import { headers } from "next/headers";
import { getPlayerSession } from "../../../lib/player-auth";
import { createTopupOrder, setOrderAsaasReference } from "../../../../db/store";
import { createTopupCheckout } from "../../../lib/asaas";

const MIN_BRL_CENTS = 1000; // R$10
const MAX_BRL_CENTS = 100000; // R$1000

export async function POST(request: Request) {
  const session = await getPlayerSession();
  if (!session) {
    return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  let payload: { amountBrlCents?: number };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const amountBrlCents = Math.round(payload.amountBrlCents ?? 0);
  if (!Number.isFinite(amountBrlCents) || amountBrlCents < MIN_BRL_CENTS || amountBrlCents > MAX_BRL_CENTS) {
    return Response.json({ error: "Valor de recarga inválido (mínimo R$10, máximo R$1000)." }, { status: 400 });
  }

  const orderId = await createTopupOrder(session.username, amountBrlCents);

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "rf-echelon.website";
  const siteUrl = `https://${host}`;

  const checkout = await createTopupCheckout({ orderId, amountBrlCents, siteUrl });
  if (!checkout.ok) {
    return Response.json({ error: checkout.error }, { status: 502 });
  }

  await setOrderAsaasReference(orderId, checkout.asaasCheckoutId);

  return Response.json({ ok: true, checkoutUrl: checkout.checkoutUrl });
}
