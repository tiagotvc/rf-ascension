import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createSessionCookieValue, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { STAFF_NAME, STAFF_EMAIL } from "../../../../db/forum";

export async function POST(request: Request) {
  let payload: { password?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const password = payload.password ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) {
    return Response.json(
      { error: "Login de equipe ainda não configurado no servidor (falta ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionCookieValue(STAFF_EMAIL, STAFF_NAME), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ ok: true });
}
