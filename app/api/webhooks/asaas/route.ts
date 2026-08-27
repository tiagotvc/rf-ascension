import { timingSafeEqual } from "node:crypto";
import { confirmTopupPayment } from "../../../../db/store";
import { fetchAsaasPayment, isAsaasPaymentConfirmed } from "../../../lib/asaas";

// Webhook da Asaas — a ÚNICA forma de saldo ser creditado (nunca a partir
// do retorno do navegador). Confere o token configurado no painel da Asaas
// (comparação constant-time), e MESMO ASSIM não confia no corpo do
// webhook: rebusca o pagamento direto na API antes de creditar qualquer
// coisa. Idempotente — reenviar o mesmo evento não credita duas vezes
// (ver confirmTopupPayment, trava a linha da order e confere status).
export async function POST(request: Request) {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken) {
    return Response.json({ error: "Webhook não configurado." }, { status: 500 });
  }

  const provided = request.headers.get("asaas-access-token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let payload: { event?: string; payment?: { id?: string; externalReference?: string } };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const paymentId = payload.payment?.id;
  const externalReference = payload.payment?.externalReference;
  if (!paymentId || !externalReference) {
    // Evento que não é de pagamento (ou mal-formado) — confirma recebimento sem processar.
    return Response.json({ ok: true });
  }

  const orderId = Number(externalReference);
  if (!Number.isInteger(orderId)) {
    return Response.json({ ok: true });
  }

  // Nunca confia no `payment` do corpo do webhook — rebusca server-to-server.
  const realPayment = await fetchAsaasPayment(paymentId);
  if (!realPayment || realPayment.id !== paymentId || !isAsaasPaymentConfirmed(realPayment.status)) {
    return Response.json({ ok: true });
  }

  await confirmTopupPayment(orderId, paymentId);
  return Response.json({ ok: true });
}
