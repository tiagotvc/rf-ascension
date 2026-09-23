"use client";
import { useEffect, useRef, useState } from "react";

export type PublicPotion = { code: string; name: string; icon: string | null; gpPrice: number; category: string | null };

export type StoreCharacter = { serial: number; name: string; level: number; dalant: number; goldPoint: number };

export type TopupBonusItem = { itemCode: string; amount: number; label: string };

export type PlayerOrder = {
  id: number;
  kind: string;
  amountBrlCents: number | null;
  gpPrice: number | null;
  packageName: string | null;
  status: string;
  createdAt: string | null;
};

const MAX_PURCHASE_QUANTITY = 20;
const GP_PER_REAL = 1;
const TOPUP_TIERS = [
  { amountBrl: 50, name: "Silver", color: "#c8ced5" },
  { amountBrl: 120, name: "Gold", color: "var(--gold)" },
  { amountBrl: 250, name: "Diamond", color: "var(--cyan)" },
  { amountBrl: 400, name: "Ultimate", color: "#ff5c5c" },
] as const;

// Caixa isométrica desenhada em SVG (sem asset de imagem) - as 3 faces tomam a cor do tier via
// var(--tier-color), com sombreamento por overlays pra parecer um baú de recompensa.
function TierCrate() {
  return (
    <svg className="gamecp-tier-crate-svg" viewBox="0 0 84 92" aria-hidden="true">
      <polygon points="8,32 42,50 42,84 8,66" fill="var(--tier-color)" fillOpacity="0.55" />
      <polygon points="8,32 42,50 42,84 8,66" fill="#000" fillOpacity="0.28" />
      <polygon points="42,50 76,32 76,66 42,84" fill="var(--tier-color)" fillOpacity="0.32" />
      <polygon points="42,50 76,32 76,66 42,84" fill="#000" fillOpacity="0.5" />
      <polygon points="42,14 76,32 42,50 8,32" fill="var(--tier-color)" fillOpacity="0.95" />
      <polygon points="42,14 76,32 42,50 8,32" fill="#fff" fillOpacity="0.2" />
      <polygon points="42,22 62,32 42,42 22,32" fill="#000" fillOpacity="0.22" />
      <polygon points="36,54 48,60 48,72 36,66" fill="#0a0d12" fillOpacity="0.85" stroke="var(--tier-color)" strokeWidth="1" />
      <polyline points="8,32 42,50 76,32" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" />
      <polyline points="42,14 42,4 46,2" fill="none" stroke="var(--tier-color)" strokeWidth="1.5" strokeOpacity="0.8" />
    </svg>
  );
}

type DashTabName = "shop" | "topup" | "packages" | "orders" | "character" | "promo";

const TAB_ICON_PATHS: Record<DashTabName, string> = {
  shop: "M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19.5 8H6 M9 19.5h.01 M17 19.5h.01",
  promo: "M3 11 19 4l-4 16-4-7-7-2z M11 13l8-9",
  topup: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8v8 M8 12h8",
  packages: "M12 3 3 7.5v9L12 21l9-4.5v-9L12 3z M3 7.5 12 12l9-4.5 M12 12v9",
  orders: "M5 6h14 M5 12h14 M5 18h9",
  character: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20a7.5 7.5 0 0 1 15 0",
};

function TabIcon({ name }: { name: DashTabName }) {
  return (
    <svg className="gamecp-subnav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TAB_ICON_PATHS[name]} />
    </svg>
  );
}

// Placeholder até o usuário passar os links reais dos grupos (pedido 2026-09-23: "são vários grupos
// que existem de rf" — não é 1 grupo só) — a validação do link enviado (db/promo.ts) já aceita
// QUALQUER post de facebook.com/groups/.../posts/..., não só os listados aqui; esta lista é só pra
// mostrar sugestões clicáveis na aba, o jogador pode postar em qualquer grupo de RF que quiser.
const PROMO_GROUP_URLS: { label: string; url: string }[] = [
  { label: "Grupo 1 (trocar pelo link real)", url: "https://www.facebook.com/groups/SEU_GRUPO_1" },
  { label: "Grupo 2 (trocar pelo link real)", url: "https://www.facebook.com/groups/SEU_GRUPO_2" },
];

