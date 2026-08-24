import { and, count, desc, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDb } from "./index";
import { forumPosts, forumTopics } from "./schema";
import { SERVER_INFO_SLUG, DROPS_SLUG, findForumBoard } from "../app/config/forum";

type Db = Awaited<ReturnType<typeof getDb>>;

export const STAFF_NAME = "Equipe Echelon";
export const STAFF_EMAIL = "equipe@rfascension.online";
export function isStaffEmail(email: string): boolean {
  return email === STAFF_EMAIL;
}

// Título exato do tópico mestre: usado como marcador de versão do seed.
// Mudou a estrutura do conteúdo? Troque o título para forçar reseed (a
// função abaixo apaga só os tópicos da equipe nesse mural antes de recriar).
const MASTER_TITLE = "Informações do servidor — RF Echelon";

// Ascensão de Arma e Vínculo de Alma foram descontinuados — removidos daqui.
// Cada seção tem um placeholder de foto (`pending`) até as imagens reais
// chegarem; ver PostBody.tsx para a sintaxe (`![legenda](pending)`).
function buildItemsTopicBody(rankupId: number): string {
  return `O sistema de itens foi atualizado com foco em variedade de build e progressão de equipamento:

{cyan:Efeitos Especiais Expandidos — até 10 por item}
![Efeitos Especiais Expandidos](pending)
Cada item agora pode receber até 10 efeitos especiais ao mesmo tempo, bem mais que o padrão original. Isso abre espaço pra montar equipamentos com combinações mais completas de dano, defesa, utilidade e efeitos de status, em vez de precisar escolher só 2 ou 3 bônus.

{green:Sistema de Rollup no Drop}
![Sistema de Rollup no Drop](pending)
Quando um item com efeito especial sai de um monstro, de uma caixa ou de qualquer outra fonte, os efeitos já vêm sorteados automaticamente na hora — sem precisar de uma etapa manual separada pra "rolar" o item depois de pegá-lo. O item já cai pronto pra avaliar.

{orange:Sistema de Rank Up}
![Tooltip de arma mostrando Rank 17 level e o bônus de Attack Point](/assets/rankup/weapon.png)
Todo item — arma ou armadura — carrega um Rank, que é um bônus fixo de ataque (arma) ou defesa (armadura) somado direto no combate, separado dos efeitos especiais e do +Upgrade normal de talica. Dá pra evoluir esse Rank investindo Pedra de Evolução no item. Tem um tutorial completo em [Sistema de Rank Up e Pedras de Evolução](/forum/${SERVER_INFO_SLUG}/topic/${rankupId}).

{gold:Bônus de Ataque e Defesa por Raridade}
Toda arma e armadura carrega uma raridade, que já vem com um bônus de ataque (arma) ou defesa (armadura) embutido — fixo naquele item específico, não é sorteado de novo depois:

- {white:Normal} — +2% a +9%
- {green:Intense} — +10% a +16%
- {orange:Superior} — bônus do Intense +2% a +8% em cima
- {cyan:Relíquia} — bônus do Superior +2% a +8% em cima
- {pink:Quantum} — bônus da Relíquia +2% a +8% em cima
- {gold:Special} — bônus do Quantum +2% a +8% em cima, a raridade mais alta

Ascended existe no sistema mas não vai estar disponível por enquanto.

Essas faixas são uma configuração própria do RF Echelon, não são do RF Online original — podem ser ajustadas antes do lançamento.

{violet:Novas Talicas, com novos adicionais}
![Novas Talicas](pending)
O sistema de Talica ganhou talicas novas, cada uma com efeitos adicionais que não existiam antes — mais opções de bônus pra encaixar no seu build.

{pink:Rune System}
![Rune System](pending)
Sistema de runas novo, que adiciona bônus extras aos seus itens.

As fotos de cada sistema entram aqui assim que estiverem prontas.`;
}

