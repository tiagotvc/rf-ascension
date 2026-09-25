export type DocNavItem = { title: string; href: string };
export type DocNavGroup = { title: string; items: DocNavItem[]; groups?: DocNavGroup[] };

const A = "/informacoes/classes/accretia";

export const docsNav: { root: DocNavItem; groups: DocNavGroup[] } = {
  root: { title: "Início da documentação", href: "/informacoes" },
  groups: [
    {
      title: "Classes",
      items: [],
      groups: [
        {
          title: "Accretia",
          items: [{ title: "Visão geral", href: A }],
          groups: [
            {
              title: "Linha Ranger",
              items: [
                { title: "Gunner", href: `${A}/gunner` },
                { title: "Scouter", href: `${A}/scouter` },
                { title: "Striker", href: `${A}/striker` },
                { title: "Dementer", href: `${A}/dementer` },
                { title: "Phantom Shadow", href: `${A}/phantom-shadow` },
                { title: "Bombardier", href: `${A}/bombardier` },
                { title: "Railgunner", href: `${A}/railgunner` },
                { title: "Demolisher", href: `${A}/demolisher` },
              ],
            },
          ],
        },
      ],
    },
  ],
};
