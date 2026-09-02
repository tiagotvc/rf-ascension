import { getPlayerSession } from "../../../lib/player-auth";
import { getSessionUser } from "../../../lib/auth";
import { isStaffEmail } from "../../../../db/forum";
import { listCharacters, deliverPackage } from "../../../lib/game-account";
import { purchasePackage, recordDeliveryAttempt } from "../../../../db/store";
import { checkRateLimit } from "../../../lib/rate-limit";

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "store:purchase", 20, 10 * 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas tentativas de compra. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const session = await getPlayerSession();
  if (!session) {
    return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  let payload: { packageKey?: string; characterSerial?: number };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const packageKey = payload.packageKey;
  const characterSerial = payload.characterSerial;
  if (!packageKey || !Number.isInteger(characterSerial)) {
    return Response.json({ error: "Escolha um pacote e um personagem." }, { status: 400 });
  }

  // Nunca confia no nome do personagem vindo do cliente — sempre revalida
  // que o serial pedido realmente pertence à conta logada.
  const characters = await listCharacters(session.username);
  const character = characters.find((c) => c.serial === characterSerial);
  if (!character) {
    return Response.json({ error: "Personagem não encontrado nessa conta." }, { status: 400 });
  }

  // Loja é pública (visibleToPlayers=true nos 3 pacotes reais) — allowHidden
  // só importa se algum pacote for marcado invisível no futuro (ex.: teste
  // interno da equipe antes de divulgar), permitindo staff comprar mesmo assim.
  const staffUser = await getSessionUser();
  const allowHidden = staffUser !== null && isStaffEmail(staffUser.email);

  const result = await purchasePackage(session.username, character.serial, character.name, packageKey, allowHidden);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // A compra já valeu (GP debitado, estoque decrementado) mesmo se essa
  // tentativa de entrega falhar — fica 'queued' e o cron de retry tenta de
  // novo depois (ver app/api/store/process-deliveries/route.ts).
  const delivery = await deliverPackage(result.characterSerial, result.accountUsername, result.cashAmount, result.items);
  const method: "bag" | "mail" = delivery.itemStatuses.includes("mail") ? "mail" : "bag";
  await recordDeliveryAttempt(result.deliveryId, delivery.ok ? { delivered: true, method } : { delivered: false });

  return Response.json({ ok: true, deliveryId: result.deliveryId, delivered: delivery.ok });
}
