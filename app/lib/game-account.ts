// Cliente do AccountBridge — API separada rodando na VPS, do lado do
// banco de conta real do jogo (tbl_rfaccount). Ver
// RF-Online/AccountBridge/README.md no repo do servidor pra detalhes.
// Ainda não está ligado em nenhuma página (/conta segue travado até o
// lançamento) — isso é só o conector, pronto pra quando for hora de
// abrir cadastro/login de jogador de verdade.

export type GameAccountResult =
  | { ok: true; username?: string }
  | { ok: false; status: number; error: string };

function bridgeConfig(): { url: string; key: string } {
  const url = process.env.GAME_ACCOUNT_BRIDGE_URL;
  const key = process.env.GAME_ACCOUNT_BRIDGE_KEY;
  if (!url || !key) {
    throw new Error(
      "GAME_ACCOUNT_BRIDGE_URL/GAME_ACCOUNT_BRIDGE_KEY não configuradas — sem elas não dá pra criar/verificar conta de jogador."
    );
  }
  return { url, key };
}

async function callBridge(path: string, username: string, password: string): Promise<GameAccountResult> {
  const { url, key } = bridgeConfig();
  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-key": key },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return { ok: false, status: 0, error: "Não foi possível falar com o servidor de contas. Tente novamente." };
  }

  if (res.ok) {
    const data = (await res.json()) as { ok: true; username?: string };
    return data;
  }

  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return { ok: false, status: res.status, error: data?.error ?? "Erro inesperado ao falar com o servidor de contas." };
}

export function createGameAccount(username: string, password: string): Promise<GameAccountResult> {
  return callBridge("/v1/accounts", username, password);
}

export function verifyGameAccount(username: string, password: string): Promise<GameAccountResult> {
  return callBridge("/v1/accounts/login", username, password);
}

export type GameCharacter = { serial: number; name: string; level: number; race: number };

// Lista os personagens de uma conta — GET /v1/characters na AccountBridge
// (consulta tbl_base no banco RF_World). Usado na loja de doações pra
// escolher em qual personagem a compra deve cair. Nunca lança: se a ponte
// não estiver configurada ou fora do ar, devolve [] (a página trata como
// "não deu pra carregar seus personagens agora").
export async function listCharacters(username: string): Promise<GameCharacter[]> {
  const url = process.env.GAME_ACCOUNT_BRIDGE_URL;
  const key = process.env.GAME_ACCOUNT_BRIDGE_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(`${url}/v1/characters?username=${encodeURIComponent(username)}`, {
      headers: { "x-bridge-key": key },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as GameCharacter[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export type ServerStatus = { online: boolean; playersOnline: number } | { online: null; playersOnline: null };

// Estado real do servidor (online + jogadores conectados agora), lido do
// mesmo mod side-channel que o launcher já usa — ver AccountBridge/README.md
// (GET /v1/status). Nunca lança: se a ponte não estiver configurada ou fora
// do ar, devolve {online:null} pra a página mostrar "indisponível" em vez de
// inventar um número.
export async function getServerStatus(): Promise<ServerStatus> {
  const url = process.env.GAME_ACCOUNT_BRIDGE_URL;
  const key = process.env.GAME_ACCOUNT_BRIDGE_KEY;
  if (!url || !key) return { online: null, playersOnline: null };

  try {
    const res = await fetch(`${url}/v1/status`, {
      headers: { "x-bridge-key": key },
      next: { revalidate: 20 },
    });
    if (!res.ok) return { online: null, playersOnline: null };
    const data = (await res.json()) as { online: boolean; playersOnline: number };
    return data;
  } catch {
    return { online: null, playersOnline: null };
  }
}
