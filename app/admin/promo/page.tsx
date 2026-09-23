import { requireSessionUser } from "../../lib/auth";
import { listPromoSubmissionsForReview } from "../../../db/promo";
import PromoReviewPanel from "./PromoReviewPanel";
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

export default async function AdminPromo() {
  const user = await requireSessionUser("/admin/promo");
  const submissions = await listPromoSubmissionsForReview(200);
  const pendingCount = submissions.filter((s) => s.status === "submitted").length;

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
          <a href="/admin/potions">
            <i>⚗</i> Loja de poções
          </a>
          <a href="/admin/orders">
            <i>◈</i> Pedidos
          </a>
          <a className="active" href="/admin/promo">
            <i>📣</i> Divulgação <b>{pendingCount > 0 ? pendingCount : submissions.length}</b>
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
            <h1>Evento de divulgação</h1>
          </div>
        </header>
        <p className="promo-admin-hint">
          O GP só é creditado quando você aprova — abra a postagem no link e confira se o código do dia aparece nela antes de
          decidir. Grupo do Facebook não pode ser validado por API (Meta bloqueia oEmbed de post de grupo), então essa conferência
          manual é a única defesa real contra link falso ou postagem sem o código.
        </p>
        <PromoReviewPanel initialSubmissions={submissions} />
      </section>
    </main>
  );
}
