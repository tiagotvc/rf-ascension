import Link from "next/link";
import { Callout, DocPage } from "./DocPage";

export const metadata = { title: "Início" };

export default function InformacoesHome() {
  return (
    <DocPage kicker="DOCUMENTAÇÃO OFICIAL" title="Bem-vindo ao RF Echelon" toc={[{ id: "o-que-tem", label: "O que você encontra aqui" }]}>
      <p className="doc-lead">
        Esta documentação reúne as informações oficiais do servidor: taxas, sistemas, classes e skills. Os números vêm direto dos arquivos do jogo, não de memória.
      </p>
      <Callout tone="info">Todas as páginas mostram ícones e valores lidos direto dos arquivos do servidor.</Callout>
      <h2 id="o-que-tem">O que você encontra aqui</h2>
      <ul className="doc-list">
        <li>
          <Link href="/informacoes/taxas">Taxas e sistemas</Link> — rates do servidor e a lista de sistemas ativos.
        </li>
        <li>
          <Link href="/informacoes/melhorias">Melhorias e novidades</Link> — o que foi adicionado ou ajustado nas skills e Forces.
        </li>
        <li>
          <Link href="/informacoes/itens/upgrade">Itens</Link>: <Link href="/informacoes/itens/upgrade">upgrade com talics e joias</Link>, <Link href="/informacoes/itens/rank">Rank e Evolution Stones</Link> e <Link href="/informacoes/itens/runas">runas</Link>.
        </li>
        <li>
          <Link href="/informacoes/classes/accretia">Classes</Link> — Accretia, <Link href="/informacoes/classes/bellato">Bellato</Link> e <Link href="/informacoes/classes/cora">Cora</Link>: árvore de evolução e as skills de cada classe.
        </li>
        <li>
          <Link href="/informacoes/skills/melee">Skills</Link> comuns de Melee e <Link href="/informacoes/skills/range">Range</Link>, dos níveis Novato, Expert, Elite e Master.
        </li>
        <li>
          <Link href="/informacoes/forces/dark">Forces</Link>: Dark, Holy, Fire, Water, Earth e Wind.
        </li>
      </ul>
    </DocPage>
  );
}