type PromoSubmissionState = { dailyCode: string; postUrl: string | null; status: string; rewardedAt: string | null };

// Valores fixos de recarga de GP — sem nome de tier (isso é só das Pacotes), só o valor e o bônus de
// GP por volume. Bônus tem que bater com TOPUP_BONUS_PERCENT_BY_AMOUNT em db/store.ts (mesma tabela,
// uma pra exibir aqui, outra pra creditar de verdade no confirmTopupPayment).
const TOPUP_GP_TIERS = [
  { amountBrl: 5, bonusPercent: 0 },
  { amountBrl: 50, bonusPercent: 0 },
  { amountBrl: 120, bonusPercent: 5 },
  { amountBrl: 250, bonusPercent: 10 },
  { amountBrl: 400, bonusPercent: 15 },
  { amountBrl: 600, bonusPercent: 30 },
  { amountBrl: 1000, bonusPercent: 50 },
] as const;

// Cash Potion 10.000/Gold Capsule+10000 na Loja não entregam mais poção (ver
// app/api/store/buy-potion/route.ts CURRENCY_POTIONS) — creditam Cash/Gold Point direto na conta.
// Exibe como crédito (símbolo de moeda, sem tooltip de item) em vez de item de poção, pra não parecer
// que precisa usar alguma coisa depois.
const CURRENCY_SHOP_ITEMS: Record<string, { symbol: string; label: string }> = {
  ipcsh05: { symbol: "$", label: "1.000 Cash (crédito direto)" },
  ipgld38: { symbol: "◈", label: "1.000 Gold Point (crédito direto)" },
  ipgld45: { symbol: "◈", label: "1.000 Dalant (crédito direto)" },
};