// Baseado na fonte real do WorldServer (CItemRankMgr, RankStoneConfig,
// CPlayer::pc_ItemUpgrade). Números conferidos contra o tooltip real (Rank
// 17 = +114 de Attack Point bate exatamente com a fórmula). O tooltip da
// Pedra de Evolução em jogo tem texto desatualizado (fala em "limite de
// upgrade do item" e "sem penalidade na falha") — isso descreve o desenho
// antigo do sistema, substituído em 19/08; o texto abaixo segue o código
// atual, não o tooltip.
const RANKUP_TOPIC_BODY = `O Rank é um atributo separado do +Upgrade normal (os pontinhos de talica) — existe tanto em arma quanto em armadura, e dá um bônus fixo de dano ou defesa que soma direto no combate, sem depender da fórmula normal de defesa.

![Tooltip de arma mostrando Rank 17 level e +114 de Attack Point](/assets/rankup/weapon.png)

{cyan:O que o Rank dá}
- Em {white:arma}: bônus fixo de Attack Point.
- Em {white:armadura}: bônus fixo de Defense Point, e também de Race Defense Point (esse último só conta em PvP e não aparece no tooltip).

O Rank vai de 0 a 255, e o bônus não cresce de forma linear — cada nível vale um pouco mais que o anterior, então os ranks mais altos valem bem mais que os primeiros. Alguns exemplos reais, calculados a partir da fórmula do servidor:

- Rank 17 — +114
- Rank 50 — +487
- Rank 100 — +1.242
- Rank 150 — +2.148
- Rank 200 — +3.167
- Rank 255 (máximo) — +4.396

{orange:Rank inicial ao dropar}
Todo item já nasce com um Rank sorteado dentro de uma faixa, de acordo com a raridade dele:

- {white:Normal} — 0 a 15
- {green:Intense / Superior} — 0 a 20
- {cyan:Relíquia / Hunter} — 0 a 25
- {violet:Ascended} — 0 a 30
- {pink:Quantum} — 0 a 35
- {gold:Special} — 0 a 40

Esse teto vale só pro sorteio inicial — depois que você começa a evoluir o item com Pedra de Evolução, o Rank pode passar bem desse número, até o limite absoluto de 255. Itens de stat fixo (aqueles que nunca rolam afixo/raridade) não recebem Rank.

{violet:Pedras de Evolução}
![Pedra de Evolução [Highest] e sua descrição](/assets/rankup/evolution_stone.png)

Existem 4 tiers de pedra, cada uma com sua própria chance de sucesso e quanto Rank ela sobe de uma vez:

- {white:Baixa} — 10% de sucesso, +1 rank
- {green:Média} — 30% de sucesso, +1 a +3 rank
- {orange:Alta} — 50% de sucesso, +1 a +5 rank
- {gold:Mais Alta} — 70% de sucesso, +1 a +10 rank

A pedra é sempre consumida, ganhe ou perca. Vale reforçar: a descrição da pedra em jogo está desatualizada em dois pontos — ela fala em "limite de upgrade do item" (hoje o teto é 255 pra qualquer item) e em "nada acontece na falha" (isso só vale pra uma das duas formas de usar a pedra, veja abaixo).

{gold:Duas formas de usar a pedra}
1. {cyan:Janela de Upgrade de Item} — arrasta a pedra pro socket principal de talica. Gasta 1 pedra só, de graça. Se falhar, tem uma chance extra de perder 1 rank do item: 40% na pedra Baixa, 25% na Média, 15% na Alta, 5% na Mais Alta.
2. {cyan:Item Combiner} (janela de 5 slots):

![Janela do Item Combiner com a arma e uma pilha de pedras](/assets/rankup/combination.png)

Gasta 250 pedras do mesmo tier de uma vez, mais Dalant — o custo em Dalant sobe conforme o Rank atual do item, então cada tentativa fica mais cara quanto mais alto o item já estiver. Em compensação, essa rota nunca faz o item perder Rank numa falha — só consome as pedras e o Dalant.

{pink:De onde vêm as pedras}
Ainda não temos certeza de onde as pedras de Baixa/Média/Alta são obtidas — assim que confirmarmos, atualizamos aqui. A de Mais Alta parece vir de boss de campo neutro.`;

