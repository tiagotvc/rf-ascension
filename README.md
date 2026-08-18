# RF Echelon Portal

Portal responsivo do servidor RF Echelon: home, campanha de abertura, download, doações, fórum, conta, admin visual e páginas LGPD.

## Documentação do produto

- `DESIGN_SYSTEM.md` — tokens, direção visual e componentes
- `CONTENT.md` — conteúdo e valores oficiais
- `BACKEND_REQUIREMENTS.md` — persistência, segurança e integrações pendentes
- `CLAUDE.md` — instruções para continuidade no Claude Code

Configurações de data, taxas, rotas e pacotes ficam em `app/config/site.ts`.

> O frontend está visualmente completo. O fórum já tem persistência real (Postgres); cadastro/login de jogador (conta do jogo), pagamentos, uploads e solicitações LGPD ainda são protótipos. Login da equipe (admin) já é real.

---

# Runtime

Next.js (App Router) puro, hospedado na Vercel. Banco de dados: Postgres via
Drizzle ORM — antes rodava em Cloudflare Workers + D1 (SQLite), migrado porque
o site passou a ser hospedado na Vercel e o banco de contas do jogo vive numa
VPS separada.

## Prerequisites

- Node.js `>=22.13.0`
- Um Postgres acessível (local para dev, ou o de produção via `DATABASE_URL`)

## Variáveis de ambiente

Ver `.env.example`. Resumo:

- `DATABASE_URL` — connection string do Postgres. Sem ela, qualquer página que
  toca o banco (fórum, admin) falha com um erro explícito em vez de mostrar
  dado falso — ver `db/index.ts`.
- `SESSION_SECRET` — chave usada pra assinar o cookie de sessão da equipe.
- `ADMIN_PASSWORD` — senha de login da equipe em `/admin/entrar`.

## Autenticação

Não existe mais Sign-In-With-ChatGPT (dependia da plataforma OpenAI Apps/Sites,
que injetava headers de identidade — não existe na Vercel). Hoje:

- **Equipe/admin**: login por senha (`ADMIN_PASSWORD`) em `/admin/entrar`,
  sessão via cookie assinado (`app/lib/auth.ts`). Único jeito de logar hoje.
- **Jogador (conta do jogo)**: ainda não conectado. Vai validar contra o banco
  de contas do jogo, hospedado na VPS — falta desenhar a ponte segura até lá
  (ver `BACKEND_REQUIREMENTS.md`).

Por enquanto, só a equipe consegue criar tópicos e responder no fórum
(`db/forum.ts`, `createForumTopic`/`createForumReply`) — a regra por mural
(`canCreateTopics`/`canReply` em `app/config/forum.ts`) volta a valer quando
contas de jogador existirem.

## Banco de dados

- `db/schema.ts` — schema Drizzle (Postgres)
- `db/index.ts` — conexão (`postgres-js`), lê `DATABASE_URL`
- `npm run db:generate` — gera migrations Drizzle a partir do schema
- `db/forum.ts` tem um `ensureForumSchema()` que cria as tabelas e roda
  migrações idempotentes automaticamente na primeira query de cada instância —
  não precisa rodar migration manual pra subir do zero

## Diagnostic Commands

- `npm run dev`: inicia o servidor de desenvolvimento Next.js
- `npm run build`: build de produção (`next build`, com type-check completo)
- `npm run start`: roda o build de produção localmente
- `npm run lint`: eslint
- `npm run db:generate`: gera migrations Drizzle após mudar o schema
