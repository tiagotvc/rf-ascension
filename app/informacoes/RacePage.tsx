import { classByCode, classUrl, classes, lineNote, lines, races, reachLevel, type ClassInfo } from "./data/game";
import { Callout, DocPage } from "./DocPage";
import { emblemSrc } from "./ClassPage";

function Row({ c }: { c: ClassInfo }) {
  const from = classes.filter((x) => x.to.includes(c.code));
  const to = c.to.map((code) => classByCode(code)).filter((x): x is ClassInfo => Boolean(x));
  const hasPage = c.grade > 0;
  return (
    <tr>
      <td>
        {hasPage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="doc-emblem" src={emblemSrc(c.code)} alt="" width={30} height={30} />
        )}
        {hasPage ? <a href={classUrl(c)}>{c.name}</a> : <b>{c.name}</b>}
      </td>
      <td>{from.length === 0 ? "Classe inicial" : from.every((f) => f.grade === 0) && from.length > 1 ? "Qualquer classe inicial" : from.map((f) => f.name).join(", ")}</td>
      <td>{c.grade === 0 ? "—" : reachLevel(c)}</td>
      <td>{c.upgradeLv < 100 ? c.upgradeLv : "—"}</td>
      <td>{to.length ? to.map((t) => t.name).join(", ") : "—"}</td>
    </tr>
  );
}

export default function RacePage({ raceId }: { raceId: string }) {
  const race = races.find((r) => r.id === raceId)!;
  const inRace = classes.filter((c) => c.race === race.name);
  const shown = lines.filter((l) => inRace.some((c) => c.line === l));
  return (
    <DocPage kicker="CLASSES" title={race.name} toc={shown.map((l) => ({ id: l.toLowerCase(), label: `Linha ${l}` }))}>
      <p className="doc-lead">Árvore de evolução das classes de {race.name}. Lida do arquivo de classes do servidor.</p>
      <Callout tone="info">
        Cada classe tem página própria com as skills, ícones e valores reais. As três classes iniciais (Warrior, Ranger e Spiritualist/Specialist) evoluem no nível 30 e apontam para as classes de 1ª evolução da própria raça.
      </Callout>
      {shown.map((line) => (
        <div key={line}>
          <h2 id={line.toLowerCase()}>
            Linha {line} <small className="doc-h2-note">({lineNote[line]})</small>
          </h2>
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Vem de</th>
                  <th>Nível p/ alcançar</th>
                  <th>Nível p/ evoluir</th>
                  <th>Evolui para</th>
                </tr>
              </thead>
              <tbody>
                {inRace
                  .filter((c) => c.line === line)
                  .sort((a, b) => a.grade - b.grade || a.idx - b.idx)
                  .map((c) => (
                    <Row key={c.code} c={c} />
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </DocPage>
  );
}