// Placeholders de imagem (pending) até as duas capturas de tela reais do RF
// Editor serem publicadas.
const EDITOR_TOPIC_BODY = `O RF Echelon é desenvolvido com uma ferramenta própria, feita do zero pela nossa equipe: o {cyan:RF Editor}. A gente não depende de edição manual em arquivo binário nem de gambiarra — cada sistema do servidor tem uma tela dedicada, com validação, pra editar com segurança.

{violet:Editor de conteúdo (quests, itens, skills, classes...)}
![Editor de Quests do RF Editor](/assets/editor/quest_editor.png)
O editor de quests, por exemplo, deixa configurar tudo visualmente: raça, tipo de ação, alvo, quantidade, até 6 recompensas de item por quest, experiência, gold, e se é uma quest diária com intervalo de repetição próprio — e salva com hot-reload, sem precisar derrubar o servidor pra a mudança valer.

{orange:Editor de mundo (mapas, monstros, drops, NPCs e lojas)}
![Editor de mapas, NPCs e lojas do RF Editor](/assets/editor/npc_editor.png)
O mesmo vale pro mundo: monstros, drops, portais, NPCs e as lojas de cada mapa são editados visualmente em cima do mapa 3D real — incluindo o que cada loja vende e por qual preço.

{green:Terrain Tools — escultura de terreno ao vivo}
![Terrain Tools do RF Editor esculpindo o terreno em tempo real](/assets/editor/terrain_tools.png)
Pra construção de mapa, o RF Editor tem ferramentas de terreno completas: Paint, Sculpt, Ramp, Pit/Crater, Scatter, Trail, Layer Paint, Recess, Platform, Subdivide, Expand e mais. No modo Sculpt dá pra levantar, abaixar, nivelar ou suavizar o terreno arrastando direto em cima do mapa 3D, com raio de pincel e altura mínima/máxima ajustáveis — o resultado aparece na hora, sem precisar exportar nada.

{pink:Editor de entidades — decoração do mapa}
![Editor de entidades do RF Editor posicionando props no mapa](/assets/editor/entity_editor.png)
Pra decorar o cenário, o RF Editor lista todo mesh disponível pra colocar no mapa (mais de 1100 no catálogo atual, entre arquivos soltos e empacotados), com pré-visualização antes de posicionar. Dá pra escolher, ver o modelo e colocar direto na cena 3D, sem sair do editor.

{cyan:Sprite Viewer — ícones e sprites da interface}
![Sprite Viewer do RF Editor navegando pelos sprites da interface](/assets/editor/sprite_editor.png)
Todo ícone e sprite de interface do cliente também é navegável, ação por ação, quadro por quadro, com importação e exportação de PNG (inclusive em lote). E tem um alerta de segurança embutido: arquivos de sprite compartilhados por várias telas da interface nativa são marcados como "crítico" antes de qualquer sobrescrita, pra ninguém quebrar a UI do cliente inteiro por acidente.

{orange:Editor de poções — do campo ao ícone}
![Editor de poções do RF Editor com os campos do item](/assets/editor/potion_item_editor.png)
![Editor de poções do RF Editor escolhendo o ícone](/assets/editor/potion_item_editor_sprite.png)
Cada poção tem uma tela própria com todos os campos que importam pra ela funcionar direito: nome interno e de exibição, descrição, limite de nível, tipo de moeda e preço, se é vendível/negociável/dropável/armazenável, e o efeito ligado a ela. O ícone é escolhido visualmente numa grade de sprites, que já avisa quais ícones outros itens já estão usando — evita duplicar ícone sem querer.

{violet:Editor de skills e forças — com prévia ao vivo}
![Editor de Skill/Força do RF Editor com prévia de combate ao vivo](/assets/editor/skill_editor.png)
O editor de skill/força mostra todos os requisitos (HP/FP/SP, cast delay) e os valores de efeito e duração por nível, do 1 ao 7, numa tela só. E o diferencial: dá pra tocar a skill numa cena de combate de teste, ao vivo, e ver o efeito visual e o dano batendo no alvo antes de publicar qualquer mudança.

Essa parte específica (criar skill nova do zero, com partícula própria) ainda está em progresso, cerca de 50% pronta — falta sincronizar a animação corretamente, renderizar o esqueleto certo pra fixar a partícula no ponto certo do personagem, fechar alguns gaps de partícula, e ainda fazer alterações no cliente e no servidor do jogo pra aceitar skills novas de verdade. Editar skill que já existe já funciona normal.

{cyan:Editor de UI nativa — monta janela sem escrever Lua na mão}
![Nativeui Layout Editor do RF Editor montando a janela do Battle Pass](/assets/editor/ui_editor.png)
![Nativeui Layout Editor do RF Editor montando a janela de Habilidades da Guilda](/assets/editor/ui_editor_2.png)
O RF Editor também monta janela de interface nativa do zero, visualmente: fundo, texto, botão, imagem, lista, barra de progresso, paginação — organiza tudo numa hierarquia com drag-and-drop pra reordenar, e cada elemento tem posição, tamanho, cor e sprite editáveis num painel próprio. No final, gera o Lua da janela automaticamente ou aplica como override em cima de uma janela nativa já existente. Ainda em progresso, mas já funcional — as janelas do Battle Pass e das Habilidades da Guilda aí em cima foram montadas nele.

Além dessas telas, o RF Editor também tem editores dedicados pra armas, equipamentos, animus, força/skill, poções, recursos, itens de baú, loja de cash, receitas de craft, anéis/amuletos e classes inteiras. É essa ferramenta que nos permite corrigir, balancear e adicionar conteúdo rápido no RF Echelon, sem depender de terceiros.`;

let bootstrapped = false;

