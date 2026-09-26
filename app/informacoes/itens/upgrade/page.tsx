import items from "../../data/items.json";
import { Callout, DocPage } from "../../DocPage";

export const metadata = { title: "Upgrade de itens" };

const img = (n: string) => `/assets/info/items/${n}.png`;
const compat: [string, string][] = [
  ["Keen Talic", "Arma corpo a corpo, à distância e unidade"],
  ["Destruction Talic", "Arma corpo a corpo e à distância"],
  ["Chaos Talic", "Arma corpo a corpo, à distância e capa"],
  ["Hatred Talic", "Arma à distância"],
  ["Favor Talic", "Armadura, calça, luvas, botas, elmo, escudo e unidade"],
  ["Wisdom Talic", "Elmo"],
  ["Sacred Fire, Belief, Guard e Glory", "Armadura, calça, escudo e capa; arma corpo a corpo (só 1 por arma)"],
  ["Grace Talic", "Luvas"],
  ["Mercy Talic", "Botas"],
];

export default function Upgrade() {
  return (
    <DocPage
      kicker="ITENS"
      title="Upgrade de itens"
      toc={[
        { id: "janela", label: "A janela" },
        { id: "talic", label: "Talic e joias" },
        { id: "chance", label: "Chance de sucesso" },
        { id: "luck", label: "Luck ticket e proteção" },
        { id: "talics", label: "Talics" },
        { id: "joias", label: "Joias" },
      ]}
    >
      <p className="doc-lead">
        A janela de Item Upgrade foi refeita: mostra as chances antes de você clicar, tem 8 slots e serve para três coisas: engastar talics, subir o Rank do item com Evolution Stones e inserir runas.
      </p>
      <Callout tone="info">
        Existem dois números diferentes. O <b>“N Rank Upgrade” (+N)</b> é a quantidade de talics engastadas (0 a 7). O <b>“Rank: N level”</b> do tooltip é o Rank de 0 a 255, que você sobe com Evolution Stones. Veja <a href="/informacoes/itens/rank">Rank e Evolution Stones</a>.
      </Callout>

      <h2 id="janela">A janela</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="doc-figure" src={img("janela-upgrade")} alt="Janela de Item Upgrade com Evolution Stone" />
      <p className="doc-caption">Captura da janela com uma Evolution Stone [Low]: o painel Result/Chance fica abaixo do item.</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>O que vai nele</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Centro</td>
              <td>O item que será melhorado (arma, armadura, escudo ou capa), do inventário ou equipado.</td>
            </tr>
            <tr>
              <td>Pena</td>
              <td>A talic, ou uma Evolution Stone.</td>
            </tr>
            <tr>
              <td>4 slots laterais</td>
              <td>Joias (opcionais). Aumentam a chance de sucesso da talic.</td>
            </tr>
            <tr>
              <td>Escudo</td>
              <td>Luck ticket (opcional).</td>
            </tr>
            <tr>
              <td>Triângulo</td>
              <td>Runa (ou Evolution Stone).</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Você pode clicar com o botão direito no item do inventário para colocá-lo no slot certo. Abaixo do item, a faixa preta mostra os sockets de runa que ele tem (de 0 a 4). O painel de chances mostra <b>Success</b>, <b>Fail</b>, <b>Break</b> e <b>Reset</b>, somando 100%, e o custo: <b>Free</b>. O upgrade não cobra Dalant.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="doc-figure" src={img("mapa-slots")} alt="Mapa numerado dos slots da janela" />
      <p className="doc-caption">Mapa dos slots: 0 item · 1 talic ou pedra · 2 a 5 joias · 6 Luck ticket · 7 runa.</p>
      <Callout tone="warn">
        A talic sempre tem prioridade. Com uma talic no slot da pena, soltar uma runa ou pedra no slot 7 é recusado (“Remove the Talic first”). Se você soltar a talic depois, a runa ou pedra volta para o inventário (“Rune removed - Talic has priority”).
      </Callout>

      <h2 id="talic">Talic e joias</h2>
      <ol className="doc-list">
        <li>Coloque o item no slot central e a talic no slot da pena. Só serve talic compatível com aquele tipo de item.</li>
        <li>Se quiser, coloque até 4 joias nos slots laterais. Não repita a mesma joia.</li>
        <li>Se quiser, coloque um Luck ticket.</li>
        <li>Leia as chances no painel e clique em <b>Upgrade</b>.</li>
      </ol>
      <p>A talic, cada joia e o Luck ticket são consumidos sempre, dando certo ou não. Depois da tentativa, o jogo recoloca sozinho no mesmo slot a talic e as joias que estavam lá (se você ainda tiver no inventário).</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Resultado</th>
              <th>O que acontece</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sucesso</td>
              <td>O item ganha +1 talic engastada.</td>
            </tr>
            <tr>
              <td>Nada acontece</td>
              <td>A talic e as joias se perdem, o item continua igual.</td>
            </tr>
            <tr>
              <td>Reset</td>
              <td>O item perde todas as talics engastadas, mas continua existindo. As runas não são afetadas.</td>
            </tr>
            <tr>
              <td>Quebra</td>
              <td>O item é destruído.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>O máximo de talics é o número de sockets do próprio item (até 7).</p>

      <h2 id="chance">Chance de sucesso</h2>
      <p>
        A chance cai a cada talic já engastada e depende do grau do item. Joias somam à chance. Itens de nível acima de 30 têm a chance reduzida na proporção 30 ÷ nível. Quem tem Premium ativo ganha +5 pontos percentuais.
      </p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Exemplo (item nível 30, primeira talic)</th>
              <th>Chance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sem joias</td>
              <td>12,5%</td>
            </tr>
            <tr>
              <td>4 joias básicas diferentes (0,25 cada)</td>
              <td>25%</td>
            </tr>
            <tr>
              <td>4 joias de valor 1,0</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Em um item de nível 45, multiplique por 0,67. A última talic (a 7ª) tem chance base zero: só Premium e Luck ticket dão chance nela.</p>

      <h2 id="luck">Luck ticket e proteção</h2>
      <div className="doc-skills">
        <section className="doc-skill">
          <div className="doc-skill-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("luck-ticket")} alt="Luck ticket" width={64} height={64} />
            <div>
              <span className="doc-tag">SLOT 6</span>
              <h3>Luck ticket</h3>
            </div>
          </div>
          <p>Tira até 5 pontos percentuais de cada resultado ruim (Quebra, Nada e Reset) e soma ao Sucesso. Só vale para talics: com pedra ou runa ele é ignorado e não é consumido.</p>
        </section>
        <section className="doc-skill">
          <div className="doc-skill-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("protection-potion")} alt="Upgrade Protection Potion" width={64} height={64} />
            <div>
              <span className="doc-tag">POÇÃO</span>
              <h3>Upgrade Protection Potion</h3>
            </div>
          </div>
          <p>Enquanto o efeito durar (600 segundos), a Quebra vira Reset: o item nunca é destruído. O painel mostra “0% (Safe)” na linha Break.</p>
        </section>
      </div>

      <h2 id="talics">Talics</h2>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <tbody>
            {items.talics.map((t) => (
              <tr key={t.idx}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="doc-emblem" src={img(`t${t.idx}`)} alt="" width={32} height={32} />
                  <b>{t.name}</b>
                </td>
                <td>{t.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Onde cada talic pode ser usada:</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Talic</th>
              <th>Itens compatíveis</th>
            </tr>
          </thead>
          <tbody>
            {compat.map(([n, w]) => (
              <tr key={n}>
                <td>{n}</td>
                <td>{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Cada arma aceita só 1 talic elemental (Sacred Fire, Belief, Guard ou Glory).</p>

      <h2 id="joias">Joias</h2>
      <p>Joias só aumentam a chance de sucesso da talic. Quanto maior o valor, maior o efeito; um slot vazio vale 0,125.</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Joia</th>
              <th>Tipo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {items.jewels.map((j) => (
              <tr key={j.idx}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="doc-emblem" src={img(`j${j.idx}`)} alt="" width={32} height={32} />
                  <b>{j.name}</b>
                </td>
                <td>{j.type}</td>
                <td>{String(j.bonus).replace(".", ",")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocPage>
  );
}
