import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { promoSubmissions } from "./schema";
import { refundGp } from "./store";
import { siteConfig } from "../app/config/site";

type Db = Awaited<ReturnType<typeof getDb>>;

let bootstrapped = false;

async function ensurePromoSchema(db: Db) {
  if (bootstrapped) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS promo_submissions (
    id SERIAL PRIMARY KEY,
    account_username TEXT NOT NULL,
    submission_date TEXT NOT NULL,
    daily_code TEXT NOT NULL,
    post_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    rewarded_at TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    review_note TEXT,
    created_at TEXT NOT NULL
  )`);
  await db.execute(
    sql`ALTER TABLE promo_submissions ADD CONSTRAINT promo_submissions_account_date_unique UNIQUE (account_username, submission_date)`
  ).catch(() => {});
  await db.execute(
    sql`ALTER TABLE promo_submissions ADD CONSTRAINT promo_submissions_post_url_unique UNIQUE (post_url)`
  ).catch(() => {});
  await db.execute(sql`CREATE INDEX IF NOT EXISTS promo_submissions_status_idx ON promo_submissions (status)`);
  bootstrapped = true;
}

// Evento eterno (sem data de fim, pedido do usuário) — recompensa fixa por
// postagem válida do dia. Mudar aqui não afeta o que já foi creditado.
export const PROMO_REWARD_GP = 2;

// Só grupo do Facebook por enquanto (pedido do usuário) — Meta não permite
// validar post de grupo via oEmbed (só Página/perfil público, ver
// desenvolvimento na conversa), então isso aqui é só checagem de formato,
// não prova que o link é real. A defesa de verdade contra link falso/reuso é
// o unique (account+dia) e o unique global de post_url abaixo.
const FACEBOOK_GROUP_POST_PATTERN = /^https?:\/\/(www\.)?facebook\.com\/groups\/[^/]+\/(posts|permalink)\/[^/?#]+/i;

// Sem caracteres ambíguos (0/O, 1/I) — o código precisa ser lido de volta
// numa foto/print pelo jogador ao montar a postagem.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateDailyCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// Chave do dia no fuso do servidor (não UTC) — o código vira à meia-noite de
// Brasília, não às 21h/24h dependendo da estação.
export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: siteConfig.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date()
  );
}

export type PromoSubmission = {
  id: number;
  submissionDate: string;
  dailyCode: string;
  postUrl: string | null;
  status: string;
  rewardedAt: string | null;
};

// Idempotente: primeira chamada do dia por conta gera e grava o código;
// chamadas seguintes (mesmo dia) devolvem a mesma linha. `for update` não é
// necessário aqui — colisão de INSERT concorrente é resolvida pelo unique de
// (conta, dia) + onConflictDoNothing, sem gerar erro pro segundo request.
export async function getOrCreateTodaySubmission(accountUsername: string): Promise<PromoSubmission> {
  const db = await getDb();
  await ensurePromoSchema(db);
  const date = todayKey();

  const [existing] = await db
    .select()
    .from(promoSubmissions)
    .where(and(eq(promoSubmissions.accountUsername, accountUsername), eq(promoSubmissions.submissionDate, date)));
  if (existing) return existing;

  await db
    .insert(promoSubmissions)
    .values({ accountUsername, submissionDate: date, dailyCode: generateDailyCode() })
    .onConflictDoNothing({ target: [promoSubmissions.accountUsername, promoSubmissions.submissionDate] });

  const [row] = await db
    .select()
    .from(promoSubmissions)
    .where(and(eq(promoSubmissions.accountUsername, accountUsername), eq(promoSubmissions.submissionDate, date)));
  if (!row) throw new Error("Falha ao criar o código do dia.");
  return row;
}

export async function submitPromoLink(
  accountUsername: string,
  postUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  await ensurePromoSchema(db);
  const trimmedUrl = postUrl.trim();
  if (!FACEBOOK_GROUP_POST_PATTERN.test(trimmedUrl)) {
    return { ok: false, error: "Link inválido — precisa ser o link direto da postagem dentro do grupo do Facebook." };
  }

  const date = todayKey();
  const [existing] = await db
    .select()
    .from(promoSubmissions)
    .where(and(eq(promoSubmissions.accountUsername, accountUsername), eq(promoSubmissions.submissionDate, date)));
  if (!existing) {
    return { ok: false, error: "Abra a aba de novo pra gerar o código do dia antes de enviar o link." };
  }
  if (existing.postUrl) {
    return { ok: false, error: "Você já enviou a postagem de hoje." };
  }

  const [urlTaken] = await db.select({ id: promoSubmissions.id }).from(promoSubmissions).where(eq(promoSubmissions.postUrl, trimmedUrl));
  if (urlTaken) {
    return { ok: false, error: "Esse link já foi usado (por você ou por outra conta) — precisa ser uma postagem nova." };
  }

  // Sem crédito automático aqui (pedido do usuário 2026-09-23: "tem que deixar claro que vai ser
  // revisado, e não que já vai receber os 2 de gp, pq eu vou ter que entrar na postagem e ver") — só
  // entra na fila. O GP só é creditado em reviewPromoSubmission, quando alguém da equipe aprova.
  const updated = await db
    .update(promoSubmissions)
    .set({ postUrl: trimmedUrl, status: "submitted" })
    .where(and(eq(promoSubmissions.id, existing.id), sql`${promoSubmissions.postUrl} IS NULL`))
    .returning({ id: promoSubmissions.id });
  if (updated.length === 0) {
    // Corrida rara: outro request preencheu postUrl entre o SELECT e o UPDATE.
    return { ok: false, error: "Você já enviou a postagem de hoje." };
  }

  return { ok: true };
}

export type PromoReviewRow = {
  id: number;
  accountUsername: string;
  submissionDate: string;
  dailyCode: string;
  postUrl: string | null;
  status: string;
  reviewedBy: string | null;
  reviewNote: string | null;
};

// Revisão vem ANTES do pagamento (pedido do usuário 2026-09-23) — só os já
// enviados (tem link) importam aqui; 'pending' é só código gerado, ninguém
// postou ainda. 'submitted' (aguardando decisão) sempre aparece primeiro,
// pra equipe não precisar caçar o que falta revisar no meio do histórico.
export async function listPromoSubmissionsForReview(limit: number): Promise<PromoReviewRow[]> {
  const db = await getDb();
  await ensurePromoSchema(db);
  return db
    .select({
      id: promoSubmissions.id,
      accountUsername: promoSubmissions.accountUsername,
      submissionDate: promoSubmissions.submissionDate,
      dailyCode: promoSubmissions.dailyCode,
      postUrl: promoSubmissions.postUrl,
      status: promoSubmissions.status,
      reviewedBy: promoSubmissions.reviewedBy,
      reviewNote: promoSubmissions.reviewNote,
    })
    .from(promoSubmissions)
    .where(sql`${promoSubmissions.postUrl} IS NOT NULL`)
    .orderBy(sql`(${promoSubmissions.status} = 'submitted') DESC`, desc(promoSubmissions.submissionDate), desc(promoSubmissions.id))
    .limit(limit);
}

// Decide a recompensa (pedido do usuário: quer abrir o link e ver antes de
// pagar, não é mais auditoria pós-fato). GP só é creditado na primeira vez
// que uma linha vira 'approved' — reprocessar a mesma decisão (ex.: clicar
// aprovar de novo) não credita duas vezes. Reverter approved -> rejected
// depois de já ter pago NÃO estorna sozinho (ação manual separada, mesma
// regra que já valia pro flag antigo).
export async function reviewPromoSubmission(
  id: number,
  decision: "approved" | "rejected",
  reviewerEmail: string,
  note: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  await ensurePromoSchema(db);
  const [row] = await db.select().from(promoSubmissions).where(eq(promoSubmissions.id, id));
  if (!row) return { ok: false, error: "Envio não encontrado." };
  if (!row.postUrl) return { ok: false, error: "Essa conta ainda não enviou o link." };

  const wasAlreadyApproved = row.status === "approved";
  await db
    .update(promoSubmissions)
    .set({
      status: decision,
      reviewedBy: reviewerEmail,
      reviewedAt: new Date().toISOString(),
      reviewNote: note,
      rewardedAt: decision === "approved" ? (row.rewardedAt ?? new Date().toISOString()) : row.rewardedAt,
    })
    .where(eq(promoSubmissions.id, id));

  if (decision === "approved" && !wasAlreadyApproved) {
    await refundGp(row.accountUsername, PROMO_REWARD_GP, `promo_daily:${row.submissionDate}`);
  }
  return { ok: true };
}
