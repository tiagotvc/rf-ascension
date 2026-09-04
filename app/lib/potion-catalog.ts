import fs from "node:fs";
import path from "node:path";

export type PotionCatalogEntry = { code: string; name: string; icon: string | null; level: number | null };

// Apesar do nome do arquivo, cobre TODAS as categorias de item já mapeadas — cada pasta abaixo é uma
// categoria exportada separadamente do Item.edf real via MapEditor (bloco RF_EXPORT_*_SHOP_CATALOG em
// MapEditor/Program.cs), ver public/game-data/<categoria>/catalog.json. `icon` já sai daqui com o
// caminho completo relativo a /game-data/ (ex.: "potions/icons/iywml01.png"), pronto pra um <img src>.
// Não confundir com potion_shop_items (banco): aquilo é só a curadoria de quais o admin habilitou pra
// venda e por qual preço — o catálogo aqui é só leitura, sempre o universo completo.
const CATALOG_DIRS = ["potions", "resources"];

export function loadPotionCatalog(): PotionCatalogEntry[] {
  const all: PotionCatalogEntry[] = [];
  for (const dir of CATALOG_DIRS) {
    const filePath = path.join(process.cwd(), "public", "game-data", dir, "catalog.json");
    let entries: PotionCatalogEntry[];
    try {
      entries = JSON.parse(fs.readFileSync(filePath, "utf8")) as PotionCatalogEntry[];
    } catch {
      continue; // categoria ainda não exportada pra public/ - ignora
    }
    for (const entry of entries) {
      all.push({ ...entry, icon: entry.icon ? `${dir}/icons/${entry.icon}` : null });
    }
  }
  return all;
}
