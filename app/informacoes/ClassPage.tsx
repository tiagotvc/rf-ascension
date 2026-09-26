import { classLead } from "./data/accretia-content";
import { cameFrom, classByCode, classUrl, cskills, generatedAt, reachLevel, type ClassInfo } from "./data/game";
import { classGradeLabel } from "./data/accretia-content";
import { DocPage } from "./DocPage";
import { SkillCard } from "./SkillCard";

export const emblemSrc = (code: string) => `/assets/info/emblems/${code}.png`;

export default function ClassPage({ cls }: { cls: ClassInfo }) {
  const from = cameFrom(cls);
  const skills = cls.skills.map((c) => cskills[c]).filter(Boolean);
  const bonus = [cls.bonus.hp && `HP +${cls.bonus.hp}`, cls.bonus.fp && `FP +${cls.bonus.fp}`, cls.bonus.sp && `SP +${cls.bonus.sp}`].filter(Boolean);
  const reach = reachLevel(cls);
  const link = (c: ClassInfo, i: number) => (
    <span key={c.code}>
      {i > 0 && ", "}
      <a href={classUrl(c)}>{c.name}</a>
    </span>
  );
  const dest = cls.to.map((code) => classByCode(code)).filter((c): c is ClassInfo => Boolean(c));
  return (
    <DocPage
      kicker={`${cls.race.toUpperCase()} · LINHA ${cls.line.toUpperCase()} · ${classGradeLabel[cls.grade] ?? ""}`}
      title={cls.name}
      icon={emblemSrc(cls.code)}
      toc={[
        { id: "resumo", label: "Resumo" },
        { id: "skills", label: "Skills da classe" },
        { id: "notas", label: "Notas" },
      ]}
    >
      <p className="doc-lead">{classLead[cls.code] ?? cls.desc}</p>
      <div className="doc-callout doc-callout-info">Valores lidos dos arquivos do servidor em {generatedAt}.</div>

      <h2 id="resumo">Resumo</h2>
      <div className="doc-table-wrap">
        <table className="doc-table doc-table-kv">
          <tbody>
            <tr>
              <th>Raça</th>
              <td>{cls.race}</td>
            </tr>
            <tr>
              <th>Linha</th>
              <td>{cls.line}</td>
            </tr>
            {cls.clientName && (
              <tr>
                <th>Nome no cliente em inglês</th>
                <td>{cls.clientName}</td>
              </tr>
            )}
            <tr>
              <th>Código da classe</th>
              <td>{cls.code}</td>
            </tr>
            {reach > 0 && (
              <tr>
                <th>Nível para alcançar</th>
                <td>{reach}</td>
              </tr>
            )}
            <tr>
              <th>Vem de</th>
              <td>{from.length && !from.every((f) => f.grade === 0) ? from.map(link) : "Qualquer classe inicial"}</td>
            </tr>
            {dest.length > 0 && (
              <tr>
                <th>Evolui para</th>
                <td>
                  Nível {cls.upgradeLv}: {dest.map(link)}
                </td>
              </tr>
            )}
            {bonus.length > 0 && (
              <tr>
                <th>Bônus ao evoluir para ela</th>
                <td>{bonus.join(" · ")}</td>
              </tr>
            )}
            <tr>
              <th>Skills exclusivas</th>
              <td>{skills.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="skills">Skills da classe</h2>
      {skills.length === 0 ? (
        <p>Esta classe não tem skills exclusivas: usa as skills e Forces comuns.</p>
      ) : (
        <>
          <p>Skills de classe têm valores fixos: não existem níveis 1 a 7 como nas skills comuns.</p>
          <div className="doc-skills">
            {skills.map((s) => (
              <SkillCard key={s.id} e={s} kind="c" />
            ))}
          </div>
        </>
      )}

      <h2 id="notas">Notas</h2>
      <ul className="doc-list">
        <li>As skills de classes anteriores continuam disponíveis depois de evoluir.</li>
        <li>O dano das skills é um percentual do seu ataque.</li>
        <li>
          Veja a árvore completa em <a href={`/informacoes/classes/${cls.race.toLowerCase()}`}>Classes de {cls.race}</a>.
        </li>
      </ul>
    </DocPage>
  );
}

