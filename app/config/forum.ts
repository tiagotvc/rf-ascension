// Catálogo canônico das áreas e subfóruns. Ícone/descrição são conteúdo
// editorial estático; tópicos e respostas são reais e vêm do banco (db/forum.ts).
export type ForumBoard = {
  slug: string;
  icon: string;
  title: string;
  description: string;
  canCreateTopics: boolean;
  canReply: boolean;
};
export type ForumArea = {
  code: string;
  title: string;
  tone: "cyan" | "violet" | "amber" | "emerald";
  boards: ForumBoard[];
};

export const forumAreas: ForumArea[] = [
  {
    code: "01",
    title: "Informações do RF Echelon",
    tone: "cyan",
    boards: [
      { slug: "01-1", icon: "✦", title: "Anúncios oficiais", description: "Notícias, manutenções, eventos e comunicados da equipe.", canCreateTopics: false, canReply: true },
      { slug: "01-2", icon: "◎", title: "Informações do servidor", description: "Rates, sistemas, horários da Chip War e regras gerais.", canCreateTopics: false, canReply: true },
      { slug: "01-3", icon: "◫", title: "Notas de atualização", description: "Histórico completo de patches, correções e novidades.", canCreateTopics: false, canReply: true },
    ],
  },
  {
    code: "02",
    title: "Tutoriais & Conhecimento",
    tone: "violet",
    boards: [
      { slug: "02-1", icon: "⌁", title: "Guias para iniciantes", description: "Instalação, primeiros níveis, equipamentos e evolução.", canCreateTopics: true, canReply: true },
      { slug: "02-2", icon: "⚔", title: "Classes & Builds", description: "Discussões sobre classes, atributos, armas e combinações.", canCreateTopics: true, canReply: true },
      { slug: "02-3", icon: "◈", title: "Mineração & Economia", description: "Minérios, processamento, mercado e formas de conseguir gold.", canCreateTopics: true, canReply: true },
      { slug: "02-4", icon: "☠", title: "Drops de Monstros", description: "O que cada monstro derruba, chances de raridade e onde farmar.", canCreateTopics: true, canReply: true },
    ],
  },
  {
    code: "03",
    title: "Comunidade & Guerra",
    tone: "amber",
    boards: [
      { slug: "03-1", icon: "♜", title: "Guildas & Recrutamento", description: "Apresente sua guilda e encontre aliados para dominar Novus.", canCreateTopics: true, canReply: true },
      { slug: "03-2", icon: "⚑", title: "Chip War & PvP", description: "Relatos de batalha, estratégias de guerra e rivalidades.", canCreateTopics: true, canReply: true },
      { slug: "03-3", icon: "◌", title: "Off-topic", description: "Conversas da comunidade que não cabem nas outras áreas.", canCreateTopics: true, canReply: true },
    ],
  },
  {
    code: "04",
    title: "Suporte & Segurança",
    tone: "emerald",
    boards: [
      { slug: "04-1", icon: "?", title: "Ajuda ao jogador", description: "Dúvidas técnicas, erros do launcher e problemas de conexão.", canCreateTopics: true, canReply: true },
      { slug: "04-2", icon: "!", title: "Denúncias & Apelações", description: "Reporte comportamentos inadequados e solicite revisões.", canCreateTopics: true, canReply: true },
      { slug: "04-3", icon: "⌾", title: "Conta & Segurança", description: "Recuperação de acesso e boas práticas para proteger sua conta.", canCreateTopics: true, canReply: true },
    ],
  },
  {
    code: "05",
    title: "Doações & Cash Points",
    tone: "amber",
    boards: [
      { slug: "05-1", icon: "◈", title: "Central de doações", description: "Conheça os pacotes, bônus disponíveis e formas de pagamento.", canCreateTopics: false, canReply: true },
      { slug: "05-2", icon: "$", title: "Pagamentos & Entrega", description: "Ajuda com PIX, cartão, confirmação e entrega automática de Cash.", canCreateTopics: true, canReply: true },
      { slug: "05-3", icon: "⌁", title: "Dúvidas frequentes", description: "Histórico, bônus, reembolsos e segurança das contribuições.", canCreateTopics: false, canReply: true },
    ],
  },
];

// "Informações do servidor": descreve os sistemas do jogo (o que existe hoje).
// "Notas de atualização" fica reservada para o histórico de manutenções reais,
// a começar pela primeira depois do lançamento — não usar para isso agora.
export const SERVER_INFO_SLUG = "01-2";
export const DROPS_SLUG = "02-4";

export function findForumBoard(slug: string): { area: ForumArea; board: ForumBoard } | null {
  for (const area of forumAreas) {
    const board = area.boards.find((b) => b.slug === slug);
    if (board) return { area, board };
  }
  return null;
}

export function forumInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function formatForumDate(iso: string): string {
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
