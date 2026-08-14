# Instruções para continuidade

Leia `README.md`, `DESIGN_SYSTEM.md`, `CONTENT.md` e `BACKEND_REQUIREMENTS.md` antes de alterar o projeto.

## O que preservar

- Identidade RF Ascension, logo atual e direção MMORPG sci-fi clássico.
- Artes refinadas indicadas em `DESIGN_SYSTEM.md`.
- Paleta ciano/âmbar/violeta e superfícies industriais escuras.
- Botões retos com cantos em L; não reintroduzir pílulas ou chanfros arredondados.
- Rotas existentes e paridade entre português e inglês.
- Responsividade, foco visível, redução de movimento e contraste.

Não redesenhe páginas, substitua artes ou altere conteúdo oficial sem aprovação. Use `app/config/site.ts` como fonte de verdade para lançamento, vagas, recompensas, rotas e pacotes. Use `app/styles/tokens.css` para novos valores visuais; não espalhe novas cores mágicas.

## Estado real

O frontend é visualmente avançado, mas as ações de conta, pré-cadastro, fórum, admin, doação, upload e LGPD são protótipos. Não trate estado do cliente como persistência e não apresente mensagens de sucesso antes da confirmação do servidor.

## Fluxo de trabalho

1. Rode o build antes e depois de mudanças estruturais.
2. Faça alterações pequenas e mantenha as telas visualmente estáveis.
3. Extraia componentes repetidos gradualmente; `Brand` já é canônico.
4. Ao implementar backend, siga `BACKEND_REQUIREMENTS.md` e crie testes para autorização e concorrência.
5. Nunca exponha segredos nem aceite preços, cargos, vagas ou benefícios enviados pelo cliente.

Próxima tarefa recomendada: implementar banco + autenticação + pré-cadastro atômico, sem redesenhar o frontend.
