import type { Keyword, RecurringTrigger } from '../types/game';
import { RECURRING_TRIGGER_HELP, RECURRING_TRIGGER_LABEL } from '../types/game';

/** Explicação de 1 linha de cada palavra-chave (mesmo sentido do glossário das regras). */
export const KEYWORD_SHORT_HELP: Record<Keyword, string> = {
  Elusivo: 'Só pode ser bloqueado por Furtivo ou Visão Ninja.',
  'Visão Aguçada': 'Pode bloquear Furtivos e vê os Ocultos do rival.',
  Sobrepujar: 'Dano além da Vida do bloqueador vai para a Vitalidade.',
  'Ataque Rápido': 'Ao atacar, golpeia antes do bloqueador.',
  'Ataque Duplo': 'Ao atacar, golpeia antes e de novo junto com o bloqueador.',
  Desafiador: 'Ao atacar, você escolhe quem do rival bloqueia.',
  Assustador: 'Só pode ser bloqueado por Poder 3+.',
  Imprudente: 'Só pode ser bloqueado por Vida 3+.',
  Formidável: 'Golpeia usando a Vida no lugar do Poder.',
  Impacto: 'Ao golpear atacando, causa 1 de dano à Vitalidade.',
  'Não Bloqueia': 'Não pode bloquear.',
  Imóvel: 'Não pode atacar nem bloquear.',
  Barreira: 'Anula o próximo dano nesta rodada.',
  'Escudo de Feitiço': 'Anula o próximo Jutsu ou efeito inimigo nela.',
  Robusto: 'Sofre 1 de dano a menos.',
  Regeneração: 'Recupera toda a Vida no início da rodada.',
  Imortal: 'Na 1ª morte, volta Paralisada com 1 de Vida.',
  'Roubo de Vida': 'O dano que causa cura a sua Vitalidade.',
  Drenar: 'O dano deste efeito cura a sua Vitalidade.',
  Efêmero: 'Morre ao golpear ou no fim da rodada.',
  Vulnerável: 'Atacantes rivais podem forçá-la a bloquear.',
  Fúria: 'Ganha +1/+1 ao abater uma unidade em combate.',
  Destinado: 'Ganha +1/+1 na 1ª vez por rodada que você a alveja.',
  Aperfeiçoar: 'Ganha +1/+0 ao jogar cartas criadas ou equipar aliados.',
  Evoluir: 'Ganha +2/+2 após você jogar 6 palavras-chave positivas diferentes.',
  Sagrado: 'Ao morrer, dá +1/+0 ao próximo atacante aliado.',
  Sintonia: 'Ao entrar, recarrega +1 de Reserva de Jutsu.',
  Fluxo: 'Ativa na rodada seguinte se você conjurou 2+ Jutsus.',
  Auxiliar: 'Ao atacar, dá bônus ao aliado à direita.',
  Imbuir: 'Dispara sempre que você resolve um Jutsu.',
  Contagem: 'Perde 1 marcador por rodada; dispara ao zerar.',
  Veneno: 'Ao golpear e causar dano, envenena: no início da rodada o alvo sofre 1 de dano, por X rodadas (não acumula, renova).',
  Parceiro: 'Token que acompanha um Ninja: se o Ninja sair de campo, o Parceiro vai com ele.',
  Formação: 'Bônus +1/+1 enquanto você tiver 3+ aliados em campo (Tokens contam). Nunca é requisito.',
  Copiar: 'Quando um Jutsu rival resolve (não Exclusivo), cria uma cópia Fugaz na sua mão. 1 vez por rodada.',
};

