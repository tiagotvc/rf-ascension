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

// Loja de doações — preços e valores de cash sempre em centavos/unidades
// inteiras (nunca float), pra nunca ter erro de arredondamento em dinheiro
// real. `visibleToPlayers` é o único controle de visibilidade: enquanto
// false, só quem tem sessão de equipe vê o pacote em /doacao.
export const donationPackages = pgTable("donation_packages", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  priceBrlCents: integer("price_brl_cents").notNull(),
  cashAmount: integer("cash_amount").notNull(),
  stockTotal: integer("stock_total").notNull(),
  stockRemaining: integer("stock_remaining").notNull(),
  visibleToPlayers: boolean("visible_to_players").notNull().default(false),
  createdAt: timestamp(),
});

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
    cashAmount: integer("cash_amount").notNull(),
    status: text("status").notNull().default("queued"), // 'queued' | 'delivered' | 'failed'
    createdAt: timestamp(),
    deliveredAt: text("delivered_at"),
  },
  (table) => ({
    statusIdx: index("deliveries_status_idx").on(table.status),
  })
);
