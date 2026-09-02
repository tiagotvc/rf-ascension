// Rate limit best-effort por IP real do visitante — a única camada que
// enxerga o atacante de verdade (a AccountBridge só vê o IP do próprio
// Vercel, nunca do navegador, então o limiter dela não serve pra brute-force
// de senha/spam de cadastro — ver comentário em rfechelon/Program.cs).
//
// Limitação honesta: em memória (Map), por instância serverless. Não é
// distribuído entre regiões/instâncias frias — não segura um atacante
// distribuído sério, mas eleva bastante a régua contra script simples
// martelando uma rota, sem precisar de Redis/Upstash configurado. Suficiente
// pro tamanho atual do projeto; revisar se o tráfego real crescer muito.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpa buckets expirados de vez em quando pra não vazar memória indefinidamente.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const hdrs = request.headers;
  // Vercel preenche x-forwarded-for com o IP real do visitante primeiro na lista.
  const forwardedFor = hdrs.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}

// `scope` separa os buckets por rota (a mesma IP não compartilha limite entre
// login e compra, por exemplo). Retorna `ok:false` quando o limite estourou.
export function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  sweep();
  const ip = getClientIp(request);
  const key = `${scope}:${ip}`;
  const now = Date.now();

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}
