import { sql } from "drizzle-orm";
import { getDb } from "./index";
import { potionShopItems } from "./schema";
import { spendGp } from "./store";
import { loadPotionCatalog, type PotionCatalogEntry } from "../app/lib/potion-catalog";

const MAX_PURCHASE_QUANTITY = 20;

type Db = Awaited<ReturnType<typeof getDb>>;

let bootstrapped = false;

async function ensurePotionShopSchema(db: Db) {
  if (bootstrapped) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS potion_shop_items (
    item_code TEXT PRIMARY KEY,
    gp_price INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  bootstrapped = true;
}

export type PotionShopSelection = { itemCode: string; gpPrice: number };

// Todas as poções que o admin já habilitou pra venda, com o preço em GP —
// chave é o código, pra casar fácil com public/game-data/potions/catalog.json
// (nome/ícone) no lado do cliente.
export async function getPotionShopSelections(): Promise<Record<string, number>> {
  const db = await getDb();
  await ensurePotionShopSchema(db);
  const rows = await db.select().from(potionShopItems);
  return Object.fromEntries(rows.map((r) => [r.itemCode, r.gpPrice]));
}

// Substitui de vez a lista de poções habilitadas pelo conjunto passado —
// mais simples que diff incremental, e o admin sempre manda o estado
// completo da tela (checkbox + preço de cada item) numa vez só.
export async function savePotionShopSelections(selections: PotionShopSelection[]): Promise<void> {
  const db = await getDb();
  await ensurePotionShopSchema(db);

  await db.transaction(async (tx) => {
    const codes = selections.map((s) => s.itemCode);
    if (codes.length > 0) {
      await tx.delete(potionShopItems).where(sql`${potionShopItems.itemCode} NOT IN ${codes}`);
    } else {
      await tx.delete(potionShopItems);
    }

    for (const { itemCode, gpPrice } of selections) {
      await tx
        .insert(potionShopItems)
        .values({ itemCode, gpPrice, updatedAt: new Date().toISOString() })
        .onConflictDoUpdate({
          target: potionShopItems.itemCode,
          set: { gpPrice, updatedAt: new Date().toISOString() },
        });
    }
  });
}

export type PublicPotion = { code: string; name: string; icon: string | null; gpPrice: number };

// Loja pública (/gamecp) — só as poções que o admin habilitou, com nome/ícone
// vindo do catálogo estático (public/game-data/potions/catalog.json).
export async function getPublicPotionCatalog(): Promise<PublicPotion[]> {
  const [catalog, selections] = await Promise.all([Promise.resolve(loadPotionCatalog()), getPotionShopSelections()]);
  const byCode = new Map<string, PotionCatalogEntry>(catalog.map((p) => [p.code, p]));

  const result: PublicPotion[] = [];
  for (const [code, gpPrice] of Object.entries(selections)) {
    const entry = byCode.get(code);
    if (!entry) continue; // item saiu do catálogo (Item.edf mudou) - ignora silenciosamente
    result.push({ code, name: entry.name, icon: entry.icon, gpPrice });
  }
  return result.sort((a, b) => a.gpPrice - b.gpPrice);
}

// Debita o GP da compra (mesmo lock transacional de spendGp/purchasePackage) — a entrega de verdade
// (deliverItem, opcode 1/2 do CStoreDeliveryChannel) acontece à parte, na rota da API, que também
// decide se estorna em caso de falha (mesmo padrão do /api/store/exchange).
export async function purchasePotion(
  accountUsername: string,
  itemCode: string,
  quantity: number
): Promise<{ ok: true; totalGpCost: number } | { ok: false; error: string }> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PURCHASE_QUANTITY) {
    return { ok: false, error: `Quantidade inválida (1 a ${MAX_PURCHASE_QUANTITY}).` };
  }

  const selections = await getPotionShopSelections();
  const gpPrice = selections[itemCode];
  if (gpPrice === undefined) {
    return { ok: false, error: "Essa poção não está à venda." };
  }

  const totalGpCost = gpPrice * quantity;
  const debit = await spendGp(accountUsername, totalGpCost, `potion:${itemCode}`);
  if (!debit.ok) {
    return { ok: false, error: debit.error };
  }
  return { ok: true, totalGpCost };
}

