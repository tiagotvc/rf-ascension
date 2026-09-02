import DonationStore from "./DonationStore";
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

export default async function Donation() {
  const header = (
    <header className="site-header">
      <a href="/">
        <Brand />
      </a>
      <nav>
        <a href="/">Início</a>
        <a href="/#download">Download</a>
        <a className="active" href="/doacao">
          Doação
        </a>
        <a href="/forum">Fórum</a>
        <a href="/conta">Minha conta</a>
      </nav>
      <div className="header-tools">
        <span className="lang-switch">
          <b>PT</b>
          <a href="/en/donate">EN</a>
        </span>
        <a className="header-cta" href="/conta">
          Minha conta <span>↗</span>
        </a>
      </div>
    </header>
  );

  const [packages, playerSession] = await Promise.all([listDonationPackages(false), getPlayerSession()]);
  const [walletBalance, characters] = playerSession
    ? await Promise.all([getWalletBalance(playerSession.username), listCharacters(playerSession.username)])
    : [null, []];

  return (
    <main className="premium-donation">
      {header}
      <section className="donation-hero admin-preview">
        <div className="donation-copy">
          <span className="kicker">CENTRAL DE CONTRIBUIÇÕES</span>
          <h1>
            Loja de
            <br />
            <em>Doações.</em>
          </h1>
          <p>
            Entre com a conta do jogo, recarregue seu Game CP via Asaas e compre os pacotes — entrega automática no
            personagem (item na bag/correio + Cash real do jogo).
          </p>
        </div>
      </section>
      <section className="donation-store">
        <header>
          <div>
            <span className="kicker">COLEÇÃO ECHELON</span>
            <h2>Escolha seu poder.</h2>
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
        />
      </section>
    </main>
  );
}
