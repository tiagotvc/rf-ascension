import GameCpPortal from "./GameCpPortal";
import HeaderAuth from "../HeaderAuth";
import { getPlayerSession } from "../lib/player-auth";
import { listCharacters, getGameCash } from "../lib/game-account";
import { getWalletBalance } from "../../db/store";
import { getPublicPotionCatalog } from "../../db/potion-shop";

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

export default async function GameCp() {
  const [potions, playerSession] = await Promise.all([getPublicPotionCatalog(), getPlayerSession()]);
  const [walletBalance, characters, gameCash] = playerSession
    ? await Promise.all([getWalletBalance(playerSession.username), listCharacters(playerSession.username), getGameCash(playerSession.username)])
    : [null, [], null];

  const header = (
    <header className="site-header forum-nav">
      <a className="brand" href="/">
        <Brand />
      </a>
      <nav>
        <a href="/">Início</a>
        <a href="/#download">Download</a>
        <a href="/forum">Fórum</a>
        <a className="active" href="/gamecp">
          Game CP
        </a>
      </nav>
      <div className="header-tools">
        <span className="lang-switch">
          <b>PT</b>
          <a href="/en/gamecp">EN</a>
        </span>
        <HeaderAuth />
      </div>
    </header>
  );

  if (!playerSession) {
    return (
      <main className="account-page">
        {header}
        <section className="account-shell">
          <div className="account-story">
            <span className="kicker">CENTRAL DO JOGADOR</span>
            <h1>
              Sua conta.
              <br />
              <em>Seu Game CP.</em>
            </h1>
            <p>Entre com a conta do jogo, recarregue seu Game CP via Asaas e compre poções — entrega automática no personagem.</p>
            <div className="account-perks">
              <span>
                <b>01</b> Cadastro rápido
              </span>
              <span>
                <b>02</b> Conta protegida
              </span>
              <span>
                <b>03</b> Entrega automática
              </span>
            </div>
          </div>
          <GameCpPortal potions={[]} loggedInUsername={null} walletBalance={null} characters={[]} />
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
        />
      </section>
    </main>
  );
}
