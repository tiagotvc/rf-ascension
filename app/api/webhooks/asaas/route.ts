import { timingSafeEqual } from "node:crypto";
import { confirmTopupPayment } from "../../../../db/store";
import {
  fetchAsaasPayment,
  isAsaasPaymentConfirmed,
  parseAsaasCheckoutPayload,
  isAsaasCheckoutPaid,
  fetchAsaasPaymentsByExternalReference,
} from "../../../lib/asaas";

// Webhook da Asaas — a ÚNICA forma de saldo ser creditado (nunca a partir do retorno do navegador).
// Confere o token configurado no painel da Asaas (comparação constant-time) — essa é a autenticação
// server-to-server real; sem ela a requisição nem chega a ser processada. Pra cobrança avulsa
// (`payment`), ainda rebusca o pagamento direto na API antes de creditar (fetchAsaasPayment). Pra
// checkout (`checkout`, o caminho real da recarga - ver createTopupCheckout), o campo id/status/
// externalReference/value vem direto do corpo já autenticado (ver comentário em
// parseAsaasCheckoutPayload sobre por que não há um re-fetch aqui). Idempotente nos dois casos —
// reenviar o mesmo evento não credita duas vezes (ver confirmTopupPayment, trava a linha da order e
// confere status).
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
    checkout?: unknown;
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
  if (payload.checkout) {
    const checkoutData = parseAsaasCheckoutPayload(payload.checkout);
    if (
      !checkoutData ||
      !isAsaasCheckoutPaid(checkoutData.status) ||
      !checkoutData.externalReference ||
      checkoutData.valueBrlCents === null
    ) {
      return Response.json({ ok: true });
    }
    const orderId = Number(checkoutData.externalReference);
    if (!Number.isInteger(orderId)) {
      return Response.json({ ok: true });
    }

    // Confirmação extra (a Asaas não tem GET pra um checkout específico, só um payments?externalReference=
    // real — ver fetchAsaasPaymentsByExternalReference): se achar pagamento(s) vinculados mas nenhum
    // confirmado, ou um confirmado com valor diferente do esperado, é sinal de adulteração — não credita.
    // Lista vazia (busca indisponível/sem resultado) não bloqueia — a autenticação por token do webhook
    // já é a garantia principal.
    const relatedPayments = await fetchAsaasPaymentsByExternalReference(checkoutData.externalReference);
    const confirmedMatch = relatedPayments.find((p) => isAsaasPaymentConfirmed(p.status));
    if (relatedPayments.length > 0 && !confirmedMatch) {
      console.log(`[asaas-webhook] order ${orderId}: pagamentos achados mas nenhum confirmado, não credita`, JSON.stringify(relatedPayments));
      return Response.json({ ok: true });
    }
    if (confirmedMatch && confirmedMatch.valueBrlCents !== null && confirmedMatch.valueBrlCents !== checkoutData.valueBrlCents) {
      console.log(`[asaas-webhook] order ${orderId}: valor do pagamento confirmado (${confirmedMatch.valueBrlCents}) diverge do checkout (${checkoutData.valueBrlCents}), não credita`);
      return Response.json({ ok: true });
    }

    const result = await confirmTopupPayment(orderId, checkoutData.id, checkoutData.valueBrlCents);
    console.log(`[asaas-webhook] order ${orderId}: confirmTopupPayment credited=${result.credited}, confirmação extra=${confirmedMatch ? "achou pagamento confirmado" : "indisponível"}`);
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
