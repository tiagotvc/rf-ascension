import type { ReactNode } from "react";

export type TocItem = { id: string; label: string };

export function DocPage({ kicker, title, toc, children }: { kicker: string; title: string; toc: TocItem[]; children: ReactNode }) {
  return (
    <div className="doc-content">
      <article className="doc-article">
        <header className="doc-hero">
          <span className="doc-kicker">{kicker}</span>
          <h1>{title}</h1>
        </header>
        {children}
      </article>
      <aside className="doc-toc" aria-label="Nesta página">
        <span>NESTA PÁGINA</span>
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`}>
            {t.label}
          </a>
        ))}
      </aside>
    </div>
  );
}

export function Callout({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: ReactNode }) {
  return <div className={`doc-callout doc-callout-${tone}`}>{children}</div>;
}
