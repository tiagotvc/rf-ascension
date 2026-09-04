import fs from "node:fs";
import path from "node:path";

export type PotionCatalogEntry = { code: string; name: string; icon: string | null; level: number | null };

// Lê o catálogo exportado do Item.edf real (ver public/game-data/potions/catalog.json e o comentário
// em MapEditor/Program.cs, bloco RF_EXPORT_POTION_SHOP_CATALOG) — nome/ícone de TODAS as poções do
// jogo. Não confundir com potion_shop_items (banco): aquilo é só a curadoria de quais o admin
// habilitou pra venda e por qual preço.
export function loadPotionCatalog(): PotionCatalogEntry[] {
  const filePath = path.join(process.cwd(), "public", "game-data", "potions", "catalog.json");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as PotionCatalogEntry[];
  } catch {
    return [];
  }
}
