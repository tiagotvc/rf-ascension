# Requisitos de backend

O frontend atual é um protótipo navegável. Mensagens de sucesso não representam persistência real. Login, cadastro, pré-cadastro, fórum, doações, admin, uploads e solicitações LGPD precisam de implementação server-side.

## Entidades mínimas

- `users`: conta, e-mail normalizado, senha com hash, idioma, status e timestamps.
- `pre_registrations`: e-mail normalizado único, posição, consentimentos e timestamps.
- `founder_rewards`: vínculo da reserva com a conta recriada e estado de entrega.
- `forum_categories`, `forum_topics`, `forum_posts`: conteúdo, autoria, moderação e publicação.
- `donation_packages`, `orders`, `payments`, `entitlements`: catálogo, pagamento, cash, Premium e itens.
- `consent_records`: versão do aviso, finalidade, escolha e data.
- `privacy_requests`: acesso, correção, portabilidade e exclusão.
- `admin_audit_logs`: autor, ação, alvo, antes/depois e data.

## Pré-cadastro fundador

Normalizar o e-mail no servidor e aplicar índice único. A atribuição das 100 vagas deve ocorrer em transação atômica; nunca usar um contador do navegador como fonte de verdade. No lançamento, vincular a recompensa apenas quando a conta do launcher usar exatamente o mesmo e-mail normalizado. Registrar tentativas, vínculo e entrega para auditoria.

## Autenticação e administração

- Hash forte de senha, sessão segura, recuperação de conta e verificação de e-mail.
- RBAC com papéis `member`, `moderator`, `editor` e `admin`.
- Rotas e mutations administrativas protegidas no servidor.
- Validação server-side, rate limit, proteção contra abuso e CSRF quando aplicável.
- Uploads com allowlist de MIME/extensão, limite de tamanho e armazenamento isolado.
- Log de auditoria para publicação, edição, moderação, concessão de itens e alterações financeiras.

## Doações e pagamentos

O preço e os benefícios vêm do servidor. Criar pedidos pendentes e confirmar somente por webhook assinado e idempotente. Nunca liberar cash a partir do retorno do navegador. Manter ledger de cash/itens, reconciliação e tratamento de estorno. Os itens exclusivos exibidos hoje são placeholders e precisam de IDs oficiais antes da integração.

## LGPD

- Identificar controlador, operador, encarregado/canal de privacidade e bases legais reais.
- Coletar somente dados necessários e separar consentimento opcional de execução do serviço.
- Versionar termos, privacidade e cookies; guardar prova de aceite.
- Implementar fluxo autenticado para acesso, correção, portabilidade e exclusão.
- Definir retenção, descarte, resposta a incidentes e contratos com subprocessadores.
- Cookies não essenciais só após consentimento; permitir revisão da escolha.

## Ordem recomendada

1. Banco, migrations e variáveis de ambiente.
2. Autenticação, e-mail e RBAC.
3. Pré-cadastro transacional e vínculo de recompensas.
4. Fórum e painel editorial com auditoria.
5. Pedidos, webhook de pagamento e entitlements.
6. Operações LGPD, observabilidade, backups e testes de segurança.

Antes de produção, realizar testes de concorrência nas 100 vagas, autorização por função, webhook duplicado, XSS no fórum, upload hostil, recuperação de conta e exclusão de dados.