/** Estados temporários mostrados como chips no inspetor. */
export const STATUS_SHORT_HELP = {
  stunned: { label: 'Paralisado', help: 'Fora do combate: não ataca nem bloqueia nesta rodada.' },
  frozen: { label: 'Bloqueio de Chakra', help: 'Poder 0 nesta rodada.' },
  silenced: { label: 'Selado', help: 'Sem habilidades nem palavras-chave; Equipamento desligado.' },
  barrier: { label: 'Substituição ativa', help: 'Anula o próximo dano nesta rodada.' },
  spellShield: { label: 'Contra-Jutsu ativo', help: 'Anula o próximo Jutsu ou efeito inimigo.' },
  genjutsu: { label: 'Genjutsu', help: 'Não ataca nem bloqueia até o fim da próxima rodada. Kai remove.' },
  poison: { label: 'Envenenado', help: 'No início da rodada sofre 1 de dano (ignora Substituição e Resistente).' },
  formation: { label: 'Formação ativa', help: '+1/+1 enquanto você tiver 3+ aliados em campo.' },
  partner: { label: 'Parceiro', help: 'Sai de campo junto com o Ninja que acompanha.' },
} as const;

/** Gatilhos que aparecem em negrito no início das frases de habilidade. */
const TRIGGER_WORDS = [
  'Entrada',
  'Investida',
  'Último Desejo',
  'Se for sua 1ª carta da rodada',
  'Se você já jogou outra carta nesta rodada',
  'Se você já causou dano à Vitalidade rival nesta rodada',
  'Formação',
  'Copiar',
  'Meditação',
  'Fluxo de Chakra',
  'Apoio',
  'Ao golpear',
  'Ao bloquear',
  'Ao atacar',
  'Ao conjurar',
  'Vingança',
  'Repouso',
  'Ao morrer',
  'Início da rodada',
  'Fim da rodada',
  'Passiva',
  'Aura',
  'Armar',
  'Disparo',
  'Ativação',
  'Cadeia de Jutsus',
  'Contagem',
  'Instantâneo',
  'Rápido',
  'Preparado',
  'Concentrado',
  'Oculto',
];

export interface AbilityLine {
  trigger?: string;
  text: string;
}

/**
 * Quebra um texto de habilidade em linhas curtas, separando o gatilho ("Entrada:",
 * "Investida:", "Último Desejo:"…) para exibir em negrito.
 */
export function splitAbilityText(text: string | undefined): AbilityLine[] {
  if (!text) return [];
  const clean = text.replace(/\s+/g, ' ').trim();
  // Quebra antes de cada gatilho conhecido seguido de ':' ou em fim de frase.
  const triggerAlt = TRIGGER_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = clean
    .split(new RegExp(`(?<=[.!])\\s+|\\s*(?=\\b(?:${triggerAlt})\\s*(?:\\([^)]*\\))?\\s*:)`, 'u'))
    .map((p) => p.trim())
    .filter(Boolean);
  const out: AbilityLine[] = [];
  for (const p of parts) {
    const m = p.match(new RegExp(`^((?:${triggerAlt})(?:\\s*\\([^)]*\\))?)\\s*:\\s*(.*)$`, 'u'));
    if (m) out.push({ trigger: m[1], text: m[2] });
    else if (out.length > 0 && !out[out.length - 1].text) out[out.length - 1].text = p;
    else {
      // Gatilhos livres: "Quando o rival atacar:", "Ao Provocar:", "Ao golpear:"…
      const free = p.match(/^((?:Quando|Ao|Sempre que)\s[^:]{2,45}):\s*(.+)$/u);
      if (free) out.push({ trigger: free[1], text: free[2] });
      else out.push({ text: p });
    }
  }
  return out;
}

/** Explicação de 1 linha de um gatilho recorrente pelo nome exibido ("Início da rodada", "Vingança"…). */
export function getTriggerHelp(trigger: string | undefined): string | undefined {
  if (!trigger) return undefined;
  const base = trigger.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
  if (base === 'ao atacar') return RECURRING_TRIGGER_HELP.ao_atacar;
  for (const k of Object.keys(RECURRING_TRIGGER_LABEL) as RecurringTrigger[]) {
    if (RECURRING_TRIGGER_LABEL[k].toLowerCase() === base) return RECURRING_TRIGGER_HELP[k];
  }
  return undefined;
}