// Ícone real pros itens de bônus da Recarregar. ipupr01 é custom (recorte manual, ver
// public/assets/donnate/); ipcal01/ipwhp01 já são poções nativas já exportadas pro catálogo da
// Loja (public/game-data/potions/icons/) — reaproveita direto, sem duplicar arquivo.
const DONATE_ITEM_ICONS: Record<string, string> = {
  ipupr01: "/assets/donnate/upgrade-potion/icon.png",
  ipcal01: "/game-data/potions/icons/ipcal01.png",
  ipwhp01: "/game-data/potions/icons/ipwhp01.png",
  ipgld29: "/game-data/potions/icons/ipgld29.png",
  ipcsb19: "/game-data/potions/icons/ipcsb19.png",
  ipfhp01: "/game-data/potions/icons/ipfhp01.png",
  ipcur01: "/game-data/potions/icons/ipcur01.png",
  ipapo01: "/game-data/potions/icons/ipapo01.png",
  // ResourceItem — mesmo catálogo, ícone com confiabilidade menor (ver aviso no chat: categoria usa
  // mais de uma página do item.spr, só uma mapeada).
  irchm63: "/game-data/resources/icons/irchm63.png",
  irunv04: "/game-data/resources/icons/irunv04.png",
  irrc01: "/game-data/resources/icons/irrc01.png",
  // irgn0029: ícone extraído bate visualmente IGUAL ao do irchm63 — provável mesmo problema de
  // página (ver aviso), confiança baixa nesse ícone específico até confirmar.
  irgn0029: "/game-data/resources/icons/irgn0029.png",
  ircco37: "/game-data/resources/icons/ircco37.png",
  ipglp01: "/game-data/potions/icons/ipglp01.png",
  irgn0027: "/game-data/resources/icons/irgn0027.png",
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
  // Race/Target/Cast Delay/Market/Drop conferidos byte-a-byte no PotionItem.dat real (bSell/
  // bExchange/bGround/strCivil/TargetEff/fActDelay). Type e Use Status não têm offset confirmado
  // pra esses dois ainda — mantidos como "Adrenaline"/"Always" pelo mesmo padrão do ipupr01, sem
  // 100% de certeza (avisar se aparecer diferente no jogo).
  ipcal01: {
    name: "Summon Potion",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "10.0secs",
    specialEffects: ["Summons a party member to your location"],
    market: "Possibility",
    drop: "Impossibility",
    useStatus: "Always",
    description:
      "Potion to summon the desired character to your position. Only possible to use once, and if the character declines the offer the summon will not be made.",
  },
  ipwhp01: {
    name: "Teleport Potion",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "10.0secs",
    specialEffects: ["Teleports you to a party member's location"],
    market: "Possibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Potion to teleport to the desired character's position. Only possible to use once.",
  },
  // Campos brutos conferidos direto em PotionItem.dat.parsed.json (bSell/bExchange/bGround/
  // strCivil/TargetEff/fActDelay). Use Status (nUseState) varia por item (0 aqui, 3 no ipcsb19,
  // 1 nos anteriores) e não tem enum confirmado ainda — "Always" é o mesmo chute dos outros, sem
  // certeza total.
  ipgld29: {
    name: "Gold Capsule+3000",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["Grants 3000 Gold Point"],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Capsule from cutting cold. transfer to gold point when used.",
  },
  ipcsb19: {
    name: "Quick Revival Potion",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["Can use skill immediately after revival"],
    market: "Possibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Can use skill as soon as revived",
  },
  ipfhp01: {
    name: "Full Recovery Potion",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "2.5secs",
    specialEffects: ["Recovers HP, FP and SP by 100%"],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Recovers HP, FP, and SP by 100%.",
  },
  ipcur01: {
    name: "Neutralizing Potion",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "5.0secs",
    specialEffects: ["Removes all debuff effects"],
    market: "Possibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Removes all debuff effects.",
  },
  ipapo01: {
    name: "Potion of Apocalypse",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["+500% all damage (physical and magic) for 150s"],
    market: "Possibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Increases all damage (physical and magic) by 500% for 150 seconds.",
  },
  // ResourceItem — Market/Drop e efeitos conferidos em ResourceItem.dat (Sell/Exchange/Ground +
  // EffectData[5]), descrição real do Item.edf/NDItem.edf (tableCode 17). Type/Target/Cast Delay
  // não têm offset confirmado nessa tabela ainda — omitidos em vez de chutados.
  irchm63: {
    name: "5 in One Charm [Cash]",
    type: "Resource",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: [
      "All Attack +0.3%",
      "Final Defense +0.35%",
      "HP Recovery +25 (flat)",
      "Max HP +0.25%",
      "Move Speed +0.5%",
    ],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Add 5 extra powers.",
  },
  irunv04: {
    name: "Evolution Stone [Highest]",
    type: "Resource",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["70% chance to raise upgrade rank by 1-10 levels at once"],
    market: "Possibility",
    drop: "Possibility",
    useStatus: "Always",
    description:
      "[Evolution Stone] The most powerful evolution stone. Place it in the primary talic socket of Item Upgrade for a 70% chance to raise the target item's upgrade rank by 1 to 10 levels at once, capped at the item's own upgrade limit. On failure nothing happens to the item - no reset, no destruction, no lost sockets. The stone itself is always consumed, win or lose.",
  },
  irrc01: {
    name: "Reroll Coupon",
    type: "Resource",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["Rerolls an equipped item's affixes via Item Combine"],
    market: "Possibility",
    drop: "Possibility",
    useStatus: "Always",
    description:
      "Used with Item Combine to reroll an equipped item's affixes. Any affix slots locked in the Affix Reroll window are protected and kept unchanged.",
  },
  // irgn0029: o texto de [Description] real (via NDItem.edf) está DESATUALIZADO — fala 22%/24%/20hp/
  // 15%/15%, mas os EffectData[5] atuais (fonte que o jogo de fato aplica) são 25%/25%/50%/Move Speed/
  // Auto Loot. Usei os valores atuais (EffectData), não o texto velho — mesmo tipo de divergência já
  // achada antes no Upgrade Protection Potion (600s vs 120s).
  irgn0029: {
    name: "Premium (30 Dias)",
    type: "Resource",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: [
      "PvE Attack Bonus (normal monsters) +25%",
      "PvE Defense Bonus (normal monsters) +25%",
      "Experience Gain Rate +50%",
      "Increased Move Speed",
      "Auto Loot enabled",
    ],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description:
      "Grants +25% PvE attack and +25% PvE defense against normal monsters, +50% Experience Gain Rate, increased Move Speed and Auto Loot, active for 30 days. Buying more than one does not stack the duration — using another one while still active resets to 30 days, it does not add up.",
  },
  ircco37: {
    name: "Thorns Generator [Cash]",
    type: "Resource",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["Reflect Chance +15%", "Reflect Value +10%"],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Increase chance of reflecting a damage in 15%. Increase amount of damage reflected in 10%.",
  },
  ipglp01: {
    name: "Gold Point Pill",
    type: "Adrenaline",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: ["Grants 500 Gold Point"],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description: "Adds 500 Gold Point when used.",
  },
  irgn0027: {
    name: "Premium (7 Dias)",
    type: "Resource",
    race: "All races",
    target: "Self",
    quantity: 99,
    castDelay: "0.0secs",
    specialEffects: [
      "PvE Attack Bonus (normal monsters) +25%",
      "PvE Defense Bonus (normal monsters) +25%",
      "Experience Gain Rate +50%",
      "Move Speed +50%",
      "Mastery Gain +50%, Drop Luck +30, Auto Loot enabled",
    ],
    market: "Impossibility",
    drop: "Impossibility",
    useStatus: "Always",
    description:
      "Grants +25% PvE attack and +25% PvE defense against normal monsters, +50% Experience Gain Rate, +50% Move Speed, +50% Mastery Gain, +30 Drop Luck and Auto Loot, active for 7 days.",
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
    tabOrders: "Minhas Compras",
    tabChar: "Personagem",
    tabPromo: "Divulgação",
    promoTitle: "Evento de Divulgação",
    promoHint: "Poste em qualquer grupo de RF no Facebook todo dia com o código abaixo bem visível na postagem e ganhe GP automaticamente.",
    promoRewardNote:
      "Cada postagem do dia passa por revisão manual antes de pagar — a equipe abre o link e confere se o código bate. Só depois de aprovado os 2 GP caem na sua carteira. O evento não tem data pra acabar.",
    promoGroupLabel: "Grupos sugeridos pra postar (pode ser qualquer grupo de RF)",
    promoCodeLabel: "Seu código de hoje",
    promoCodeHint: "Deixe esse código bem visível na foto ou na legenda da postagem — sem ele a gente não consegue confirmar que é uma postagem nova.",
    promoLinkLabel: "Link da sua postagem",
    promoLinkPlaceholder: "Cole aqui o link direto da postagem no grupo",
    promoSubmit: "Enviar pra revisão",
    promoLoading: "Carregando...",
    promoAlreadySent: "Você já mandou a postagem de hoje.",
    promoPendingReview: "Aguardando revisão da equipe — os 2 GP caem na sua carteira assim que for aprovada.",
    promoApproved: "Aprovada! Os 2 GP já foram creditados na sua carteira.",
    promoRejected: "Essa postagem foi recusada na revisão — volta amanhã pra tentar de novo.",
    promoSentLink: "Postagem enviada:",
    promoNeedLogin: "Entre com sua conta pra participar do evento.",
    topupTitle: "Recarregar Game CP",
    topupHint: "Pagamento via Asaas (PIX, cartão, Mercado Pago). R$ 1 = 1 Game CP.",
    packagesHint: "Pague com o Game CP que você já tem — entrega automática, sem passar pelo Asaas.",
    packagesPremiumNote:
      "Todos os pacotes dão Premium por 30 dias (não acumula — comprar mais de um pacote no mês não estende a duração). Vantagens: 2x mais XP, 2x mais Drop, 2x mais Mastery, Auto Loot.",
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
    ordersTitle: "Minhas Compras",
    ordersHint: "Histórico de recargas e pacotes comprados nessa conta.",
    noOrders: "Nenhuma compra ainda.",
    orderDate: "Data",
    orderType: "Tipo",
    orderValue: "Valor",
    orderStatus: "Status",
    orderKindTopup: "Recarga",
    orderKindPackage: "Pacote",
    orderStatusPaid: "Pago",
    orderStatusPending: "Pendente",
    orderStatusFailed: "Falhou",
    orderStatusRefunded: "Estornado",
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
    tabOrders: "My Purchases",
    tabChar: "Character",
    tabPromo: "Promotion",
    promoTitle: "Promotion Event",
    promoHint: "Post in any RF Facebook group every day with the code below clearly visible in the post and get GP automatically.",
    promoRewardNote:
      "Every daily post goes through manual review before it pays out — the team opens the link and checks the code. GP only lands in your wallet once it's approved. The event has no end date.",
    promoGroupLabel: "Suggested groups to post in (any RF group works)",
    promoCodeLabel: "Your code for today",
    promoCodeHint: "Keep this code clearly visible in the photo or caption — without it we can not confirm it is a new post.",
    promoLinkLabel: "Link to your post",
    promoLinkPlaceholder: "Paste the direct link to the post in the group",
    promoSubmit: "Submit for review",
    promoLoading: "Loading...",
    promoAlreadySent: "You already sent today's post.",
    promoPendingReview: "Waiting on the team's review — GP lands in your wallet as soon as it's approved.",
    promoApproved: "Approved! The 2 GP have already been credited to your wallet.",
    promoRejected: "That post was rejected in review — come back tomorrow to try again.",
    promoSentLink: "Post submitted:",
    promoNeedLogin: "Log in to join the event.",
    topupTitle: "Top up Game CP",
    topupHint: "Payment via Asaas (PIX, card, Mercado Pago). R$ 1 = 1 Game CP.",
    packagesHint: "Pay with the Game CP you already have — automatic delivery, no Asaas checkout needed.",
    packagesPremiumNote:
      "Every package grants Premium for 30 days (non-stacking — buying more than one package in a month does not extend the duration). Benefits: 2x XP, 2x Drop, 2x Mastery, Auto Loot.",
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
    ordersTitle: "My Purchases",
    ordersHint: "Top-up and package purchase history for this account.",
    noOrders: "No purchases yet.",
    orderDate: "Date",
    orderType: "Type",
    orderValue: "Value",
    orderStatus: "Status",
    orderKindTopup: "Top-up",
    orderKindPackage: "Package",
    orderStatusPaid: "Paid",
    orderStatusPending: "Pending",
    orderStatusFailed: "Failed",
    orderStatusRefunded: "Refunded",
  },
};

