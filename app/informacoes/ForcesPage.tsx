import { forceTrees, forces } from "./data/game";
import { Callout, DocPage } from "./DocPage";
import { SkillCard } from "./SkillCard";

export default function ForcesPage({ treeId }: { treeId: string }) {
  const tree = forceTrees.find((t) => t.id === treeId)!;
  const tiers = tree.tiers.map((m, i) => ({ mastery: m, n: i + 1, list: forces.filter((f) => f.mastery === m) })).filter((t) => t.list.length);
  return (
    <DocPage kicker="FORCES" title={`Forces de ${tree.name}`} toc={tiers.map((t) => ({ id: `tier-${t.n}`, label: `${t.n}º nível — ${t.mastery}` }))}>
      <p className="doc-lead">Forces são as magias do Spiritualist. Cada Force evolui do nível 1 ao 7.</p>
      <Callout tone="info">
        Forces marcadas <span className="doc-tag doc-tag-new">NOVA</span> foram adicionadas ou liberadas; as <span className="doc-tag doc-tag-changed">AJUSTADA</span> mudaram, e o que mudou aparece no fim do cartão. Resumo em <a href="/informacoes/melhorias">Melhorias</a>.
      </Callout>
      {tiers.map((t) => (
        <div key={t.mastery}>
          <h2 id={`tier-${t.n}`}>
            {t.n}º nível <small className="doc-h2-note">({t.mastery})</small>
          </h2>
          <div className="doc-skills">
            {t.list.map((f) => (
              <SkillCard key={f.id} e={f} kind="f" force />
            ))}
          </div>
        </div>
      ))}
    </DocPage>
  );
}
