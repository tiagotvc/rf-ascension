import { Callout, DocPage } from "../../DocPage";

export const metadata = { title: "Rank e Evolution Stones" };

const img = (n: string) => `/assets/info/items/${n}.png`;

const stones = [
  { id: "low", name: "Evolution Stone [Low]", code: "irunv01", success: 10, gain: "+1", lose: 40, min: 1, max: 1 },
  { id: "middle", name: "Evolution Stone [Middle]", code: "irunv02", success: 30, gain: "+1 a +3", lose: 25, min: 1, max: 3 },
  { id: "high", name: "Evolution Stone [High]", code: "irunv03", success: 50, gain: "+1 a +5", lose: 15, min: 1, max: 5 },
  { id: "highest", name: "Evolution Stone [Highest]", code: "irunv04", success: 70, gain: "+1 a +10", lose: 5, min: 1, max: 10 },
];

const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;
const bonus = (rank: number) => Math.round(4396 * Math.pow(rank / 255, 1.35));
const ranks = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 255];

const tiers: [string, string][] = [
  ["Normal", "0 a 15"],
  ["Intense", "0 a 20"],
  ["Superior", "0 a 20"],
  ["Rare", "0 a 10"],
  ["Ascended", "0 a 30"],
  ["Quantum", "0 a 35"],
  ["Special", "0 a 40"],
  ["Hunter", "0 a 25"],
  ["Leon", "0 a 25"],
];

export default function Rank() {
  return (
    <DocPage
      kicker="ITENS"
      title="Rank e Evolution Stones"
      toc={[
        { id: "dois", label: "Dois números" },
        { id: "rankup", label: "Como subir o Rank" },
        { id: "pedras", label: "As pedras" },
        { id: "bonus", label: "Bônus por Rank" },
        { id: "tier", label: "Rank inicial por tier" },
      ]}
    >
      <p className="doc-lead">O Rank é um número de 0 a 255 que cada item carrega. Quanto mais alto, mais ataque (armas) ou defesa (armaduras e escudos) o item dá.</p>

      <h2 id="dois">Dois números diferentes</h2>
      <div className="doc-table-wrap">
        <table className="doc-table doc-table-kv">
          <tbody>
            <tr>
              <th>N Rank Upgrade (+N)</th>
              <td>A quantidade de talics engastadas no item, de 0 a 7. Sobe com talics, na janela de Upgrade.</td>
            </tr>
            <tr>
              <th>Rank: N level</th>
              <td>O Rank de 0 a 255 que aparece em amarelo no tooltip, com “Additional AttackPoint” ou “Additional DefensePoint”. Sobe com Evolution Stones.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="rankup">Como subir o Rank</h2>
      <ol className="doc-list">
        <li>Abra a janela de Item Upgrade e coloque o item no slot central.</li>
        <li>Coloque uma Evolution Stone no slot da pena (ou no slot 7).</li>
        <li>Leia o painel: Success, Fail, Break (sempre 0%) e “-1 Rank”. Clique em <b>Upgrade</b>.</li>
      </ol>
      <ul className="doc-list">
        <li>A pedra é consumida sempre (1 unidade por tentativa).</li>
        <li>No sucesso o Rank sobe e aparece o texto dourado “Rank Up Success! (+N)”. Na falha aparece “Rank Up Failed” em vermelho.</li>
        <li>O item nunca quebra e não perde talics. Não gasta joias, Luck ticket nem Dalant, e o Premium não entra.</li>
        <li>Na falha, se o item já tem Rank maior que 0, existe uma chance de perder 1 Rank (veja a tabela).</li>
        <li>O teto é 255, sem limite por tier: qualquer item pode chegar lá. No Rank 255 a pedra não é consumida.</li>
      </ul>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="doc-figure" src={img("janela-upgrade")} alt="Janela de Item Upgrade com Evolution Stone Low" />
      <p className="doc-caption">Evolution Stone [Low] em um item com Rank: 10% de sucesso, 54% de falha, 0% de quebra e 36% de perder 1 Rank.</p>

      <h2 id="pedras">As pedras</h2>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Pedra</th>
              <th>Sucesso</th>
              <th>Ganho</th>
              <th>Nada acontece</th>
              <th>Perde 1 Rank</th>
              <th>Ganho médio por tentativa</th>
            </tr>
          </thead>
          <tbody>
            {stones.map((s) => {
              const fail = 100 - s.success;
              const lose = (fail * s.lose) / 100;
              const gain = (s.success / 100) * ((s.min + s.max) / 2) - lose / 100;
              return (
                <tr key={s.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="doc-emblem" src={img(`stone-${s.id}`)} alt="" width={32} height={32} />
                    <b>{s.name}</b>
                  </td>
                  <td>{s.success}%</td>
                  <td>{s.gain}</td>
                  <td>{pct(fail - lose)}</td>
                  <td>{pct(lose)}</td>
                  <td>{(gain >= 0 ? "+" : "−") + Math.abs(gain).toFixed(2).replace(".", ",")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Callout tone="warn">
        A pedra Low, em um item que já tem Rank, perde mais do que ganha em média (−0,26 por tentativa). Ela só compensa em item com Rank 0, onde não há perda.
      </Callout>

      <h2 id="bonus">Bônus por Rank</h2>
      <p>O bônus cresce mais devagar no começo e acelera nos ranks altos: bônus = 4396 × (Rank ÷ 255)^1,35. Armas somam ataque; armaduras e escudos somam defesa. O tooltip mostra o valor arredondado.</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Rank</th>
              {ranks.map((r) => (
                <th key={r}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Bônus</th>
              {ranks.map((r) => (
                <td key={r}>{bonus(r)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p>Anéis, amuletos, balas, ferramentas Radiant e itens de stat fixo não recebem Rank.</p>

      <h2 id="tier">Rank inicial por tier</h2>
      <p>Ao nascer, o item sorteia um Rank dentro da faixa do seu tier. Depois disso, o Rank pode passar da faixa: só o teto de 255 vale.</p>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Rank ao nascer</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(([t, r]) => (
              <tr key={t}>
                <td>{t}</td>
                <td>{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocPage>
  );
}
