import { Callout, DocPage } from "./DocPage";

export const metadata = { title: "Início" };

export default function InformacoesHome() {
  return (
    <DocPage kicker="DOCUMENTAÇÃO OFICIAL" title="Bem-vindo ao RF Echelon" toc={[{ id: "o-que-tem", label: "O que você encontra aqui" }]}>
      <p className="doc-lead">
        Esta documentação reúne as informações oficiais do servidor: classes, skills e sistemas. Os números vêm direto dos arquivos do jogo, não de memória.
      </p>
      <Callout tone="warn">
        <b>Em construção.</b> As páginas estão sendo escritas uma a uma, começando pelas classes de Accretia.
      </Callout>
      <h2 id="o-que-tem">O que você encontra aqui</h2>
      <ul className="doc-list">
        <li>
          <a href="/informacoes/classes/accretia">Classes de Accretia</a> — árvore de evolução e, página a página, as skills de cada classe (começando pelo <a href="/informacoes/classes/accretia/striker">Striker</a>).
        </li>
      </ul>
    </DocPage>
  );
}
