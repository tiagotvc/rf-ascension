"use client";
import { useState } from "react";

export type StorePackage = {
  key: string;
  name: string;
  gpPrice: number;
  cashAmount: number;
  stockRemaining: number;
  stockTotal: number;
  items: { itemCode: string; amount: number; label: string }[];
};

export type StoreCharacter = { serial: number; name: string; level: number; dalant: number; goldPoint: number };

const EXCHANGE_RATES = { cash: 1, dalant: 1_000_000, goldpoint: 25 } as const;
type ExchangeCurrencyKey = keyof typeof EXCHANGE_RATES;

const ITEM_ICONS: Record<string, string> = {
  iywml01: "/assets/donnate/watermelon/watermelon.png",
};

// Sem arte real extraída do cliente pra maioria dos itens ainda — emoji
// temático por código, só pra o grid de ícones não ficar todo com a mesma
// letra. Troca por ícone real assim que tivermos os assets.
const ITEM_EMOJI: Record<string, string> = {
  irgn0029: "💎",
  irchm01: "🎁",
  irchm02: "💰",
  irchm63: "⭐",
  ipupr01: "🧪",
  iwspu10: "🗡️",
  iwspu11: "🗡️",
  iwspu12: "🗡️",
  irunv04: "🔮",
  irrc02: "📜",
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
    inStock: "em estoque",
    cash: "Cash",
    soldOut: "Esgotado",
    buy: "Comprar",
    gp: "GP",
    qty: "Qtd.",
    shopTitle: "Pacotes disponíveis",
    shopHint: "Entrega automática — item na bag (ou correio) + Cash real do jogo.",
    mostPopular: "Mais popular",
    bestValue: "Melhor valor",
    trustBar: "Compra 100% segura. Entrega automática diretamente na sua bag (ou correio) e adição de Cash real do jogo.",
    chooseCharFirst: "Escolha um personagem primeiro.",
    genericLoginError: "Erro ao entrar.",
    genericTopupError: "Erro ao criar cobrança.",
    genericPurchaseError: "Erro na compra.",
    delivered: "Compra entregue! Confira a bag (ou o correio in-game) do personagem escolhido.",
    queued: "Compra registrada — o WorldServer não respondeu agora, vamos tentar de novo automaticamente em breve.",
    exchangeTitle: "Trocar Game CP por moeda do jogo",
    exchangeHint: "Troque o GP que você já tem por Cash, Dalant ou Gold Point, direto no personagem selecionado.",
    exchangeCash: "Cash",
    exchangeDalant: "Dalant",
    exchangeGoldPoint: "Gold Point",
    exchangeRateCash: "1 GP = 1 Cash",
    exchangeRateDalant: "1 GP = 1.000.000 Dalant",
    exchangeRateGoldPoint: "1 GP = 25 Gold Point",
    exchangeSubmit: "Trocar",
    exchangeSuccess: "Troca concluída! Confira o personagem.",
    genericExchangeError: "Erro na troca.",
    balancesTitle: "Saldos reais no jogo",
    accountCash: "Cash da conta",
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
    inStock: "in stock",
    cash: "Cash",
    soldOut: "Sold out",
    buy: "Buy",
    gp: "GP",
    qty: "Qty.",
    shopTitle: "Available packages",
    shopHint: "Automatic delivery — item in the bag (or mail) + real in-game Cash.",
    mostPopular: "Most popular",
    bestValue: "Best value",
    trustBar: "100% secure purchase. Automatic delivery straight to your bag (or mail) and real in-game Cash added.",
    chooseCharFirst: "Choose a character first.",
    genericLoginError: "Login error.",
    genericTopupError: "Error creating charge.",
    genericPurchaseError: "Purchase error.",
    delivered: "Purchase delivered! Check the bag (or in-game mail) of the character you chose.",
    queued: "Purchase registered — the WorldServer didn't respond right now, we'll retry automatically soon.",
    exchangeTitle: "Exchange Game CP for in-game currency",
    exchangeHint: "Trade the GP you already have for Cash, Dalant or Gold Point, straight to the selected character.",
    exchangeCash: "Cash",
    exchangeDalant: "Dalant",
    exchangeGoldPoint: "Gold Point",
    exchangeRateCash: "1 GP = 1 Cash",
    exchangeRateDalant: "1 GP = 1,000,000 Dalant",
    exchangeRateGoldPoint: "1 GP = 25 Gold Point",
    exchangeSubmit: "Exchange",
    exchangeSuccess: "Exchange complete! Check your character.",
    genericExchangeError: "Exchange error.",
    balancesTitle: "Real in-game balances",
    accountCash: "Account Cash",
  },
};

