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
  // gp_price = quanto é debitado da carteira GP pra comprar (conversão reta,
  // sem bônus) — DISTINTO de cash_amount (Cash real entregue no jogo, com
  // bônus). Nunca usar cash_amount como preço — bug real já corrigido aqui.
  await db.execute(sql`ALTER TABLE donation_packages ADD COLUMN IF NOT EXISTS gp_price INTEGER NOT NULL DEFAULT 0`);
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
// (não lido). Sem itens: o pacote só credita Cash de verdade do jogo — os
// itens em si o jogador compra no Cash Shop nativo do RF Online com esse
// Cash, não aqui no site. gpPrice segue a mesma taxa do top-up (R$1 = 1.000
// GP), sem bônus; cashAmount é o valor de Cash entregue, com o bônus
// crescente nas faixas maiores.
type PackageSeedItem = { itemCode: string; amount: number; label: string };
const PACKAGE_SEED: { key: string; name: string; priceBrlCents: number; gpPrice: number; cashAmount: number; items: PackageSeedItem[] }[] = [
  {
    key: "pack_50",
    name: "Pacote Season Setembro 01",
    priceBrlCents: 5000,
    gpPrice: 50000,
    cashAmount: 50000,
    items: [],
  },
  {
    key: "pack_100",
    name: "Pacote Season Setembro 02",
    priceBrlCents: 10000,
    gpPrice: 100000,
    cashAmount: 105000,
    items: [],
  },
  {
    key: "pack_150",
    name: "Pacote Season Setembro 03",
    priceBrlCents: 15000,
    gpPrice: 150000,
    cashAmount: 160000,
    items: [],
  },
  {
    key: "pack_300",
    name: "Pacote Season Setembro 04",
    priceBrlCents: 30000,
    gpPrice: 300000,
    cashAmount: 345000,
    items: [],
  },
  {
    key: "pack_500",
    name: "Pacote Season Setembro 05",
    priceBrlCents: 50000,
    gpPrice: 500000,
    cashAmount: 600000,
    items: [],
  },
  {
    key: "pack_1000",
    name: "Pacote Season Setembro 06",
    priceBrlCents: 100000,
    gpPrice: 1000000,
    cashAmount: 1500000,
    items: [],
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
      if (
        !row ||
        row.visibleToPlayers !== true ||
        row.name !== p.name ||
        row.gpPrice !== p.gpPrice ||
        row.cashAmount !== p.cashAmount
      )
        return false;
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
              gpPrice: p.gpPrice,
              cashAmount: p.cashAmount,
              itemCode,
              stockTotal: 999999,
              stockRemaining: 999999,
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
          gpPrice: p.gpPrice,
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

const MAX_PURCHASE_QUANTITY = 20;

// Gasta saldo (GP) já existente na carteira — não fala com a Asaas nessa
// etapa. Cobra `gpPrice * quantity` (preço real em GP, conversão reta sem
// bônus — NUNCA cashAmount, que é a recompensa em Cash com bônus, não o
// custo). `allowHidden` só deve vir true quando o chamador já confirmou
// sessão de equipe (pacote ainda não visível pra jogador comum).
export async function purchasePackage(
  accountUsername: string,
  characterSerial: number,
  characterName: string,
  packageKey: string,
  quantity: number,
  allowHidden: boolean
): Promise<PurchaseResult> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PURCHASE_QUANTITY) {
    return { ok: false, error: `Quantidade inválida (1 a ${MAX_PURCHASE_QUANTITY}).` };
  }

  const db = await getDb();
  await ensureStoreSchema(db);
  return db.transaction(async (tx) => {
    const [pkg] = await tx.select().from(donationPackages).where(eq(donationPackages.key, packageKey)).for("update");
    if (!pkg) return { ok: false, error: "Pacote não encontrado." };
    if (!pkg.visibleToPlayers && !allowHidden) return { ok: false, error: "Pacote não disponível." };
    if (pkg.stockRemaining < quantity) return { ok: false, error: "Sem estoque suficiente desse pacote." };

    const totalGpCost = pkg.gpPrice * quantity;
    const totalCashReward = pkg.cashAmount * quantity;

    const [wallet] = await tx
      .select()
      .from(walletBalances)
      .where(eq(walletBalances.accountUsername, accountUsername))
      .for("update");
    const balance = wallet?.balanceCash ?? 0;
    if (balance < totalGpCost) return { ok: false, error: "Saldo insuficiente." };

    const items = await tx.select().from(donationPackageItems).where(eq(donationPackageItems.packageId, pkg.id));

    await tx
      .update(donationPackages)
      .set({ stockRemaining: pkg.stockRemaining - quantity })
      .where(eq(donationPackages.id, pkg.id));
    await tx.insert(walletLedger).values({
      accountUsername,
      deltaCash: -totalGpCost,
      reason: "purchase",
      referenceId: null,
    });
    await tx
      .update(walletBalances)
      .set({ balanceCash: sql`${walletBalances.balanceCash} - ${totalGpCost}`, updatedAt: new Date().toISOString() })
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
        cashAmount: totalCashReward,
        status: "queued",
      })
      .returning({ id: deliveries.id });

    return {
      ok: true,
      deliveryId: delivery.id,
      characterSerial,
      accountUsername,
      cashAmount: totalCashReward,
      items: items.map((i) => ({ itemCode: i.itemCode, amount: i.amount * quantity })),
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

// Taxas de troca GP -> moeda real (Fase 5, aba Recarregar). Confirmadas com o usuário: 1 GP = 1
// Cash (mesma base que os pacotes já usam), 1 GP = 1.000.000 Dalant, 1 GP = 25 Gold Point. São só
// constantes — fácil de trocar depois se o balanceamento mudar.
export const EXCHANGE_RATES = {
  cash: 1,
  dalant: 1_000_000,
  goldpoint: 25,
} as const;

export type ExchangeCurrency = keyof typeof EXCHANGE_RATES;

// Debita GP da carteira — mesmo lock/transação de purchasePackage. `reason` vai pro ledger só pra
// auditoria (ex. "exchange:dalant"). Retorna erro sem debitar nada se o saldo não bater.
export async function spendGp(accountUsername: string, gpAmount: number, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  await ensureStoreSchema(db);
  return db.transaction(async (tx) => {
    const [wallet] = await tx.select().from(walletBalances).where(eq(walletBalances.accountUsername, accountUsername)).for("update");
    const balance = wallet?.balanceCash ?? 0;
    if (balance < gpAmount) return { ok: false, error: "Saldo insuficiente." };

    await tx.insert(walletLedger).values({ accountUsername, deltaCash: -gpAmount, reason, referenceId: null });
    await tx
      .update(walletBalances)
      .set({ balanceCash: sql`${walletBalances.balanceCash} - ${gpAmount}`, updatedAt: new Date().toISOString() })
      .where(eq(walletBalances.accountUsername, accountUsername));

    return { ok: true };
  });
}

// Devolve GP pra carteira — usado quando o débito já aconteceu (spendGp) mas a entrega real da
// moeda no jogo falhou (WorldServer fora do ar, etc.), pra não ficar com o débito sem nada em troca
// (diferente de purchasePackage, que tem fila de retry — troca de moeda hoje é síncrona, sem fila).
export async function refundGp(accountUsername: string, gpAmount: number, reason: string): Promise<void> {
  const db = await getDb();
  await ensureStoreSchema(db);
  await db.transaction(async (tx) => {
    await tx.insert(walletLedger).values({ accountUsername, deltaCash: gpAmount, reason, referenceId: null });
    await tx
      .insert(walletBalances)
      .values({ accountUsername, balanceCash: gpAmount })
      .onConflictDoUpdate({
        target: walletBalances.accountUsername,
        set: { balanceCash: sql`${walletBalances.balanceCash} + ${gpAmount}`, updatedAt: new Date().toISOString() },
      });
  });
}
