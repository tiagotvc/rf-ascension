import LaunchCountdown from "../../LaunchCountdown";
const Brand=()=> <span className="brand"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ASCENSION</strong><small>PRIVATE SERVER</small></span></span>;
export default function Donate(){return <main className="premium-donation">
 <header className="site-header"><a href="/en"><Brand/></a><nav><a href="/en">Home</a><a href="/en#download">Download</a><a className="active" href="/en/donate">Donate</a><a href="/en/forum">Forum</a><a href="/en/account">My account</a></nav><div className="header-tools"><span className="lang-switch"><a href="/doacao">PT</a><b>EN</b></span><a className="header-cta" href="/en/account">My account <span>↗</span></a></div></header>
 <section className="donation-hero"><div className="donation-orbit"/><div className="donation-copy"><span className="kicker">CONTRIBUTION CENTER</span><h1>Empower<br/><em>RF Ascension.</em></h1><p>Your contribution keeps Novus online, protected and evolving. Packages and the Cash Point exchange rate are published on launch day, together with the server.</p><div className="trust-line"><span>◆ SECURE PAYMENT</span><span>◆ PACKAGES ON LAUNCH DAY</span><span>◆ TEAM SUPPORT</span></div></div><aside className="donation-balance"><span>ACCOUNT BALANCE</span><strong>0 <small>CP</small></strong><p>Accounts open on launch day. Balance is not available yet.</p><a href="/en/account" className="corner-button">ACCESS MY ACCOUNT <b>↗</b></a></aside></section>
 <section className="donation-store"><header><div><span className="kicker">CHOOSE YOUR PACKAGE</span><h2>Cash Points</h2></div><p>Prices, exchange rate and exclusive items for each package have not been revealed yet.</p></header>
  <div className="account-panel account-locked store-locked">
   <span className="mini-label">PACKAGES NOT REVEALED YET</span>
   <h2>Unlocked on launch day.</h2>
   <p>Prices, Cash Point exchange rate and exclusive items are published together with the server opening, on <b>08/21/2026 at 20:00</b> (GMT-3).</p>
   <LaunchCountdown/>
   <a className="btn btn-ghost" href="/en/forum">Follow news on the forum →</a>
  </div>
  <div className="payment-bar"><span>PAYMENT METHODS</span><b>PIX</b><b>Card</b><b>Mercado Pago</b><small>Protected environment and automatic confirmation</small></div></section>
 <section className="donation-values"><div><span className="kicker">TRANSPARENT CONTRIBUTION</span><h2>The server grows<br/>with its community.</h2></div><div className="value-list"><article><b>01</b><h3>Infrastructure</h3><p>Stable servers, low latency and attack protection.</p></article><article><b>02</b><h3>Content</h3><p>New events, improvements and frequent updates.</p></article><article><b>03</b><h3>Fair play</h3><p>Rewards support your journey without replacing progression.</p></article></div></section>
 </main>}