export default function GameCpPortal({
  packages,
  loggedInUsername,
  walletBalance,
  characters,
  gameCash = null,
  locale = "pt",
}: {
  packages: StorePackage[];
  loggedInUsername: string | null;
  walletBalance: number | null;
  characters: StoreCharacter[];
  gameCash?: number | null;
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [exchangeAmounts, setExchangeAmounts] = useState<Record<ExchangeCurrencyKey, string>>({
    cash: "1000",
    dalant: "1000",
    goldpoint: "1000",
  });
  const [exchangeLoading, setExchangeLoading] = useState<ExchangeCurrencyKey | null>(null);
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  function getQuantity(packageKey: string, stockRemaining: number): number {
    const raw = quantities[packageKey] ?? 1;
    return Math.min(Math.max(1, raw), Math.max(1, stockRemaining));
  }

  function setQuantity(packageKey: string, value: number, stockRemaining: number) {
    const clamped = Math.min(Math.max(1, value), Math.max(1, stockRemaining));
    setQuantities((prev) => ({ ...prev, [packageKey]: clamped }));
  }

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

  async function handlePurchase(packageKey: string, quantity: number) {
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
        body: JSON.stringify({ packageKey, characterSerial: selectedCharacter, quantity }),
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

  async function handleExchange(currency: ExchangeCurrencyKey) {
    if (!selectedCharacter) {
      setExchangeMessage(t.chooseCharFirst);
      setDashTab("character");
      return;
    }
    const gpAmount = parseInt(exchangeAmounts[currency], 10);
    if (!Number.isInteger(gpAmount) || gpAmount <= 0) return;
    setExchangeLoading(currency);
    setExchangeMessage(null);
    try {
      const res = await fetch("/api/store/exchange", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currency, gpAmount, characterSerial: selectedCharacter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExchangeMessage(data.error ?? t.genericExchangeError);
        return;
      }
      setExchangeMessage(t.exchangeSuccess);
      window.location.reload();
    } finally {
      setExchangeLoading(null);
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
          <div className="gamecp-cards">
            {packages.map((p, i) => {
              const badge = i === 1 ? t.mostPopular : i === 2 ? t.bestValue : null;
              const qty = getQuantity(p.key, p.stockRemaining);
              return (
                <div className={`gamecp-card${badge ? " featured" : ""}`} key={p.key}>
                  {badge && (
                    <span className="gamecp-card-badge">
                      {i === 1 ? "★" : "◆"} {badge}
                    </span>
                  )}
                  <div className="gamecp-card-icons">
                    <span className="gamecp-item-badge">
                      <span className="gamecp-item-fallback">◈</span>
                      <span className="gamecp-item-tooltip">
                        {p.cashAmount.toLocaleString(numberLocale)} {t.cash}
                      </span>
                    </span>
                    {p.items.map((item) => (
                      <span className="gamecp-item-badge" key={item.itemCode}>
                        {ITEM_ICONS[item.itemCode] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ITEM_ICONS[item.itemCode]} alt="" />
                        ) : (
                          <span className="gamecp-item-fallback">{ITEM_EMOJI[item.itemCode] ?? item.label.charAt(0)}</span>
                        )}
                        <span className="gamecp-item-tooltip">
                          {item.label}
                          {item.amount > 1 ? ` x${item.amount}` : ""}
                        </span>
                      </span>
                    ))}
                  </div>
                  <strong className="gamecp-card-name">{p.name}</strong>
                  <p className="gamecp-card-cash">
                    <b>◈</b> +{p.cashAmount.toLocaleString(numberLocale)} {t.cash}
                  </p>
                  {p.stockTotal < 1000 && (
                    <p className="gamecp-card-stock">
                      <span aria-hidden>📦</span> {p.stockRemaining}/{p.stockTotal} {t.inStock}
                    </p>
                  )}
                  <div className="gamecp-card-divider" />
                  <p className="gamecp-card-price">
                    {(p.gpPrice * qty).toLocaleString(numberLocale)} <small>{t.gp}</small>
                  </p>
                  {p.stockRemaining > 0 && (
                    <div className="gamecp-qty">
                      <label>{t.qty}</label>
                      <div className="gamecp-qty-controls">
                        <button type="button" onClick={() => setQuantity(p.key, qty - 1, p.stockRemaining)} disabled={qty <= 1}>
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={p.stockRemaining}
                          value={qty}
                          onChange={(e) => setQuantity(p.key, parseInt(e.target.value, 10) || 1, p.stockRemaining)}
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(p.key, qty + 1, p.stockRemaining)}
                          disabled={qty >= p.stockRemaining}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    className="btn btn-primary gamecp-card-buy"
                    disabled={loading || p.stockRemaining <= 0 || characters.length === 0}
                    onClick={() => handlePurchase(p.key, qty)}
                  >
                    <span aria-hidden>🛒</span> {p.stockRemaining <= 0 ? t.soldOut : t.buy}
                  </button>
                </div>
              );
            })}
          </div>
          {purchaseMessage && <p className="store-message">{purchaseMessage}</p>}
          <div className="gamecp-trust-bar">
            <span aria-hidden>🛡️</span> {t.trustBar}
          </div>
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

          <div className="gamecp-exchange">
            <div className="gamecp-panel-head">
              <h3>{t.exchangeTitle}</h3>
              <p>{t.exchangeHint}</p>
            </div>
            <div className="gamecp-exchange-grid">
              {(
                [
                  { key: "cash" as const, label: t.exchangeCash, rateLabel: t.exchangeRateCash },
                  { key: "dalant" as const, label: t.exchangeDalant, rateLabel: t.exchangeRateDalant },
                  { key: "goldpoint" as const, label: t.exchangeGoldPoint, rateLabel: t.exchangeRateGoldPoint },
                ]
              ).map(({ key, label, rateLabel }) => {
                const gpAmount = parseInt(exchangeAmounts[key], 10) || 0;
                const targetAmount = gpAmount * EXCHANGE_RATES[key];
                return (
                  <div className="gamecp-exchange-card" key={key}>
                    <strong>{label}</strong>
                    <small>{rateLabel}</small>
                    <input
                      type="number"
                      min={1}
                      value={exchangeAmounts[key]}
                      onChange={(e) => setExchangeAmounts((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                    <p className="gamecp-exchange-preview">
                      → {targetAmount.toLocaleString(numberLocale)} {label}
                    </p>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={exchangeLoading !== null || gpAmount <= 0}
                      onClick={() => handleExchange(key)}
                    >
                      {t.exchangeSubmit}
                    </button>
                  </div>
                );
              })}
            </div>
            {exchangeMessage && <p className="store-message">{exchangeMessage}</p>}
          </div>

          <div className="gamecp-balances">
            <div className="gamecp-panel-head">
              <h3>{t.balancesTitle}</h3>
            </div>
            <p className="gamecp-account-cash">
              <b>◈</b> {t.accountCash}: {(gameCash ?? 0).toLocaleString(numberLocale)}
            </p>
            {characters.length > 0 ? (
              <div className="gamecp-balances-table">
                <div className="gamecp-balances-row gamecp-balances-head">
                  <span>{t.character}</span>
                  <span>{t.exchangeDalant}</span>
                  <span>{t.exchangeGoldPoint}</span>
                </div>
                {characters.map((c) => (
                  <div className="gamecp-balances-row" key={c.serial}>
                    <span>{c.name}</span>
                    <span>{c.dalant.toLocaleString(numberLocale)}</span>
                    <span>{c.goldPoint.toLocaleString(numberLocale)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="store-error">{t.noChars}</p>
            )}
          </div>
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
