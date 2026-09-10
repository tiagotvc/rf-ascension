import type { listDonationPackages } from "../../db/store";

export type TopupBonusItem = { itemCode: string; amount: number; label: string };

// Os 4 pacotes-molde topup_bonus_* (ver PACKAGE_SEED em db/store.ts) guardam só os itens de bônus
// de cada faixa de recarga — essa função extrai {R$ -> itens} pra exibir na Recarregar.
export function extractTopupBonusItems(
  packages: Awaited<ReturnType<typeof listDonationPackages>>
): Record<number, TopupBonusItem[]> {
  const byAmount: Record<number, TopupBonusItem[]> = {};
  for (const pkg of packages) {
    const match = pkg.key.match(/^topup_bonus_(\d+)$/);
    if (!match) continue;
    byAmount[Number(match[1])] = pkg.items.map((i) => ({ itemCode: i.itemCode, amount: i.amount, label: i.label }));
  }
  return byAmount;
}
