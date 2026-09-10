"use client";
import { useState } from "react";

export type PublicPotion = { code: string; name: string; icon: string | null; gpPrice: number; category: string | null };

export type StoreCharacter = { serial: number; name: string; level: number; dalant: number; goldPoint: number };

export type TopupBonusItem = { itemCode: string; amount: number; label: string };

const EXCHANGE_RATES = { cash: 1, dalant: 1_000_000, goldpoint: 25 } as const;
type ExchangeCurrencyKey = keyof typeof EXCHANGE_RATES;

const MAX_PURCHASE_QUANTITY = 20;
const GP_PER_REAL = 1000;
const TOPUP_TIERS = [
  { amountBrl: 50, name: "Silver", color: "#c8ced5" },
  { amountBrl: 120, name: "Gold", color: "var(--gold)" },
  { amountBrl: 250, name: "Diamond", color: "var(--cyan)" },
  { amountBrl: 400, name: "Ultimate", color: "#ff5c5c" },
] as const;

// Ícone real (recortado do jogo, ver public/assets/donnate/<item>/) pros itens de bônus da
// Recarregar — mesma convenção já usada pro Thorns Generator.
const DONATE_ITEM_ICONS: Record<string, string> = {
  ipupr01: "/assets/donnate/upgrade-potion/icon.png",
};

type DonateItemTooltip = {
  name: string;
  type: string;
  race: string;
  target: string;
  quantity: number;
  castDelay: string;
  specialEffects: string[];
  market: string;
  drop: string;
  useStatus: string;
  description: string;
};

