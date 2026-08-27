// Cliente da API da Asaas (checkout hospedado) — usado só pra criar a
// cobrança de recarga de saldo (GP). Nunca libera saldo por aqui: o
// webhook (app/api/webhooks/asaas/route.ts) é quem credita, depois de
// reconfirmar o pagamento direto na API (nunca confia só no corpo do
// webhook nem no retorno do navegador).
//
// ATENÇÃO: os nomes de campo do corpo de resposta do /checkouts (ex. a URL
// pra redirecionar o pagador) foram escritos pelo formato documentado da
// Asaas, mas ainda não foram testados contra a API real (preciso da chave
// em sandbox pra confirmar) — primeira coisa a validar quando ligarmos de
// verdade, ver `checkoutUrlFromResponse` abaixo.

export type AsaasCheckoutResult =
  | { ok: true; checkoutUrl: string; asaasCheckoutId: string }
  | { ok: false; error: string };

function asaasConfig(): { baseUrl: string; apiKey: string } {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada — sem ela não dá pra criar cobrança real.");
  }
  const env = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
  const baseUrl = env === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";
  return { baseUrl, apiKey };
}

function checkoutUrlFromResponse(data: Record<string, unknown>): string | null {
  const candidate = data.url ?? data.checkoutUrl ?? data.link ?? data.invoiceUrl;
  return typeof candidate === "string" ? candidate : null;
}

// Cria uma cobrança de recarga de saldo. `siteUrl` deve ser a origem
// pública do site (pra montar as URLs de retorno pós-checkout).
export async function createTopupCheckout(params: {
  orderId: number;
  amountBrlCents: number;
  siteUrl: string;
}): Promise<AsaasCheckoutResult> {
  const { baseUrl, apiKey } = asaasConfig();
  const amountBrl = params.amountBrlCents / 100;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: { "content-type": "application/json", access_token: apiKey },
      body: JSON.stringify({
        billingTypes: ["PIX", "CREDIT_CARD"],
        chargeTypes: ["DETACHED"],
        minutesToExpire: 60,
        externalReference: String(params.orderId),
        callback: {
          successUrl: `${params.siteUrl}/doacao/sucesso?order=${params.orderId}`,
          cancelUrl: `${params.siteUrl}/doacao?cancelado=1`,
          expiredUrl: `${params.siteUrl}/doacao?expirado=1`,
        },
        items: [
          {
            name: "Recarga de saldo — RF Echelon",
            description: `Pedido #${params.orderId}`,
            quantity: 1,
            value: amountBrl,
          },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "Não foi possível falar com a Asaas. Tente novamente." };
  }

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data) {
    return { ok: false, error: "Erro inesperado ao criar a cobrança." };
  }

  const checkoutUrl = checkoutUrlFromResponse(data);
  const asaasCheckoutId = typeof data.id === "string" ? data.id : null;
  if (!checkoutUrl || !asaasCheckoutId) {
    return { ok: false, error: "Resposta inesperada da Asaas ao criar a cobrança." };
  }

  return { ok: true, checkoutUrl, asaasCheckoutId };
}

export type AsaasPaymentStatus = { id: string; status: string; externalReference: string | null };

// Rebusca o pagamento direto na API — nunca confiar só no corpo do
// webhook, mesmo depois de validar o token de autenticação dele.
export async function fetchAsaasPayment(paymentId: string): Promise<AsaasPaymentStatus | null> {
  const { baseUrl, apiKey } = asaasConfig();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { access_token: apiKey },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data.id !== "string" || typeof data.status !== "string") return null;

  return {
    id: data.id,
    status: data.status,
    externalReference: typeof data.externalReference === "string" ? data.externalReference : null,
  };
}

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

export function isAsaasPaymentConfirmed(status: string): boolean {
  return CONFIRMED_STATUSES.has(status);
}
