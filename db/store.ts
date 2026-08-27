import { eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { donationPackages, walletLedger, walletBalances, orders, deliveries } from "./schema";
import { siteConfig } from "../app/config/site";

type Db = Awaited<ReturnType<typeof getDb>>;

let bootstrapped = false;

// Loja de doações: pacotes de cash (dinheiro real via Asaas), carteira (GP)
// e a fila de entrega pro personagem (consumida pela Fase 2, ainda não
// implementada — WorldServer precisa de código novo em C++ pra entregar
// item de fora do processo). Preços e cash sempre em inteiro (centavos pro
// preço, unidades de cash pro valor), nunca float.
async function ensureStoreSchema(db: Db) {
  if (bootstrapped) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS donation_packages (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_brl_cents INTEGER NOT NULL,
    cash_amount INTEGER NOT NULL,
    stock_total INTEGER NOT NULL,
    stock_remaining INTEGER NOT NULL,
    visible_to_players BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL
  )`);
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
    cash_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL,
    delivered_at TEXT
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries (status)`);
  await seedPackages(db);
  bootstrapped = true;
}

const PACKAGE_SEED = [
  { key: "pack_150", name: "Pacote 150", priceBrlCents: 15000 },
  { key: "pack_300", name: "Pacote 300", priceBrlCents: 30000 },
  { key: "pack_500", name: "Pacote 500", priceBrlCents: 50000 },
];

async function seedPackages(db: Db) {
  const [existing] = await db.select({ id: donationPackages.id }).from(donationPackages).limit(1);
  if (existing) return;

  for (const p of PACKAGE_SEED) {
    const cashAmount = Math.round((p.priceBrlCents / 100) * siteConfig.cashPerReal);
    await db.insert(donationPackages).values({
      key: p.key,
      name: p.name,
      priceBrlCents: p.priceBrlCents,
      cashAmount,
      stockTotal: 100,
      stockRemaining: 100,
      visibleToPlayers: false,
    });
  }
}

export type DonationPackage = typeof donationPackages.$inferSelect;

// `includeHidden` só deve vir true quando o chamador já confirmou sessão de
// equipe — pacotes com visible_to_players=false não podem aparecer pra
// jogador comum.
export async function listDonationPackages(includeHidden: boolean): Promise<DonationPackage[]> {
  const db = await getDb();
  await ensureStoreSchema(db);
  const rows = await db.select().from(donationPackages).orderBy(donationPackages.priceBrlCents);
  return includeHidden ? rows : rows.filter((r) => r.visibleToPlayers);
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

export type PurchaseResult = { ok: true; deliveryId: number } | { ok: false; error: string };

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
        cashAmount: pkg.cashAmount,
        status: "queued",
      })
      .returning({ id: deliveries.id });

    return { ok: true, deliveryId: delivery.id };
  });
}
