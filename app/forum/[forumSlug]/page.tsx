import { notFound } from "next/navigation";
import { findForumBoard, formatForumDate, forumInitials } from "../../config/forum";
import { listForumTopics, getRecentTopics, isStaffEmail } from "../../../db/forum";
import { getChatGPTUser, chatGPTSignInPath } from "../../chatgpt-auth";
import NewTopicForm from "../NewTopicForm";

export const dynamic = "force-dynamic";

export default async function ForumBoard({ params }: { params: Promise<{ forumSlug: string }> }) {
  const { forumSlug } = await params;
  const found = findForumBoard(forumSlug);
  if (!found) notFound();
  const { area, board } = found;

  const [topics, user, recentTopics] = await Promise.all([
    listForumTopics(forumSlug),
    getChatGPTUser(),
    getRecentTopics(6),
  ]);

  return (
    <main className="forum-page board-page">
      <header className="site-header forum-nav">
        <a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>PRIVATE SERVER</small></span></a>
        <nav><a href="/">Início</a><a href="/#download">Download</a><a href="/doacao">Doação</a><a className="active" href="/forum">Fórum</a><a href="/conta">Minha conta</a></nav>
        <div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/forum">EN</a></span><a className="header-cta" href="/conta">Criar conta</a></div>
      </header>
      <section className="board-hero">
        <div className="tutorial-crumb"><a href="/forum">FÓRUM</a><span>/</span><a href="/forum">{area.title.toUpperCase()}</a><span>/</span><b>{board.title.toUpperCase()}</b></div>
        <h1>{board.icon} {board.title}</h1>
        <p>{board.description}</p>
      </section>
      <section className="board-content board-layout">
        <div>
          <div className="board-toolbar">
            <span>{topics.length} {topics.length === 1 ? "tópico" : "tópicos"}</span>
            {board.canCreateTopics ? (
              user ? (
                isStaffEmail(user.email) ? (
                  <NewTopicForm forumSlug={forumSlug} />
                ) : (
                  <span className="board-staff-note">Por enquanto, só a equipe pode publicar tópicos aqui.</span>
                )
              ) : (
                <span className="login-gate"><small>Você não está logado.</small><a className="btn btn-ghost" href={chatGPTSignInPath(`/forum/${forumSlug}`)}>Entrar</a></span>
              )
            ) : (
              <span className="board-staff-note">Mural mantido pela equipe Echelon.</span>
            )}
          </div>
          {topics.length === 0 ? (
            <p className="board-empty">Nenhum tópico ainda. {board.canCreateTopics ? "Seja o primeiro a publicar." : ""}</p>
          ) : (
            <div className="topic-index">
              {topics.map((topic) => (
                <a className="topic-index-row" href={`/forum/${forumSlug}/topic/${topic.id}`} key={topic.id}>
                  <span className={`topic-index-avatar ${isStaffEmail(topic.authorEmail) ? "staff" : ""}`}>{forumInitials(topic.authorName)}</span>
                  <span className="topic-index-main">
                    {topic.pinned && <b className="pin-badge">FIXADO</b>}
                    <strong>{topic.title}</strong>
                    <small>Por {topic.authorName} · {formatForumDate(topic.createdAt)}</small>
                  </span>
                  <span className="topic-index-count"><b>{topic.replyCount}</b><small>{topic.replyCount === 1 ? "resposta" : "respostas"}</small></span>
                  <b className="forum-row-arrow">→</b>
                </a>
              ))}
            </div>
          )}
        </div>
        <aside className="board-sidebar">
          <div className="sidebar-card">
            <span className="sidebar-card-title">AÇÕES RÁPIDAS</span>
            <a className="sidebar-link" href="/doacao"><i>◈</i><span>Cash Points & doação</span></a>
            <a className="sidebar-link" href="/conta"><i>♙</i><span>Minha conta</span></a>
          </div>
          <div className="sidebar-card">
            <span className="sidebar-card-title">TÓPICOS RECENTES</span>
            {recentTopics.length === 0 ? (
              <p className="sidebar-empty">Nenhum tópico ainda.</p>
            ) : (
              recentTopics.map((t) => {
                const b = findForumBoard(t.forumSlug);
                return (
                  <a className="sidebar-topic" href={`/forum/${t.forumSlug}/topic/${t.id}`} key={t.id}>
                    <span className={`topic-index-avatar sm ${isStaffEmail(t.authorEmail) ? "staff" : ""}`}>{forumInitials(t.authorName)}</span>
                    <span>
                      <strong>{t.title}</strong>
                      <small>{b?.board.title ?? ""} · {formatForumDate(t.createdAt)}</small>
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
