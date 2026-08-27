export const siteConfig={
 name:"RF Echelon",operator:"CCR",locale:"pt-BR",timezone:"America/Sao_Paulo",
 launchAt:"2026-08-28T20:00:00-03:00",launchLabel:"28/08/2026 às 20:00",
 cashPerReal:1000,
 routes:{home:"/",download:"/#download",forum:"/forum",donation:"/doacao",account:"/conta",admin:"/admin"},
 legal:{privacy:"/legal/privacidade",cookies:"/legal/cookies",terms:"/legal/termos"}
} as const;
export const serverRates=[
 {value:"10x",label:"Experiência (XP)"},
 {value:"x5",label:"Venda (valor original)"},
 {value:"x5",label:"PT / Skill"},
 {value:"x5",label:"Drop"},
 {value:"20",label:"Buffs ativos"},
 {value:"255",label:"Stack de item"}
] as const;
// `guidePath`, quando presente, aponta pro guia real desse sistema no fórum
// — só adicionar quando o guia de fato existir (ver db/forum.ts), nunca um
// link de enfeite. Os demais sistemas ganham o campo conforme escrevemos o
// guia correspondente.
export const serverSystems=[
 {name:"CCR Box",active:false,icon:"▣"},
 {name:"Novo Sistema de Itens",active:true,icon:"◈",detail:"Upgrade de Talica (com talicas novas) e Rank Up System.",guidePath:"/forum/01-2/topic/14"},
 {name:"Sistema de Runas",active:true,icon:"❖",detail:"Novos slots de item, separados do Rank e da Talica.",guidePath:"/forum/01-2/topic/16"},
 {name:"Tálica de Favor",active:true,icon:"⛨",detail:"Ajuste de balanceamento: a defesa que ela dá agora é real de verdade.",guidePath:"/forum/01-2/topic/15"},
 {name:"Tooltip de Skills e Buffs",active:true,icon:"◉",detail:"Tooltip mostra o valor real do efeito, direto na tela.",guidePath:"/forum/01-2/topic/17"},
 {name:"Efeitos Especiais Estendidos",active:true,icon:"✦",detail:"Até 10 efeitos especiais por item."},
 {name:"Auto Rollup de Efeitos Especiais",active:true,icon:"↻",detail:"Em drop, abertura de caixa e outras fontes de item."},
 {name:"Guild Passives System",active:true,icon:"♜"},
 {name:"Quests Diárias",active:true,icon:"☀"},
 {name:"Anúncio Global de Boss",active:true,icon:"☠",detail:"Aviso pra todo o servidor quando um boss nasce e quando ele morre."},
 {name:"XP no Maul",active:true,icon:"⚙",detail:"Ganha experiência normalmente enquanto pilota o Maul."},
 {name:"Armadilhas de Caçador",active:true,icon:"⌖",detail:"Também podem ser usadas pra matar monstro e ganhar XP."},
 {name:"Torres de Caçador",active:true,icon:"♖",detail:"Também podem ser usadas pra matar monstro e ganhar XP."},
 {name:"Dungeon Solo",active:true,icon:"◐"},
 {name:"Dungeon PvP",active:true,icon:"⚔"},
 {name:"Destruir chave do M.A.U. ao explodir",active:false,icon:"⚷"}
] as const;
