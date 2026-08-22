import LaunchCountdown from "../LaunchCountdown";
export default function Conta(){
 return <main className="account-page">
  <header className="site-header forum-nav"><a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/">Início</a><a href="/#download">Download</a><a href="/forum">Fórum</a><a className="active" href="/conta">Minha conta</a></nav><div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/account">EN</a></span><a className="header-cta" href="/">← Voltar</a></div></header>
  <section className="account-shell">
   <div className="account-story"><span className="kicker">PORTAL DO JOGADOR</span><h1>Sua jornada<br/><em>começa aqui.</em></h1><p>Crie sua identidade no RF Echelon, escolha sua raça dentro do jogo e escreva seu nome na história de Novus.</p><div className="account-perks"><span><b>01</b> Cadastro rápido</span><span><b>02</b> Conta protegida</span><span><b>03</b> Acesso ao fórum</span></div><div className="account-orbit"><i/><i/><i/></div>
   </div>
   <div className="account-panel account-locked">
    <span className="mini-label">CADASTRO AINDA FECHADO</span>
    <h2>Abre no dia do lançamento.</h2>
    <p>Criação de conta e login abrem em <b>28/08/2026 às 20:00</b> (horário de Brasília), junto com o servidor. Não é possível criar conta antes disso.</p>
    <LaunchCountdown/>
    <a className="btn btn-ghost" href="/forum">Acompanhar novidades no fórum →</a>
   </div>
  </section>
 </main>
}
