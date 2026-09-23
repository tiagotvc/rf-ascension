import { getPlayerSession } from "../../lib/player-auth";
import { getOrCreateTodaySubmission, submitPromoLink } from "../../../db/promo";
import { checkRateLimit } from "../../lib/rate-limit";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) {
    return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
  }
  const submission = await getOrCreateTodaySubmission(session.username);
  return Response.json({ ok: true, submission });
}

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "promo:submit", 10, 10 * 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas tentativas seguidas. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const session = await getPlayerSession();
  if (!session) {
    return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  let payload: { postUrl?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!payload.postUrl || typeof payload.postUrl !== "string") {
    return Response.json({ error: "Cole o link da sua postagem." }, { status: 400 });
  }

  const result = await submitPromoLink(session.username, payload.postUrl);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true });
}