async function ensureForumSchema(db: Db) {
  if (bootstrapped) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS forum_topics (
    id SERIAL PRIMARY KEY,
    forum_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT false,
    comments_allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TEXT NOT NULL
  )`);
  await db.execute(sql`ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS comments_allowed BOOLEAN NOT NULL DEFAULT true`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS forum_topics_forum_slug_idx ON forum_topics (forum_slug)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS forum_posts_topic_id_idx ON forum_posts (topic_id)`);
  // Correção de rota: essas notas foram semeadas em "Notas de atualização"
  // (01-3) antes de decidirmos que esse mural fica reservado para a primeira
  // manutenção real. Move o que já existir para "Informações do servidor".
  await db.execute(
    sql`UPDATE forum_topics SET forum_slug = ${SERVER_INFO_SLUG} WHERE forum_slug = '01-3' AND author_email = ${STAFF_EMAIL}`
  );
  // Rebrand RF Ascension -> RF Echelon: título, autor e corpo já semeados
  // ainda tinham o nome antigo (a troca dos textos-fonte só afeta o próximo
  // insert; conteúdo já gravado no D1 precisa de migração explícita).
  await db.execute(sql`UPDATE forum_topics SET title = REPLACE(title, 'RF Ascension', 'RF Echelon') WHERE author_email = ${STAFF_EMAIL} AND title LIKE '%RF Ascension%'`);
  await db.execute(sql`UPDATE forum_topics SET author_name = REPLACE(author_name, 'Equipe Ascension', 'Equipe Echelon') WHERE author_email = ${STAFF_EMAIL} AND author_name LIKE '%Ascension%'`);
  await db.execute(sql`UPDATE forum_posts SET author_name = REPLACE(author_name, 'Equipe Ascension', 'Equipe Echelon') WHERE author_email = ${STAFF_EMAIL} AND author_name LIKE '%Ascension%'`);
  await db.execute(sql`UPDATE forum_posts SET body = REPLACE(body, 'RF Ascension', 'RF Echelon') WHERE author_email = ${STAFF_EMAIL} AND body LIKE '%RF Ascension%'`);
  // Ofícios, Coleta e Crafting foi removido do catálogo — apaga o que já
  // tinha sido semeado (nunca toca em posts de jogador nesse tópico, mas
  // como é mural de equipe isso nunca existiu de qualquer forma).
  await db.execute(sql`DELETE FROM forum_posts WHERE topic_id IN (SELECT id FROM forum_topics WHERE forum_slug = ${SERVER_INFO_SLUG} AND author_email = ${STAFF_EMAIL} AND title = 'Ofícios, Coleta e Crafting')`);
  await db.execute(sql`DELETE FROM forum_topics WHERE forum_slug = ${SERVER_INFO_SLUG} AND author_email = ${STAFF_EMAIL} AND title = 'Ofícios, Coleta e Crafting'`);
  // Limpa tópicos de teste criados durante o desenvolvimento local.
  await db.execute(
    sql`DELETE FROM forum_posts WHERE author_email IN ('jogador@exemplo.com') OR topic_id IN (SELECT id FROM forum_topics WHERE author_email LIKE 'teste%@exemplo.com')`
  );
  await db.execute(sql`DELETE FROM forum_topics WHERE author_email LIKE 'teste%@exemplo.com'`);
  // Dev-only race: um hot-reload do módulo no meio de um seed em andamento
  // pode fazer dois processos passarem pelo "if (master) return" ao mesmo
  // tempo e inserir o mesmo tópico duas vezes (aconteceu de verdade numa
  // sessão local). Sem constraint única em (forum_slug, title), o guard
  // mais simples é limpar duplicata por duplicata, mantendo o id mais
  // antigo — nunca toca em tópicos de jogador (só author_email = staff).
  await db.execute(sql`DELETE FROM forum_posts WHERE topic_id IN (
    SELECT t.id FROM forum_topics t
    WHERE t.author_email = ${STAFF_EMAIL}
    AND t.id NOT IN (
      SELECT MIN(id) FROM forum_topics WHERE author_email = ${STAFF_EMAIL} GROUP BY forum_slug, title
    )
  )`);
  await db.execute(sql`DELETE FROM forum_topics WHERE author_email = ${STAFF_EMAIL} AND id NOT IN (
    SELECT MIN(id) FROM forum_topics WHERE author_email = ${STAFF_EMAIL} GROUP BY forum_slug, title
  )`);
  const rankupId = await ensureSubTopic(db, "Sistema de Rank Up e Pedras de Evolução", RANKUP_TOPIC_BODY);
  await rewriteTopicBodyIfChanged(db, SERVER_INFO_SLUG, "Sistema de Rank Up e Pedras de Evolução", RANKUP_TOPIC_BODY);
  await rewriteTopicBodyIfChanged(db, SERVER_INFO_SLUG, "Sistema de Itens Atualizado", buildItemsTopicBody(rankupId));
  await ensureSubTopic(db, "Nosso Editor Próprio", EDITOR_TOPIC_BODY);
  await rewriteTopicBodyIfChanged(db, SERVER_INFO_SLUG, "Nosso Editor Próprio", EDITOR_TOPIC_BODY);
  await rewriteMasterTopicBody(db);
  await seedServerInfo(db);
  await seedMonsterDrops(db);
  bootstrapped = true;
}

// Atualiza o post original de um tópico de staff já existente quando o texto
// fonte muda (mesmo id, mesma URL, respostas preservadas) — usado toda vez
// que eu reescrevo um dos tópicos de "Informações do servidor" depois que
// ele já foi semeado uma vez.
async function rewriteTopicBodyIfChanged(db: Db, forumSlug: string, title: string, newBody: string) {
  const [topic] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(and(eq(forumTopics.forumSlug, forumSlug), eq(forumTopics.title, title), eq(forumTopics.authorEmail, STAFF_EMAIL)));
  if (!topic) return;

  const [original] = await db
    .select({ id: forumPosts.id, body: forumPosts.body })
    .from(forumPosts)
    .where(eq(forumPosts.topicId, topic.id))
    .orderBy(forumPosts.createdAt)
    .limit(1);
  if (!original || original.body === newBody) return;

  await db.update(forumPosts).set({ body: newBody }).where(eq(forumPosts.id, original.id));
}

type MasterLinkIds = {
  itemsId: number;
  premiumId: number;
  mountId: number;
  dungeonId: number;
  towersId: number;
  guildId: number;
  editorId: number;
  rankupId: number;
};

