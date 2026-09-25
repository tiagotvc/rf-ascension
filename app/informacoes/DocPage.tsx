import type { ReactNode } from "react";

export type TocItem = { id: string; label: string };

export function DocPage({ kicker, title, toc, icon, children }: { kicker: string; title: string; toc: TocItem[]; icon?: string; children: ReactNode }) {
  return (
    <div className="doc-content">
      <article className="doc-article">
        <header className="doc-hero">
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="doc-hero-icon" src={icon} alt="" width={90} height={90} />
          )}
          <div>
            <span className="doc-kicker">{kicker}</span>
            <h1>{title}</h1>
          </div>
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
