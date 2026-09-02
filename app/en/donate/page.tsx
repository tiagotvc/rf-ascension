import DonationStore from "../../doacao/DonationStore";
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

export default async function Donate() {
  const [packages, playerSession] = await Promise.all([listDonationPackages(false), getPlayerSession()]);
  const [walletBalance, characters] = playerSession
    ? await Promise.all([getWalletBalance(playerSession.username), listCharacters(playerSession.username)])
    : [null, []];

  return (
    <main className="premium-donation">
      <header className="site-header">
        <a href="/en">
          <Brand />
        </a>
        <nav>
          <a href="/en">Home</a>
          <a href="/en#download">Download</a>
          <a className="active" href="/en/donate">
            Donate
          </a>
          <a href="/en/forum">Forum</a>
          <a href="/en/account">My account</a>
        </nav>
        <div className="header-tools">
          <span className="lang-switch">
            <a href="/doacao">PT</a>
            <b>EN</b>
          </span>
          <a className="header-cta" href="/en/account">
            My account <span>↗</span>
          </a>
        </div>
      </header>
      <section className="donation-hero admin-preview">
        <div className="donation-copy">
          <span className="kicker">CONTRIBUTION CENTER</span>
          <h1>
            Donation
            <br />
            <em>Store.</em>
          </h1>
          <p>
            Log in with your game account, top up your Game CP via Asaas and buy packages — automatic delivery to
            your character (item in the bag/mail + real in-game Cash).
          </p>
        </div>
      </section>
      <section className="donation-store">
        <header>
          <div>
            <span className="kicker">ECHELON COLLECTION</span>
            <h2>Choose your power.</h2>
          </div>
        </header>
        <DonationStore
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