// Única fonte do texto do tópico mestre — usada tanto no seed inicial quanto
// na migração que atualiza o tópico já existente (rewriteMasterTopicBody),
// pra nunca ficarem dessincronizados.
function buildMasterBody(ids: MasterLinkIds): string {
  return `RF Echelon roda sobre a base Cliente e Servidor 2.2.3.2, com GameGuard próprio.

Taxas do servidor:
- XP base: x5
- XP Animus: x7
- Drop de monstro: x5
- Taxa de venda: x2
- Mastery / Skill: x5
- Janelas abertas ao mesmo tempo: 1 (free) / 2 (premium)

Recursos do servidor:
- [Sistema de Itens Atualizado](/forum/${SERVER_INFO_SLUG}/topic/${ids.itemsId})
- [Conveniências Premium: Auto Loot, Auto Sell e Tela de Teleporte](/forum/${SERVER_INFO_SLUG}/topic/${ids.premiumId})
- [Sistema de Montaria](/forum/${SERVER_INFO_SLUG}/topic/${ids.mountId})
- [Nova Dungeon Exclusiva](/forum/${SERVER_INFO_SLUG}/topic/${ids.dungeonId})
- [Torres, M.A.U. e Minas Aprimoradas](/forum/${SERVER_INFO_SLUG}/topic/${ids.towersId})
- [Novo Sistema de Guildas](/forum/${SERVER_INFO_SLUG}/topic/${ids.guildId})
- [Sistema de Rank Up e Pedras de Evolução](/forum/${SERVER_INFO_SLUG}/topic/${ids.rankupId})
- [Nosso Editor Próprio](/forum/${SERVER_INFO_SLUG}/topic/${ids.editorId})

Eventos:
- Invasão de monstros às terças e quintas, 10h e 16h (drops especiais e XP extra)

Outros sistemas:
- Quests reformuladas (todas as quests do servidor foram revisadas e refeitas)
- Quests diárias
- Novas poções e novas runas
- Pedra de Proteção (protege o item de quebrar no upgrade)
- Novo Sistema de Talismã (Talica)
- Sistema de votação do Archon reformulado
- Recompensas por quebrar chip, entregar chip e matar o portador do chip
- Buffs de líder de guilda e líder de raça reformulados
- Anúncio global de boss (aviso pro servidor inteiro quando nasce e quando morre)
- XP no Maul (ganha experiência normalmente enquanto pilota)
- Armadilhas de Caçador (também matam monstro e dão XP)
- Torres de Caçador (também matam monstro e dão XP)
- Munição de Carga (Charge Ammo)
- Dungeon Solo e Dungeon PvP
- Sistema de Módulos próprio do RF Echelon, em evolução constante
- Chave do M.A.U. não é destruída ao explodir`;
}

// Cria um sub-tópico novo em SERVER_INFO_SLUG se ainda não existir — usado
// quando um recurso novo é adicionado DEPOIS que o tópico mestre já existe
// (seedServerInfo só roda inteiro na primeira vez, então não recria os
// sub-tópicos que já estavam lá; isso preenche especificamente o que falta).
async function ensureSubTopic(db: Db, title: string, body: string): Promise<number> {
  const [existing] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(
      and(eq(forumTopics.forumSlug, SERVER_INFO_SLUG), eq(forumTopics.title, title), eq(forumTopics.authorEmail, STAFF_EMAIL))
    );
  if (existing) return existing.id;

  const [topic] = await db
    .insert(forumTopics)
    .values({ forumSlug: SERVER_INFO_SLUG, title, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL })
    .returning();
  await db.insert(forumPosts).values({ topicId: topic.id, body, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL });
  return topic.id;
}

// Sub-tópicos já existem (mesmos ids) e o texto do mestre mudou de novo —
// atualiza o post original em vez de apagar e recriar (mesma URL preservada).
async function rewriteMasterTopicBody(db: Db) {
  const [master] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(and(eq(forumTopics.forumSlug, SERVER_INFO_SLUG), eq(forumTopics.title, MASTER_TITLE)));
  if (!master) return;

  async function findId(title: string): Promise<number | null> {
    const [row] = await db
      .select({ id: forumTopics.id })
      .from(forumTopics)
      .where(
        and(
          eq(forumTopics.forumSlug, SERVER_INFO_SLUG),
          eq(forumTopics.title, title),
          eq(forumTopics.authorEmail, STAFF_EMAIL)
        )
      );
    return row?.id ?? null;
  }

  const itemsId = await findId("Sistema de Itens Atualizado");
  const premiumId = await findId("Conveniências Premium: Auto Loot, Auto Sell e Tela de Teleporte");
  const mountId = await findId("Sistema de Montaria");
  const dungeonId = await findId("Nova Dungeon Exclusiva");
  const towersId = await findId("Torres, M.A.U. e Minas Aprimoradas");
  const guildId = await findId("Novo Sistema de Guildas");
  const editorId = await findId("Nosso Editor Próprio");
  const rankupId = await findId("Sistema de Rank Up e Pedras de Evolução");
  if (!itemsId || !premiumId || !mountId || !dungeonId || !towersId || !guildId || !editorId || !rankupId) return;

  const newBody = buildMasterBody({ itemsId, premiumId, mountId, dungeonId, towersId, guildId, editorId, rankupId });

  const [original] = await db
    .select({ id: forumPosts.id, body: forumPosts.body })
    .from(forumPosts)
    .where(eq(forumPosts.topicId, master.id))
    .orderBy(forumPosts.createdAt)
    .limit(1);
  if (!original || original.body === newBody) return;

  await db.update(forumPosts).set({ body: newBody }).where(eq(forumPosts.id, original.id));
}