export default function GameCpPortal({
  potions,
  loggedInUsername,
  walletBalance,
  characters,
  topupBonusItems = {},
  orders = [],
  locale = "pt",
  initialTab = "shop",
}: {
  potions: PublicPotion[];
  loggedInUsername: string | null;
  walletBalance: number | null;
  characters: StoreCharacter[];
  topupBonusItems?: Record<number, TopupBonusItem[]>;
  orders?: PlayerOrder[];
  locale?: "pt" | "en";
  initialTab?: DashTabName;
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
  const [dashTab, setDashTab] = useState<DashTabName>(initialTab);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promo, setPromo] = useState<PromoSubmissionState | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoUrlInput, setPromoUrlInput] = useState("");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const promoFetchStarted = useRef(false);

  useEffect(() => {
    if (dashTab !== "promo" || !loggedInUsername || promoFetchStarted.current) return;
    promoFetchStarted.current = true;
    fetch("/api/promo")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) setPromo(data.submission);
        else setPromoError(data?.error ?? null);
      })
      .catch(() => setPromoError(locale === "en" ? "Could not load today's code." : "Não deu pra carregar o código de hoje."));
  }, [dashTab, loggedInUsername, locale]);

  async function handleSubmitPromo() {
    setPromoSubmitting(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postUrl: promoUrlInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? (locale === "en" ? "Could not submit." : "Não deu pra enviar."));
        return;
      }
      setPromo((prev) => (prev ? { ...prev, postUrl: promoUrlInput.trim(), status: "submitted" } : prev));
      setPromoUrlInput("");
    } finally {
      setPromoSubmitting(false);
    }
  }

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
    setLoading(true);
    setTopupError(null);
    try {
      const amountBrlCents = Math.round(amountBrl * 100);
      const res = await fetch("/api/store/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountBrlCents }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.checkoutUrl) {
        setTopupError(data?.error ?? t.genericTopupError);
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

  async function handleBuyPackage(packageKey: string) {
    if (!selectedCharacter) {
      setTopupError(t.chooseCharFirst);
      return;
    }
    setLoading(true);
    setTopupError(null);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageKey, characterSerial: selectedCharacter, quantity: 1 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setTopupError(data?.error ?? t.genericPurchaseError);
        return;
      }
      setTopupError(t.delivered);
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
          <TabIcon name="shop" />
          <span>{t.tabShop}</span>
        </button>
        <button className={dashTab === "topup" ? "active" : ""} onClick={() => setDashTab("topup")} type="button">
          <TabIcon name="topup" />
          <span>{t.tabTopup}</span>
        </button>
        <button className={dashTab === "packages" ? "active" : ""} onClick={() => setDashTab("packages")} type="button">
          <TabIcon name="packages" />
          <span>{t.tabPackages}</span>
        </button>
        <button className={dashTab === "orders" ? "active" : ""} onClick={() => setDashTab("orders")} type="button">
          <TabIcon name="orders" />
          <span>{t.tabOrders}</span>
        </button>
        <button className={dashTab === "character" ? "active" : ""} onClick={() => setDashTab("character")} type="button">
          <TabIcon name="character" />
          <span>{t.tabChar}</span>
        </button>
        <button className={dashTab === "promo" ? "active" : ""} onClick={() => setDashTab("promo")} type="button">
          <TabIcon name="promo" />
          <span>{t.tabPromo}</span>
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
                    const currencyDisplay = CURRENCY_SHOP_ITEMS[p.code];
                    const tooltip = currencyDisplay ? undefined : DONATE_ITEM_TOOLTIPS[p.code];
                    return (
                      <div className="gamecp-potion-row" key={p.code}>
                        {currencyDisplay ? (
                          <span className="gamecp-potion-icon gamecp-beginner-banner-dalant">{currencyDisplay.symbol}</span>
                        ) : p.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="gamecp-potion-icon" src={`/game-data/${p.icon}`} alt="" />
                        ) : (
                          <span className="gamecp-potion-icon gamecp-potion-icon-fallback">?</span>
                        )}
                        <strong className="gamecp-potion-name">{currencyDisplay?.label ?? p.name}</strong>
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
            <p>{t.packagesHint}</p>
          </div>
          {characters.length === 0 ? (
            <p className="store-error">{t.noChars}</p>
          ) : (
            <label className="gamecp-char-select gamecp-char-select-inline">
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
          {topupError && <p className="store-error">{topupError}</p>}
          <p className="gamecp-topup-premium-note">{t.packagesPremiumNote}</p>
          <div className="gamecp-topup-packages">
            {TOPUP_TIERS.map(({ amountBrl, name, color }) => {
              const items = topupBonusItems[amountBrl] ?? [];
              return (
                <div className="gamecp-topup-card gamecp-tier-card" key={amountBrl} style={{ ["--tier-color" as string]: color }}>
                  <div className="gamecp-tier-crate">
                    <TierCrate />
                  </div>
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
                    <p className="gamecp-topup-card-price">
                      <b>◈</b> {amountBrl.toLocaleString(numberLocale)} {t.gp}
                    </p>
                    <button
                      type="button"
                      className="gamecp-topup-card-buy"
                      disabled={loading}
                      onClick={() => handleBuyPackage(`topup_bonus_${amountBrl}`)}
                    >
                      {t.buy}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dashTab === "topup" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.topupTitle}</h2>
            <p>{t.topupHint}</p>
          </div>
          {topupError && <p className="store-error">{topupError}</p>}
          <div className="gamecp-topup-packages gamecp-topup-packages-gp">
            {TOPUP_GP_TIERS.map(({ amountBrl, bonusPercent }) => {
              const totalGp = Math.round(amountBrl * GP_PER_REAL * (1 + bonusPercent / 100));
              return (
                <div className="gamecp-topup-card" key={amountBrl} style={{ ["--tier-color" as string]: "var(--cyan)" }}>
                  <div className="gamecp-topup-card-badge">◈</div>
                  {bonusPercent > 0 && <span className="gamecp-topup-bonus-badge">+{bonusPercent}% bônus</span>}
                  <div className="gamecp-topup-card-foot">
                    <p className="gamecp-topup-card-price">R$ {amountBrl}</p>
                    <p className="gamecp-topup-card-gp">
                      <b>◈</b> {totalGp.toLocaleString(numberLocale)} {t.gp}
                    </p>
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
        </div>
      )}

      {dashTab === "orders" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.ordersTitle}</h2>
            <p>{t.ordersHint}</p>
          </div>
          {orders.length === 0 ? (
            <p className="store-error">{t.noOrders}</p>
          ) : (
            <div className="gamecp-orders-table">
              <div className="gamecp-orders-row gamecp-orders-head">
                <span>{t.orderDate}</span>
                <span>{t.orderType}</span>
                <span>{t.orderValue}</span>
                <span>{t.orderStatus}</span>
              </div>
              {orders.map((o) => {
                const statusKey =
                  o.status === "paid"
                    ? "orderStatusPaid"
                    : o.status === "failed"
                      ? "orderStatusFailed"
                      : o.status === "refunded"
                        ? "orderStatusRefunded"
                        : "orderStatusPending";
                return (
                  <div className="gamecp-orders-row" key={o.id}>
                    <span>{o.createdAt ? new Date(o.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}</span>
                    <span>{o.kind === "topup" ? t.orderKindTopup : t.orderKindPackage}</span>
                    <span>
                      {o.kind === "topup"
                        ? `R$ ${((o.amountBrlCents ?? 0) / 100).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}`
                        : o.gpPrice !== null
                          ? `${o.gpPrice.toLocaleString(numberLocale)} ${t.gp}${o.packageName ? ` (${o.packageName})` : ""}`
                          : "—"}
                    </span>
                    <span className={`gamecp-orders-status gamecp-orders-status-${o.status}`}>{t[statusKey]}</span>
                  </div>
                );
              })}
            </div>
          )}
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

      {dashTab === "promo" && (
        <div className="gamecp-panel">
          <div className="gamecp-panel-head">
            <h2>{t.promoTitle}</h2>
            <p>{t.promoHint}</p>
          </div>
          {!loggedInUsername ? (
            <p className="store-error">{t.promoNeedLogin}</p>
          ) : (
            <>
              <p className="gamecp-topup-premium-note">{t.promoRewardNote}</p>
              <div className="gamecp-promo-group">
                <span className="mini-label">{t.promoGroupLabel}</span>
                <div className="gamecp-promo-group-list">
                  {PROMO_GROUP_URLS.map((g) => (
                    <a key={g.url} href={g.url} target="_blank" rel="noreferrer" className="btn btn-ghost">
                      {g.label}
                    </a>
                  ))}
                </div>
              </div>
              {!promo && !promoError ? (
                <p className="store-message">{t.promoLoading}</p>
              ) : promo ? (
                <>
                  <div className="gamecp-promo-code">
                    <span className="mini-label">{t.promoCodeLabel}</span>
                    <strong>{promo.dailyCode}</strong>
                    <small>{t.promoCodeHint}</small>
                  </div>
                  {promo.postUrl ? (
                    <p className={promo.status === "rejected" ? "store-error" : "store-message"}>
                      {t.promoAlreadySent}{" "}
                      {promo.status === "approved" ? t.promoApproved : promo.status === "rejected" ? t.promoRejected : t.promoPendingReview}
                      <br />
                      {t.promoSentLink}{" "}
                      <a href={promo.postUrl} target="_blank" rel="noreferrer">
                        {promo.postUrl}
                      </a>
                    </p>
                  ) : (
                    <div className="gamecp-promo-form">
                      <label>
                        <span className="mini-label">{t.promoLinkLabel}</span>
                        <input
                          type="url"
                          value={promoUrlInput}
                          onChange={(e) => setPromoUrlInput(e.target.value)}
                          placeholder={t.promoLinkPlaceholder}
                        />
                      </label>
                      {promoError && <p className="store-error">{promoError}</p>}
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={promoSubmitting || !promoUrlInput.trim()}
                        onClick={handleSubmitPromo}
                      >
                        {t.promoSubmit}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                promoError && <p className="store-error">{promoError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
