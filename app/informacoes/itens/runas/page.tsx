import items from "../../data/items.json";
import { Callout, DocPage } from "../../DocPage";

export const metadata = { title: "Runas" };

const img = (n: string) => `/assets/info/items/${n}.png`;

const statPt: Record<string, string> = {
  "Attack Points": "Pontos de ataque",
  "Crit Chance": "Chance de crítico",
  "Damage Reflect": "Reflexão de dano",
  "Force Attack Points": "Pontos de ataque de Force",
  "Crit Damage": "Dano crítico",
  "Defense Penetration": "Penetração de defesa",
  "Attack Speed": "Velocidade de ataque",
  "Damage vs Monsters": "Dano contra monstros",
  "Damage vs Players": "Dano contra jogadores",
  "Cooldown Reduction": "Redução de recarga",
  "Cast Time Reduction": "Redução do tempo de conjuração",
  "Defense Points": "Pontos de defesa",
  Avoidance: "Esquiva",
  Accuracy: "Precisão",
  "Max HP": "HP máximo",
  "HP Recovery Rate": "Recuperação de HP",
  "Potion Effectiveness": "Eficácia de poções",
  "Damage Reduction": "Redução de dano",
  "Block Chance": "Chance de bloqueio",
  "Crit Damage Taken": "Dano crítico recebido",
  "Element Resistance": "Resistência elemental",
  "Debuff Duration": "Duração de debuffs",
  "FP / SP Recovery": "Recuperação de FP e SP",
  "Max FP": "FP máximo",
  "Run Speed": "Velocidade de corrida",
  "Experience Gained": "Experiência ganha",
  "Mastery Experience": "Experiência de maestria",
  "Dalant Drop Amount": "Dalant dropado",
  "Item Drop Chance": "Chance de drop de item",
  "Gathering Speed": "Velocidade de coleta",
  "Guild Points Gained": "Pontos de guild ganhos",
  "Durability Loss Reduction": "Perda de durabilidade",
};
const piecePt: Record<string, string> = {
  weapon: "arma",
  armor: "armadura",
  helmet: "elmo",
  gloves: "luvas",
  boots: "botas",
  shield: "escudo",
  cloak: "capa",
  ring: "anel",
  amulet: "amuleto",
  generator: "gerador",
};

export default function Runas() {
  return (
    <DocPage
      kicker="ITENS"
      title="Runas"
      toc={[
        { id: "como", label: "Como funcionam" },
        { id: "sockets", label: "Sockets" },
        { id: "inserir", label: "Como inserir" },
        { id: "lista", label: "Lista de runas" },
      ]}
    >
      <p className="doc-lead">Runas dão um bônus fixo ao item. Cada runa ocupa um socket do item e, depois de inserida, não sai mais.</p>

      <h2 id="como">Como funcionam</h2>
      <ul className="doc-list">
        <li>A chance de inserir é 100%: a runa sempre entra, se o item tiver socket livre e a peça for compatível.</li>
        <li>A runa é sempre consumida. Não há custo em Dalant, quebra do item nem reset.</li>
        <li>A mesma runa pode ser inserida mais de uma vez no mesmo item, até encher os sockets.</li>
        <li>Runas não podem ser removidas.</li>
        <li>Cada família de runa tem um teto de bônus por personagem, somando todas as peças equipadas (tabela abaixo).</li>
      </ul>

      <h2 id="sockets">Sockets</h2>
      <p>Cada item tem de 0 a 4 sockets de runa. O tooltip mostra “Runes — Available slots livres/total”.</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Origem do item</th>
              <th>Sockets</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Itens Rare, anéis, amuletos e geradores</td>
              <td>0 a 4, sorteados ao nascer</td>
            </tr>
            <tr>
              <td>Feitos por ferreiro ou artesão (proficiência abaixo de 50)</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Proficiência 50 a 99</td>
              <td>1 a 2</td>
            </tr>
            <tr>
              <td>Proficiência 100 a 149</td>
              <td>1 a 3</td>
            </tr>
            <tr>
              <td>Proficiência 150 ou mais</td>
              <td>1 a 4</td>
            </tr>
            <tr>
              <td>Drops, quests e demais itens</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="inserir">Como inserir</h2>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Onde</th>
              <th>Serve para</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Janela de Item Upgrade (slot 7)</td>
              <td>Armas, armaduras e escudos. O painel mostra “Insert chance 100%”. O slot da talic precisa estar vazio.</td>
            </tr>
            <tr>
              <td>Janela de Item Combine</td>
              <td>Equipamentos e geradores. É a única forma de inserir runa em anéis, amuletos e geradores.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Na Item Combine, coloque o equipamento e a runa juntos. Se a runa não serve para o item, o jogo avisa: “This rune cannot be socketed in this type of item.”</p>
      <Callout tone="info">Algumas runas só encaixam em certas peças (coluna “Peças”).</Callout>

      <h2 id="lista">Lista de runas</h2>
      <p>Os valores vão do tier 1 ao último tier de cada família.</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Runa</th>
              <th>Bônus</th>
              <th>Valores por tier</th>
              <th>Peças</th>
              <th>Teto por personagem</th>
            </tr>
          </thead>
          <tbody>
            {items.runes.map((r) => (
              <tr key={r.n}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="doc-emblem" src={img(r.icon)} alt="" width={32} height={32} />
                  <b>{r.name}</b>
                </td>
                <td>{statPt[r.stat] ?? r.stat}</td>
                <td>{r.values.join(" · ")}</td>
                <td>{r.pieces.map((p) => piecePt[p] ?? p).join(", ")}</td>
                <td>{r.cap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocPage>
  );
}
