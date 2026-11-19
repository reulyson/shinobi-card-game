export interface NinjaVoiceQuote {
  chuunin: string;
  jounnin: string;
  pitch: number;
  rate: number;
}

const DEFAULT_QUOTE: NinjaVoiceQuote = {
  chuunin: 'Meu chakra despertou para o próximo nível!',
  jounnin: 'Alcancei o domínio completo de um Jounnin!',
  pitch: 1.0,
  rate: 1.03,
};

export const NINJA_VOICE_LINES: Record<string, NinjaVoiceQuote> = {
  naruto_uzumaki: {
    chuunin: 'Tô certo! Eu nunca volto atrás na minha palavra!',
    jounnin: 'Esse é o meu jeito ninja! Rasengan!',
    pitch: 1.15,
    rate: 1.08,
  },
  sasuke_uchiha: {
    chuunin: 'O Sharingan enxerga cada movimento seu.',
    jounnin: 'Meu poder Uchiha superou todos os limites!',
    pitch: 0.9,
    rate: 1.0,
  },
  sakura_haruno: {
    chuunin: 'Não vou mais ficar para trás! Shannaro!',
    jounnin: 'A força do Byakugou finalmente despertou!',
    pitch: 1.2,
    rate: 1.06,
  },
  kakashi_hatake: {
    chuunin: 'Aqueles que abandonam seus amigos são piores que lixo.',
    jounnin: 'O Ninja Copiador entra em ação. Raikiri!',
    pitch: 0.85,
    rate: 0.96,
  },
  hinata_hyuga: {
    chuunin: 'Eu também não vou voltar atrás na minha palavra!',
    jounnin: 'Byakugan! Passo Gentil dos Leões Gêmeos!',
    pitch: 1.24,
    rate: 0.98,
  },
  kiba_inuzuka: {
    chuunin: 'Vamos com tudo, Akamaru! Presa sobre Presa!',
    jounnin: 'Ninguém escapa do nosso faro implacável!',
    pitch: 1.08,
    rate: 1.08,
  },
  shino_aburame: {
    chuunin: 'Meus insetos já cercaram todo o campo.',
    jounnin: 'A colmeia Aburame não deixa brechas.',
    pitch: 0.84,
    rate: 0.94,
  },
  kurenai_yuhi: {
    chuunin: 'Você já caiu na minha ilusão.',
    jounnin: 'Genjutsu supremo: aprisionamento da árvore demoníaca!',
    pitch: 1.14,
    rate: 0.98,
  },
  rock_lee: {
    chuunin: 'O esforço sempre supera o dom natural!',
    jounnin: 'Os Oito Portões Internos foram liberados!',
    pitch: 1.12,
    rate: 1.1,
  },
  neji_hyuga: {
    chuunin: 'O destino não pode se esconder do Byakugan.',
    jounnin: 'Rotação dos Oito Trigramas: Sessenta e Quatro Palmas!',
    pitch: 0.92,
    rate: 1.0,
  },
  tenten: {
    chuunin: 'Nenhuma arma ninja erra o meu alvo!',
    jounnin: 'Arsenal infinito liberado no campo de batalha!',
    pitch: 1.18,
    rate: 1.05,
  },
  might_guy: {
    chuunin: 'Queime com a chama da juventude!',
    jounnin: 'Sinta a força da Besta Verde de Konoha!',
    pitch: 0.95,
    rate: 1.08,
  },
  shikamaru_nara: {
    chuunin: 'Que problemático... mas eu já previ esse movimento.',
    jounnin: 'Xeque-mate. Jutsu Possessão das Sombras!',
    pitch: 0.88,
    rate: 0.95,
  },
  ino_yamanaka: {
    chuunin: 'Sua mente agora pertence à formação Ino-Shika-Cho!',
    jounnin: 'Transferência Mental concluída com perfeição!',
    pitch: 1.2,
    rate: 1.04,
  },
  choji_akimichi: {
    chuunin: 'Nunca mexa com os meus amigos ou com meu último salgadinho!',
    jounnin: 'Asas de Chakra do clã Akimichi, liberar!',
    pitch: 0.96,
    rate: 1.02,
  },
  asuma_sarutobi: {
    chuunin: 'Lâminas de chakra afiadas para proteger o rei.',
    jounnin: 'A Vontade do Fogo queima nas minhas lâminas!',
    pitch: 0.82,
    rate: 0.96,
  },
  orochimaru: {
    chuunin: 'Todo jutsu deste mundo será meu.',
    jounnin: 'A imortalidade serpenteia pelas sombras!',
    pitch: 0.78,
    rate: 0.92,
  },
  jiraiya: {
    chuunin: 'O Sábio dos Sapos nunca foge de uma boa batalha!',
    jounnin: 'Modo Eremita do Monte Myoboku ativado!',
    pitch: 0.86,
    rate: 1.0,
  },
  tsunade: {
    chuunin: 'Nenhum aliado cairá enquanto eu estiver aqui!',
    jounnin: 'Cem Curas liberado: a Quinta Hokage entra em campo!',
    pitch: 1.1,
    rate: 1.0,
  },
  kabuto_yakushi: {
    chuunin: 'Cada ferimento se torna dados para minha vitória.',
    jounnin: 'Minha ciência ninja superou o próprio mestre.',
    pitch: 0.92,
    rate: 1.0,
  },
  kimimaro: {
    chuunin: 'A dança dos ossos do clã Kaguya começou.',
    jounnin: 'Dança da Samambaia! Ninguém sobrevive!',
    pitch: 0.88,
    rate: 0.96,
  },
  jirobo: {
    chuunin: 'Sua energia agora alimenta a minha força bruta!',
    jounnin: 'Selo Amaldiçoado em nível máximo!',
    pitch: 0.76,
    rate: 0.95,
  },
  kidomaru: {
    chuunin: 'Minha teia dourada já prendeu sua fuga.',
    jounnin: 'Disparo preciso do arqueiro do Som!',
    pitch: 0.94,
    rate: 1.03,
  },
  sakon_ukon: {
    chuunin: 'Dois corpos atacando como um só!',
    jounnin: 'Não há defesa contra o ataque duplo do Som!',
    pitch: 0.88,
    rate: 1.04,
  },
  tayuya: {
    chuunin: 'Ouça a melodia sombria da minha flauta!',
    jounnin: 'Sinfonia demoníaca de genjutsu liberada!',
    pitch: 1.16,
    rate: 1.05,
  },
  hashirama_senju: {
    chuunin: 'A floresta responde ao chamado do Primeiro Hokage!',
    jounnin: 'Estilo Madeira: O Nascimento do Mundo das Árvores!',
    pitch: 0.82,
    rate: 0.97,
  },
  tobirama_senju: {
    chuunin: 'Minha lâmina de água corta qualquer defesa.',
    jounnin: 'Deus Voador do Trovão: golpe instantâneo!',
    pitch: 0.84,
    rate: 1.0,
  },
  hiruzen_sarutobi: {
    chuunin: 'Onde as folhas dançam, o fogo sempre arde.',
    jounnin: 'O Professor conhece todos os jutsus de Konoha!',
    pitch: 0.8,
    rate: 0.95,
  },
  minato_namikaze: {
    chuunin: 'O Relâmpago Amarelo de Konoha está no campo.',
    jounnin: 'Mais rápido que um relâmpago: Hiraishin no Jutsu!',
    pitch: 0.94,
    rate: 1.05,
  },
  gaara: {
    chuunin: 'A areia absoluta protege a minha existência.',
    jounnin: 'Caixão de Areia! Sinta a fúria do deserto!',
    pitch: 0.82,
    rate: 0.94,
  },
  temari: {
    chuunin: 'Meu leque gigante vai varrer você da arena!',
    jounnin: 'Furacão cortante da Folha e da Areia!',
    pitch: 1.12,
    rate: 1.05,
  },
  kankuro: {
    chuunin: 'Minhas marionetes controlam o palco inteiro.',
    jounnin: 'Teatro Negro: nenhuma saída para o alvo!',
    pitch: 0.9,
    rate: 1.02,
  },
  baki: {
    chuunin: 'A Lâmina de Vento da Areia não deixa rastros.',
    jounnin: 'Ataque furtivo consumado em um instante!',
    pitch: 0.84,
    rate: 0.98,
  },
  zabuza_momochi: {
    chuunin: 'Na névoa silenciosa, o Demônio Oculto ataca.',
    jounnin: 'A Kubikiribocho não perdoa os fracos!',
    pitch: 0.76,
    rate: 0.93,
  },
  haku: {
    chuunin: 'Eu luto por quem me deu um propósito.',
    jounnin: 'Espelhos Demoníacos de Cristal de Gelo!',
    pitch: 1.12,
    rate: 0.98,
  },
  iruka_umino: {
    chuunin: 'Como instrutor, protejo a próxima geração!',
    jounnin: 'A Vontade do Fogo vive em cada aluno meu!',
    pitch: 0.96,
    rate: 1.02,
  },
  anko_mitarashi: {
    chuunin: 'A Floresta da Morte é o meu território!',
    jounnin: 'Serpentes gêmeas e marcas de batalha liberadas!',
    pitch: 1.15,
    rate: 1.06,
  },
  shizune: {
    chuunin: 'Ninjutsu médico e veneno em perfeita harmonia.',
    jounnin: 'Suporte absoluto para manter Konoha de pé!',
    pitch: 1.16,
    rate: 1.0,
  },
  hayate_gekko: {
    chuunin: 'A Dança da Lua Crescente corta através do vento.',
    jounnin: 'Três lâminas em um único piscar de olhos!',
    pitch: 0.88,
    rate: 1.0,
  },
};

export function getNinjaLevelUpQuote(
  cardId: string,
  evolutionLevel: 2 | 3
): { text: string; pitch: number; rate: number } {
  const entry = NINJA_VOICE_LINES[cardId] || DEFAULT_QUOTE;
  return {
    text: evolutionLevel === 3 ? entry.jounnin : entry.chuunin,
    pitch: entry.pitch,
    rate: entry.rate,
  };
}
