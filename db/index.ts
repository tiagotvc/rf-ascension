import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Um único client por processo (reaproveita a conexão entre requests na
// mesma função serverless/instância — evita reabrir conexão TCP a cada
// chamada). `DATABASE_URL` deve apontar pro Postgres real (VPS, Neon,
// Vercel Postgres etc.) — de preferência uma connection string com pooler,
// já que funções serverless podem escalar em paralelo.
let client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Defina a variável de ambiente apontando pro Postgres antes de usar o banco."
    );
  }

  client ??= postgres(connectionString, { max: 1 });
  return drizzle(client, { schema });
}
