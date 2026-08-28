import { timingSafeEqual } from "node:crypto";
import { listQueuedDeliveries, recordDeliveryAttempt } from "../../../../db/store";
import { deliverPackage } from "../../../lib/game-account";

// Retry das entregas que ficaram 'queued' (WorldServer fora do ar na hora
// da compra, etc.) — chamado pelo Vercel Cron (ver vercel.json). Vercel
// manda "Authorization: Bearer $CRON_SECRET" automaticamente quando essa
// env var existe; confere isso pra ninguém de fora conseguir martelar essa
// rota (mesmo que não role dinheiro, evita bater sem parar no WorldServer).
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return Response.json({ error: "CRON_SECRET não configurado." }, { status: 500 });
  }

  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const queued = await listQueuedDeliveries(25);
  let delivered = 0;
  let stillQueued = 0;

  for (const item of queued) {
    const result = await deliverPackage(item.characterSerial, item.accountUsername, item.cashAmount, item.items);
    const method: "bag" | "mail" = result.itemStatuses.includes("mail") ? "mail" : "bag";
    await recordDeliveryAttempt(item.id, result.ok ? { delivered: true, method } : { delivered: false });
    if (result.ok) delivered++;
    else stillQueued++;
  }

  return Response.json({ ok: true, processed: queued.length, delivered, stillQueued });
}
