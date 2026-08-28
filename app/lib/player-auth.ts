import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

// Sessão de JOGADOR — separada da sessão de equipe (ver app/lib/auth.ts).
// Login com usuário/senha da conta real do jogo (verifyGameAccount, via
// AccountBridge). Usada tanto pra /conta (cadastro/login geral, navegação
// livre) quanto pro fluxo de compra na loja de doações — mesmo cookie,
// TTL de 7 dias (era 2h quando isso servia só a compra).
export type PlayerSession = { username: string };

const COOKIE_NAME = "echelon_player_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.PLAYER_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("PLAYER_SESSION_SECRET (ou SESSION_SECRET) não configurada no servidor.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createPlayerSessionCookieValue(username: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${username}|${exp}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

export async function getPlayerSession(): Promise<PlayerSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [encoded, sig] = raw.split(".");
  if (!encoded || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expectedSig = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [username, expRaw] = payload.split("|");
  const exp = Number(expRaw);
  if (!username || !Number.isFinite(exp) || Date.now() > exp) return null;

  return { username };
}

export const PLAYER_SESSION_COOKIE_NAME = COOKIE_NAME;
export const PLAYER_SESSION_TTL_MS = SESSION_TTL_MS;
