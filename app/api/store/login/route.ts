import { cookies } from "next/headers";
import { verifyGameAccount } from "../../../lib/game-account";
import { createPlayerSessionCookieValue, PLAYER_SESSION_COOKIE_NAME, PLAYER_SESSION_TTL_MS } from "../../../lib/player-auth";
import { checkRateLimit } from "../../../lib/rate-limit";

// Rate limit por IP antes de qualquer coisa — essa é a defesa real contra
// brute-force de senha (a AccountBridge só vê o IP do Vercel, não do
// visitante, então o limiter dela sozinho não protege login).
export async function POST(request: Request) {
  const limited = checkRateLimit(request, "store:login", 10, 5 * 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas tentativas de login. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let payload: { username?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const username = (payload.username ?? "").trim();
  const password = payload.password ?? "";
  if (!username || !password) {
    return Response.json({ error: "Informe usuário e senha." }, { status: 400 });
  }

  const result = await verifyGameAccount(username, password);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status || 401 });
  }

  const store = await cookies();
  store.set(PLAYER_SESSION_COOKIE_NAME, createPlayerSessionCookieValue(username), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(PLAYER_SESSION_TTL_MS / 1000),
  });

  return Response.json({ ok: true, username });
}
