import { notFound } from "next/navigation";
import { findForumBoard, formatForumDate, forumInitials } from "../../../../config/forum";
import { getForumTopicWithPosts, getAuthorStats, isStaffEmail } from "../../../../../db/forum";
import { getChatGPTUser, chatGPTSignInPath } from "../../../../chatgpt-auth";
import ReplyForm from "../../../ReplyForm";
import PostBody from "../../../PostBody";

export const dynamic = "force-dynamic";

function formatShortDate(iso: string): string {
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ForumTopic({
  params,
}: {
  params: Promise<{ forumSlug: string; topicId: string }>;
}) {
  const { forumSlug, topicId: topicIdParam } = await params;
  const found = findForumBoard(forumSlug);
  if (!found) notFound();
  const topicId = Number(topicIdParam);
  if (!Number.isInteger(topicId)) notFound();

  const [data, user] = await Promise.all([getForumTopicWithPosts(forumSlug, topicId), getChatGPTUser()]);
  if (!data) notFound();
  const { area, board } = found;
  const { topic, posts } = data;
  const authorStats = await getAuthorStats([...new Set(posts.map((p) => p.authorEmail))]);

  return (
    <main className="forum-page thread-page">
      <header className="site-header forum-nav">
        <a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ASCENSION</strong><small>PRIVATE SERVER</small></span></a>
        <nav><a href="/">Início</a><a href="/#download">Download</a><a href="/doacao">Doação</a><a className="active" href="/forum">Fórum</a><a href="/conta">Minha conta</a></nav>
        <div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/forum">EN</a></span><a className="header-cta" href="/conta">Criar conta</a></div>
      </header>
      <section className="board-hero thread-hero">
        <div className="tutorial-crumb"><a href="/forum">FÓRUM</a><span>/</span><a href="/forum">{area.title.toUpperCase()}</a><span>/</span><a href={`/forum/${forumSlug}`}>{board.title.toUpperCase()}</a></div>
        <h1>{topic.title}</h1>
        <p>Por {topic.authorName} · {formatForumDate(topic.createdAt)}</p>
      </section>
      <section className="board-content">
        <div className="post-list">
          {posts.map((post, i) => {
            const stats = authorStats.get(post.authorEmail);
            const staff = isStaffEmail(post.authorEmail);
            return (
              <article className="thread-post" key={post.id}>
                <aside className="thread-post-user">
                  <div className={`thread-post-avatar ${staff ? "staff" : ""}`}>
                    {forumInitials(post.authorName)}
                    <i className="avatar-badge">{staff ? "★" : "◆"}</i>
                  </div>
                  <strong>{post.authorName}</strong>
                  <span className={`role-badge ${staff ? "staff" : ""}`}>{staff ? "Equipe Ascension" : "Membro"}</span>
                  <dl className="thread-post-stats">
                    <div><dt>Mensagens</dt><dd>{stats?.postCount ?? 1}</dd></div>
                    <div><dt>Desde</dt><dd>{formatShortDate(stats?.memberSince ?? post.createdAt)}</dd></div>
                  </dl>
                </aside>
                <div className="thread-post-body">
                  <div className="thread-post-meta"><i>{i === 0 ? "✦" : "↳"}</i><span>{i === 0 ? "Publicação original" : `Resposta #${i}`} · {formatForumDate(post.createdAt)}</span></div>
                  <p><PostBody text={post.body} /></p>
                </div>
              </article>
            );
          })}
        </div>
        {board.canReply ? (
          user ? (
            <ReplyForm forumSlug={forumSlug} topicId={topic.id} />
          ) : (
            <a className="btn btn-ghost" href={chatGPTSignInPath(`/forum/${forumSlug}/topic/${topic.id}`)}>Entrar para responder</a>
          )
        ) : null}
      </section>
    </main>
  );
}
