import GameCpPortal from "../../gamecp/GameCpPortal";
import { getPlayerSession } from "../../lib/player-auth";
import { listCharacters } from "../../lib/game-account";
import { listDonationPackages, getWalletBalance } from "../../../db/store";

export const dynamic = "force-dynamic";

const Brand = () => (
  <span className="brand">
    <span className="brand-mark">RF</span>
    <span className="brand-copy">
      <strong>ECHELON</strong>
      <small>PRIVATE SERVER</small>
    </span>
  </span>
);

export default async function EnglishGameCp() {
  const [packages, playerSession] = await Promise.all([listDonationPackages(false), getPlayerSession()]);
  const [walletBalance, characters] = playerSession
    ? await Promise.all([getWalletBalance(playerSession.username), listCharacters(playerSession.username)])
    : [null, []];

  return (
    <main className="account-page gamecp-page">
      <header className="site-header forum-nav">
        <a className="brand" href="/en">
          <Brand />
        </a>
        <nav>
          <a href="/en">Home</a>
          <a href="/en#download">Download</a>
          <a href="/en/forum">Forum</a>
          <a className="active" href="/en/gamecp">
            Game CP
          </a>
        </nav>
        <div className="header-tools">
          <span className="lang-switch">
            <a href="/gamecp">PT</a>
            <b>EN</b>
          </span>
          <a className="header-cta" href="/en">
            ← Back
          </a>
        </div>
      </header>
      <section className="account-shell gamecp-shell-wrap">
        <div className="account-story">
          <span className="kicker">PLAYER HUB</span>
          <h1>
            Your account.
            <br />
            <em>Your Game CP.</em>
          </h1>
          <p>Log in with your game account, top up your Game CP via Asaas and buy packages — automatic delivery to your character.</p>
          <div className="account-perks">
            <span>
              <b>01</b> Quick signup
            </span>
            <span>
              <b>02</b> Protected account
            </span>
            <span>
              <b>03</b> Automatic delivery
            </span>
          </div>
        </div>
        <GameCpPortal
          packages={packages.map((p) => ({
            key: p.key,
            name: p.name,
            priceBrlCents: p.priceBrlCents,
            cashAmount: p.cashAmount,
            stockRemaining: p.stockRemaining,
            stockTotal: p.stockTotal,
            items: p.items.map((i) => ({ itemCode: i.itemCode, amount: i.amount, label: i.label })),
          }))}
          loggedInUsername={playerSession?.username ?? null}
          walletBalance={walletBalance}
          characters={characters.map((c) => ({ serial: c.serial, name: c.name, level: c.level }))}
          locale="en"
        />
      </section>
    </main>
  );
}
