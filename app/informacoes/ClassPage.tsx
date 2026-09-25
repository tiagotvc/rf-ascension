import data from "./data/accretia-ranger.json";
import { classGradeLabel, classLead, classSlugs, classTitles, effectLabelPt, skillPt, weaponNames } from "./data/accretia-content";
import { DocPage } from "./DocPage";

type Effect = { kind: string; index: number; label: string | null; value: number };
type SkillData = {
  code: string;
  name: string;
  desc: string;
  fp: number;
  sp: number;
  hp: number;
  cooldown: number;
  targets: string[];
  weapons: number[];
  needBullets: number;
  damage: { pct: number; attType: number } | null;
  contType: number;
  durationSec: number;
  cont: Effect[];
};
type ClassData = {
  code: string;
  name: string;
  ndName: string;
  grade: number;
  upgradeLv: number;
  to: string[];
  bonus: { hp: number; fp: number; sp: number };
  skills: string[];
};

const classes = data.classes as ClassData[];
const skillMap = new Map((data.skills as SkillData[]).map((s) => [s.code, s]));
const BASE = "/informacoes/classes/accretia/";

const num = (n: number) => String(n).replace(".", ",");

function duration(sec: number) {
  if (sec >= 120 && sec % 60 === 0) return `${sec / 60} min (${sec} s)`;
  return `${num(sec)} s`;
}

function kindOf(s: SkillData) {
  if (s.damage) return "ATAQUE";
  if (s.contType === 1 && s.targets.includes("Você mesmo")) return "BUFF";
  if (s.contType === 0) return "DEBUFF";
  return "UTILIDADE";
}

function effectText(e: Effect) {
  if (!e.label) return null;
  const label = effectLabelPt[e.label] ?? e.label;
  if (e.kind === "State") return e.value === 0 ? null : label;
  if (e.kind === "Rate") {
    const pct = Math.round(e.value * 1000) / 10;
    return `${label} ${pct >= 0 ? "+" : "−"}${num(Math.abs(pct))}%`;
  }
  return `${label} ${e.value >= 0 ? "+" : "−"}${num(Math.abs(e.value))}`;
}

function skillStats(s: SkillData): [string, string][] {
  const stats: [string, string][] = [];
  const cost = [s.fp && `${s.fp} FP`, s.sp && `${s.sp} SP`, s.hp && `${s.hp} HP`].filter(Boolean);
  stats.push(["Custo", cost.length ? cost.join(" · ") : "Sem custo"]);
  if (s.cooldown > 0) stats.push(["Recarga", `${num(s.cooldown)} s`]);
  if (s.targets.length) stats.push(["Alvo", s.targets.join(" ou ")]);
  if (s.damage) {
    const area = s.damage.attType === 6;
    stats.push(["Dano", `${num(s.damage.pct)}% do ataque · ${area ? "em área" : "alvo único"}`]);
  }
  if (s.needBullets > 0) stats.push(["Munição", `${s.needBullets} por uso`]);
  if (s.contType >= 0 && s.durationSec > 0) stats.push(["Duração", duration(s.durationSec)]);
  const weapons = s.weapons.filter((w) => w in weaponNames).map((w) => weaponNames[w]);
  if (weapons.length) stats.push(["Arma", weapons.join(" ou ")]);
  return stats;
}

export default function ClassPage({ code }: { code: string }) {
  const cls = classes.find((c) => c.code === code);
  if (!cls) throw new Error(`classe ${code} ausente em accretia-ranger.json`);
  const title = classTitles[code];
  const from = classes.filter((c) => c.to.includes(code));
  const clientName = cls.ndName && cls.ndName.replace(/\s+/g, "") !== title.replace(/\s+/g, "") ? cls.ndName : null;
  const skills = cls.skills.map((sc) => skillMap.get(sc)).filter((s): s is SkillData => Boolean(s));
  const bonus = [cls.bonus.hp && `HP +${cls.bonus.hp}`, cls.bonus.fp && `FP +${cls.bonus.fp}`, cls.bonus.sp && `SP +${cls.bonus.sp}`].filter(Boolean);
  const link = (c: string) => (
    <a key={c} href={BASE + classSlugs[c]}>
      {classTitles[c]}
    </a>
  );
  const joined = (codes: string[]) =>
    codes.map((c, i) => (
      <span key={c}>
        {i > 0 && ", "}
        {link(c)}
      </span>
    ));

  return (
    <DocPage
      kicker={`ACCRETIA · LINHA RANGER · ${classGradeLabel[cls.grade] ?? ""}`}
      title={title}
      icon={`/assets/info/classes/accretia/class-${code}.png`}
      toc={[
        { id: "resumo", label: "Resumo" },
        { id: "skills", label: "Skills da classe" },
        { id: "notas", label: "Notas" },
      ]}
    >
      <p className="doc-lead">{classLead[code]}</p>
      <div className="doc-callout doc-callout-info">Valores lidos dos arquivos do servidor em {data.generatedAt.split("-").reverse().join("/")}.</div>

      <h2 id="resumo">Resumo</h2>
      <div className="doc-table-wrap">
        <table className="doc-table doc-table-kv">
          <tbody>
            <tr>
              <th>Raça</th>
              <td>Accretia</td>
            </tr>
            <tr>
              <th>Linha</th>
              <td>Ranger</td>
            </tr>
            {clientName && (
              <tr>
                <th>Nome no cliente em inglês</th>
                <td>{clientName}</td>
              </tr>
            )}
            <tr>
              <th>Código da classe</th>
              <td>{code}</td>
            </tr>
            <tr>
              <th>Vem de</th>
              <td>{from.length ? joined(from.map((c) => c.code)) : "Qualquer classe inicial"}</td>
            </tr>
            {cls.to.length > 0 && (
              <tr>
                <th>Evolui para</th>
                <td>
                  Nível {cls.upgradeLv}: {joined(cls.to)}
                </td>
              </tr>
            )}
            <tr>
              <th>Bônus ao evoluir para ela</th>
              <td>{bonus.join(" · ")}</td>
            </tr>
            <tr>
              <th>Skills exclusivas</th>
              <td>{skills.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="skills">Skills da classe</h2>
      <p>Skills de classe têm valores fixos: não existem níveis 1 a 7 como nas skills comuns.</p>
      <div className="doc-skills">
        {skills.map((s) => {
          const others = classes.filter((c) => c.code !== code && c.skills.includes(s.code));
          const effects = s.cont.map(effectText).filter((x): x is string => Boolean(x));
          return (
            <section className="doc-skill" key={s.code} id={s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
              <div className="doc-skill-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/info/classes/accretia/skill-${s.code}.png`} alt={s.name} width={64} height={64} />
                <div>
                  <span className="doc-tag">{kindOf(s)}</span>
                  <h3>{s.name}</h3>
                </div>
              </div>
              <p>{skillPt[s.code]}</p>
              <p className="doc-original">Texto do jogo: “{s.desc}”</p>
              <dl className="doc-stats">
                {skillStats(s).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {effects.length > 0 && (
                <ul className="doc-effects">
                  {effects.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {others.length > 0 && <p className="doc-shared">Também disponível para: {joined(others.map((c) => c.code))}.</p>}
            </section>
          );
        })}
      </div>

      <h2 id="notas">Notas</h2>
      <ul className="doc-list">
        <li>As skills de classes anteriores continuam disponíveis depois de evoluir.</li>
        <li>O dano das skills é um percentual do seu ataque.</li>
        <li>
          Veja a árvore completa em <a href="/informacoes/classes/accretia">Classes de Accretia</a>.
        </li>
      </ul>
    </DocPage>
  );
}
