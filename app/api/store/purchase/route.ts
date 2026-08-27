import { getPlayerSession } from "../../../lib/player-auth";
import { getSessionUser } from "../../../lib/auth";
import { isStaffEmail } from "../../../../db/forum";
import { listCharacters } from "../../../lib/game-account";
import { purchasePackage } from "../../../../db/store";

export async function POST(request: Request) {
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

  // Pacotes ainda não são visíveis pra jogador comum — só libera a compra
  // se também houver sessão de equipe ativa no mesmo navegador.
  const staffUser = await getSessionUser();
  const allowHidden = staffUser !== null && isStaffEmail(staffUser.email);

  const result = await purchasePackage(session.username, character.serial, character.name, packageKey, allowHidden);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, deliveryId: result.deliveryId });
}
