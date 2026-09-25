// Textos em português das classes e skills do ramo Ranger de Accretia.
// Os números (custo, recarga, dano, duração) NÃO ficam aqui: vêm de accretia-ranger.json, lido dos arquivos do jogo.

export const classSlugs: Record<string, string> = {
  ARF1: "gunner",
  ARF2: "scouter",
  ARS1: "striker",
  ARS2: "dementer",
  ARS3: "phantom-shadow",
  ART1: "bombardier",
  ART2: "railgunner",
  ART3: "demolisher",
};

export const classTitles: Record<string, string> = {
  ARF1: "Gunner",
  ARF2: "Scouter",
  ARS1: "Striker",
  ARS2: "Dementer",
  ARS3: "Phantom Shadow",
  ART1: "Bombardier",
  ART2: "Railgunner",
  ART3: "Demolisher",
};

export const classGradeLabel: Record<number, string> = {
  1: "1ª EVOLUÇÃO",
  2: "2ª EVOLUÇÃO",
  3: "3ª EVOLUÇÃO",
};

export const classLead: Record<string, string> = {
  ARF1: "Gunners combatem tanto à distância quanto corpo a corpo. Todos os soldados Accretia podem usar Launchers, mas os Gunners são estruturados especificamente para o uso do Launcher.",
  ARF2: "Os Scouts são feitos para combate à distância e para armar e desarmar armadilhas. Por isso, as skills de classe do Scout priorizam técnicas de armadilha.",
  ARS1: "As unidades Striker (Annihilator) são as mais bem projetadas para o uso do Launcher. Formam uma força quase invencível em combate.",
  ARS2: "As unidades Dementer (Desolator) têm capacidade de tirar aliados de situações perigosas e conseguem ignorar os mandatos de autopreservação.",
  ARS3: "Ofensiva forte e maior velocidade permitem às unidades Phantom Shadow (Infiltrator) causar dano crítico. São frequentemente enviadas para infiltrar quartéis-generais inimigos.",
  ART1: "Bombardiers são a artilharia pesada de Accretia: marcam alvos para a bateria, fazem chover fogo sobre posições inteiras e mantêm o Launcher ciclando mais rápido enquanto nanitos de reparo os mantêm de pé. Terceira promoção para Striker, Dementer e Phantom Shadow.",
  ART2: "Railgunners são os atiradores de precisão de Accretia, corpos construídos em torno de um único rifle de trilho. Travam numa postura de tiro, estendem as miras e disparam projéteis perfurantes de além do alcance inimigo. Terceira promoção para Striker, Dementer e Phantom Shadow.",
  ART3: "Demolishers dominam o terreno: prendem alvos com redes magnéticas, espalham rajadas de fragmentação, somem numa névoa térmica e carregam mais armadilhas que qualquer outro Ranger. Terceira promoção para Striker, Dementer e Phantom Shadow.",
};

