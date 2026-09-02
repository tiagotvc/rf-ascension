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
    createTab: "Criar conta",
    loginTab: "Entrar",
    createTitle: "Crie sua conta",
    loginTitle: "Entrar",
    createHint: "Usuário e senha de 4 a 12 caracteres, letras e números, sem espaço ou acento.",
    loginHint: "Use o mesmo usuário e senha do client — é a mesma conta.",
    user: "Usuário",
    pass: "Senha",
    confirmPass: "Confirmar senha",
    footNote: "Mesma conta usada no cliente do jogo.",
    loggedInAs: "Logado como",
    gameCp: "GAME CP",
    topupPlaceholder: "Valor em R$",
    topup: "Recarregar",
    character: "Personagem",
    level: "nível",
    noChars: "Nenhum personagem encontrado nessa conta — entre no jogo pra criar o primeiro.",
    logout: "Sair",
    download: "Baixar cliente",
    inStock: "em estoque",
    cash: "CASH",
    soldOut: "Esgotado",
    buy: "Comprar",
    chooseCharFirst: "Escolha um personagem primeiro.",
    genericLoginError: "Erro ao entrar.",
    genericTopupError: "Erro ao criar cobrança.",
    genericPurchaseError: "Erro na compra.",
    delivered: "Compra entregue! Confira a bag (ou o correio in-game) do personagem escolhido.",
    queued: "Compra registrada — o WorldServer não respondeu agora, vamos tentar de novo automaticamente em breve.",
  },
  en: {
    createTab: "Create account",
    loginTab: "Log in",
    createTitle: "Create your account",
    loginTitle: "Log in",
    createHint: "Username and password 4 to 12 characters, letters and numbers, no spaces or accents.",
    loginHint: "Use the same username and password as the client — it's the same account.",
    user: "Username",
    pass: "Password",
    confirmPass: "Confirm password",
    footNote: "Same account used in the game client.",
    loggedInAs: "Logged in as",
    gameCp: "GAME CP",
    topupPlaceholder: "Amount in R$",
    topup: "Top up",
    character: "Character",
    level: "level",
    noChars: "No character found on this account — log in-game to create your first one.",
    logout: "Log out",
    download: "Download client",
    inStock: "in stock",
    cash: "CASH",
    soldOut: "Sold out",
    buy: "Buy",
    chooseCharFirst: "Choose a character first.",
    genericLoginError: "Login error.",
    genericTopupError: "Error creating charge.",
    genericPurchaseError: "Purchase error.",
    delivered: "Purchase delivered! Check the bag (or in-game mail) of the character you chose.",
    queued: "Purchase registered — the WorldServer didn't respond right now, we'll retry automatically soon.",
  },
};

export default function GameCpPortal({
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
  const [tab, setTab] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState("50");
  const [topupError, setTopupError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<number | "">(characters[0]?.serial ?? "");
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const path = tab === "register" ? "/api/conta/registrar" : "/api/store/login";
      const body = tab === "register" ? { username, password, confirmPassword } : { username, password };
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? t.genericLoginError);
        return;
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/store/logout", { method: "POST" });
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
      <div className="account-panel">
        <div className="account-tabs">
          <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")} type="button">
            {t.createTab}
          </button>
          <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")} type="button">
            {t.loginTab}
          </button>
        </div>
        <form onSubmit={handleAuthSubmit}>
          <h2>{tab === "register" ? t.createTitle : t.loginTitle}</h2>
          <p>{tab === "register" ? t.createHint : t.loginHint}</p>
          <label>
            {t.user}
            <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={4} maxLength={12} required />
          </label>
          {tab === "register" ? (
            <div className="field-row">
              <label>
                {t.pass}
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} maxLength={12} required />
              </label>
              <label>
                {t.confirmPass}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={4}
                  maxLength={12}
                  required
                />
              </label>
            </div>
          ) : (
            <label>
              {t.pass}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={12} required />
            </label>
          )}
          {formError && <p className="store-error">{formError}</p>}
          <button className="btn btn-primary account-submit" disabled={loading}>
            {tab === "register" ? t.createTab : t.loginTab}
          </button>
          <small className="form-note">{t.footNote}</small>
        </form>
      </div>
    );
  }

  return (
    <div className="gamecp-shell">
      <div className="gamecp-header">
        <div className="gamecp-balance">
          <span className="mini-label">{t.gameCp}</span>
          <strong>{(walletBalance ?? 0).toLocaleString(locale === "en" ? "en-US" : "pt-BR")}</strong>
        </div>
        <div className="gamecp-user">
          <p>
            {t.loggedInAs} <strong>{loggedInUsername}</strong>
          </p>
          <div className="gamecp-user-actions">
            <a className="btn btn-ghost" href={locale === "en" ? "/en#download" : "/#download"}>
              {t.download}
            </a>
            <button className="forgot" onClick={handleLogout} disabled={loading} type="button">
              {t.logout}
            </button>
          </div>
        </div>
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

      <div className="gamecp-list">
        {packages.map((p) => (
          <div className="gamecp-row" key={p.key}>
            <div className="gamecp-row-icon">◈</div>
            <div className="gamecp-row-main">
              <strong>{p.name}</strong>
              <span className="gamecp-row-items">
                {p.items.map((item) => (
                  <em key={item.itemCode}>
                    {ITEM_ICONS[item.itemCode] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ITEM_ICONS[item.itemCode]} alt="" className="gamecp-row-item-icon" />
                    )}
                    {item.label}
                    {item.amount > 1 ? ` x${item.amount}` : ""}
                  </em>
                ))}
              </span>
              <small>
                +{p.cashAmount.toLocaleString(locale === "en" ? "en-US" : "pt-BR")} {t.cash} · {p.stockRemaining}/
                {p.stockTotal} {t.inStock}
              </small>
            </div>
            <div className="gamecp-row-buy">
              <span>R$ {(p.priceBrlCents / 100).toFixed(2).replace(".", locale === "en" ? "." : ",")}</span>
              <button
                className="btn btn-primary"
                disabled={loading || p.stockRemaining <= 0 || characters.length === 0}
                onClick={() => handlePurchase(p.key)}
              >
                {p.stockRemaining <= 0 ? t.soldOut : t.buy}
              </button>
            </div>
          </div>
        ))}
      </div>
      {purchaseMessage && <p className="store-message">{purchaseMessage}</p>}
    </div>
  );
}