async function seedServerInfo(db: Db) {
  const [master] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(and(eq(forumTopics.forumSlug, SERVER_INFO_SLUG), eq(forumTopics.title, MASTER_TITLE)));
  if (master) return;

  // Estrutura de conteúdo mudou desde o último seed: limpa só o que a
  // própria equipe publicou nesse mural (nunca toca em posts de jogadores)
  // e recria do zero.
  await db.execute(
    sql`DELETE FROM forum_posts WHERE topic_id IN (SELECT id FROM forum_topics WHERE forum_slug = ${SERVER_INFO_SLUG} AND author_email = ${STAFF_EMAIL})`
  );
  await db.execute(sql`DELETE FROM forum_topics WHERE forum_slug = ${SERVER_INFO_SLUG} AND author_email = ${STAFF_EMAIL}`);

  async function createStaffTopic(title: string, body: string, pinned = false): Promise<number> {
    const [topic] = await db
      .insert(forumTopics)
      .values({ forumSlug: SERVER_INFO_SLUG, title, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL, pinned })
      .returning();
    await db.insert(forumPosts).values({ topicId: topic.id, body, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL });
    return topic.id;
  }

  const rankupId = await createStaffTopic("Sistema de Rank Up e Pedras de Evolução", RANKUP_TOPIC_BODY);
  const itemsId = await createStaffTopic("Sistema de Itens Atualizado", buildItemsTopicBody(rankupId));
  const premiumId = await createStaffTopic(
    "Conveniências Premium: Auto Loot, Auto Sell e Tela de Teleporte",
    "Três conveniências para quem tem Premium ativo:\n\n- Auto Loot System (Premium)\n- Auto Sell System (Premium)\n- Tela de Teleporte (Teleportation Screen)\n\nAuto Loot recolhe os itens do chão automaticamente durante o farm. Auto Sell vende para o NPC sem precisar abrir a janela de loja o tempo todo. A Tela de Teleporte reúne os pontos de teleporte do mundo em uma única interface, sem precisar andar até o NPC."
  );
  const mountId = await createStaffTopic(
    "Sistema de Montaria",
    "RF Echelon conta com sistema de montaria próprio. Formas de obtenção, evolução e velocidades serão detalhadas aqui antes do lançamento."
  );
  const dungeonId = await createStaffTopic(
    "Nova Dungeon Exclusiva",
    "A dungeon ganhou um sistema exclusivo, com fluxo completo: navegador de salas (lista pública, sala própria e sala da dungeon), timer de tempo restante e uma janela de resultado no final que mostra a recompensa de cada jogador do grupo para todo mundo, não só para quem recebeu o item."
  );
  const towersId = await createStaffTopic(
    "Torres, M.A.U. e Minas Aprimoradas",
    "Torres, M.A.U. e minas foram todos revisados:\n\n- Torres de guerra agora têm tooltip detalhado direto no inventário, para comparar upgrade antes de instalar.\n- Bellato ganhou o M.A.U., um mecha pilotável.\n- Pontos de mineração foram revisados.\n\nMais detalhes de cada um em breve."
  );
  const guildId = await createStaffTopic(
    "Novo Sistema de Guildas",
    "As guildas agora acumulam pontos de habilidade para investir em passivos próprios, com uma janela de reset mensal para reorganizar a build da guilda sem perder progresso permanentemente."
  );
  const editorId = await createStaffTopic("Nosso Editor Próprio", EDITOR_TOPIC_BODY);

  await createStaffTopic(
    MASTER_TITLE,
    buildMasterBody({ itemsId, premiumId, mountId, dungeonId, towersId, guildId, editorId, rankupId }),
    true
  );
}

const DROPS_MASTER_TITLE = "Como funcionam os drops — RF Echelon";