export const skillPt: Record<string, string> = {
  "4F0EA": "Causa um flash cegante e uma explosão alta que desorientam o alvo e reduzem temporariamente a esquiva dele.",
  "410EB": "O usuário fixa sua massa e dispara um poderoso tiro de Launcher.",
  "410EC": "Usando o kit de cerco como plataforma de catapulta, o usuário dispara um tiro explosivo de Launcher no alvo e nos inimigos próximos.",
  "4F0ED": "Ativa a blindagem furtiva e torna o usuário temporariamente invisível para os inimigos.",
  "4F0EE": "Instala minas de proximidade que explodem quando um inimigo passa por cima.",
  "4F0EF": "Encontra armadilhas escondidas detectando compostos químicos não orgânicos.",
  "410ED": "Ataque devastador de Launcher usando reservas de energia.",
  "410EF": "Usando o kit de cerco como plataforma estável, dispara rapidamente três séries de ataques de Launcher contra um alvo.",
  "4F0F1":
    "Operando o kit de cerco no limite da tolerância estrutural, em vez dos limites de segurança, o usuário aumenta temporariamente o ataque e a defesa enquanto estiver em modo cerco.",
  "4F0F3": "Sobrecarregando o núcleo de energia, o usuário se autodestrói e causa dano massivo aos inimigos ao redor.",
  "4F0FA": "Aumenta o poder de ataque à distância maximizando a saída do motor.",
  "4F0F5": "Instala um farol de teletransporte que leva os membros do grupo de volta ao ponto de retorno do usuário.",
  "4100C": "Aumenta a taxa de precisão do ataque.",
  "400F6": "Ataque poderoso que ignora as defesas do alvo. Só pode ser usado enquanto estiver com Cloaking ativo.",
  "4F0F7": "Compartimentos extras projetados para carregar mais armadilhas.",
  "4F0FC": "Marca o alvo para a bateria, reduzindo sua Defesa Final em 20% e sua esquiva em 20 por 90 segundos.",
  "410FD": "Chama um tapete de foguetes sobre a zona alvo, causando 305% do dano da arma a todos os inimigos no raio da explosão. Exige Launcher.",
  "4F0FE": "Aciona os amortecedores de recuo: Defesa Final +25%, ataque de Launcher +10% e velocidade de movimento +1,0 por 1080 segundos.",
  "4F0FF": "Coloca o Launcher em modo vigilância, reduzindo o atraso de ataque em 1000 ms por 15 segundos.",
  "4F100": "Libera uma nuvem de nanitos de reparo que restaura instantaneamente 30% do seu HP máximo.",
  "4F101": "Trava o corpo numa postura de tiro: ataque à distância e ataque de skill à distância +25% e precisão +30, ao custo de 20 de esquiva, por 1080 segundos.",
  "41102": "Carrega o trilho e dispara um projétil perfurante, causando 380% do dano da arma. Alcança 100 a mais que um tiro normal. Exige arma de fogo.",
  "4F103": "Instala uma mira térmica: alcance de ataque de arma de fogo +100 e taxa de crítico +20 por 1080 segundos.",
  "4F104": "Aciona os propulsores traseiros: velocidade de movimento +2,5 e esquiva +10 por 6 segundos.",
  "41105": "Descarrega todo o banco de capacitores num único tiro superalimentado, causando 450% do dano da arma a um alvo. Exige arma de fogo.",
  "4F106": "Dispara uma rede magnética que prende o alvo, bloqueando seu movimento por 5 segundos.",
  "41107": "Detona uma carga de fragmentação no alvo, causando 156% do dano da arma a todos os inimigos num raio pequeno. Exige arma de longa distância.",
  "4F108": "Desvia calor e luz ao redor do corpo, deixando você invisível e aumentando a velocidade de movimento em 1,0 por 20 segundos. Atacar quebra a camuflagem.",
  "4F109": "Espalha uma malha de sensores que revela armadilhas inimigas e aumenta a precisão à distância em 20 por 1080 segundos.",
};

export const effectLabelPt: Record<string, string> = {
  "Ranged Attack Rate": "Ataque à distância",
  "Ranged Skill Attack Rate": "Ataque de skill à distância",
  "Close Range Attack Rate": "Ataque corpo a corpo",
  "Close Range Skill Attack Rate": "Ataque de skill corpo a corpo",
  "Siege Attack Rate": "Ataque em modo cerco",
  "Siege Defense Rate": "Defesa em modo cerco",
  "Final Defense Rate": "Defesa final",
  "Launcher Attack Rate": "Ataque de Launcher",
  "Avoid Rate": "Esquiva",
  "Ranged Attack Accuracy": "Precisão à distância",
  "Ranged Attack Distance": "Alcance de ataque à distância",
  "Ranged Skill Attack Distance": "Alcance de skill à distância",
  "Critical Rate": "Taxa de crítico",
  "Move/Run Speed": "Velocidade de movimento",
  "Move Restricted": "Movimento bloqueado",
  Stealth: "Furtividade",
  "Trap Detection": "Detecção de armadilhas",
  Invisible: "Invisível",
  "Max HP": "HP máximo",
};

export const weaponNames: Record<number, string> = {
  6: "Arma de fogo",
  7: "Launcher",
  8: "Arremesso",
};
