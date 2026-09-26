import { effectLabelPt, skillPt, weaponNames } from "./data/accretia-content";
import type { Effect, Entry } from "./data/game";

export type IconKind = "s" | "f" | "c";
export const iconSrc = (kind: IconKind, id: string) => `/assets/info/icons/${kind}-${id}.png`;

const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const same = (v: number[]) => v.every((x) => x === v[0]);
const span = (v: number[], f: (x: number) => string) => (same(v) ? f(v[0]) : `${f(v[0])} → ${f(v[v.length - 1])}`);

export function effectValue(kind: string, v: number) {
  if (kind === "Rate") {
    const pct = Math.round(v * 1000) / 10;
    return `${pct >= 0 ? "+" : "−"}${num(Math.abs(pct))}%`;
  }
  if (kind === "Plus") return `${v >= 0 ? "+" : "−"}${num(Math.abs(v))}`;
  return "ativo";
}
export const effectName = (e: { label: string | null; kind: string; index: number }) => (e.label ? (effectLabelPt[e.label] ?? e.label) : null);

function duration(sec: number) {
  if (sec >= 120 && sec % 60 === 0) return `${sec / 60} min`;
  return `${num(sec)} s`;
}

export function kindOf(e: Entry, force: boolean) {
  if (e.dmg) return "ATAQUE";
  if (e.contType === 1 && e.targets.includes("Você mesmo")) return "BUFF";
  if (e.contType === 1) return force ? "BUFF" : "BUFF";
  if (e.contType === 0) return "DEBUFF";
  return "UTILIDADE";
}

function weaponText(w: number[]) {
  if (w.length && w.every((x) => x <= 4)) return "Corpo a corpo";
  const names = w.filter((x) => x in weaponNames).map((x) => weaponNames[x]);
  return names.join(" ou ");
}

function stats(e: Entry): [string, string][] {
  const out: [string, string][] = [];
  const cost = [e.fp && `${e.fp} FP`, e.sp && `${e.sp} SP`, e.hp && `${e.hp} HP`].filter(Boolean);
  out.push(["Custo", cost.length ? cost.join(" · ") : "Sem custo"]);
  if (e.cooldown > 0) out.push(["Recarga", `${num(e.cooldown)} s`]);
  if (e.targets.length) out.push(["Alvo", e.targets.join(" ou ")]);
  if (e.dmg && e.dmg.pct) out.push(["Dano", `${span(e.dmg.pct, num)}% do ataque${e.dmg.attType && e.dmg.attType.includes(6) ? " · em área" : ""}`]);
  if (e.bullets > 0) out.push(["Munição", `${e.bullets} por uso`]);
  if (e.contType >= 0 && Math.max(...e.durationSec) > 0) out.push(["Duração", span(e.durationSec, duration)]);
  const w = weaponText(e.weapons);
  if (w) out.push(["Arma", w]);
  return out;
}

function fmtChange(label: string, b: unknown, a: unknown): string | null {
  const eff = (x: unknown) => {
    const list = (x as [string | null, string, number, number, number][]).filter(([l]) => Boolean(l));
    if (!list.length) return "nenhum";
    return list
      .map(([l, k, , v0, v6]) => `${(l && (effectLabelPt[l] ?? l)) || "efeito"} ${effectValue(k, v0)}${v6 !== v0 ? ` … ${effectValue(k, v6)}` : ""}`)
      .join(", ");
  };
  if (label === "Efeitos") {
    const [eb, ea] = [eff(b), eff(a)];
    return eb === ea ? null : `${label}: ${eb} → ${ea}`;
  }
  if (label === "Armas (índice)") {
    const w = (x: unknown) => weaponText(x as number[]) || "qualquer";
    return `Armas: ${w(b)} → ${w(a)}`;
  }
  const f = (x: unknown) => (x === null || x === undefined ? "—" : typeof x === "number" ? num(x) : String(x));
  return `${label}: ${f(b)} → ${f(a)}`;
}

export function SkillCard({ e, kind, force = false, showChanges = true }: { e: Entry; kind: IconKind; force?: boolean; showChanges?: boolean }) {
  const pt = skillPt[e.id];
  const effects = e.effects.map((x) => ({ x, name: effectName(x) })).filter((y): y is { x: Effect; name: string } => Boolean(y.name) && !(y.x.kind === "State" && y.x.values[0] === 0));
  const levelRows: [string, string[]][] = [];
  if (e.dmg && e.dmg.pct && !same(e.dmg.pct)) levelRows.push(["Dano (%)", e.dmg.pct.map(num)]);
  if (e.contType >= 0 && !same(e.durationSec)) levelRows.push(["Duração", e.durationSec.map(duration)]);
  for (const { x, name } of effects) if (!same(x.values)) levelRows.push([name, x.values.map((v) => effectValue(x.kind, v))]);
  return (
    <section className="doc-skill" id={e.id.toLowerCase()}>
      <div className="doc-skill-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc(kind, e.id)} alt={e.name} width={64} height={64} />
        <div>
          <span className="doc-tag">{kindOf(e, force)}</span>
          {e.status === "new" && <span className="doc-tag doc-tag-new">NOVA</span>}
          {e.status === "changed" && visibleChanges(e).length > 0 && <span className="doc-tag doc-tag-changed">AJUSTADA</span>}
          <h3>{e.name}</h3>
        </div>
      </div>
      {pt ? (
        <>
          <p>{pt}</p>
          <p className="doc-original">Texto do jogo: “{e.desc}”</p>
        </>
      ) : (
        <p>{e.desc}</p>
      )}
      <dl className="doc-stats">
        {stats(e).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {effects.length > 0 && (
        <ul className="doc-effects">
          {effects.map(({ x, name }) => (
            <li key={`${x.kind}${x.index}`}>
              {name} {span(x.values, (v) => effectValue(x.kind, v))}
            </li>
          ))}
        </ul>
      )}
      {levelRows.length > 0 && (
        <div className="doc-table-wrap">
          <table className="doc-table doc-levels">
            <thead>
              <tr>
                <th />
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <th key={n}>Nv {n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levelRows.map(([label, vals]) => (
                <tr key={label}>
                  <th>{label}</th>
                  {vals.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showChanges && visibleChanges(e).length > 0 && (
        <ul className="doc-changes">
          {visibleChanges(e).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { fmtChange };

export const visibleChanges = (e: Entry) => (e.changes ?? []).map(([l, b, a]) => fmtChange(l, b, a)).filter((x): x is string => x !== null);
