import { skills, tierName, tierOrder } from "./data/game";
import { Callout, DocPage } from "./DocPage";
import { SkillCard } from "./SkillCard";

export default function SkillsPage({ group }: { group: "melee" | "range" }) {
  const title = group === "melee" ? "Skills de Melee" : "Skills de Range";
  const prefix = group === "melee" ? "Melee" : "Range";
  const tiers = tierOrder.map((t) => ({ key: t, label: tierName[t], list: skills.filter((s) => s.mastery === `${prefix} ${t}`) })).filter((t) => t.list.length);
  return (
    <DocPage kicker="SKILLS COMUNS" title={title} toc={tiers.map((t) => ({ id: t.label.toLowerCase(), label: t.label }))}>
      <p className="doc-lead">
        Skills comuns valem para todas as raças e evoluem do nível 1 ao 7. São divididas em quatro níveis de maestria: Novato, Expert, Master e Elite.
      </p>
      <Callout tone="info">
        Skills marcadas <span className="doc-tag doc-tag-new">NOVA</span> foram adicionadas ou liberadas; as marcadas <span className="doc-tag doc-tag-changed">AJUSTADA</span> mudaram, e o que mudou aparece no fim do cartão. O resumo de tudo está em <a href="/informacoes/melhorias">Melhorias</a>.
      </Callout>
      {tiers.map((t) => (
        <div key={t.key}>
          <h2 id={t.label.toLowerCase()}>{t.label}</h2>
          <div className="doc-skills">
            {t.list.map((s) => (
              <SkillCard key={s.id} e={s} kind="s" />
            ))}
          </div>
        </div>
      ))}
    </DocPage>
  );
}
