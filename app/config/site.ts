export const siteConfig={
 name:"RF Ascension",operator:"CCR",locale:"pt-BR",timezone:"America/Sao_Paulo",
 launchAt:"2026-08-21T20:00:00-03:00",launchLabel:"21/08/2026 às 20:00",
 betaNoWipe:true,founderSlots:100,cashPerReal:1000,
 routes:{home:"/",download:"/#download",forum:"/forum",donation:"/doacao",account:"/conta",preRegister:"/pre-cadastro",admin:"/admin"},
 founderRewards:["Set de Potions oficiais do servidor","Gerador exclusivo por 7 dias","Box de materiais de craft","Skin exclusiva de abertura"],
 legal:{privacy:"/legal/privacidade",cookies:"/legal/cookies",terms:"/legal/termos"}
} as const;
export const donationPackages=[
 {id:"starter",name:"Iniciante",priceBRL:49.9,baseCash:49900,bonusPercent:0,totalCash:49900,premiumDays:30},
 {id:"ascendant",name:"Ascendente",priceBRL:109.9,baseCash:109900,bonusPercent:10,totalCash:120890,premiumDays:30},
 {id:"dominator",name:"Dominador",priceBRL:179.9,baseCash:179900,bonusPercent:15,totalCash:206885,premiumDays:30},
 {id:"emperor",name:"Imperador",priceBRL:300,baseCash:300000,bonusPercent:30,totalCash:390000,premiumDays:30}
] as const;
