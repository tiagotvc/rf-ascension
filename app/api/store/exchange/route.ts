import { getPlayerSession } from "../../../lib/player-auth";
import { listCharacters, exchangeCurrency } from "../../../lib/game-account";
import { EXCHANGE_RATES, ExchangeCurrency, spendGp, refundGp } from "../../../../db/store";
import { checkRateLimit } from "../../../lib/rate-limit";

const MAX_GP_PER_EXCHANGE = 1_000_000;

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "store:exchange", 20, 10 * 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas trocas seguidas. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const session = await getPlayerSession();
  if (!session) {
    return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  let payload: { currency?: string; gpAmount?: number; characterSerial?: number };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const currency = payload.currency as ExchangeCurrency | undefined;
  const gpAmount = payload.gpAmount;
  if (!currency || !(currency in EXCHANGE_RATES)) {
    return Response.json({ error: "Moeda inválida." }, { status: 400 });
  }
  if (!Number.isInteger(gpAmount) || (gpAmount as number) <= 0 || (gpAmount as number) > MAX_GP_PER_EXCHANGE) {
    return Response.json({ error: "Quantidade de GP inválida." }, { status: 400 });
  }

  // Cash é por conta (characterSerial não importa pro WorldServer nesse caso, mas ainda exigimos um
  // personagem válido pra manter a mesma revalidação de posse em todos os caminhos). Dalant/Gold
  // Point são por personagem — sempre revalida que o serial pedido é realmente da conta logada,
  // nunca confia no que vem do cliente (mesmo padrão de purchase/route.ts).
  const characterSerial = payload.characterSerial;
  if (!Number.isInteger(characterSerial)) {
    return Response.json({ error: "Escolha um personagem." }, { status: 400 });
  }
  const characters = await listCharacters(session.username);
  const character = characters.find((c) => c.serial === characterSerial);
  if (!character) {
    return Response.json({ error: "Personagem não encontrado nessa conta." }, { status: 400 });
  }

  const debit = await spendGp(session.username, gpAmount as number, `exchange:${currency}`);
  if (!debit.ok) {
    return Response.json({ error: debit.error }, { status: 400 });
  }

  const targetAmount = (gpAmount as number) * EXCHANGE_RATES[currency];
  const result = await exchangeCurrency(character.serial, session.username, currency, targetAmount);
  if (!result.ok) {
    await refundGp(session.username, gpAmount as number, `exchange_refund:${currency}`);
    return Response.json({ error: "Não foi possível creditar agora. Seu GP foi devolvido — tente de novo em instantes." }, { status: 502 });
  }

  return Response.json({ ok: true, currency, targetAmount });
}
