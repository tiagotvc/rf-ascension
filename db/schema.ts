import { boolean, index, integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";

const timestamp = () =>
  text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString());

const updatedAtTimestamp = () =>
  text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString());

export const forumTopics = pgTable(
  "forum_topics",
  {
    id: serial("id").primaryKey(),
    forumSlug: text("forum_slug").notNull(),
    title: text("title").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    commentsAllowed: boolean("comments_allowed").notNull().default(true),
    createdAt: timestamp(),
  },
  (table) => ({
    forumSlugIdx: index("forum_topics_forum_slug_idx").on(table.forumSlug),
  })
);

export const forumPosts = pgTable(
  "forum_posts",
  {
    id: serial("id").primaryKey(),
    topicId: integer("topic_id")
      .notNull()
      .references(() => forumTopics.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    createdAt: timestamp(),
  },
  (table) => ({
    topicIdIdx: index("forum_posts_topic_id_idx").on(table.topicId),
  })
);

// Loja de doações — preços sempre em centavos (nunca float). `cashAmount`
// é Cash REAL do jogo (loja nativa RF Online, tbl_UserStatus.Cash na base
// BILLING — Fase 3), creditado via CStoreDeliveryChannel opcode 3/4 — é
// RECOMPENSA, não custo. `gpPrice` é o que de fato é debitado da carteira
// GP do site (wallet_balances) pra comprar o pacote — conversão reta de
// priceBrlCents (cashPerReal, sem o bônus que cashAmount carrega). Nunca
// usar cashAmount como preço de novo — bug real corrigido nesta sessão:
// comprar chegou a debitar exatamente o mesmo tanto de Cash que o pacote
// devolvia. `visibleToPlayers` é o único controle de visibilidade: enquanto
// false, só quem tem sessão de equipe vê o pacote em /gamecp.
export const donationPackages = pgTable("donation_packages", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  priceBrlCents: integer("price_brl_cents").notNull(),
  gpPrice: integer("gp_price").notNull().default(0),
  cashAmount: integer("cash_amount").notNull(),
  // Legado da Fase 2 (1 item só por pacote) — mantido só pra não quebrar a
  // coluna NOT NULL existente; a entrega real agora usa donation_package_items
  // (N itens por pacote). Não lido por nenhum código novo.
  itemCode: text("item_code").notNull(),
  stockTotal: integer("stock_total").notNull(),
  stockRemaining: integer("stock_remaining").notNull(),
  visibleToPlayers: boolean("visible_to_players").notNull().default(false),
  createdAt: timestamp(),
});

// N itens por pacote (Fase 3) — cada linha é 1 item real entregue na compra
// (bag ou correio, via CStoreDeliveryChannel). `label` é só pra exibição na
// loja (nome amigável do item, pode divergir do nome real do jogo).
export const donationPackageItems = pgTable(
  "donation_package_items",
  {
    id: serial("id").primaryKey(),
    packageId: integer("package_id")
      .notNull()
      .references(() => donationPackages.id, { onDelete: "cascade" }),
    itemCode: text("item_code").notNull(),
    amount: integer("amount").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp(),
  },
  (table) => ({
    packageIdIdx: index("donation_package_items_package_id_idx").on(table.packageId),
  })
);

// Fonte da verdade do saldo: append-only, nunca editado nem apagado.
// wallet_balances é só um cache derivado, atualizado na mesma transação
// que cada linha inserida aqui.
export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: serial("id").primaryKey(),
    accountUsername: text("account_username").notNull(),
    deltaCash: integer("delta_cash").notNull(),
    reason: text("reason").notNull(), // 'topup' | 'purchase' | 'refund'
    referenceId: integer("reference_id"),
    createdAt: timestamp(),
  },
  (table) => ({
    accountUsernameIdx: index("wallet_ledger_account_username_idx").on(table.accountUsername),
  })
);

export const walletBalances = pgTable("wallet_balances", {
  accountUsername: text("account_username").primaryKey(),
  balanceCash: integer("balance_cash").notNull().default(0),
  updatedAt: updatedAtTimestamp(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(), // 'topup' | 'package_purchase'
    accountUsername: text("account_username").notNull(),
    characterSerial: integer("character_serial"),
    characterName: text("character_name"),
    packageId: integer("package_id").references(() => donationPackages.id),
    amountBrlCents: integer("amount_brl_cents"),
    asaasPaymentId: text("asaas_payment_id"),
    status: text("status").notNull(), // 'pending' | 'paid' | 'failed' | 'refunded'
    createdAt: timestamp(),
    updatedAt: updatedAtTimestamp(),
  },
  (table) => ({
    accountUsernameIdx: index("orders_account_username_idx").on(table.accountUsername),
    asaasPaymentIdUnique: unique("orders_asaas_payment_id_unique").on(table.asaasPaymentId),
  })
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    accountUsername: text("account_username").notNull(),
    characterSerial: integer("character_serial").notNull(),
    characterName: text("character_name").notNull(),
    packageId: integer("package_id")
      .notNull()
      .references(() => donationPackages.id),
    itemCode: text("item_code").notNull(),
    cashAmount: integer("cash_amount").notNull(),
    status: text("status").notNull().default("queued"), // 'queued' | 'delivered' | 'failed'
    deliveryMethod: text("delivery_method"), // 'bag' | 'mail', preenchido quando delivered
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp(),
    deliveredAt: text("delivered_at"),
  },
  (table) => ({
    statusIdx: index("deliveries_status_idx").on(table.status),
  })
);

// Curadoria do admin sobre o catálogo completo de poções (exportado do
// Item.edf real via MapEditor, ver public/game-data/potions/catalog.json —
// nome/ícone vêm de lá, não daqui). Esta tabela só guarda QUAIS o admin
// decidiu vender e por qual preço em GP — uma linha só existe pra item
// habilitado.
export const potionShopItems = pgTable("potion_shop_items", {
  itemCode: text("item_code").primaryKey(),
  gpPrice: integer("gp_price").notNull(),
  category: text("category"), // livre, definida pelo admin ao marcar o item pra venda
  updatedAt: updatedAtTimestamp(),
});
