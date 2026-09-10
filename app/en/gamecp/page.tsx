import GameCpPortal from "../../gamecp/GameCpPortal";
import HeaderAuth from "../../HeaderAuth";
import { getPlayerSession } from "../../lib/player-auth";
import { listCharacters, getGameCash } from "../../lib/game-account";
import { getWalletBalance, listDonationPackages } from "../../../db/store";
import { getPublicPotionCatalog } from "../../../db/potion-shop";
import { extractTopupBonusItems } from "../../lib/topup-bonus";

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
  const [potions, allPackages, playerSession] = await Promise.all([
    getPublicPotionCatalog(),
    listDonationPackages(true),
    getPlayerSession(),
  ]);
  const topupBonusItems = extractTopupBonusItems(allPackages);
  const [walletBalance, characters, gameCash] = playerSession
    ? await Promise.all([getWalletBalance(playerSession.username), listCharacters(playerSession.username), getGameCash(playerSession.username)])
    : [null, [], null];

  const header = (
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
        <HeaderAuth locale="en" />
      </div>
    </header>
  );

  if (!playerSession) {
    return (
      <main className="account-page">
        {header}
        <section className="account-shell">
          <div className="account-story">
            <span className="kicker">PLAYER HUB</span>
            <h1>
              Your account.
              <br />
              <em>Your Game CP.</em>
            </h1>
            <p>Log in with your game account, top up your Game CP via Asaas and buy potions — automatic delivery to your character.</p>
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
          <GameCpPortal potions={[]} loggedInUsername={null} walletBalance={null} characters={[]} topupBonusItems={{}} locale="en" />
        </section>
      </main>
    );
  }

  return (
    <main className="gamecp-page">
      {header}
      <section className="gamecp-wrap">
        <GameCpPortal
          potions={potions}
          loggedInUsername={playerSession.username}
          walletBalance={walletBalance}
          characters={characters.map((c) => ({ serial: c.serial, name: c.name, level: c.level, dalant: c.dalant, goldPoint: c.goldPoint }))}
          gameCash={gameCash}
          topupBonusItems={topupBonusItems}
          locale="en"
        />
      </section>
    </main>
  );
}
