import { forumAreas, formatForumDate } from "../config/forum";
import { getForumIndexStats } from "../../db/forum";

export const dynamic = "force-dynamic";

export default async function Forum() {
  const stats = await getForumIndexStats();
  const totalTopics = [...stats.values()].reduce((sum, s) => sum + s.topicCount, 0);
  const totalReplies = [...stats.values()].reduce((sum, s) => sum + s.replyCount, 0);

  return (
    <main className="forum-page">
      <header className="site-header forum-nav"><a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ASCENSION</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/">Início</a><a href="/#download">Download</a><a href="/doacao">Doação</a><a className="active" href="/forum">Fórum</a><a href="/conta">Minha conta</a></nav><div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/forum">EN</a></span><a className="header-cta" href="/conta">Criar conta</a></div></header>
      <section className="forum-hero compact"><span className="kicker">COMUNIDADE RF ASCENSION</span><h1>Fórum da <em>comunidade.</em></h1><p>Encontre informações, aprenda os sistemas do jogo e participe das discussões.</p><div className="forum-tools"><label><span>⌕</span><input aria-label="Pesquisar no fórum" placeholder="Pesquisar em todas as áreas..." /></label><a className="btn btn-primary" href="#areas">Explorar áreas ↓</a></div></section>
      <section className="forum-content forum-index" id="areas">
        <div className="forum-strip square"><span><i className="pulse" /> comunidade ativa</span><span>{totalTopics} {totalTopics === 1 ? "tópico" : "tópicos"}</span><span>{totalReplies} {totalReplies === 1 ? "resposta" : "respostas"}</span><span>Fórum real · publique você mesmo</span></div>
        <div className="index-legend"><span>FÓRUM</span><span>TÓPICOS</span><span>RESPOSTAS</span><span>ÚLTIMO POST</span></div>
        {forumAreas.map((area) => (
          <section className={`forum-area ${area.tone}`} key={area.title}>
            <header><span>{area.code}</span><h2>{area.title}</h2><small>{area.boards.length} áreas</small></header>
            <div>
              {area.boards.map((board) => {
                const s = stats.get(board.slug);
                return (
                  <a className="forum-row" href={board.slug === "05-1" ? "/forum/doacoes" : `/forum/${board.slug}`} key={board.slug}>
                    <span className="forum-row-icon">{board.icon}</span>
                    <span className="forum-row-main"><span className="row-label">{board.canCreateTopics ? "COMUNIDADE" : "EQUIPE"}</span><strong>{board.title}</strong><small>{board.description}</small></span>
                    <span className="forum-row-count"><b>{s?.topicCount ?? 0}</b><small>tópicos</small></span>
                    <span className="forum-row-count"><b>{s?.replyCount ?? 0}</b><small>respostas</small></span>
                    <span className="forum-row-last">{s?.latest ? <><i>{s.latest.authorName.slice(0, 1)}</i><span><strong>{s.latest.title}</strong><small>{s.latest.authorName} · {formatForumDate(s.latest.createdAt)}</small></span></> : <span><small>Nenhum tópico ainda</small></span>}</span>
                    <b className="forum-row-arrow">→</b>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
        <section className="rules-card square" id="informacoes"><div><span className="kicker">ANTES DE PUBLICAR</span><h2>Uma comunidade forte<br />começa com respeito.</h2></div><div><p><b>01.</b> Seja respeitoso com todos os jogadores.</p><p><b>02.</b> Procure antes de criar um novo tópico.</p><p><b>03.</b> Denúncias devem conter evidências.</p></div></section>
      </section>
    </main>
  );
}
