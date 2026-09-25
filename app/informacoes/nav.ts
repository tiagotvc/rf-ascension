export type DocNavItem = { title: string; href: string };
export type DocNavGroup = { title: string; items: DocNavItem[]; groups?: DocNavGroup[] };

export const docsNav: { root: DocNavItem; groups: DocNavGroup[] } = {
  root: { title: "Início da documentação", href: "/informacoes" },
  groups: [
    {
      title: "Classes",
      items: [],
      groups: [
        {
          title: "Accretia",
          items: [
            { title: "Visão geral", href: "/informacoes/classes/accretia" },
            { title: "Striker", href: "/informacoes/classes/accretia/striker" },
          ],
        },
      ],
    },
  ],
};