// Baseado nos dados reais de ItemLooting.txt / MonsterCharacter.txt / MonsterSet.ini
// (tabela-fonte do servidor). O .dat em produção pode ter ajustes finos por
// cima dessa fonte — os números aqui são os da tabela-fonte, não uma medição
// ao vivo.
async function seedMonsterDrops(db: Db) {
  const [master] = await db
    .select({ id: forumTopics.id })
    .from(forumTopics)
    .where(and(eq(forumTopics.forumSlug, DROPS_SLUG), eq(forumTopics.title, DROPS_MASTER_TITLE)));
  if (master) return;

  await db.execute(
    sql`DELETE FROM forum_posts WHERE topic_id IN (SELECT id FROM forum_topics WHERE forum_slug = ${DROPS_SLUG} AND author_email = ${STAFF_EMAIL})`
  );
  await db.execute(sql`DELETE FROM forum_topics WHERE forum_slug = ${DROPS_SLUG} AND author_email = ${STAFF_EMAIL}`);

  async function createStaffTopic(title: string, body: string, pinned = false): Promise<number> {
    const [topic] = await db
      .insert(forumTopics)
      .values({ forumSlug: DROPS_SLUG, title, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL, pinned })
      .returning();
    await db.insert(forumPosts).values({ topicId: topic.id, body, authorName: STAFF_NAME, authorEmail: STAFF_EMAIL });
    return topic.id;
  }

  await createStaffTopic(
    "Dark Sign & Izen Crasher — set Saint [Rare B]",
    "Dois monstros de elite (nível 79 e 81) que derrubam o mesmo conjunto de armas:\n\n- Saint Beam Saver [Rare B]\n- Saint Beam Sword [Rare B]\n- Saint Burova [Rare B]\n- Saint Beam Pressure [Rare B]\n- Saint Staff [Rare B]\n\nChance de dropar uma dessas armas: cerca de 15% por kill (e só rola arma se o drop sortear raridade Rara ou melhor — veja o tópico fixado sobre como funcionam os drops)."
  );

  await createStaffTopic(
    "Chief Researcher John F Carter & BigFoot Clan — set Élfico",
    "Dois monstros de nível 72 com o mesmo conjunto de drops:\n\n- Elven Blade\n- Elven Bow\n- Elven Staff\n- Metal Elven Blade\n- Metal Elven Dual Blade\n- Destruction Rune, Convert Rune, Swift Rune, Escape Rune, Defense Rune\n\nChance de dropar uma das armas: cerca de 50% por kill."
  );

  await createStaffTopic(
    "Sealed Calliana Queen, Sealed Hora Baal Hamon Guard & Sealed Soul Cinder — set Divino & Crimson Hora",
    "Três monstros selados (nível 71 e 72) com o mesmo padrão de drop:\n\n- Divine Beam Saver / Sword / Burova / Pressure / Staff [Rare B]\n- Crimson Hora Knife / Sword / Hammer / Bow / Fire Arm / Launcher / Staff / Axe / Spear [Rare D]\n- Jewelry Box\n- Gateway Generating Key\n\nA chance de dropar uma arma do set varia por monstro: Sealed Calliana Queen ~50%, Sealed Hora Baal Hamon Guard ~35%, Sealed Soul Cinder ~25%. Jewelry Box e Gateway Generating Key têm entrada própria na tabela, não competem pelo mesmo slot das armas."
  );

  await createStaffTopic(
    DROPS_MASTER_TITLE,
    `Todo monstro tem sua própria tabela de drop. Dois fatores decidem o que sai:

**Diferença de nível entre você e o monstro**
Quanto mais alto o seu nível em relação ao do monstro, menor a chance de drop — matar algo muito abaixo do seu nível praticamente não derruba nada.

**Raridade do monstro**
Só rola item de arma/armadura se o drop sortear raridade Rara ou melhor, e isso muda bastante entre monstro comum e boss:

- {gold:Monstro Boss} — 0% Comum, 10% Normal, 60% Rara, 30% Épica
- {white:Monstro Fraco} — 79% Comum, 20% Normal, 1% Rara, 0% Épica

Ou seja: bosses valem muito mais a pena caçar se você quer item raro — um monstro comum praticamente nunca dropa arma ou armadura.

Veja os outros tópicos desta área pra saber o que bosses específicos derrubam. E fique à vontade pra postar o que você mesmo encontrou — essa área é aberta pra comunidade.`,
    true
  );
}

export type ForumBoardStats = {
  slug: string;
  topicCount: number;
  replyCount: number;
  latest: { title: string; authorName: string; createdAt: string; topicId: number } | null;
};

export async function getForumIndexStats(): Promise<Map<string, ForumBoardStats>> {
  const db = await getDb();
  await ensureForumSchema(db);

  const topicCounts = await db
    .select({ slug: forumTopics.forumSlug, value: count() })
    .from(forumTopics)
    .groupBy(forumTopics.forumSlug);

  const postCounts = await db
    .select({ slug: forumTopics.forumSlug, value: count() })
    .from(forumPosts)
    .innerJoin(forumTopics, eq(forumPosts.topicId, forumTopics.id))
    .groupBy(forumTopics.forumSlug);

  const allTopics = await db
    .select({
      id: forumTopics.id,
      slug: forumTopics.forumSlug,
      title: forumTopics.title,
      authorName: forumTopics.authorName,
      createdAt: forumTopics.createdAt,
    })
    .from(forumTopics)
    .orderBy(desc(forumTopics.createdAt));

  const topicCountBySlug = new Map(topicCounts.map((r) => [r.slug, r.value]));
  const postCountBySlug = new Map(postCounts.map((r) => [r.slug, r.value]));
  const latestBySlug = new Map<string, (typeof allTopics)[number]>();
  for (const topic of allTopics) {
    if (!latestBySlug.has(topic.slug)) latestBySlug.set(topic.slug, topic);
  }

  const stats = new Map<string, ForumBoardStats>();
  for (const slug of new Set([...topicCountBySlug.keys(), ...postCountBySlug.keys()])) {
    const topicCount = topicCountBySlug.get(slug) ?? 0;
    const postCount = postCountBySlug.get(slug) ?? 0;
    const latest = latestBySlug.get(slug);
    stats.set(slug, {
      slug,
      topicCount,
      replyCount: Math.max(0, postCount - topicCount),
      latest: latest
        ? { title: latest.title, authorName: latest.authorName, createdAt: latest.createdAt, topicId: latest.id }
        : null,
    });
  }
  return stats;
}

