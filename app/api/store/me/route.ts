import { getPlayerSession } from "../../../lib/player-auth";

// Checagem leve de sessão de jogador pro HeaderAuth (client component,
// precisa saber se tem alguém logado sem virar toda página em server
// component). Sem efeito colateral nenhum, só lê o cookie assinado.
export async function GET() {
  const session = await getPlayerSession();
  return Response.json({ username: session?.username ?? null });
}
