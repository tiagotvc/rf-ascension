export type DocNavItem = { title: string; href: string; icon?: string; badge?: string };
export type DocNavGroup = { title: string; items: DocNavItem[]; groups?: DocNavGroup[] };

const A = "/informacoes/classes/accretia";

export const docsNav: { root: DocNavItem; groups: DocNavGroup[] } = {
  root: { title: "Início da documentação", href: "/informacoes" },
  groups: [
    {
      title: "Servidor",
      items: [{ title: "Taxas e sistemas", href: "/informacoes/taxas" }],
    },
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
              items: [],
              groups: [
                {
                  title: "1ª classe",
                  items: [
                    { title: "Gunner", href: `${A}/gunner`, icon: `/assets/info/classes/accretia/class-ARF1.png`, badge: "Lv 30" },
                    { title: "Scouter", href: `${A}/scouter`, icon: `/assets/info/classes/accretia/class-ARF2.png`, badge: "Lv 30" },
                  ],
                },
                {
                  title: "2ª classe",
                  items: [
                    { title: "Striker", href: `${A}/striker`, icon: `/assets/info/classes/accretia/class-ARS1.png`, badge: "Lv 40" },
                    { title: "Dementer", href: `${A}/dementer`, icon: `/assets/info/classes/accretia/class-ARS2.png`, badge: "Lv 40" },
                    { title: "Phantom Shadow", href: `${A}/phantom-shadow`, icon: `/assets/info/classes/accretia/class-ARS3.png`, badge: "Lv 40" },
                  ],
                },
                {
                  title: "3ª classe",
                  items: [
                    { title: "Bombardier", href: `${A}/bombardier`, icon: `/assets/info/classes/accretia/class-ART1.png`, badge: "Lv 50" },
                    { title: "Railgunner", href: `${A}/railgunner`, icon: `/assets/info/classes/accretia/class-ART2.png`, badge: "Lv 50" },
                    { title: "Demolisher", href: `${A}/demolisher`, icon: `/assets/info/classes/accretia/class-ART3.png`, badge: "Lv 50" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
