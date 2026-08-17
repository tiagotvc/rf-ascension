export const siteConfig={
 name:"RF Ascension",operator:"CCR",locale:"pt-BR",timezone:"America/Sao_Paulo",
 launchAt:"2026-08-21T20:00:00-03:00",launchLabel:"21/08/2026 às 20:00",
 cashPerReal:1000,
 routes:{home:"/",download:"/#download",forum:"/forum",donation:"/doacao",account:"/conta",admin:"/admin"},
 legal:{privacy:"/legal/privacidade",cookies:"/legal/cookies",terms:"/legal/termos"}
} as const;
export const serverRates=[
 {value:"10x",label:"Experiência (XP)"},
 {value:"x4",label:"Venda (valor original)"},
 {value:"x3",label:"PT / Skill"},
 {value:"x5",label:"Drop"},
 {value:"16",label:"Membros por grupo"},
 {value:"16",label:"Buffs ativos"},
 {value:"100",label:"Membros de guilda"},
 {value:"255",label:"Stack de item"}
] as const;
export const serverSystems=[
 {name:"Consil Armor",active:false},
 {name:"CCR Box",active:false},
 {name:"Novo Sistema de Itens",active:true,detail:"Upgrade de Talica (com talicas novas), Sistema de Runas e Rank Up System."},
 {name:"Efeitos Especiais Estendidos",active:true,detail:"Até 10 efeitos especiais por item."},
 {name:"Auto Rollup de Efeitos Especiais",active:true,detail:"Em drop, abertura de caixa e outras fontes de item."},
 {name:"Guild Passives System",active:true},
 {name:"Guild Research System",active:true}
] as const;
export const donationPackages=[
 {id:"starter",name:"Iniciante",priceBRL:49.9,baseCash:49900,bonusPercent:0,totalCash:49900,premiumDays:30},
 {id:"ascendant",name:"Ascendente",priceBRL:109.9,baseCash:109900,bonusPercent:10,totalCash:120890,premiumDays:30},
 {id:"dominator",name:"Dominador",priceBRL:179.9,baseCash:179900,bonusPercent:15,totalCash:206885,premiumDays:30},
 {id:"emperor",name:"Imperador",priceBRL:300,baseCash:300000,bonusPercent:30,totalCash:390000,premiumDays:30}
] as const;
