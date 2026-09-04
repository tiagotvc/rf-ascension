import { getPlayerSession } from "../../../lib/player-auth";
import { listCharacters, deliverItem } from "../../../lib/game-account";
import { purchasePotion } from "../../../../db/potion-shop";
import { refundGp } from "../../../../db/store";
import { checkRateLimit } from "../../../lib/rate-limit";

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "store:buy-potion", 20, 10 * 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas compras seguidas. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const session = await getPlayerSession();
  if (!session) {
    return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  let payload: { itemCode?: string; characterSerial?: number; quantity?: number };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const itemCode = payload.itemCode;
  const characterSerial = payload.characterSerial;
  const quantity = Number.isInteger(payload.quantity) && (payload.quantity as number) > 0 ? (payload.quantity as number) : 1;
  if (!itemCode || !Number.isInteger(characterSerial)) {
    return Response.json({ error: "Escolha uma poção e um personagem." }, { status: 400 });
  }

  // Nunca confia no personagem vindo do cliente — sempre revalida que o serial pedido é
  // realmente da conta logada (mesmo padrão de purchase/exchange).
  const characters = await listCharacters(session.username);
  const character = characters.find((c) => c.serial === characterSerial);
  if (!character) {
    return Response.json({ error: "Personagem não encontrado nessa conta." }, { status: 400 });
  }

  const debit = await purchasePotion(session.username, itemCode, quantity);
  if (!debit.ok) {
    return Response.json({ error: debit.error }, { status: 400 });
  }

  const delivery = await deliverItem(character.serial, itemCode, quantity);
  if (!delivery.ok) {
    await refundGp(session.username, debit.totalGpCost, `potion_refund:${itemCode}`);
    return Response.json({ error: "Não foi possível entregar agora. Seu GP foi devolvido — tente de novo em instantes." }, { status: 502 });
  }

  return Response.json({ ok: true, method: delivery.method });
}
