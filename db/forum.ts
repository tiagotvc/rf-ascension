import { and, count, desc, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDb } from "./index";
import { forumPosts, forumTopics } from "./schema";
import { SERVER_INFO_SLUG, findForumBoard } from "../app/config/forum";

type Db = Awaited<ReturnType<typeof getDb>>;

export const STAFF_NAME = "Equipe Ascension";
export const STAFF_EMAIL = "equipe@rfascension.online";
export function isStaffEmail(email: string): boolean {
  return email === STAFF_EMAIL;
}

// Título exato do tópico mestre: usado como marcador de versão do seed.
// Mudou a estrutura do conteúdo? Troque o título para forçar reseed (a
// função abaixo apaga só os tópicos da equipe nesse mural antes de recriar).
const MASTER_TITLE = "Informações do servidor — RF Ascension";

let bootstrapped = false;

async function ensureForumSchema(db: Db) {
  if (bootstrapped) return;
  await db.run(sql`CREATE TABLE IF NOT EXISTS forum_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forum_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS forum_topics_forum_slug_idx ON forum_topics (forum_slug)`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS forum_posts_topic_id_idx ON forum_posts (topic_id)`);
  // Correção de rota: essas notas foram semeadas em "Notas de atualização"
  // (01-3) antes de decidirmos que esse mural fica reservado para a primeira
  // manutenção real. Move o que já existir para "Informações do servidor".
  await db.run(
    sql`UPDATE forum_topics SET forum_slug = ${SERVER_INFO_SLUG} WHERE forum_slug = '01-3' AND author_email = ${STAFF_EMAIL}`
  );
  // Limpa tópicos de teste criados durante o desenvolvimento local.
  await db.run(
    sql`DELETE FROM forum_posts WHERE author_email IN ('jogador@exemplo.com') OR topic_id IN (SELECT id FROM forum_topics WHERE author_email LIKE 'teste%@exemplo.com')`
  );
  await db.run(sql`DELETE FROM forum_topics WHERE author_email LIKE 'teste%@exemplo.com'`);
  await seedServerInfo(db);
  bootstrapped = true;
}

async function seedServerInfo(db: Db) {
  const [master] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(and(eq(forumTopics.forumSlug, SERVER_INFO_SLUG), eq(forumTopics.title, MASTER_TITLE)));
  if (master) return;

  // Estrutura de conteúdo mudou desde o último seed: limpa só o que a
  // própria equipe publicou nesse mural (nunca toca em posts de jogadores)
  // e recria do zero.
  await db.run(
    sql`DELETE FROM forum_posts WHERE topic_id IN (SELECT id FROM forum_topics WHERE forum_slug = ${SERVER_INFO_SLUG} AND author_email = ${STAFF_EMAIL})`
  );
  await db.run(sql`DELETE FROM forum_topics WHERE forum_slug = ${SERVER_INFO_SLUG} AND author_email = ${STAFF_EMAIL}`);

  async function createStaffTopic(title: string, body: string, pinned = false): Promise<number> {
    const [topic] = await db
      .insert(forumTopics)
      .values({ forumSlug: SERVER_INFO_SLUG, title, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL, pinned })
      .returning();
    await db.insert(forumPosts).values({ topicId: topic.id, body, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL });
    return topic.id;
  }

  const itemsId = await createStaffTopic(
    "Sistema de Itens Atualizado",
    "O sistema de itens recebeu uma atualização completa:\n\n- Sistema de Efeitos Especiais expandido\n- Sistema de Rank de Item\n- Sistema de Vínculo de Alma\n- Sistema de Ascensão de Arma\n\nCada um desses sistemas tem requisitos e custos próprios. Detalhes específicos de cada um serão publicados aqui conforme forem fechados antes do lançamento."
  );
  const premiumId = await createStaffTopic(
    "Conveniências Premium: Auto Loot, Auto Sell e Tela de Teleporte",
    "Três conveniências para quem tem Premium ativo:\n\n- Auto Loot System (Premium)\n- Auto Sell System (Premium)\n- Tela de Teleporte (Teleportation Screen)\n\nAuto Loot recolhe os itens do chão automaticamente durante o farm. Auto Sell vende para o NPC sem precisar abrir a janela de loja o tempo todo. A Tela de Teleporte reúne os pontos de teleporte do mundo em uma única interface, sem precisar andar até o NPC."
  );
  const mountId = await createStaffTopic(
    "Sistema de Montaria",
    "RF Ascension conta com sistema de montaria próprio. Formas de obtenção, evolução e velocidades serão detalhadas aqui antes do lançamento."
  );
  const dungeonId = await createStaffTopic(
    "Nova Dungeon Exclusiva",
    "A dungeon ganhou um sistema exclusivo, com fluxo completo: navegador de salas (lista pública, sala própria e sala da dungeon), timer de tempo restante e uma janela de resultado no final que mostra a recompensa de cada jogador do grupo para todo mundo, não só para quem recebeu o item."
  );
  const professionId = await createStaffTopic(
    "Ofícios, Coleta e Crafting",
    "Novo sistema de ofícios, coleta e crafting:\n\n- Ofícios: qualquer classe pode se especializar em uma linha de produção, sem depender de uma classe fixa de artesão.\n- Coleta: o Extrator substitui a antiga coleta de plantas — dá para analisar o ponto antes de coletar e saber o que esperar.\n\nA meta é dar mais opções de economia própria para quem não quer depender só de farm de monstro."
  );
  const towersId = await createStaffTopic(
    "Torres, M.A.U. e Minas Aprimoradas",
    "Torres, M.A.U. e minas foram todos revisados:\n\n- Torres de guerra agora têm tooltip detalhado direto no inventário, para comparar upgrade antes de instalar.\n- Bellato ganhou o M.A.U., um mecha pilotável.\n- Pontos de mineração foram revisados.\n\nMais detalhes de cada um em breve."
  );
  const guildId = await createStaffTopic(
    "Novo Sistema de Guildas",
    "As guildas agora acumulam pontos de habilidade para investir em passivos próprios, com uma janela de reset mensal para reorganizar a build da guilda sem perder progresso permanentemente."
  );

  await createStaffTopic(
    MASTER_TITLE,
    `RF Ascension roda sobre a base Cliente e Servidor 2.2.3.2, com GameGuard próprio.

Taxas do servidor:
- XP base: x5
- XP Animus: x7
- Drop de monstro: x5
- Taxa de venda: x2
- Mastery / Skill: x5
- Janelas abertas ao mesmo tempo: 1 (free) / 2 (premium)

Recursos do servidor:
- [Sistema de Itens Atualizado](/forum/${SERVER_INFO_SLUG}/topic/${itemsId})
- [Conveniências Premium: Auto Loot, Auto Sell e Tela de Teleporte](/forum/${SERVER_INFO_SLUG}/topic/${premiumId})
- [Sistema de Montaria](/forum/${SERVER_INFO_SLUG}/topic/${mountId})
- [Nova Dungeon Exclusiva](/forum/${SERVER_INFO_SLUG}/topic/${dungeonId})
- [Ofícios, Coleta e Crafting](/forum/${SERVER_INFO_SLUG}/topic/${professionId})
- [Torres, M.A.U. e Minas Aprimoradas](/forum/${SERVER_INFO_SLUG}/topic/${towersId})
- [Novo Sistema de Guildas](/forum/${SERVER_INFO_SLUG}/topic/${guildId})

Eventos:
- Invasão de monstros às terças e quintas, 10h e 16h (drops especiais e XP extra)

Outros sistemas:
- Quests diárias
- Novas poções e novas runas
- Pedra de Proteção (protege o item de quebrar no upgrade)
- Novo Sistema de Talismã (Talica)
- Sistema de Rank Up
- Sistema de votação do Archon reformulado
- Recompensas por quebrar chip, entregar chip e matar o portador do chip
- Buffs de líder de guilda e líder de raça reformulados`,
    true
  );
}

export type ForumBoardStats = {
  slug: string;
  topicCount: number;
  replyCount: number;
  latest: { title: string; authorName: string; createdAt: string; topicId: number } | null;
};

export async function getForumIndexStats(): Promise<Map<string, ForumBoardStats>> {
  const db = await getDb();
  await ensureForumSchema(db);

  const topicCounts = await db
    .select({ slug: forumTopics.forumSlug, value: count() })
    .from(forumTopics)
    .groupBy(forumTopics.forumSlug);

  const postCounts = await db
    .select({ slug: forumTopics.forumSlug, value: count() })
    .from(forumPosts)
    .innerJoin(forumTopics, eq(forumPosts.topicId, forumTopics.id))
    .groupBy(forumTopics.forumSlug);

  const allTopics = await db
    .select({
      id: forumTopics.id,
      slug: forumTopics.forumSlug,
      title: forumTopics.title,
      authorName: forumTopics.authorName,
      createdAt: forumTopics.createdAt,
    })
    .from(forumTopics)
    .orderBy(desc(forumTopics.createdAt));

  const topicCountBySlug = new Map(topicCounts.map((r) => [r.slug, r.value]));
  const postCountBySlug = new Map(postCounts.map((r) => [r.slug, r.value]));
  const latestBySlug = new Map<string, (typeof allTopics)[number]>();
  for (const topic of allTopics) {
    if (!latestBySlug.has(topic.slug)) latestBySlug.set(topic.slug, topic);
  }

  const stats = new Map<string, ForumBoardStats>();
  for (const slug of new Set([...topicCountBySlug.keys(), ...postCountBySlug.keys()])) {
    const topicCount = topicCountBySlug.get(slug) ?? 0;
    const postCount = postCountBySlug.get(slug) ?? 0;
    const latest = latestBySlug.get(slug);
    stats.set(slug, {
      slug,
      topicCount,
      replyCount: Math.max(0, postCount - topicCount),
      latest: latest
        ? { title: latest.title, authorName: latest.authorName, createdAt: latest.createdAt, topicId: latest.id }
        : null,
    });
  }
  return stats;
}

export async function listForumTopics(forumSlug: string) {
  const db = await getDb();
  await ensureForumSchema(db);

  const topics = await db
    .select({
      id: forumTopics.id,
      title: forumTopics.title,
      authorName: forumTopics.authorName,
      authorEmail: forumTopics.authorEmail,
      pinned: forumTopics.pinned,
      createdAt: forumTopics.createdAt,
    })
    .from(forumTopics)
    .where(eq(forumTopics.forumSlug, forumSlug))
    .orderBy(desc(forumTopics.pinned), desc(forumTopics.createdAt));

  const postCounts = await db
    .select({ topicId: forumPosts.topicId, value: count() })
    .from(forumPosts)
    .innerJoin(forumTopics, eq(forumPosts.topicId, forumTopics.id))
    .where(eq(forumTopics.forumSlug, forumSlug))
    .groupBy(forumPosts.topicId);
  const postCountByTopic = new Map(postCounts.map((r) => [r.topicId, r.value]));

  return topics.map((topic) => ({
    ...topic,
    replyCount: Math.max(0, (postCountByTopic.get(topic.id) ?? 0) - 1),
  }));
}

export async function getForumTopicWithPosts(forumSlug: string, topicId: number) {
  const db = await getDb();
  await ensureForumSchema(db);

  const [topic] = await db
    .select()
    .from(forumTopics)
    .where(and(eq(forumTopics.id, topicId), eq(forumTopics.forumSlug, forumSlug)));
  if (!topic) return null;

  const posts = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.topicId, topicId))
    .orderBy(forumPosts.createdAt);

  return { topic, posts };
}

export async function createForumTopic(input: {
  forumSlug: string;
  title: string;
  body: string;
  authorName: string;
  authorEmail: string;
}) {
  const board = findForumBoard(input.forumSlug);
  if (!board || !board.board.canCreateTopics) {
    throw new Error("Este mural não aceita novos tópicos.");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || title.length > 140) {
    throw new Error("O título deve ter entre 3 e 140 caracteres.");
  }
  if (body.length < 3 || body.length > 8000) {
    throw new Error("A mensagem deve ter entre 3 e 8000 caracteres.");
  }

  const db = await getDb();
  await ensureForumSchema(db);

  const [topic] = await db
    .insert(forumTopics)
    .values({
      forumSlug: input.forumSlug,
      title,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
    })
    .returning();
  await db.insert(forumPosts).values({
    topicId: topic.id,
    body,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
  });
  return topic;
}

export async function createForumReply(input: {
  forumSlug: string;
  topicId: number;
  body: string;
  authorName: string;
  authorEmail: string;
}) {
  const board = findForumBoard(input.forumSlug);
  if (!board || !board.board.canReply) {
    throw new Error("Este mural não aceita respostas.");
  }
  const body = input.body.trim();
  if (body.length < 1 || body.length > 8000) {
    throw new Error("A resposta deve ter entre 1 e 8000 caracteres.");
  }

  const db = await getDb();
  await ensureForumSchema(db);

  const [topic] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(and(eq(forumTopics.id, input.topicId), eq(forumTopics.forumSlug, input.forumSlug)));
  if (!topic) {
    throw new Error("Tópico não encontrado.");
  }

  const [post] = await db
    .insert(forumPosts)
    .values({
      topicId: input.topicId,
      body,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
    })
    .returning();
  return post;
}

export type AuthorStats = { postCount: number; memberSince: string };

// Dados reais do card de usuário: total de mensagens e data da primeira
// mensagem, calculados a partir do próprio histórico do fórum (não há
// cadastro de conta separado ainda — ver BACKEND_REQUIREMENTS.md).
export async function getAuthorStats(emails: string[]): Promise<Map<string, AuthorStats>> {
  const db = await getDb();
  await ensureForumSchema(db);
  if (emails.length === 0) return new Map();

  const rows = await db
    .select({
      email: forumPosts.authorEmail,
      postCount: count(),
      memberSince: sql<string>`min(${forumPosts.createdAt})`,
    })
    .from(forumPosts)
    .where(inArray(forumPosts.authorEmail, emails))
    .groupBy(forumPosts.authorEmail);

  return new Map(rows.map((r) => [r.email, { postCount: r.postCount, memberSince: r.memberSince }]));
}

export type RecentTopic = {
  id: number;
  forumSlug: string;
  title: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
};

export async function getRecentTopics(limit: number): Promise<RecentTopic[]> {
  const db = await getDb();
  await ensureForumSchema(db);

  return db
    .select({
      id: forumTopics.id,
      forumSlug: forumTopics.forumSlug,
      title: forumTopics.title,
      authorName: forumTopics.authorName,
      authorEmail: forumTopics.authorEmail,
      createdAt: forumTopics.createdAt,
    })
    .from(forumTopics)
    .orderBy(desc(forumTopics.createdAt))
    .limit(limit);
}
