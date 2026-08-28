import { cookies } from "next/headers";
import { createGameAccount } from "../../../lib/game-account";
import { createPlayerSessionCookieValue, PLAYER_SESSION_COOKIE_NAME, PLAYER_SESSION_TTL_MS } from "../../../lib/player-auth";

// Cadastro real de conta de jogo — POST /v1/accounts na AccountBridge (cria
// direto em tbl_rfaccount). Sucesso já loga (mesmo cookie de sessão do
// login), pra não pedir username/senha duas vezes seguidas.
export async function POST(request: Request) {
  let payload: { username?: string; password?: string; confirmPassword?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const username = (payload.username ?? "").trim();
  const password = payload.password ?? "";
  const confirmPassword = payload.confirmPassword ?? "";
  if (!username || !password) {
    return Response.json({ error: "Informe usuário e senha." }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return Response.json({ error: "As senhas não coincidem." }, { status: 400 });
  }

  const result = await createGameAccount(username, password);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status || 400 });
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
