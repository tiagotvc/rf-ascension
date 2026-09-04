import { requireSessionUser } from "../lib/auth";
import { getRecentTopics } from "../../db/forum";
import { forumAreas, findForumBoard, formatForumDate } from "../config/forum";
import AdminPostEditor from "./AdminPostEditor";
import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

const Brand = () => <span className="brand"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>ADMIN CONSOLE</small></span></span>;

export default async function Admin() {
  const user = await requireSessionUser("/admin");
  const recent = await getRecentTopics(10);

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <a href="/"><Brand /></a>
        <nav>
          <span>GERENCIAMENTO</span>
          <a className="active" href="/admin"><i>✎</i> Criar post</a>
          <a href="#posts"><i>▤</i> Posts recentes <b>{recent.length}</b></a>
          <a href="/admin/potions"><i>⚗</i> Loja de poções</a>
          <a href="/forum"><i>◫</i> Áreas do fórum</a>
        </nav>
        <div className="admin-user">
          <i>{user.displayName.slice(0, 2).toUpperCase()}</i>
          <span><strong>{user.displayName}</strong><small>Equipe</small></span>
          <AdminLogoutButton />
        </div>
      </aside>
      <section className="admin-workspace">
        <header>
          <div><span>PAINEL ADMINISTRATIVO</span><h1>Novo post</h1></div>
        </header>
        <AdminPostEditor areas={forumAreas} />
        <section className="recent-admin" id="posts">
          <header><h2>Posts recentes</h2></header>
          {recent.length === 0 ? (
            <p style={{ color: "#58636e", fontSize: 11 }}>Nenhum post ainda.</p>
          ) : (
            recent.map((topic, i) => {
              const board = findForumBoard(topic.forumSlug);
              return (
                <div key={topic.id}>
                  <span>0{i + 1}</span>
                  <strong>{topic.title}</strong>
                  <small>{board?.board.title ?? topic.forumSlug}</small>
                  <time>{formatForumDate(topic.createdAt)}</time>
                  <a href={`/forum/${topic.forumSlug}/topic/${topic.id}`}>Ver →</a>
                </div>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
