import { sql } from "drizzle-orm";
import { getDb } from "./index";
import { potionShopItems } from "./schema";

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

