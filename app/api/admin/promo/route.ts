import { getSessionUser } from "../../../lib/auth";
import { setPromoSubmissionFlag } from "../../../../db/promo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Entre com a conta da equipe pra revisar." }, { status: 401 });
  }

  let payload: { id?: number; flagged?: boolean; note?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!Number.isInteger(payload.id) || typeof payload.flagged !== "boolean") {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  await setPromoSubmissionFlag(payload.id as number, payload.flagged, user.email, payload.note?.trim() || null);
  return Response.json({ ok: true });
}
