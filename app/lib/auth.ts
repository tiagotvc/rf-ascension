import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

// Sessão própria da equipe: substitui o antigo Sign-In-With-ChatGPT (que só
// funcionava hospedado atrás da plataforma OpenAI Apps/Sites — não existe
// mais aqui). Login por senha de equipe (ADMIN_PASSWORD), cookie assinado
// (HMAC) guardando a identidade, sem estado de sessão no servidor.
//
// O login com a conta real do jogador (mesma conta do jogo, banco na VPS)
// ainda não está conectado — fica para quando a ponte com a VPS existir.
// Por enquanto só a equipe consegue entrar no site.

export type SessionUser = { displayName: string; email: string; fullName: string | null };

const COOKIE_NAME = "echelon_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não configurada no servidor.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionCookieValue(email: string, displayName: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${email}|${displayName}|${exp}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

export async function getSessionUser(): Promise<SessionUser | null> {
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

  const [email, displayName, expRaw] = payload.split("|");
  const exp = Number(expRaw);
  if (!email || !Number.isFinite(exp) || Date.now() > exp) return null;

  return { email, displayName: displayName || email, fullName: null };
}

export async function requireSessionUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  redirect(adminSignInPath(returnTo));
}

export function adminSignInPath(returnTo: string): string {
  return `/admin/entrar?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
