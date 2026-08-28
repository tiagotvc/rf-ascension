import { getPlayerSession } from "../lib/player-auth";
import { listCharacters } from "../lib/game-account";
import AccountPortal from "./AccountPortal";

export const dynamic = "force-dynamic";

export default async function Conta(){
 const session = await getPlayerSession();
 const characters = session ? await listCharacters(session.username) : [];
 return <main className="account-page">
  <header className="site-header forum-nav"><a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/">Início</a><a href="/#download">Download</a><a href="/forum">Fórum</a><a className="active" href="/conta">Minha conta</a></nav><div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/account">EN</a></span><a className="header-cta" href="/">← Voltar</a></div></header>
  <section className="account-shell">
   <div className="account-story"><span className="kicker">PORTAL DO JOGADOR</span><h1>Sua jornada<br/><em>começa aqui.</em></h1><p>Crie sua identidade no RF Echelon, escolha sua raça dentro do jogo e escreva seu nome na história de Novus.</p><div className="account-perks"><span><b>01</b> Cadastro rápido</span><span><b>02</b> Conta protegida</span><span><b>03</b> Acesso ao fórum</span></div><div className="account-orbit"><i/><i/><i/></div>
   </div>
   <AccountPortal
     loggedInUsername={session?.username ?? null}
     characters={characters.map((c) => ({ serial: c.serial, name: c.name, level: c.level, race: c.race }))}
   />
  </section>
 </main>
}