// Tooltip nativo do site (texto real do item, não print) — dados conferidos direto na fonte do
// item no MapEditor (MapEditor/Formats/PotionItemAppendUpgradeProtection.cs), não em screenshot.
const DONATE_ITEM_TOOLTIPS: Record<string, DonateItemTooltip> = {
  ipupr01: {
    name: "Upgrade Protection Potion",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["Prevents item destruction on failed upgrade"],
    market: "Possibility",
    drop: "Possibility",
    useStatus: "Always",
    description:
      "For 120 seconds after drinking this, every Item Upgrade attempt (Alter Durability Point / talic) you make is protected from total destruction. The talic can still fail, and a failed attempt can still reset the item's upgrade sockets back to empty - but the item itself will never be destroyed while the protection is active. Consumed on use, one use = one 120s window.",
  },
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
    tabPackages: "Pacotes",
    tabChar: "Personagem",
    topupTitle: "Recarregar Game CP",
    topupHint: "Pagamento via Asaas (PIX, cartão, Mercado Pago). R$ 1 = 1.000 Game CP.",
    character: "Personagem selecionado",
    level: "nível",
    noChars: "Nenhum personagem encontrado nessa conta — entre no jogo pra criar o primeiro.",
    charHint: "A compra de qualquer poção cai neste personagem.",
    cash: "Cash",
    buy: "Comprar",
    gp: "GP",
    qty: "Qtd.",
    shopTitle: "Poções disponíveis",
    shopHint: "Entrega automática — item direto na bag (ou correio) do personagem.",
    noPotions: "Nenhuma poção à venda no momento.",
    uncategorized: "Outros",
    trustBar: "Compra 100% segura. Entrega automática diretamente na sua bag (ou correio).",
    chooseCharFirst: "Escolha um personagem primeiro.",
    genericLoginError: "Erro ao entrar.",
    genericTopupError: "Erro ao criar cobrança.",
    genericPurchaseError: "Erro na compra.",
    delivered: "Compra entregue! Confira a bag (ou o correio in-game) do personagem escolhido.",
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
    tabPackages: "Packages",
    tabChar: "Character",
    topupTitle: "Top up Game CP",
    topupHint: "Payment via Asaas (PIX, card, Mercado Pago). R$ 1 = 1,000 Game CP.",
    character: "Selected character",
    level: "level",
    noChars: "No character found on this account — log in-game to create your first one.",
    charHint: "Any potion purchase is delivered to this character.",
    cash: "Cash",
    buy: "Buy",
    gp: "GP",
    qty: "Qty.",
    shopTitle: "Available potions",
    shopHint: "Automatic delivery — item straight to the character's bag (or mail).",
    noPotions: "No potion for sale right now.",
    uncategorized: "Other",
    trustBar: "100% secure purchase. Automatic delivery straight to your bag (or mail).",
    chooseCharFirst: "Choose a character first.",
    genericLoginError: "Login error.",
    genericTopupError: "Error creating charge.",
    genericPurchaseError: "Purchase error.",
    delivered: "Purchase delivered! Check the bag (or in-game mail) of the character you chose.",
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
  potions,
  loggedInUsername,
  walletBalance,
  characters,
  gameCash = null,
  topupBonusItems = {},
  locale = "pt",
}: {
  potions: PublicPotion[];
  loggedInUsername: string | null;
  walletBalance: number | null;
  characters: StoreCharacter[];
  gameCash?: number | null;
  topupBonusItems?: Record<number, TopupBonusItem[]>;
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
  const [topupError, setTopupError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<number | "">(characters[0]?.serial ?? "");
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [dashTab, setDashTab] = useState<"shop" | "topup" | "packages" | "character">("shop");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [exchangeAmounts, setExchangeAmounts] = useState<Record<ExchangeCurrencyKey, string>>({
    cash: "1000",
    dalant: "1000",
    goldpoint: "1000",
  });
  const [exchangeLoading, setExchangeLoading] = useState<ExchangeCurrencyKey | null>(null);
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  const potionGroups: { category: string; items: PublicPotion[] }[] = [];
  for (const p of potions) {
    const category = p.category ?? t.uncategorized;
    const group = potionGroups.find((g) => g.category === category);
    if (group) group.items.push(p);
    else potionGroups.push({ category, items: [p] });
  }

  function getQuantity(itemCode: string): number {
    const raw = quantities[itemCode] ?? 1;
    return Math.min(Math.max(1, raw), MAX_PURCHASE_QUANTITY);
  }

  function setQuantity(itemCode: string, value: number) {
    const clamped = Math.min(Math.max(1, value), MAX_PURCHASE_QUANTITY);
    setQuantities((prev) => ({ ...prev, [itemCode]: clamped }));
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

  async function handleTopup(amountBrl: number) {
    if (!selectedCharacter) {
      setTopupError(t.chooseCharFirst);
      return;
    }
    setLoading(true);
    setTopupError(null);
    try {
      const amountBrlCents = Math.round(amountBrl * 100);
      const res = await fetch("/api/store/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountBrlCents, characterSerial: selectedCharacter }),
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

  async function handleBuyPotion(itemCode: string, quantity: number) {
    if (!selectedCharacter) {
      setPurchaseMessage(t.chooseCharFirst);
      return;
    }
    setLoading(true);
    setPurchaseMessage(null);
    try {
      const res = await fetch("/api/store/buy-potion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemCode, characterSerial: selectedCharacter, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurchaseMessage(data.error ?? t.genericPurchaseError);
        return;
      }
      setPurchaseMessage(t.delivered);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleExchange(currency: ExchangeCurrencyKey) {
    if (!selectedCharacter) {
      setExchangeMessage(t.chooseCharFirst);
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
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={tab === "register" ? 4 : undefined}
              maxLength={12}
              required
            />
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
        {characters.length > 0 && (
          <label className="gamecp-char-select">
            <span className="mini-label">{t.character}</span>
            <select value={selectedCharacter} onChange={(e) => setSelectedCharacter(Number(e.target.value))}>
              {characters.map((c) => (
                <option key={c.serial} value={c.serial}>
                  {c.name} ({t.level} {c.level})
                </option>
              ))}
            </select>
          </label>
        )}
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
        <button className={dashTab === "packages" ? "active" : ""} onClick={() => setDashTab("packages")} type="button">
          {t.tabPackages}
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
          {characters.length === 0 && <p className="store-error">{t.noChars}</p>}
          {potions.length === 0 ? (
            <p className="store-error">{t.noPotions}</p>
          ) : (
            potionGroups.map((group) => (
              <div className="gamecp-potion-group" key={group.category}>
                {potionGroups.length > 1 && <h3 className="gamecp-potion-category">{group.category}</h3>}
                <div className="gamecp-potion-list">
                  {group.items.map((p) => {
                    const qty = getQuantity(p.code);
                    return (
                      <div className="gamecp-potion-row" key={p.code}>
                        {p.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="gamecp-potion-icon" src={`/game-data/${p.icon}`} alt="" />
                        ) : (
                          <span className="gamecp-potion-icon gamecp-potion-icon-fallback">?</span>
                        )}
                        <strong className="gamecp-potion-name">{p.name}</strong>
                        <span className="gamecp-potion-price">
                          {(p.gpPrice * qty).toLocaleString(numberLocale)} <small>{t.gp}</small>
                        </span>
                        <div className="gamecp-qty">
                          <label>{t.qty}</label>
                          <div className="gamecp-qty-controls">
                            <button type="button" onClick={() => setQuantity(p.code, qty - 1)} disabled={qty <= 1}>
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={MAX_PURCHASE_QUANTITY}
                              value={qty}
                              onChange={(e) => setQuantity(p.code, parseInt(e.target.value, 10) || 1)}
                            />
                            <button type="button" onClick={() => setQuantity(p.code, qty + 1)} disabled={qty >= MAX_PURCHASE_QUANTITY}>
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          className="gamecp-potion-buy"
                          disabled={loading || characters.length === 0}
                          onClick={() => handleBuyPotion(p.code, qty)}
                        >
                          <span aria-hidden>🛒</span> {t.buy}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          {purchaseMessage && <p className="store-message">{purchaseMessage}</p>}
          <div className="gamecp-trust-bar">
            <span aria-hidden>🛡️</span> {t.trustBar}
          </div>
        </div>
      )}

      {dashTab === "packages" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.tabPackages}</h2>
            <p>{t.topupHint}</p>
          </div>
          <div className="gamecp-topup-packages">
            {TOPUP_TIERS.map(({ amountBrl, name, color }) => {
              const items = topupBonusItems[amountBrl] ?? [];
              return (
                <div className="gamecp-topup-card" key={amountBrl} style={{ ["--tier-color" as string]: color }}>
                  <div className="gamecp-topup-card-badge">📦</div>
                  <div className="gamecp-topup-card-head">
                    <strong>{name}</strong>
                    <span className="gamecp-topup-card-underline" />
                  </div>
                  {items.length > 0 && (
                    <ul className="gamecp-topup-card-items">
                      {items.map((item) => {
                        const tooltip = DONATE_ITEM_TOOLTIPS[item.itemCode];
                        return (
                          <li key={item.itemCode} className="gamecp-topup-card-item">
                            <span className="gamecp-topup-card-item-icon">
                              {DONATE_ITEM_ICONS[item.itemCode] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={DONATE_ITEM_ICONS[item.itemCode]} alt="" />
                              ) : (
                                <span className="gamecp-topup-card-item-fallback">{item.label.charAt(0)}</span>
                              )}
                            </span>
                            <span>
                              {item.amount}x {item.label}
                            </span>
                            {tooltip && (
                              <div className="gamecp-item-tooltip gamecp-native-tooltip">
                                <strong className="gamecp-native-tooltip-title">[{tooltip.name}]</strong>
                                <dl className="gamecp-native-tooltip-fields">
                                  <dt>Type</dt>
                                  <dd>{tooltip.type}</dd>
                                  <dt>Race</dt>
                                  <dd>{tooltip.race}</dd>
                                  <dt>Target</dt>
                                  <dd>{tooltip.target}</dd>
                                  <dt>Quantity</dt>
                                  <dd>{tooltip.quantity}</dd>
                                  <dt>Cast Delay</dt>
                                  <dd>{tooltip.castDelay}</dd>
                                  {tooltip.specialEffects.length > 0 && (
                                    <>
                                      <dt>Special Effects</dt>
                                      <dd className="gamecp-native-tooltip-gold">
                                        {tooltip.specialEffects.map((effect) => (
                                          <span key={effect}>{effect}</span>
                                        ))}
                                      </dd>
                                    </>
                                  )}
                                  <dt>Market</dt>
                                  <dd className="gamecp-native-tooltip-green">{tooltip.market}</dd>
                                  <dt>Drop</dt>
                                  <dd className="gamecp-native-tooltip-green">{tooltip.drop}</dd>
                                  <dt>Use Status</dt>
                                  <dd>{tooltip.useStatus}</dd>
                                </dl>
                                <p className="gamecp-native-tooltip-desc-label">[Description]</p>
                                <p className="gamecp-native-tooltip-desc">{tooltip.description}</p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="gamecp-topup-card-foot">
                    <p className="gamecp-topup-card-gp">
                      <b>◈</b> {(amountBrl * GP_PER_REAL).toLocaleString(numberLocale)} {t.gp}
                    </p>
                    <p className="gamecp-topup-card-price">R$ {amountBrl}</p>
                    <button
                      type="button"
                      className="gamecp-topup-card-buy"
                      disabled={loading}
                      onClick={() => handleTopup(amountBrl)}
                    >
                      {t.buy}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {topupError && <p className="store-error">{topupError}</p>}
        </div>
      )}

      {dashTab === "topup" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.topupTitle}</h2>
            <p>{t.topupHint}</p>
          </div>

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
