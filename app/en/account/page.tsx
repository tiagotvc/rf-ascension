import LaunchCountdown from "../../LaunchCountdown";
export default function EnglishAccount(){
 return <main className="account-page">
  <header className="site-header forum-nav"><a className="brand" href="/en"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ASCENSION</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/en">Home</a><a href="/en#download">Download</a><a href="/en/forum">Forum</a><a className="active" href="/en/account">My account</a></nav><div className="header-tools"><span className="lang-switch"><a href="/conta">PT</a><b>EN</b></span><a className="header-cta" href="/en">← Back</a></div></header>
  <section className="account-shell">
   <div className="account-story"><span className="kicker">PLAYER PORTAL</span><h1>Your journey<br/><em>starts here.</em></h1><p>Create your RF Ascension identity, choose your race in-game and write your name in the history of Novus.</p><div className="account-perks"><span><b>01</b> Quick signup</span><span><b>02</b> Protected account</span><span><b>03</b> Forum access</span></div></div>
   <div className="account-panel account-locked">
    <span className="mini-label">SIGNUPS STILL CLOSED</span>
    <h2>Opens on launch day.</h2>
    <p>Account creation and sign-in open on <b>08/21/2026 at 20:00</b> (GMT-3), together with the server. You cannot create an account before that.</p>
    <LaunchCountdown/>
    <a className="btn btn-ghost" href="/en/forum">Follow news on the forum →</a>
   </div>
  </section>
 </main>
}
