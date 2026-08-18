# Design System — RF Echelon

## Direção

MMORPG sci-fi clássico, escuro e direto. Materiais industriais, Corita ciano, tecnologia das três raças e interface militar. Evitar cyberpunk, vidro excessivo, arredondamento e sci-fi genérico.

## Regras

1. Superfícies retas e escuras.
2. Botões com cantos em L e reforço luminoso no hover.
3. Ciano = ação/sistema; âmbar = lançamento/doação/raridade; violeta = especial.
4. Arte no fundo sempre recebe película para legibilidade.
5. Geist em conteúdo; Geist Mono em labels, números e status.

## Tokens

Fonte canônica: `app/styles/tokens.css`. A escala inclui cores semânticas, espaços de 4–96px, container de 1280px, header de 84px e foco acessível. Aliases antigos em `globals.css` são compatibilidade temporária.

## Componentes canônicos

- `app/components/Brand.tsx`
- `app/LaunchCountdown.tsx`
- `app/CookieConsent.tsx`
- `app/QuickDock.tsx`

Próximas extrações: `SiteHeader`, `Footer`, `SciFiButton`, `FormField`, `ForumRow`, `CashPackage`.

## Arte ativa

- Home: `public/assets/rf-ascension-home-refined.png`
- Fórum: `public/assets/rf-ascension-forum-refined.png`
- Conta: `public/assets/rf-ascension-account-refined.png`
- Logo: `public/assets/rf-ascension-logo.svg`

Não trocar sem aprovação. Não incorporar logos ou cópias literais de referências externas.

## Acessibilidade

- Foco visível; alvos mínimos de 44–48px.
- Breakpoint principal 900px; compacto 560–650px.
- Não depender apenas de cor.
- Respeitar `prefers-reduced-motion`.
