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

export type DeliverItemResult =
  | { ok: true; method: "bag" | "mail" }
  | { ok: false; reason: "not_found" | "unreachable" | "error" };

// Entrega de verdade no personagem — POST /v1/deliver na AccountBridge, que
// aciona o canal novo do WorldServer (CStoreDeliveryChannel, porta 27602).
// Cai na bag se o personagem estiver online com espaço; senão vai por
// correio in-game. Nunca lança: falha de rede/servidor fora do ar vira
// {ok:false, reason:"unreachable"} — quem chama decide se tenta de novo.
export async function deliverItem(characterSerial: number, itemCode: string, amount: number): Promise<DeliverItemResult> {
  const url = process.env.GAME_ACCOUNT_BRIDGE_URL;
  const key = process.env.GAME_ACCOUNT_BRIDGE_KEY;
  if (!url || !key) return { ok: false, reason: "unreachable" };

  let res: Response;
  try {
    res = await fetch(`${url}/v1/deliver`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-key": key },
      body: JSON.stringify({ characterSerial, itemCode, amount }),
    });
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  if (!res.ok) return { ok: false, reason: "unreachable" };
  const data = (await res.json().catch(() => null)) as { ok?: boolean; status?: string } | null;
  if (!data?.ok) {
    return { ok: false, reason: data?.status === "not_found" ? "not_found" : "error" };
  }
  if (data.status === "bag" || data.status === "mail") {
    return { ok: true, method: data.status };
  }
  return { ok: false, reason: "error" };
}

export type DeliverPackageResult =
  | { ok: true; cashStatus: "credited" | "skipped"; itemStatuses: ("bag" | "mail")[] }
  | { ok: false; cashStatus: string; itemStatuses: string[] };

// Entrega de pacote completo (Fase 3 — item(s) + Cash real numa call só) —
// POST /v1/deliver-package na AccountBridge, que aciona o canal do
// WorldServer (CStoreDeliveryChannel, opcode 3/4). Nunca lança: falha de
// rede/servidor fora do ar vira {ok:false} — quem chama decide se tenta de
// novo (fila `deliveries`, retry via cron).
export async function deliverPackage(
  characterSerial: number,
  accountUsername: string,
  cashAmount: number,
  items: { itemCode: string; amount: number }[]
): Promise<DeliverPackageResult> {
  const url = process.env.GAME_ACCOUNT_BRIDGE_URL;
  const key = process.env.GAME_ACCOUNT_BRIDGE_KEY;
  if (!url || !key) return { ok: false, cashStatus: "error", itemStatuses: [] };

  let res: Response;
  try {
    res = await fetch(`${url}/v1/deliver-package`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-key": key },
      body: JSON.stringify({ characterSerial, accountUsername, cashAmount, items }),
    });
  } catch {
    return { ok: false, cashStatus: "error", itemStatuses: [] };
  }

  if (!res.ok) return { ok: false, cashStatus: "error", itemStatuses: [] };
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; cashStatus?: string; itemStatuses?: string[] }
    | null;
  if (!data) return { ok: false, cashStatus: "error", itemStatuses: [] };

  if (data.ok) {
    return {
      ok: true,
      cashStatus: data.cashStatus as "credited" | "skipped",
      itemStatuses: (data.itemStatuses ?? []) as ("bag" | "mail")[],
    };
  }
  return { ok: false, cashStatus: data.cashStatus ?? "error", itemStatuses: data.itemStatuses ?? [] };
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
