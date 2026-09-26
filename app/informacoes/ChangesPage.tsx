import { cskills, forceTrees, forces, generatedAt, skills, tierName, type Entry } from "./data/game";
import { Callout, DocPage } from "./DocPage";
import { iconSrc, visibleChanges, type IconKind } from "./SkillCard";

type Item = { e: Entry; kind: IconKind; where: string; href: string };

const treeOf = (mastery: string) => forceTrees.find((t) => t.tiers.includes(mastery));

function where(kind: IconKind, e: Entry) {
  if (kind === "s") {
    const [group, tier] = e.mastery.split(" ");
    return { where: `${group} · ${tierName[tier] ?? tier}`, href: `/informacoes/skills/${group.toLowerCase()}#${e.id.toLowerCase()}` };
  }
  if (kind === "f") {
    const tree = treeOf(e.mastery);
    return { where: `Force · ${tree?.name ?? ""} · ${e.mastery}`, href: `/informacoes/forces/${tree?.id ?? "dark"}#${e.id.toLowerCase()}` };
  }
  return { where: "Skill de classe", href: "" };
}

const all: Item[] = [
  ...skills.map((e) => ({ e, kind: "s" as const, ...where("s", e) })),
  ...forces.map((e) => ({ e, kind: "f" as const, ...where("f", e) })),
  ...Object.values(cskills).map((e) => ({ e, kind: "c" as const, ...where("c", e) })),
];

function List({ items, showChanges }: { items: Item[]; showChanges: boolean }) {
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Onde</th>
            {showChanges && <th>O que mudou</th>}
          </tr>
        </thead>
        <tbody>
          {items.map(({ e, kind, where: w, href }) => (
            <tr key={kind + e.id}>
              <td>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="doc-emblem" src={iconSrc(kind, e.id)} alt="" width={32} height={32} />
                {href ? <a href={href}>{e.name}</a> : <b>{e.name}</b>}
              </td>
              <td>{w}</td>
              {showChanges && (
                <td>
                  <ul className="doc-changes doc-changes-tight">
                    {visibleChanges(e).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChangesPage() {
  const novas = all.filter((i) => i.e.status === "new" && i.kind !== "c");
  const ajustadas = all.filter((i) => i.e.status === "changed" && visibleChanges(i.e).length > 0);
  return (
    <DocPage
      kicker="INFORMAÇÕES DO SERVIDOR"
      title="Melhorias e novidades"
      toc={[
        { id: "novas", label: "Skills e Forces novas" },
        { id: "ajustadas", label: "Skills e Forces ajustadas" },
      ]}
    >
      <p className="doc-lead">Tudo o que foi adicionado ou ajustado nas skills e Forces em relação ao começo das melhorias (23 a 26/09/2026).</p>
      <Callout tone="info">
        Comparação feita entre os arquivos do servidor antes das melhorias e os de hoje ({generatedAt}). As skills das classes novas estão nas páginas das próprias classes.
      </Callout>
      <h2 id="novas">Skills e Forces novas</h2>
      <p>Skills de maestria Elite e Master liberadas, novas skills comuns e novas Forces.</p>
      <List items={novas} showChanges={false} />
      <h2 id="ajustadas">Skills e Forces ajustadas</h2>
      <p>Custo, recarga, dano, duração e efeitos que mudaram.</p>
      <List items={ajustadas} showChanges />
    </DocPage>
  );
}
