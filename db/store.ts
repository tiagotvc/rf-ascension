import { eq, sql, inArray } from "drizzle-orm";
import { getDb } from "./index";
import { donationPackages, donationPackageItems, walletLedger, walletBalances, orders, deliveries } from "./schema";
import { siteConfig } from "../app/config/site";

type Db = Awaited<ReturnType<typeof getDb>>;

let bootstrapped = false;

// Loja de doações: pacotes reais (item + Cash de verdade do jogo, Fase 3),
// carteira (GP, usada só pra "pagar" o pacote dentro do site) e a fila de
// entrega pro personagem via CStoreDeliveryChannel (WorldServer, opcode
// 3/4). Preços e cash sempre em inteiro (centavos pro preço, unidades de
// Cash pro valor), nunca float.
async function ensureStoreSchema(db: Db) {
  if (bootstrapped) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS donation_packages (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_brl_cents INTEGER NOT NULL,
    cash_amount INTEGER NOT NULL,
    item_code TEXT NOT NULL DEFAULT 'iwswb55',
    stock_total INTEGER NOT NULL,
    stock_remaining INTEGER NOT NULL,
    visible_to_players BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL
  )`);
  await db.execute(sql`ALTER TABLE donation_packages ADD COLUMN IF NOT EXISTS item_code TEXT NOT NULL DEFAULT 'iwswb55'`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS donation_package_items (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES donation_packages(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    amount INTEGER NOT NULL,
    label TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS donation_package_items_package_id_idx ON donation_package_items (package_id)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS wallet_ledger (
    id SERIAL PRIMARY KEY,
    account_username TEXT NOT NULL,
    delta_cash INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id INTEGER,
    created_at TEXT NOT NULL
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS wallet_ledger_account_username_idx ON wallet_ledger (account_username)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS wallet_balances (
    account_username TEXT PRIMARY KEY,
    balance_cash INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    kind TEXT NOT NULL,
    account_username TEXT NOT NULL,
    character_serial INTEGER,
    character_name TEXT,
    package_id INTEGER REFERENCES donation_packages(id),
    amount_brl_cents INTEGER,
    asaas_payment_id TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS orders_asaas_payment_id_unique ON orders (asaas_payment_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_account_username_idx ON orders (account_username)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    account_username TEXT NOT NULL,
    character_serial INTEGER NOT NULL,
    character_name TEXT NOT NULL,
    package_id INTEGER NOT NULL REFERENCES donation_packages(id),
    item_code TEXT NOT NULL DEFAULT 'iwswb55',
    cash_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    delivery_method TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    delivered_at TEXT
  )`);
  await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS item_code TEXT NOT NULL DEFAULT 'iwswb55'`);
  await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_method TEXT`);
  await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries (status)`);
  await seedPackages(db);
  bootstrapped = true;
}

// Pacotes reais (Fase 3) — item_code de donation_packages fica legado
// (não lido); a entrega real usa PACKAGE_SEED[].items abaixo, uma linha por
// item real em donation_package_items. Cash é Cash de verdade do jogo
// (loja nativa RF Online), não a carteira GP do site.
const PACKAGE_SEED = [
  {
    key: "pack_50",
    name: "Pacote 50",
    priceBrlCents: 5000,
    cashAmount: 55000,
    items: [
      { itemCode: "irgn0029", amount: 1, label: "Jade Premium (30 Dias)" },
      { itemCode: "irchm01", amount: 1, label: "Wrapping Charm" },
      { itemCode: "ipupr01", amount: 1, label: "Upgrade Protection Potion" },
      { itemCode: "iwspu10", amount: 1, label: "Speed Knife Tier 1" },
      { itemCode: "iywml01", amount: 2, label: "Watermelon" },
    ],
  },
  {
    key: "pack_150",
    name: "Pacote 150",
    priceBrlCents: 15000,
    cashAmount: 170000,
    items: [
      { itemCode: "irgn0029", amount: 1, label: "Jade Premium (30 Dias)" },
      { itemCode: "irchm02", amount: 1, label: "Trading Charm" },
      { itemCode: "iwspu11", amount: 1, label: "Speed Knife Tier 2" },
      { itemCode: "ipupr01", amount: 3, label: "Upgrade Protection Potion" },
      { itemCode: "irunv04", amount: 255, label: "Evolution Stone [Highest]" },
      { itemCode: "irrc02", amount: 2, label: "Superior Recipe" },
      { itemCode: "iywml01", amount: 3, label: "Watermelon" },
    ],
  },
  {
    key: "pack_250",
    name: "Pacote 250",
    priceBrlCents: 25000,
    cashAmount: 320000,
    items: [
      { itemCode: "irgn0029", amount: 1, label: "Jade Premium (30 Dias)" },
      { itemCode: "iwspu12", amount: 1, label: "Speed Knife Tier 3" },
      { itemCode: "irchm63", amount: 1, label: "All in One Charm" },
      { itemCode: "ipupr01", amount: 5, label: "Upgrade Protection Potion" },
      { itemCode: "irunv04", amount: 765, label: "Evolution Stone [Highest]" },
      { itemCode: "irrc02", amount: 4, label: "Superior Recipe" },
      { itemCode: "iywml01", amount: 5, label: "Watermelon" },
    ],
  },
];

async function seedPackages(db: Db) {
  const existing = await db.select().from(donationPackages);
  const existingItems =
    existing.length > 0
      ? await db
          .select()
          .from(donationPackageItems)
          .where(
            inArray(
              donationPackageItems.packageId,
              existing.map((r) => r.id)
            )
          )
      : [];
  const isCurrent =
    existing.length === PACKAGE_SEED.length &&
    PACKAGE_SEED.every((p) => {
      const row = existing.find((r) => r.key === p.key);
      if (!row || row.visibleToPlayers !== true) return false;
      const rowItems = existingItems.filter((i) => i.packageId === row.id);
      if (rowItems.length !== p.items.length) return false;
      return p.items.every((expected) =>
        rowItems.some(
          (i) => i.itemCode === expected.itemCode && i.amount === expected.amount && i.label === expected.label
        )
      );
    });
  if (isCurrent) return;

  // Faz upsert por `key` em vez de apagar e recriar tudo: preserva
  // stockRemaining dos pacotes que já existiam (pode ter compra de teste da
  // equipe), só substitui de fato os itens (não carregam estoque, seguro
  // recriar) e os campos de catálogo (nome/preço/cash/visibilidade). Pacotes
  // que saíram do PACKAGE_SEED (versão antiga de teste) são removidos.
  const expectedKeys = new Set(PACKAGE_SEED.map((p) => p.key));
  const stale = existing.filter((r) => !expectedKeys.has(r.key));
  if (stale.length > 0) {
    await db.delete(donationPackages).where(
      inArray(
        donationPackages.id,
        stale.map((r) => r.id)
      )
    );
  }

  for (const p of PACKAGE_SEED) {
    const row = existing.find((r) => r.key === p.key);
    const itemCode = p.items[0]?.itemCode ?? "iwswb55";
    const packageId = row
      ? row.id
      : (
          await db
            .insert(donationPackages)
            .values({
              key: p.key,
              name: p.name,
              priceBrlCents: p.priceBrlCents,
              cashAmount: p.cashAmount,
              itemCode,
              stockTotal: 100,
              stockRemaining: 100,
              visibleToPlayers: true,
            })
            .returning({ id: donationPackages.id })
        )[0].id;

    if (row) {
      await db
        .update(donationPackages)
        .set({
          name: p.name,
          priceBrlCents: p.priceBrlCents,
          cashAmount: p.cashAmount,
          itemCode,
          visibleToPlayers: true,
        })
        .where(eq(donationPackages.id, packageId));
      await db.delete(donationPackageItems).where(eq(donationPackageItems.packageId, packageId));
    }

    for (const item of p.items) {
      await db.insert(donationPackageItems).values({
        packageId,
        itemCode: item.itemCode,
        amount: item.amount,
        label: item.label,
      });
    }
  }
}

export type DonationPackage = typeof donationPackages.$inferSelect;
export type DonationPackageItem = typeof donationPackageItems.$inferSelect;
export type DonationPackageWithItems = DonationPackage & { items: DonationPackageItem[] };

// `includeHidden` só deve vir true quando o chamador já confirmou sessão de
// equipe — pacotes com visible_to_players=false não podem aparecer pra
// jogador comum.
export async function listDonationPackages(includeHidden: boolean): Promise<DonationPackageWithItems[]> {
  const db = await getDb();
  await ensureStoreSchema(db);
  const rows = await db.select().from(donationPackages).orderBy(donationPackages.priceBrlCents);
  const visible = includeHidden ? rows : rows.filter((r) => r.visibleToPlayers);
  if (visible.length === 0) return [];

  const items = await db
    .select()
    .from(donationPackageItems)
    .where(
      inArray(
        donationPackageItems.packageId,
        visible.map((r) => r.id)
      )
    );
  return visible.map((pkg) => ({ ...pkg, items: items.filter((i) => i.packageId === pkg.id) }));
}

export async function getWalletBalance(accountUsername: string): Promise<number> {
  const db = await getDb();
  await ensureStoreSchema(db);
  const [row] = await db
    .select({ balance: walletBalances.balanceCash })
    .from(walletBalances)
    .where(eq(walletBalances.accountUsername, accountUsername));
  return row?.balance ?? 0;
}

export async function createTopupOrder(accountUsername: string, amountBrlCents: number): Promise<number> {
  const db = await getDb();
  await ensureStoreSchema(db);
  const [order] = await db
    .insert(orders)
    .values({ kind: "topup", accountUsername, amountBrlCents, status: "pending" })
    .returning({ id: orders.id });
  return order.id;
}

export async function setOrderAsaasReference(orderId: number, asaasPaymentId: string): Promise<void> {
  const db = await getDb();
  await ensureStoreSchema(db);
  await db
    .update(orders)
    .set({ asaasPaymentId, updatedAt: new Date().toISOString() })
    .where(eq(orders.id, orderId));
}

// Chamado só pelo webhook, depois de reconfirmar o pagamento direto na API
// da Asaas (nunca confiar só no corpo do webhook). Idempotente: se a order
// já estiver 'paid', não credita de novo — trava a linha (FOR UPDATE) pra
// evitar corrida caso o mesmo webhook chegue em paralelo. `paidValueBrlCents`
// tem que bater exatamente com o valor da order — proteção extra contra
// qualquer jeito de um payment_id real, mas de valor diferente do
// esperado, acabar creditando a order errada.
export async function confirmTopupPayment(
  orderId: number,
  asaasPaymentId: string,
  paidValueBrlCents: number
): Promise<{ credited: boolean }> {
  const db = await getDb();
  await ensureStoreSchema(db);
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (
      !order ||
      order.kind !== "topup" ||
      order.status === "paid" ||
      !order.amountBrlCents ||
      order.amountBrlCents !== paidValueBrlCents
    ) {
      return { credited: false };
    }

    const cashAmount = Math.round((order.amountBrlCents / 100) * siteConfig.cashPerReal);

    await tx
      .update(orders)
      .set({ status: "paid", asaasPaymentId, updatedAt: new Date().toISOString() })
      .where(eq(orders.id, orderId));
    await tx.insert(walletLedger).values({
      accountUsername: order.accountUsername,
      deltaCash: cashAmount,
      reason: "topup",
      referenceId: orderId,
    });
    await tx
      .insert(walletBalances)
      .values({ accountUsername: order.accountUsername, balanceCash: cashAmount })
      .onConflictDoUpdate({
        target: walletBalances.accountUsername,
        set: { balanceCash: sql`${walletBalances.balanceCash} + ${cashAmount}`, updatedAt: new Date().toISOString() },
      });

    return { credited: true };
  });
}

export type PurchaseResult =
  | {
      ok: true;
      deliveryId: number;
      characterSerial: number;
      accountUsername: string;
      cashAmount: number;
      items: { itemCode: string; amount: number }[];
    }
  | { ok: false; error: string };

// Gasta saldo (GP) já existente na carteira — não fala com a Asaas nessa
// etapa. `allowHidden` só deve vir true quando o chamador já confirmou
// sessão de equipe (pacote ainda não visível pra jogador comum).
export async function purchasePackage(
  accountUsername: string,
  characterSerial: number,
  characterName: string,
  packageKey: string,
  allowHidden: boolean
): Promise<PurchaseResult> {
  const db = await getDb();
  await ensureStoreSchema(db);
  return db.transaction(async (tx) => {
    const [pkg] = await tx.select().from(donationPackages).where(eq(donationPackages.key, packageKey)).for("update");
    if (!pkg) return { ok: false, error: "Pacote não encontrado." };
    if (!pkg.visibleToPlayers && !allowHidden) return { ok: false, error: "Pacote não disponível." };
    if (pkg.stockRemaining <= 0) return { ok: false, error: "Sem estoque desse pacote." };

    const [wallet] = await tx
      .select()
      .from(walletBalances)
      .where(eq(walletBalances.accountUsername, accountUsername))
      .for("update");
    const balance = wallet?.balanceCash ?? 0;
    if (balance < pkg.cashAmount) return { ok: false, error: "Saldo insuficiente." };

    const items = await tx.select().from(donationPackageItems).where(eq(donationPackageItems.packageId, pkg.id));

    await tx
      .update(donationPackages)
      .set({ stockRemaining: pkg.stockRemaining - 1 })
      .where(eq(donationPackages.id, pkg.id));
    await tx.insert(walletLedger).values({
      accountUsername,
      deltaCash: -pkg.cashAmount,
      reason: "purchase",
      referenceId: null,
    });
    await tx
      .update(walletBalances)
      .set({ balanceCash: sql`${walletBalances.balanceCash} - ${pkg.cashAmount}`, updatedAt: new Date().toISOString() })
      .where(eq(walletBalances.accountUsername, accountUsername));

    const [order] = await tx
      .insert(orders)
      .values({
        kind: "package_purchase",
        accountUsername,
        characterSerial,
        characterName,
        packageId: pkg.id,
        status: "paid",
      })
      .returning({ id: orders.id });

    const [delivery] = await tx
      .insert(deliveries)
      .values({
        orderId: order.id,
        accountUsername,
        characterSerial,
        characterName,
        packageId: pkg.id,
        // Legado da Fase 2 (1 item só) — coluna NOT NULL sem uso real agora, os itens de verdade
        // vêm de donation_package_items via packageId (ver listQueuedDeliveries).
        itemCode: "iwswb55",
        cashAmount: pkg.cashAmount,
        status: "queued",
      })
      .returning({ id: deliveries.id });

    return {
      ok: true,
      deliveryId: delivery.id,
      characterSerial,
      accountUsername,
      cashAmount: pkg.cashAmount,
      items: items.map((i) => ({ itemCode: i.itemCode, amount: i.amount })),
    };
  });
}

export type QueuedDelivery = {
  id: number;
  characterSerial: number;
  accountUsername: string;
  cashAmount: number;
  attempts: number;
  items: { itemCode: string; amount: number }[];
};

// Fila pro retry (cron) — entregas que ainda não confirmaram sucesso. Os
// itens são relidos de donation_package_items via packageId (fonte da
// verdade sempre atual), não guardados na própria delivery. Não reprocessa
// indefinidamente: para depois de MAX_DELIVERY_ATTEMPTS tentativas,
// marcando 'failed' pra investigação manual em vez de martelar o
// WorldServer pra sempre se algo estiver genuinamente errado.
const MAX_DELIVERY_ATTEMPTS = 20;

export async function listQueuedDeliveries(limit: number): Promise<QueuedDelivery[]> {
  const db = await getDb();
  await ensureStoreSchema(db);
  const rows = await db
    .select({
      id: deliveries.id,
      characterSerial: deliveries.characterSerial,
      accountUsername: deliveries.accountUsername,
      cashAmount: deliveries.cashAmount,
      attempts: deliveries.attempts,
      packageId: deliveries.packageId,
    })
    .from(deliveries)
    .where(eq(deliveries.status, "queued"))
    .limit(limit);
  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(donationPackageItems)
    .where(
      inArray(
        donationPackageItems.packageId,
        rows.map((r) => r.packageId)
      )
    );

  return rows.map((r) => ({
    id: r.id,
    characterSerial: r.characterSerial,
    accountUsername: r.accountUsername,
    cashAmount: r.cashAmount,
    attempts: r.attempts,
    items: items.filter((i) => i.packageId === r.packageId).map((i) => ({ itemCode: i.itemCode, amount: i.amount })),
  }));
}

// Chamado depois de CADA tentativa de entrega (sucesso ou falha) — sempre
// incrementa `attempts`; só marca 'delivered'/'failed' conforme o caso.
export async function recordDeliveryAttempt(
  deliveryId: number,
  result: { delivered: true; method: "bag" | "mail" } | { delivered: false }
): Promise<void> {
  const db = await getDb();
  await ensureStoreSchema(db);

  if (result.delivered) {
    await db
      .update(deliveries)
      .set({
        status: "delivered",
        deliveryMethod: result.method,
        deliveredAt: new Date().toISOString(),
        attempts: sql`${deliveries.attempts} + 1`,
      })
      .where(eq(deliveries.id, deliveryId));
    return;
  }

  const [row] = await db.select({ attempts: deliveries.attempts }).from(deliveries).where(eq(deliveries.id, deliveryId));
  const nextAttempts = (row?.attempts ?? 0) + 1;
  await db
    .update(deliveries)
    .set({
      attempts: nextAttempts,
      status: nextAttempts >= MAX_DELIVERY_ATTEMPTS ? "failed" : "queued",
    })
    .where(eq(deliveries.id, deliveryId));
}
