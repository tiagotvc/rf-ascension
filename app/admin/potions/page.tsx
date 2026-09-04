import fs from "node:fs";
import path from "node:path";
import { requireSessionUser } from "../../lib/auth";
import { getPotionShopSelections } from "../../../db/potion-shop";
import PotionShopAdminPanel, { type PotionCatalogEntry } from "./PotionShopAdminPanel";
import AdminLogoutButton from "../AdminLogoutButton";

export const dynamic = "force-dynamic";

const Brand = () => (
  <span className="brand">
    <span className="brand-mark">RF</span>
    <span className="brand-copy">
      <strong>ECHELON</strong>
      <small>ADMIN CONSOLE</small>
    </span>
  </span>
);

function loadCatalog(): PotionCatalogEntry[] {
  const filePath = path.join(process.cwd(), "public", "game-data", "potions", "catalog.json");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as PotionCatalogEntry[];
  } catch {
    return [];
  }
}

export default async function AdminPotions() {
  const user = await requireSessionUser("/admin/potions");
  const [catalog, selections] = await Promise.all([Promise.resolve(loadCatalog()), getPotionShopSelections()]);

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <a href="/">
          <Brand />
        </a>
        <nav>
          <span>GERENCIAMENTO</span>
          <a href="/admin">
            <i>✎</i> Criar post
          </a>
          <a className="active" href="/admin/potions">
            <i>⚗</i> Loja de poções <b>{catalog.length}</b>
          </a>
          <a href="/forum">
            <i>◫</i> Áreas do fórum
          </a>
        </nav>
        <div className="admin-user">
          <i>{user.displayName.slice(0, 2).toUpperCase()}</i>
          <span>
            <strong>{user.displayName}</strong>
            <small>Equipe</small>
          </span>
          <AdminLogoutButton />
        </div>
      </aside>
      <section className="admin-workspace">
        <header>
          <div>
            <span>PAINEL ADMINISTRATIVO</span>
            <h1>Loja de poções</h1>
          </div>
        </header>
        <PotionShopAdminPanel catalog={catalog} initialSelections={selections} />
      </section>
    </main>
  );
}
