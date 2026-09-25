"use client";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DocNavGroup, DocNavItem } from "./nav";

function matches(item: DocNavItem, q: string) {
  return item.title.toLowerCase().includes(q);
}

function filterGroup(group: DocNavGroup, q: string): DocNavGroup | null {
  if (!q) return group;
  const items = group.items.filter((i) => matches(i, q));
  const groups = (group.groups ?? []).map((g) => filterGroup(g, q)).filter((g): g is DocNavGroup => g !== null);
  if (group.title.toLowerCase().includes(q)) return group;
  return items.length || groups.length ? { ...group, items, groups } : null;
}

function Group({ group, pathname, open }: { group: DocNavGroup; pathname: string; open: boolean }) {
  return (
    <details className="doc-nav-group" open={open}>
      <summary>{group.title}</summary>
      <div>
        {group.items.map((item) => (
          <a key={item.href} href={item.href} className={pathname === item.href ? "active" : undefined} aria-current={pathname === item.href ? "page" : undefined}>
            {item.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.icon} alt="" width={24} height={24} />
            )}
            <span className="doc-nav-title">{item.title}</span>
            {item.badge && <span className="doc-nav-badge">{item.badge}</span>}
          </a>
        ))}
        {(group.groups ?? []).map((g) => (
          <Group key={g.title} group={g} pathname={pathname} open={open} />
        ))}
      </div>
    </details>
  );
}

export default function DocsSidebar({ root, groups }: { root: DocNavItem; groups: DocNavGroup[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => groups.map((g) => filterGroup(g, q)).filter((g): g is DocNavGroup => g !== null), [groups, q]);

  return (
    <aside className="doc-sidebar" aria-label="Menu da documentação">
      <input className="doc-search" type="search" placeholder="Buscar na documentação..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar na documentação" />
      <a href={root.href} className={`doc-nav-root${pathname === root.href ? " active" : ""}`}>
        {root.title}
      </a>
      {visible.map((g) => (
        <Group key={g.title} group={g} pathname={pathname} open={true} />
      ))}
      {visible.length === 0 && <p className="doc-empty">Nada encontrado.</p>}
    </aside>
  );
}
