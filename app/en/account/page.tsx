import { getPlayerSession } from "../../lib/player-auth";
import { listCharacters } from "../../lib/game-account";
import AccountPortal from "../../conta/AccountPortal";

export const dynamic = "force-dynamic";

export default async function EnglishAccount(){
 const session = await getPlayerSession();
 const characters = session ? await listCharacters(session.username) : [];
 return <main className="account-page">
  <header className="site-header forum-nav"><a className="brand" href="/en"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ECHELON</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/en">Home</a><a href="/en#download">Download</a><a href="/en/forum">Forum</a><a className="active" href="/en/account">My account</a></nav><div className="header-tools"><span className="lang-switch"><a href="/conta">PT</a><b>EN</b></span><a className="header-cta" href="/en">← Back</a></div></header>
  <section className="account-shell">
   <div className="account-story"><span className="kicker">PLAYER PORTAL</span><h1>Your journey<br/><em>starts here.</em></h1><p>Create your RF Echelon identity, choose your race in-game and write your name in the history of Novus.</p><div className="account-perks"><span><b>01</b> Quick signup</span><span><b>02</b> Protected account</span><span><b>03</b> Forum access</span></div></div>
   <AccountPortal
     loggedInUsername={session?.username ?? null}
     characters={characters.map((c) => ({ serial: c.serial, name: c.name, level: c.level, race: c.race }))}
     locale="en"
   />
  </section>
 </main>
}
