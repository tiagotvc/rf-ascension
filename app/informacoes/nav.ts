import { classUrl, classes, forceTrees, lines, races, reachLevel } from "./data/game";

export type DocNavItem = { title: string; href: string; icon?: string; badge?: string };
export type DocNavGroup = { title: string; items: DocNavItem[]; groups?: DocNavGroup[] };

const raceGroup = (raceId: string, raceName: string): DocNavGroup => ({
  title: raceName,
  items: [{ title: "Visão geral", href: `/informacoes/classes/${raceId}` }],
  groups: lines
    .filter((l) => classes.some((c) => c.race === raceName && c.line === l && c.grade > 0))
    .map((line) => ({
      title: `Linha ${line}`,
      items: [],
      groups: [1, 2, 3]
        .filter((g) => classes.some((c) => c.race === raceName && c.line === line && c.grade === g))
        .map((g) => ({
          title: `${g}ª classe`,
          items: classes
            .filter((c) => c.race === raceName && c.line === line && c.grade === g)
            .sort((a, b) => a.idx - b.idx)
            .map((c) => ({ title: c.name, href: classUrl(c), icon: `/assets/info/emblems/${c.code}.png`, badge: `Lv ${reachLevel(c)}` })),
        })),
    })),
});

export const docsNav: { root: DocNavItem; groups: DocNavGroup[] } = {
  root: { title: "Início da documentação", href: "/informacoes" },
  groups: [
    {
      title: "Servidor",
      items: [
        { title: "Taxas e sistemas", href: "/informacoes/taxas" },
        { title: "Melhorias e novidades", href: "/informacoes/melhorias" },
      ],
    },
    {
      title: "Itens",
      items: [
        { title: "Upgrade de itens", href: "/informacoes/itens/upgrade" },
        { title: "Rank e Evolution Stones", href: "/informacoes/itens/rank" },
        { title: "Runas", href: "/informacoes/itens/runas" },
      ],
    },
    { title: "Classes", items: [], groups: races.map((r) => raceGroup(r.id, r.name)) },
    {
      title: "Skills",
      items: [
        { title: "Melee", href: "/informacoes/skills/melee" },
        { title: "Range", href: "/informacoes/skills/range" },
      ],
    },
    { title: "Forces", items: forceTrees.map((t) => ({ title: t.name, href: `/informacoes/forces/${t.id}` })) },
  ],
};
