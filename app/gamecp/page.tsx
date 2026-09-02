import GameCpPortal from "./GameCpPortal";
import { getPlayerSession } from "../lib/player-auth";
import { listCharacters } from "../lib/game-account";
import { listDonationPackages, getWalletBalance } from "../../db/store";

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
  const [packages, playerSession] = await Promise.all([listDonationPackages(false), getPlayerSession()]);
  const [walletBalance, characters] = playerSession
    ? await Promise.all([getWalletBalance(playerSession.username), listCharacters(playerSession.username)])
    : [null, []];

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
        <a className="header-cta" href="/">
          ← Voltar
        </a>
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
            <p>Entre com a conta do jogo, recarregue seu Game CP via Asaas e compre pacotes — entrega automática no personagem.</p>
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
          <GameCpPortal packages={[]} loggedInUsername={null} walletBalance={null} characters={[]} />
        </section>
      </main>
    );
  }

  return (
    <main className="gamecp-page">
      {header}
      <section className="gamecp-wrap">
        <GameCpPortal
          packages={packages.map((p) => ({
            key: p.key,
            name: p.name,
            gpPrice: p.gpPrice,
            cashAmount: p.cashAmount,
            stockRemaining: p.stockRemaining,
            stockTotal: p.stockTotal,
            items: p.items.map((i) => ({ itemCode: i.itemCode, amount: i.amount, label: i.label })),
          }))}
          loggedInUsername={playerSession.username}
          walletBalance={walletBalance}
          characters={characters.map((c) => ({ serial: c.serial, name: c.name, level: c.level }))}
        />
      </section>
    </main>
  );
}
