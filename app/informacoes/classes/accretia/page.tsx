import { Callout, DocPage } from "../../DocPage";

export const metadata = { title: "Classes de Accretia" };

const A = "/informacoes/classes/accretia/";

type Row = { name: string; from: string; level: string; to: string; href?: string; emblem?: string };

const ranger: Row[] = [
  { name: "Ranger", from: "Classe inicial", level: "30", to: "Destroyer, Gladius, Gunner, Scouter, Engineer" },
  { name: "Gunner", from: "Qualquer classe inicial", level: "40", to: "Striker, Dementer", href: A+"gunner", emblem: "ARF1" },
  { name: "Scouter", from: "Qualquer classe inicial", level: "40", to: "Dementer, Phantom Shadow", href: A+"scouter", emblem: "ARF2" },
  { name: "Striker", from: "Gunner", level: "50", to: "Bombardier, Railgunner, Demolisher", href: A+"striker", emblem: "ARS1" },
  { name: "Dementer", from: "Gunner, Scouter", level: "50", to: "Bombardier, Railgunner, Demolisher", href: A+"dementer", emblem: "ARS2" },
  { name: "Phantom Shadow", from: "Scouter", level: "50", to: "Bombardier, Railgunner, Demolisher", href: A+"phantom-shadow", emblem: "ARS3" },
  { name: "Bombardier", from: "Striker, Dementer, Phantom Shadow", level: "—", to: "—", href: A+"bombardier", emblem: "ART1" },
  { name: "Railgunner", from: "Striker, Dementer, Phantom Shadow", level: "—", to: "—", href: A+"railgunner", emblem: "ART2" },
  { name: "Demolisher", from: "Striker, Dementer, Phantom Shadow", level: "—", to: "—", href: A+"demolisher", emblem: "ART3" },
];

const warrior: Row[] = [
  { name: "Warrior", from: "Classe inicial", level: "30", to: "Destroyer, Gladius, Gunner, Scouter, Engineer" },
  { name: "Destroyer", from: "Qualquer classe inicial", level: "40", to: "Punisher, Assaulter" },
  { name: "Gladius", from: "Qualquer classe inicial", level: "40", to: "Assaulter, Mercenary" },
  { name: "Punisher", from: "Destroyer", level: "50", to: "Breacher" },
  { name: "Assaulter", from: "Destroyer, Gladius", level: "50", to: "Breacher" },
  { name: "Mercenary", from: "Gladius", level: "50", to: "Breacher" },
  { name: "Breacher", from: "Punisher, Assaulter, Mercenary", level: "—", to: "—" },
];

const specialist: Row[] = [
  { name: "Specialist", from: "Classe inicial", level: "30", to: "Destroyer, Gladius, Gunner, Scouter, Engineer" },
  { name: "Engineer", from: "Qualquer classe inicial", level: "40", to: "Scientist, Battle Leader" },
  { name: "Scientist", from: "Engineer", level: "50", to: "Grenadier, Field Marshal" },
  { name: "Battle Leader", from: "Engineer", level: "50", to: "Grenadier, Field Marshal" },
  { name: "Grenadier", from: "Scientist, Battle Leader", level: "—", to: "—" },
  { name: "Field Marshal", from: "Scientist, Battle Leader", level: "—", to: "—" },
];

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            <th>Classe</th>
            <th>Vem de</th>
            <th>Nível p/ evoluir</th>
            <th>Evolui para</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                {r.emblem && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="doc-emblem" src={"/assets/info/classes/accretia/class-" + r.emblem + ".png"} alt="" width={30} height={30} />
                )}
                {r.href ? <a href={r.href}>{r.name}</a> : <b>{r.name}</b>}
              </td>
              <td>{r.from}</td>
              <td>{r.level}</td>
              <td>{r.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AccretiaClasses() {
  return (
    <DocPage
      kicker="CLASSES"
      title="Accretia"
      toc={[
        { id: "ranger", label: "Linha Ranger" },
        { id: "warrior", label: "Linha Warrior" },
        { id: "specialist", label: "Linha Specialist" },
      ]}
    >
      <p className="doc-lead">Árvore de evolução das classes de Accretia. Lida do arquivo de classes do servidor (Class.dat).</p>
      <Callout tone="info">Cada classe da linha Ranger já tem página com as skills, ícones e valores reais. As linhas Warrior e Specialist chegam em seguida.</Callout>
      <p>As três classes iniciais (Warrior, Ranger e Specialist) evoluem no nível 30 e, no arquivo de classes, todas apontam para as mesmas cinco classes de 1ª evolução. Cada tabela abaixo mostra uma linha.</p>
      <h2 id="ranger">Linha Ranger</h2>
      <Table rows={ranger} />
      <h2 id="warrior">Linha Warrior</h2>
      <Table rows={warrior} />
      <h2 id="specialist">Linha Specialist</h2>
      <Table rows={specialist} />
    </DocPage>
  );
}
