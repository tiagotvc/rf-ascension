import { getSessionUser } from "../../../lib/auth";
import { reviewPromoSubmission } from "../../../../db/promo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Entre com a conta da equipe pra revisar." }, { status: 401 });
  }

  let payload: { id?: number; decision?: string; note?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!Number.isInteger(payload.id) || (payload.decision !== "approved" && payload.decision !== "rejected")) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const result = await reviewPromoSubmission(payload.id as number, payload.decision, user.email, payload.note?.trim() || null);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true });
}
