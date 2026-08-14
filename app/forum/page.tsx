const areas=[
 {title:"Informações do RF Ascension",code:"01",tone:"cyan",forums:[
  ["✦","Anúncios oficiais","Notícias, manutenções, eventos e comunicados da equipe.","18","243","Patch 1.0.4 — Balanceamento","Admin Ascension · hoje, 11:05"],
  ["◎","Informações do servidor","Rates, sistemas, horários da Chip War e regras gerais.","12","184","Bem-vindos ao RF Ascension","Admin Ascension · hoje, 14:32"],
  ["◫","Notas de atualização","Histórico completo de patches, correções e novidades.","9","126","Notas da manutenção semanal","Equipe Ascension · ontem, 22:10"]
 ]},
 {title:"Tutoriais & Conhecimento",code:"02",tone:"violet",forums:[
  ["⌁","Guias para iniciantes","Instalação, primeiros níveis, equipamentos e evolução.","46","938","Guia do nível 1 ao 40","Lyra · ontem, 20:18"],
  ["⚔","Classes & Builds","Discussões sobre classes, atributos, armas e combinações.","63","1.204","Build PvP para Punisher","Raven · hoje, 09:42"],
  ["◈","Mineração & Economia","Minérios, processamento, mercado e formas de conseguir gold.","28","517","Onde minerar no nível 45?","Astra · há 2 horas"]
 ]},
 {title:"Comunidade & Guerra",code:"03",tone:"amber",forums:[
  ["♜","Guildas & Recrutamento","Apresente sua guilda e encontre aliados para dominar Novus.","31","684","Guilda Eclipse recruta Bellato","Nyx · há 38 min"],
  ["⚑","Chip War & PvP","Relatos de batalha, estratégias de guerra e rivalidades.","22","492","Resultado da CW de ontem","Kael · hoje, 08:15"],
  ["◌","Off-topic","Conversas da comunidade que não cabem nas outras áreas.","17","301","De qual raça você começou?","Mika · há 20 min"]
 ]},
 {title:"Suporte & Segurança",code:"04",tone:"emerald",forums:[
  ["?","Ajuda ao jogador","Dúvidas técnicas, erros do launcher e problemas de conexão.","12","247","Launcher não atualiza","Suporte RF · há 12 min"],
  ["!","Denúncias & Apelações","Reporte comportamentos inadequados e solicite revisões.","6","54","Como enviar uma denúncia válida","Moderação · ontem"],
  ["⌾","Conta & Segurança","Recuperação de acesso e boas práticas para proteger sua conta.","8","93","Ative a proteção da sua conta","Suporte RF · segunda"]
 ]},
 {title:"Doações & Cash Points",code:"05",tone:"gold",forums:[
  ["◈","Central de doações","Conheça os pacotes, bônus disponíveis e formas de pagamento.","7","86","Novos pacotes Ascension disponíveis","Equipe Ascension · hoje"],
  ["$","Pagamentos & Entrega","Ajuda com PIX, cartão, confirmação e entrega automática de Cash.","14","112","Prazo para receber Cash Points","Suporte RF · há 25 min"],
  ["⌁","Dúvidas frequentes","Histórico, bônus, reembolsos e segurança das contribuições.","9","74","Como consultar meu histórico?","Admin Ascension · ontem"]
 ]}
];

export default function Forum(){return <main className="forum-page">
 <header className="site-header forum-nav"><a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ASCENSION</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/">Início</a><a href="/#download">Download</a><a href="/doacao">Doação</a><a className="active" href="/forum">Fórum</a><a href="/conta">Minha conta</a></nav><div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/forum">EN</a></span><a className="header-cta" href="/conta">Criar conta</a></div></header>
 <section className="forum-hero compact"><span className="kicker">COMUNIDADE RF ASCENSION</span><h1>Fórum da <em>comunidade.</em></h1><p>Encontre informações, aprenda os sistemas do jogo e participe das discussões.</p><div className="forum-tools"><label><span>⌕</span><input aria-label="Pesquisar no fórum" placeholder="Pesquisar em todas as áreas..."/></label><a className="btn btn-primary" href="#areas">Explorar áreas ↓</a></div></section>
 <section className="forum-content forum-index" id="areas">
  <div className="forum-strip square"><span><i className="pulse"/> 1.284 jogadores online</span><span>272 tópicos</span><span>4.981 respostas</span><span>Último registro: <b>Astra</b></span></div>
  <div className="index-legend"><span>FÓRUM</span><span>TÓPICOS</span><span>RESPOSTAS</span><span>ÚLTIMO POST</span></div>
  {areas.map(area=><section className={`forum-area ${area.tone}`} key={area.title}>
   <header><span>{area.code}</span><h2>{area.title}</h2><small>{area.forums.length} áreas</small></header>
   <div>{area.forums.map((f,i)=><a className="forum-row" href={area.code==="05"&&i===0?"/forum/doacoes":`#${area.code}-${i+1}`} id={`${area.code}-${i+1}`} key={f[1]}>
    <span className="forum-row-icon">{f[0]}</span>
    <span className="forum-row-main"><span className="row-label">{i===0?"DESTAQUE":"COMUNIDADE"}</span><strong>{f[1]}</strong><small>{f[2]}</small></span>
    <span className="forum-row-count"><b>{f[3]}</b><small>tópicos</small></span>
    <span className="forum-row-count"><b>{f[4]}</b><small>respostas</small></span>
    <span className="forum-row-last"><i>{f[6].slice(0,1)}</i><span><strong>{f[5]}</strong><small>{f[6]}</small></span></span>
    <b className="forum-row-arrow">→</b>
   </a>)}</div>
  </section>)}
  <section className="rules-card square" id="informacoes"><div><span className="kicker">ANTES DE PUBLICAR</span><h2>Uma comunidade forte<br/>começa com respeito.</h2></div><div><p><b>01.</b> Seja respeitoso com todos os jogadores.</p><p><b>02.</b> Procure antes de criar um novo tópico.</p><p><b>03.</b> Denúncias devem conter evidências.</p></div></section>
 </section>
 </main>}
