import { Callout, DocPage } from "../../DocPage";

export const metadata = { title: "Classes de Accretia" };

type Row = { name: string; from: string; level: string; to: string; href?: string; test?: boolean };

const ranger: Row[] = [
  { name: "Ranger", from: "Classe inicial", level: "30", to: "Destroyer, Gladius, Gunner, Scouter, Engineer" },
  { name: "Gunner", from: "Qualquer classe inicial", level: "40", to: "Striker, Dementer" },
  { name: "Scouter", from: "Qualquer classe inicial", level: "40", to: "Dementer, Phantom Shadow" },
  { name: "Striker", from: "Gunner", level: "50", to: "Bombardier, Railgunner, Demolisher", href: "/informacoes/classes/accretia/striker" },
  { name: "Dementer", from: "Gunner, Scouter", level: "50", to: "Bombardier, Railgunner, Demolisher" },
  { name: "Phantom Shadow", from: "Scouter", level: "50", to: "Bombardier, Railgunner, Demolisher" },
  { name: "Bombardier", from: "Striker, Dementer, Phantom Shadow", level: "—", to: "—", test: true },
  { name: "Railgunner", from: "Striker, Dementer, Phantom Shadow", level: "—", to: "—", test: true },
  { name: "Demolisher", from: "Striker, Dementer, Phantom Shadow", level: "—", to: "—", test: true },
];

const warrior: Row[] = [
  { name: "Warrior", from: "Classe inicial", level: "30", to: "Destroyer, Gladius, Gunner, Scouter, Engineer" },
  { name: "Destroyer", from: "Qualquer classe inicial", level: "40", to: "Punisher, Assaulter" },
  { name: "Gladius", from: "Qualquer classe inicial", level: "40", to: "Assaulter, Mercenary" },
  { name: "Punisher", from: "Destroyer", level: "50", to: "Breacher" },
  { name: "Assaulter", from: "Destroyer, Gladius", level: "50", to: "Breacher" },
  { name: "Mercenary", from: "Gladius", level: "50", to: "Breacher" },
  { name: "Breacher", from: "Punisher, Assaulter, Mercenary", level: "—", to: "—", test: true },
];

const specialist: Row[] = [
  { name: "Specialist", from: "Classe inicial", level: "30", to: "Destroyer, Gladius, Gunner, Scouter, Engineer" },
  { name: "Engineer", from: "Qualquer classe inicial", level: "40", to: "Scientist, Battle Leader" },
  { name: "Scientist", from: "Engineer", level: "50", to: "Grenadier, Field Marshal" },
  { name: "Battle Leader", from: "Engineer", level: "50", to: "Grenadier, Field Marshal" },
  { name: "Grenadier", from: "Scientist, Battle Leader", level: "—", to: "—", test: true },
  { name: "Field Marshal", from: "Scientist, Battle Leader", level: "—", to: "—", test: true },
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
                {r.href ? <a href={r.href}>{r.name}</a> : <b>{r.name}</b>}
                {r.test && <span className="doc-tag">EM TESTE</span>}
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
      <Callout tone="info">
        Classes marcadas <span className="doc-tag">EM TESTE</span> ainda não estão no servidor oficial. A página de cada classe será publicada aqui conforme for escrita — por enquanto, só o Striker.
      </Callout>
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
