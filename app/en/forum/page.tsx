import { forumAreas } from "../../config/forum";
import { getForumIndexStats } from "../../../db/forum";

export const dynamic = "force-dynamic";

const AREA_TITLES_EN: Record<string, string> = {
  "Informações do RF Echelon": "Server Information",
  "Tutoriais & Conhecimento": "Tutorials & Knowledge",
  "Comunidade & Guerra": "Community & War",
  "Suporte & Segurança": "Support & Security",
  "Doações & Cash Points": "Donations & Cash Points",
};

const BOARD_EN: Record<string, { title: string; description: string }> = {
  "01-1": { title: "Official announcements", description: "News, maintenance, events and staff announcements." },
  "01-2": { title: "Server details", description: "Rates, systems, Chip War schedule and general rules." },
  "01-3": { title: "Patch notes", description: "Full history of patches, fixes and new features." },
  "02-1": { title: "Beginner guides", description: "Installation, early levels, gear and progression." },
  "02-2": { title: "Classes & Builds", description: "Discussions about classes, stats, weapons and combos." },
  "02-3": { title: "Mining & Economy", description: "Ores, processing, market and ways to earn gold." },
  "02-4": { title: "Monster Drops", description: "What each monster drops, rarity odds and where to farm." },
  "03-1": { title: "Guilds & Recruitment", description: "Introduce your guild and find allies to dominate Novus." },
  "03-2": { title: "Chip War & PvP", description: "Battle reports, war strategies and rivalries." },
  "03-3": { title: "Off-topic", description: "Community talk that doesn't fit the other areas." },
  "04-1": { title: "Player support", description: "Technical questions, launcher errors and connection issues." },
  "04-2": { title: "Reports & Appeals", description: "Report misconduct and request reviews." },
  "04-3": { title: "Account & Security", description: "Access recovery and best practices to protect your account." },
  "05-1": { title: "Donation center", description: "Check out packages, available bonuses and payment methods." },
  "05-2": { title: "Payments & Delivery", description: "Help with PIX, card, confirmation and automatic Cash delivery." },
  "05-3": { title: "Frequently asked questions", description: "History, bonuses, refunds and contribution security." },
};

function formatForumDateEn(iso: string): string {
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EnglishForum() {
  const stats = await getForumIndexStats();
  const totalTopics = [...stats.values()].reduce((sum, s) => sum + s.topicCount, 0);
  const totalReplies = [...stats.values()].reduce((sum, s) => sum + s.replyCount, 0);

  return (
    <main className="forum-page">
      <header className="site-header forum-nav">
        <a className="brand" href="/en"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>PRIVATE SERVER</small></span></a>
        <nav><a href="/en">Home</a><a href="/en#download">Download</a><a href="/en/donate">Donate</a><a className="active" href="/en/forum">Forum</a><a href="/en/account">My account</a></nav>
        <div className="header-tools"><span className="lang-switch"><a href="/forum">PT</a><b>EN</b></span><a className="header-cta" href="/en/account">Create account</a></div>
      </header>
      <section className="forum-hero compact">
        <span className="kicker">RF ECHELON COMMUNITY</span>
        <h1>Community <em>forum.</em></h1>
        <p>Find information, learn game systems and join the discussions.</p>
        <div className="forum-tools"><label><span>⌕</span><input placeholder="Search all sections..." aria-label="Search forum" /></label><a className="btn btn-primary" href="#areas">Browse sections ↓</a></div>
      </section>
      <section className="forum-content forum-index" id="areas">
        <div className="forum-strip square">
          <span><i className="pulse" /> active community</span>
          <span>{totalTopics} {totalTopics === 1 ? "topic" : "topics"}</span>
          <span>{totalReplies} {totalReplies === 1 ? "reply" : "replies"}</span>
          <span>Real forum · post it yourself</span>
        </div>
        <div className="index-legend"><span>FORUM</span><span>TOPICS</span><span>REPLIES</span><span>LAST POST</span></div>
        {forumAreas.map((area) => (
          <section className={`forum-area ${area.tone}`} key={area.title}>
            <header><span>{area.code}</span><h2>{AREA_TITLES_EN[area.title] ?? area.title}</h2><small>{area.boards.length} sections</small></header>
            <div>
              {area.boards.map((board) => {
                const s = stats.get(board.slug);
                const en = BOARD_EN[board.slug];
                return (
                  <a className="forum-row" href={board.slug === "05-1" ? "/forum/doacoes" : `/forum/${board.slug}`} key={board.slug}>
                    <span className="forum-row-icon">{board.icon}</span>
                    <span className="forum-row-main">
                      <span className="row-label">{board.canCreateTopics ? "COMMUNITY" : "STAFF"}</span>
                      <strong>{en?.title ?? board.title}</strong>
                      <small>{en?.description ?? board.description}</small>
                    </span>
                    <span className="forum-row-count"><b>{s?.topicCount ?? 0}</b><small>topics</small></span>
                    <span className="forum-row-count"><b>{s?.replyCount ?? 0}</b><small>replies</small></span>
                    <span className="forum-row-last">
                      {s?.latest ? (
                        <>
                          <i>{s.latest.authorName.slice(0, 1)}</i>
                          <span><strong>{s.latest.title}</strong><small>{s.latest.authorName} · {formatForumDateEn(s.latest.createdAt)}</small></span>
                        </>
                      ) : (
                        <span><small>No topics yet</small></span>
                      )}
                    </span>
                    <b className="forum-row-arrow">→</b>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
        <section className="rules-card square" id="informacoes">
          <div><span className="kicker">BEFORE POSTING</span><h2>A strong community<br />starts with respect.</h2></div>
          <div><p><b>01.</b> Be respectful to all players.</p><p><b>02.</b> Search before creating a new topic.</p><p><b>03.</b> Reports must include evidence.</p></div>
        </section>
      </section>
    </main>
  );
}
