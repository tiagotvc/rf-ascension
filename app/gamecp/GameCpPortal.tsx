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
    gameCp: "Game CP",
    tabShop: "Loja",
    tabTopup: "Recarregar",
    tabChar: "Personagem",
    topupTitle: "Recarregar Game CP",
    topupHint: "Pagamento via Asaas (PIX, cartão, Mercado Pago). R$ 1 = 1.000 Game CP.",
    topupPlaceholder: "Valor em R$",
    topup: "Gerar cobrança",
    character: "Personagem selecionado",
    level: "nível",
    noChars: "Nenhum personagem encontrado nessa conta — entre no jogo pra criar o primeiro.",
    charHint: "A compra de qualquer pacote cai neste personagem.",
    logout: "Sair",
    download: "Baixar cliente",
    inStock: "em estoque",
    cash: "Cash",
    soldOut: "Esgotado",
    buy: "Comprar",
    shopTitle: "Pacotes disponíveis",
    shopHint: "Entrega automática — item na bag (ou correio) + Cash real do jogo.",
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
    gameCp: "Game CP",
    tabShop: "Shop",
    tabTopup: "Top up",
    tabChar: "Character",
    topupTitle: "Top up Game CP",
    topupHint: "Payment via Asaas (PIX, card, Mercado Pago). R$ 1 = 1,000 Game CP.",
    topupPlaceholder: "Amount in R$",
    topup: "Generate charge",
    character: "Selected character",
    level: "level",
    noChars: "No character found on this account — log in-game to create your first one.",
    charHint: "Any package purchase is delivered to this character.",
    logout: "Log out",
    download: "Download client",
    inStock: "in stock",
    cash: "Cash",
    soldOut: "Sold out",
    buy: "Buy",
    shopTitle: "Available packages",
    shopHint: "Automatic delivery — item in the bag (or mail) + real in-game Cash.",
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
  const numberLocale = locale === "en" ? "en-US" : "pt-BR";
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
  const [dashTab, setDashTab] = useState<"shop" | "topup" | "character">("shop");

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
      setDashTab("character");
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

  const selected = characters.find((c) => c.serial === selectedCharacter) ?? null;

  return (
    <div className="gamecp-dash">
      <div className="gamecp-topbar">
        <div className="gamecp-identity">
          <span className="mini-label">{t.loggedInAs}</span>
          <strong>{loggedInUsername}</strong>
        </div>
        <div className="gamecp-balance-pill">
          <b>◈</b>
          <span>{(walletBalance ?? 0).toLocaleString(numberLocale)}</span>
          <small>{t.gameCp}</small>
        </div>
        <div className="gamecp-topbar-actions">
          <a className="btn btn-ghost" href={locale === "en" ? "/en#download" : "/#download"}>
            {t.download}
          </a>
          <button className="btn btn-ghost" onClick={handleLogout} disabled={loading} type="button">
            {t.logout}
          </button>
        </div>
      </div>

      <nav className="gamecp-subnav">
        <button className={dashTab === "shop" ? "active" : ""} onClick={() => setDashTab("shop")} type="button">
          {t.tabShop}
        </button>
        <button className={dashTab === "topup" ? "active" : ""} onClick={() => setDashTab("topup")} type="button">
          {t.tabTopup}
        </button>
        <button className={dashTab === "character" ? "active" : ""} onClick={() => setDashTab("character")} type="button">
          {t.tabChar}
        </button>
      </nav>

      {dashTab === "shop" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.shopTitle}</h2>
            <p>{t.shopHint}</p>
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
                    +{p.cashAmount.toLocaleString(numberLocale)} {t.cash} · {p.stockRemaining}/{p.stockTotal} {t.inStock}
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
      )}

      {dashTab === "topup" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.topupTitle}</h2>
            <p>{t.topupHint}</p>
          </div>
          <form onSubmit={handleTopup} className="store-topup-form gamecp-topup-form">
            <input
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder={t.topupPlaceholder}
              inputMode="decimal"
            />
            <button className="btn btn-primary" disabled={loading}>
              {t.topup}
            </button>
          </form>
          {topupError && <p className="store-error">{topupError}</p>}
        </div>
      )}

      {dashTab === "character" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.character}</h2>
            <p>{t.charHint}</p>
          </div>
          {characters.length > 0 ? (
            <>
              <div className="gamecp-char-grid">
                {characters.map((c) => (
                  <button
                    key={c.serial}
                    type="button"
                    className={`gamecp-char-card${c.serial === selectedCharacter ? " active" : ""}`}
                    onClick={() => setSelectedCharacter(c.serial)}
                  >
                    <strong>{c.name}</strong>
                    <span>
                      {t.level} {c.level}
                    </span>
                  </button>
                ))}
              </div>
              {selected && (
                <p className="gamecp-char-selected">
                  {locale === "en" ? "Selected:" : "Selecionado:"} <b>{selected.name}</b>
                </p>
              )}
            </>
          ) : (
            <p className="store-error">{t.noChars}</p>
          )}
        </div>
      )}
    </div>
  );
}
