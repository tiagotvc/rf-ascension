import { Callout, DocPage } from "../../../DocPage";

export const metadata = { title: "Striker (Accretia)" };

type Stat = [label: string, value: string];

type Skill = {
  code: string;
  name: string;
  kind: string;
  original: string;
  summary: string;
  stats: Stat[];
};

// Valores lidos do ClassSkill.dat / Class.dat / NDSkillForce.edf do servidor de testes em 25/09/2026.
const skills: Skill[] = [
  {
    code: "410ED",
    name: "Final Blast",
    kind: "Ataque",
    original: "A devastating launcher attack using energy reserves.",
    summary: "Ataque devastador de Launcher usando reservas de energia.",
    stats: [
      ["Custo", "90 FP · 120 SP"],
      ["Recarga", "30 s"],
      ["Dano", "305% do ataque"],
      ["Alvo", "1 inimigo ou monstro"],
      ["Munição", "1 por uso"],
      ["Arma", "Launcher"],
    ],
  },
  {
    code: "410EF",
    name: "Chain Rocket",
    kind: "Ataque",
    original:
      "Using the siege kit as a stable platform, the user rapidly fires three sets of launcher attacks at one target.",
    summary: "Usando o kit de cerco como plataforma estável, dispara rapidamente três séries de ataques de Launcher contra um alvo.",
    stats: [
      ["Custo", "120 FP · 240 SP"],
      ["Recarga", "30 s"],
      ["Dano", "305% do ataque"],
      ["Alvo", "1 inimigo ou monstro"],
      ["Munição", "1 por uso"],
      ["Arma", "Launcher"],
    ],
  },
  {
    code: "4F0F1",
    name: "Siege Mastery",
    kind: "Buff",
    original:
      "By operating the siege kit to the limits of structural tolerance instead of safety limits, the user temporarily increases attack and defense power while in siege mode.",
    summary:
      "Operando o kit de cerco no limite da tolerância estrutural, em vez dos limites de segurança, o usuário aumenta temporariamente o ataque e a defesa enquanto estiver em modo cerco.",
    stats: [
      ["Custo", "90 FP"],
      ["Recarga", "10 s"],
      ["Ataque (modo cerco)", "+50%"],
      ["Defesa (modo cerco)", "+30%"],
      ["Duração", "18 min (1080 s)"],
      ["Alvo", "Você mesmo"],
      ["Arma", "Launcher"],
    ],
  },
];

export default function Striker() {
  return (
    <DocPage
      kicker="ACCRETIA · LINHA RANGER · 2ª EVOLUÇÃO"
      title="Striker"
      toc={[
        { id: "resumo", label: "Resumo" },
        { id: "skills", label: "Skills da classe" },
        { id: "evolucao", label: "Evolução" },
        { id: "notas", label: "Notas" },
      ]}
    >
      <p className="doc-lead">
        Classe de Launcher de Accretia. Dois ataques de alvo único e um buff de modo cerco que aumenta ataque e defesa.
      </p>
      <Callout tone="warn">
        <b>Em teste.</b> Os números abaixo foram lidos do servidor de testes em 25/09/2026 e podem mudar até a abertura.
      </Callout>

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
            <tr>
              <th>Código da classe</th>
              <td>ARS1</td>
            </tr>
            <tr>
              <th>Vem de</th>
              <td>
                Gunner (evolui no nível 40)
              </td>
            </tr>
            <tr>
              <th>Bônus ao evoluir</th>
              <td>HP +10 · SP +15</td>
            </tr>
            <tr>
              <th>Arma das skills</th>
              <td>Launcher</td>
            </tr>
            <tr>
              <th>Próxima evolução</th>
              <td>Nível 50: Bombardier, Railgunner ou Demolisher (em teste)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="skills">Skills da classe</h2>
      <p>São 3 skills exclusivas do Striker. Os valores de classe são fixos: não há níveis 1 a 7 como nas skills comuns.</p>
      <div className="doc-skills">
        {skills.map((s) => (
          <section className="doc-skill" key={s.code} id={s.name.toLowerCase().replace(/\s+/g, "-")}>
            <div className="doc-skill-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/info/classes/accretia/striker-${s.code}.png`} alt={s.name} width={64} height={64} />
              <div>
                <span className="doc-tag">{s.kind.toUpperCase()}</span>
                <h3>{s.name}</h3>
              </div>
            </div>
            <p>{s.summary}</p>
            <p className="doc-original">Texto do jogo: “{s.original}”</p>
            <dl className="doc-stats">
              {s.stats.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <h2 id="evolucao">Evolução</h2>
      <ol className="doc-path">
        <li>
          <b>Ranger</b>
          <small>nível 30</small>
        </li>
        <li>
          <b>Gunner</b>
          <small>nível 40</small>
        </li>
        <li className="current">
          <b>Striker</b>
          <small>nível 50</small>
        </li>
        <li>
          <b>Bombardier · Railgunner · Demolisher</b>
          <small>em teste</small>
        </li>
      </ol>
      <p>
        Veja a árvore completa em <a href="/informacoes/classes/accretia">Classes de Accretia</a>.
      </p>

      <h2 id="notas">Notas</h2>
      <ul className="doc-list">
        <li>As skills de classes anteriores (como as do Gunner) continuam disponíveis depois de evoluir.</li>
        <li>O dano é um percentual do seu ataque; o dano final também depende do nível e da maestria.</li>
      </ul>
    </DocPage>
  );
}