export async function listForumTopics(forumSlug: string) {
  const db = await getDb();
  await ensureForumSchema(db);

  const topics = await db
    .select({
      id: forumTopics.id,
      title: forumTopics.title,
      authorName: forumTopics.authorName,
      authorEmail: forumTopics.authorEmail,
      pinned: forumTopics.pinned,
      createdAt: forumTopics.createdAt,
    })
    .from(forumTopics)
    .where(eq(forumTopics.forumSlug, forumSlug))
    .orderBy(desc(forumTopics.pinned), desc(forumTopics.createdAt));

  const postCounts = await db
    .select({ topicId: forumPosts.topicId, value: count() })
    .from(forumPosts)
    .innerJoin(forumTopics, eq(forumPosts.topicId, forumTopics.id))
    .where(eq(forumTopics.forumSlug, forumSlug))
    .groupBy(forumPosts.topicId);
  const postCountByTopic = new Map(postCounts.map((r) => [r.topicId, r.value]));

  return topics.map((topic) => ({
    ...topic,
    replyCount: Math.max(0, (postCountByTopic.get(topic.id) ?? 0) - 1),
  }));
}

export async function getForumTopicWithPosts(forumSlug: string, topicId: number) {
  const db = await getDb();
  await ensureForumSchema(db);

  const [topic] = await db
    .select()
    .from(forumTopics)
    .where(and(eq(forumTopics.id, topicId), eq(forumTopics.forumSlug, forumSlug)));
  if (!topic) return null;

  const posts = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.topicId, topicId))
    .orderBy(forumPosts.createdAt);

  return { topic, posts };
}

export async function createForumTopic(input: {
  forumSlug: string;
  title: string;
  body: string;
  authorName: string;
  authorEmail: string;
  pinned?: boolean;
  commentsAllowed?: boolean;
}) {
  const board = findForumBoard(input.forumSlug);
  if (!board) {
    throw new Error("Mural não encontrado.");
  }
  const staff = isStaffEmail(input.authorEmail);
  if (!staff) {
    // Por enquanto só a equipe pode publicar — quando contas de jogador
    // (login com a conta do jogo) estiverem ligadas, volta a valer a regra
    // por mural (board.canCreateTopics).
    throw new Error("Por enquanto só a equipe pode publicar novos tópicos.");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || title.length > 140) {
    throw new Error("O título deve ter entre 3 e 140 caracteres.");
  }
  if (body.length < 3 || body.length > 8000) {
    throw new Error("A mensagem deve ter entre 3 e 8000 caracteres.");
  }

  const db = await getDb();
  await ensureForumSchema(db);

  const [topic] = await db
    .insert(forumTopics)
    .values({
      forumSlug: input.forumSlug,
      title,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      pinned: input.pinned ?? false,
      commentsAllowed: input.commentsAllowed ?? true,
    })
    .returning();
  await db.insert(forumPosts).values({
    topicId: topic.id,
    body,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
  });
  return topic;
}

export async function createForumReply(input: {
  forumSlug: string;
  topicId: number;
  body: string;
  authorName: string;
  authorEmail: string;
}) {
  const board = findForumBoard(input.forumSlug);
  if (!board || !board.board.canReply) {
    throw new Error("Este mural não aceita respostas.");
  }
  if (!isStaffEmail(input.authorEmail)) {
    throw new Error("Por enquanto só a equipe pode responder.");
  }
  const body = input.body.trim();
  if (body.length < 1 || body.length > 8000) {
    throw new Error("A resposta deve ter entre 1 e 8000 caracteres.");
  }

  const db = await getDb();
  await ensureForumSchema(db);

  const [topic] = await db
    .select({ id: forumTopics.id, commentsAllowed: forumTopics.commentsAllowed })
    .from(forumTopics)
    .where(and(eq(forumTopics.id, input.topicId), eq(forumTopics.forumSlug, input.forumSlug)));
  if (!topic) {
    throw new Error("Tópico não encontrado.");
  }
  if (!topic.commentsAllowed) {
    throw new Error("Comentários desativados neste tópico.");
  }

  const [post] = await db
    .insert(forumPosts)
    .values({
      topicId: input.topicId,
      body,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
    })
    .returning();
  return post;
}

export type AuthorStats = { postCount: number; memberSince: string };

// Dados reais do card de usuário: total de mensagens e data da primeira
// mensagem, calculados a partir do próprio histórico do fórum (não há
// cadastro de conta separado ainda — ver BACKEND_REQUIREMENTS.md).
export async function getAuthorStats(emails: string[]): Promise<Map<string, AuthorStats>> {
  const db = await getDb();
  await ensureForumSchema(db);
  if (emails.length === 0) return new Map();

  const rows = await db
    .select({
      email: forumPosts.authorEmail,
      postCount: count(),
      memberSince: sql<string>`min(${forumPosts.createdAt})`,
    })
    .from(forumPosts)
    .where(inArray(forumPosts.authorEmail, emails))
    .groupBy(forumPosts.authorEmail);

  return new Map(rows.map((r) => [r.email, { postCount: r.postCount, memberSince: r.memberSince }]));
}

export type RecentTopic = {
  id: number;
  forumSlug: string;
  title: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
};

export async function getRecentTopics(limit: number): Promise<RecentTopic[]> {
  const db = await getDb();
  await ensureForumSchema(db);

  return db
    .select({
      id: forumTopics.id,
      forumSlug: forumTopics.forumSlug,
      title: forumTopics.title,
      authorName: forumTopics.authorName,
      authorEmail: forumTopics.authorEmail,
      createdAt: forumTopics.createdAt,
    })
    .from(forumTopics)
    .orderBy(desc(forumTopics.createdAt))
    .limit(limit);
}
