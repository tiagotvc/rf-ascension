import { timingSafeEqual } from "node:crypto";
import { confirmTopupPayment } from "../../../../db/store";
import { fetchAsaasPayment, isAsaasPaymentConfirmed, fetchAsaasCheckout, isAsaasCheckoutPaid } from "../../../lib/asaas";

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

  let payload: {
    event?: string;
    payment?: { id?: string; externalReference?: string };
    checkout?: { id?: string };
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  // Recarga é criada via Asaas Checkout (não cobrança avulsa) — o evento real que a Asaas manda
  // quando o checkout é pago é CHECKOUT_PAID, com um objeto `checkout`, não `payment` (recursos
  // diferentes na Asaas). Mantém o caminho `payment` como fallback pra qualquer evento de cobrança
  // avulsa que venha a existir, mas o caminho `checkout` é o que de fato importa aqui.
  const checkoutId = payload.checkout?.id;
  if (checkoutId) {
    const realCheckout = await fetchAsaasCheckout(checkoutId);
    if (
      !realCheckout ||
      realCheckout.id !== checkoutId ||
      !isAsaasCheckoutPaid(realCheckout.status) ||
      !realCheckout.externalReference ||
      realCheckout.valueBrlCents === null
    ) {
      return Response.json({ ok: true });
    }
    const orderId = Number(realCheckout.externalReference);
    if (!Number.isInteger(orderId)) {
      return Response.json({ ok: true });
    }
    await confirmTopupPayment(orderId, realCheckout.id, realCheckout.valueBrlCents);
    return Response.json({ ok: true });
  }

  const paymentId = payload.payment?.id;
  const externalReference = payload.payment?.externalReference;
  if (!paymentId || !externalReference) {
    // Evento que não é de pagamento nem de checkout (ou mal-formado) — confirma recebimento sem processar.
    return Response.json({ ok: true });
  }

  const orderId = Number(externalReference);
  if (!Number.isInteger(orderId)) {
    return Response.json({ ok: true });
  }

  // Nunca confia no `payment` do corpo do webhook — rebusca server-to-server.
  const realPayment = await fetchAsaasPayment(paymentId);
  if (
    !realPayment ||
    realPayment.id !== paymentId ||
    !isAsaasPaymentConfirmed(realPayment.status) ||
    realPayment.valueBrlCents === null
  ) {
    return Response.json({ ok: true });
  }

  await confirmTopupPayment(orderId, paymentId, realPayment.valueBrlCents);
  return Response.json({ ok: true });
}
