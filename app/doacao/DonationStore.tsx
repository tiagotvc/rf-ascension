"use client";
import { useState } from "react";

export type StorePackage = {
  key: string;
  name: string;
  priceBrlCents: number;
  cashAmount: number;
  stockRemaining: number;
  stockTotal: number;
  items: { itemCode: string; amount: number; label: string }[];
};

export type StoreCharacter = { serial: number; name: string; level: number };

const ITEM_ICONS: Record<string, string> = {
  iywml01: "/assets/donnate/watermelon.png",
};

const COPY = {
  pt: {
    loginTitle: "Entrar com a conta do jogo",
    loginHint: "Use o mesmo usuário e senha do client — é a mesma conta.",
    user: "Usuário",
    pass: "Senha",
    enter: "Entrar",
    loggedInAs: "Logado como",
    topupPlaceholder: "Valor em R$",
    topup: "Recarregar saldo",
    character: "Personagem",
    level: "nível",
    noChars: "Nenhum personagem encontrado nessa conta.",
    inStock: "em estoque",
    cash: "CASH",
    soldOut: "Esgotado",
    buy: "Comprar com saldo",
    chooseCharFirst: "Escolha um personagem primeiro.",
    genericLoginError: "Erro ao entrar.",
    genericTopupError: "Erro ao criar cobrança.",
    genericPurchaseError: "Erro na compra.",
    delivered: "Compra entregue! Confira a bag (ou o correio in-game) do personagem escolhido.",
    queued: "Compra registrada — o WorldServer não respondeu agora, vamos tentar de novo automaticamente em breve.",
  },
  en: {
    loginTitle: "Log in with your game account",
    loginHint: "Use the same username and password as the client — it's the same account.",
    user: "Username",
    pass: "Password",
    enter: "Log in",
    loggedInAs: "Logged in as",
    topupPlaceholder: "Amount in R$",
    topup: "Top up balance",
    character: "Character",
    level: "level",
    noChars: "No character found on this account.",
    inStock: "in stock",
    cash: "CASH",
    soldOut: "Sold out",
    buy: "Buy with balance",
    chooseCharFirst: "Choose a character first.",
    genericLoginError: "Login error.",
    genericTopupError: "Error creating charge.",
    genericPurchaseError: "Purchase error.",
    delivered: "Purchase delivered! Check the bag (or in-game mail) of the character you chose.",
    queued: "Purchase registered — the WorldServer didn't respond right now, we'll retry automatically soon.",
  },
};

export default function DonationStore({
  packages,
  loggedInUsername,
  walletBalance,
  characters,
  locale = "pt",
}: {
  packages: StorePackage[];
  loggedInUsername: string | null;
  walletBalance: number | null;
  characters: StoreCharacter[];
  locale?: "pt" | "en";
}) {
  const t = COPY[locale];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState("50");
  const [topupError, setTopupError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<number | "">(characters[0]?.serial ?? "");
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/store/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? t.genericLoginError);
        return;
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTopupError(null);
    try {
      const amountBrlCents = Math.round(parseFloat(topupAmount.replace(",", ".")) * 100);
      const res = await fetch("/api/store/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountBrlCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTopupError(data.error ?? t.genericTopupError);
        return;
      }
      window.location.href = data.checkoutUrl;
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(packageKey: string) {
    if (!selectedCharacter) {
      setPurchaseMessage(t.chooseCharFirst);
      return;
    }
    setLoading(true);
    setPurchaseMessage(null);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageKey, characterSerial: selectedCharacter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurchaseMessage(data.error ?? t.genericPurchaseError);
        return;
      }
      setPurchaseMessage(data.delivered ? t.delivered : t.queued);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (!loggedInUsername) {
    return (
      <div className="account-panel store-login">
        <form onSubmit={handleLogin}>
          <h2>{t.loginTitle}</h2>
          <p>{t.loginHint}</p>
          <label>
            {t.user}
            <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={12} required />
          </label>
          <label>
            {t.pass}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={12}
              required
            />
          </label>
          {loginError && <p className="store-error">{loginError}</p>}
          <button className="btn btn-primary account-submit" disabled={loading}>
            {t.enter}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="store-panel">
      <div className="account-panel store-wallet">
        <p>
          {t.loggedInAs} <strong>{loggedInUsername}</strong> · Game CP:{" "}
          <strong>{(walletBalance ?? 0).toLocaleString("pt-BR")}</strong>
        </p>
        <form onSubmit={handleTopup} className="store-topup-form">
          <input
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder={t.topupPlaceholder}
            inputMode="decimal"
          />
          <button className="btn btn-ghost" disabled={loading}>
            {t.topup}
          </button>
        </form>
        {topupError && <p className="store-error">{topupError}</p>}
        {characters.length > 0 ? (
          <label className="store-character-select">
            {t.character}
            <select value={selectedCharacter} onChange={(e) => setSelectedCharacter(Number(e.target.value))}>
              {characters.map((c) => (
                <option key={c.serial} value={c.serial}>
                  {c.name} ({t.level} {c.level})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="store-error">{t.noChars}</p>
        )}
      </div>

      <div className="pack-grid">
        {packages.map((p, i) => (
          <div className={`cash-pack tier-${(i % 4) + 1}`} key={p.key}>
            <div className="pack-top">
              <span>{p.name}</span>
              <i>
                {p.stockRemaining}/{p.stockTotal} {t.inStock}
              </i>
            </div>
            <div className="cash-value">
              <b>◈</b>
              <strong>{p.cashAmount.toLocaleString("pt-BR")}</strong>
              <small>{t.cash}</small>
            </div>
            <ul className="pack-benefits">
              {p.items.map((item) => (
                <li key={item.itemCode} className="pack-benefit-item">
                  {ITEM_ICONS[item.itemCode] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ITEM_ICONS[item.itemCode]} alt="" className="pack-benefit-icon" />
                  )}
                  {item.label}
                  {item.amount > 1 ? ` x${item.amount}` : ""}
                </li>
              ))}
            </ul>
            <div className="pack-price">R$ {(p.priceBrlCents / 100).toFixed(2).replace(".", ",")}</div>
            <button
              className="btn btn-primary"
              disabled={loading || p.stockRemaining <= 0 || characters.length === 0}
              onClick={() => handlePurchase(p.key)}
            >
              {p.stockRemaining <= 0 ? t.soldOut : t.buy}
            </button>
          </div>
        ))}
      </div>
      {purchaseMessage && <p className="store-message">{purchaseMessage}</p>}
    </div>
  );
}
