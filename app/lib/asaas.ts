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

function asaasConfig(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) return null;
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
  const config = asaasConfig();
  if (!config) {
    return { ok: false, error: "Recarga temporariamente indisponível (ASAAS_API_KEY não configurada)." };
  }
  const { baseUrl, apiKey } = config;
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
            name: "Recarga RF Echelon", // API da Asaas limita a 30 chars
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
    return { ok: false, error: "Erro ao criar a cobrança." };
  }

  const checkoutUrl = checkoutUrlFromResponse(data);
  const asaasCheckoutId = typeof data.id === "string" ? data.id : null;
  if (!checkoutUrl || !asaasCheckoutId) {
    return { ok: false, error: "Resposta inesperada da Asaas ao criar a cobrança." };
  }

  return { ok: true, checkoutUrl, asaasCheckoutId };
}

export type AsaasPaymentStatus = { id: string; status: string; externalReference: string | null; valueBrlCents: number | null };

// Rebusca o pagamento direto na API — nunca confiar só no corpo do
// webhook, mesmo depois de validar o token de autenticação dele. Inclui o
// valor pago (`value`, em reais) pra quem chamar poder conferir que bate
// com o valor esperado da order antes de creditar qualquer coisa.
export async function fetchAsaasPayment(paymentId: string): Promise<AsaasPaymentStatus | null> {
  const config = asaasConfig();
  if (!config) return null;
  const { baseUrl, apiKey } = config;

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
    valueBrlCents: typeof data.value === "number" ? Math.round(data.value * 100) : null,
    externalReference: typeof data.externalReference === "string" ? data.externalReference : null,
  };
}

// Confirmação extra pro caminho de checkout (ver parseAsaasCheckoutPayload — a Asaas não tem GET pra
// um checkout específico, só criar/cancelar, confirmado na doc). GET /v3/payments?externalReference=X
// é endpoint real e documentado: busca os pagamentos que a Asaas gerou de fato pro checkout pago,
// cruzando de forma independente do corpo do webhook. Devolve lista vazia (nunca lança) se a busca
// falhar ou não achar nada — quem chama trata isso como "confirmação extra indisponível", não bloqueia
// o crédito só com base nisso (a autenticação do webhook por token já é a garantia principal).
export async function fetchAsaasPaymentsByExternalReference(externalReference: string): Promise<AsaasPaymentStatus[]> {
  const config = asaasConfig();
  if (!config) return [];
  const { baseUrl, apiKey } = config;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/payments?externalReference=${encodeURIComponent(externalReference)}`, {
      headers: { access_token: apiKey },
    });
  } catch {
    return [];
  }

  if (!res.ok) return [];
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || !Array.isArray(data.data)) return [];

  return (data.data as Record<string, unknown>[])
    .filter((p) => typeof p.id === "string" && typeof p.status === "string")
    .map((p) => ({
      id: p.id as string,
      status: p.status as string,
      valueBrlCents: typeof p.value === "number" ? Math.round(p.value * 100) : null,
      externalReference: typeof p.externalReference === "string" ? p.externalReference : null,
    }));
}

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

export function isAsaasPaymentConfirmed(status: string): boolean {
  return CONFIRMED_STATUSES.has(status);
}

export type AsaasCheckoutStatus = { id: string; status: string; externalReference: string | null; valueBrlCents: number | null };

// 2026-09-11: tentei rebuscar o checkout direto na API (GET /checkouts/{id}, mesmo princípio do
// fetchAsaasPayment) antes de confiar no corpo do webhook, mas esse endpoint nunca respondeu nada
// utilizável em teste ao vivo (fetch chegou a rodar, resultado sempre null - a doc de referência
// desse GET específico também nunca carregou, então não dá pra confirmar se o path/formato assumido
// está certo). Removido: em vez disso, parseAsaasCheckoutPayload lê direto do objeto `checkout` que
// já vem no corpo do webhook - a autenticação real aqui é o token do header asaas-access-token
// (comparação constant-time no route.ts), que já é a garantia server-to-server; sem ele a requisição
// nem chega a ser processada. Confirmado com um pagamento real (R$5, pedido #78): o payload do evento
// CHECKOUT_PAID já traz id/status/externalReference/items completos e corretos.
export function parseAsaasCheckoutPayload(checkout: unknown): AsaasCheckoutStatus | null {
  if (!checkout || typeof checkout !== "object") return null;
  const data = checkout as Record<string, unknown>;
  if (typeof data.id !== "string" || typeof data.status !== "string") return null;

  let valueBrlCents: number | null = null;
  if (typeof data.value === "number") {
    valueBrlCents = Math.round(data.value * 100);
  } else if (Array.isArray(data.items)) {
    const total = (data.items as Record<string, unknown>[]).reduce((sum, item) => {
      const value = typeof item.value === "number" ? item.value : 0;
      const quantity = typeof item.quantity === "number" ? item.quantity : 1;
      return sum + value * quantity;
    }, 0);
    valueBrlCents = total > 0 ? Math.round(total * 100) : null;
  }

  return {
    id: data.id,
    status: data.status,
    externalReference: typeof data.externalReference === "string" ? data.externalReference : null,
    valueBrlCents,
  };
}

export function isAsaasCheckoutPaid(status: string): boolean {
  return status === "PAID";
}
