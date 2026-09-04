import { getSessionUser } from "../../../lib/auth";
import { savePotionShopSelections } from "../../../../db/potion-shop";

const MAX_GP_PRICE = 1_000_000;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Entre com a conta da equipe pra editar a loja." }, { status: 401 });
  }

  let payload: { selections?: { itemCode?: string; gpPrice?: number; category?: string | null }[] };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!Array.isArray(payload.selections)) {
    return Response.json({ error: "selections deve ser uma lista." }, { status: 400 });
  }

  const selections: { itemCode: string; gpPrice: number; category: string | null }[] = [];
  for (const entry of payload.selections) {
    const itemCode = entry.itemCode?.trim();
    const gpPrice = entry.gpPrice;
    if (!itemCode || !Number.isInteger(gpPrice) || (gpPrice as number) < 0 || (gpPrice as number) > MAX_GP_PRICE) {
      return Response.json({ error: `Preço inválido pro item ${itemCode ?? "?"}.` }, { status: 400 });
    }
    const category = typeof entry.category === "string" ? entry.category.trim().slice(0, 60) || null : null;
    selections.push({ itemCode, gpPrice: gpPrice as number, category });
  }

  await savePotionShopSelections(selections);
  return Response.json({ ok: true, count: selections.length });
}
