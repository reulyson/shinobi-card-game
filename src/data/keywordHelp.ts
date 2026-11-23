import type { Keyword, OcultoTriggerType, RecurringAbility, RecurringTrigger } from '../types/game';
import { KEYWORD_DISPLAY_NAME, RECURRING_TRIGGER_HELP, RECURRING_TRIGGER_LABEL } from '../types/game';

/** Explicação de 1 linha de cada palavra-chave (mesmo sentido do glossário das regras). */
export const KEYWORD_SHORT_HELP: Record<Keyword, string> = {
  Furtivo: 'Só pode ser bloqueado por Furtivo ou Sensor.',
  'Sensor': 'Pode bloquear Furtivos e vê os Ocultos do rival.',
  Perfurante: 'Dano além da Vida do bloqueador vai para a Vitalidade.',
  'Ágil': 'Ao atacar, golpeia antes do bloqueador.',
  'Veloz': 'Ao atacar, golpeia antes e de novo junto com o bloqueador.',
  Provocar: 'Ao atacar, você escolhe quem do rival bloqueia.',
  Intimidação: 'Só pode ser bloqueado por Poder 3+.',
  Imprudente: 'Só pode ser bloqueado por Vida 3+.',
  Muralha: 'Golpeia usando a Vida no lugar do Poder.',
  Impacto: 'Ao golpear atacando, causa 1 de dano à Vitalidade.',
  'Indefeso': 'Não pode bloquear.',
  Imobilizado: 'Não pode atacar nem bloquear.',
  Esquiva: 'Anula o próximo dano nesta rodada.',
  'Anulação': 'Anula o próximo Jutsu ou efeito inimigo nela.',
  Resistente: 'Sofre 1 de dano a menos.',
  Regenerar: 'Recupera toda a Vida no início da rodada.',
  Renascer: 'Na 1ª morte, volta Paralisada com 1 de Vida.',
  'Roubo de Vida': 'O dano que causa cura a sua Vitalidade.',
  Drenar: 'O dano deste efeito cura a sua Vitalidade.',
  Clone: 'Morre ao golpear ou no fim da rodada.',
  Exposto: 'Atacantes rivais podem forçá-la a bloquear.',
  Fúria: 'Ganha +1/+1 ao abater uma unidade em combate.',
  Determinação: 'Ganha +1/+1 na 1ª vez por rodada que você a alveja.',
  Treinamento: 'Ganha +1/+0 ao jogar cartas criadas ou equipar aliados.',
  Despertar: 'Ganha +2/+2 após você jogar 6 palavras-chave positivas diferentes.',
  Legado: 'Ao morrer, dá +1/+0 ao próximo atacante aliado.',
  Concentrar: 'Ao entrar, recarrega +1 de Reserva de Jutsu.',
  Fluxo: 'Ativa na rodada seguinte se você conjurou 2+ Jutsus.',
  Apoio: 'Ao atacar, dá bônus ao aliado à direita.',
  Ressonância: 'Dispara sempre que você resolve um Jutsu.',
  Contagem: 'Perde 1 marcador por rodada; dispara ao zerar.',
  Veneno:
    'Ao golpear e causar dano, envenena: no início da rodada o alvo sofre 1 de dano, por X rodadas (não acumula, renova).',
  Parceiro: 'Token que acompanha um Ninja: se o Ninja sair de campo, o Parceiro vai com ele.',
  Formação:
    'Bônus +1/+1 enquanto você tiver 3+ aliados em campo (Tokens contam). Nunca é requisito.',
  Copiar:
    'Quando um Jutsu rival resolve (não Exclusivo), cria uma cópia Fugaz na sua mão. 1 vez por rodada.',
};

/** Estados temporários mostrados como chips no inspetor. */
export const STATUS_SHORT_HELP = {
  stunned: { label: 'Paralisado', help: 'Não ataca nem bloqueia nesta rodada.' },
  frozen: { label: 'Bloqueio de Chakra', help: 'Poder 0 nesta rodada.' },
  silenced: { label: 'Selado', help: 'Sem habilidades nem palavras-chave; Equipamento desligado.' },
  barrier: { label: 'Esquiva', help: 'Anula o próximo dano nesta rodada.' },
  spellShield: { label: 'Anulação', help: 'Anula o próximo Jutsu ou efeito inimigo.' },
  genjutsu: { label: 'Genjutsu', help: 'Não ataca nem bloqueia até Kai remover.' },
  poison: { label: 'Envenenado', help: '1 de dano no início da rodada por X rodadas.' },
  formation: { label: 'Formação ativa', help: '+1/+1 enquanto você tiver 3+ aliados em campo.' },
  exposed: { label: 'Exposto', help: 'Atacantes podem forçar a bloquear.' },
  exhausted: { label: 'Exaustão', help: '-1/-1 aplicado por efeito.' },
  indefeso: { label: 'Indefeso', help: 'Não pode bloquear.' },
  fleeting: { label: 'Cópia Fugaz', help: 'Cópia que some da mão no fim da rodada.' },
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
  'Concentrar',
  'Ressonância',
  'Fluxo',
  'Apoio',
  'Ao golpear',
  'Ao bloquear',
  'Ao atacar',
  'Ao abater',
  'Ao sofrer dano',
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

export type TermCategory = 'keyword' | 'status' | 'trigger' | 'action';

export interface ExtractedTerm {
  key: string;
  category: TermCategory;
  label: string;
  help: string;
  keyword?: Keyword;
}

const TEXT_KEYWORD_RULES: Array<{ kw: Keyword; pattern: RegExp }> = [
  { kw: 'Furtivo', pattern: /\bFurtiv[oa]s?\b/i },
  { kw: 'Sensor', pattern: /\bSensor(?:es)?\b/i },
  { kw: 'Perfurante', pattern: /\bPerfurante\b/i },
  { kw: 'Ágil', pattern: /\bÁgil\b/i },
  { kw: 'Veloz', pattern: /\bVeloz\b/i },
  { kw: 'Provocar', pattern: /\bProvocar\b/i },
  { kw: 'Intimidação', pattern: /\bIntimidação\b/i },
  { kw: 'Imprudente', pattern: /\bImprudente\b/i },
  { kw: 'Muralha', pattern: /\bMuralha\b/i },
  { kw: 'Impacto', pattern: /\bImpacto\b/i },
  { kw: 'Imobilizado', pattern: /\bImobilizad[oa]s?\b/i },
  { kw: 'Resistente', pattern: /\bResistente\b/i },
  { kw: 'Regenerar', pattern: /\bRegenerar\b/i },
  { kw: 'Renascer', pattern: /\bRenascer\b/i },
  { kw: 'Roubo de Vida', pattern: /\bRoubo de Vida\b/i },
  { kw: 'Drenar', pattern: /\bDrenar\b(?!\s+\d+\s+de\s+Reserva|\s+Reserva)/i },
  { kw: 'Clone', pattern: /\bClone\b/i },
  { kw: 'Fúria', pattern: /\bFúria\b/i },
  { kw: 'Determinação', pattern: /\bDeterminação\b/i },
  { kw: 'Treinamento', pattern: /\bTreinamento\b/i },
  { kw: 'Despertar', pattern: /\bDespertar\b/i },
  { kw: 'Legado', pattern: /\bLegado\b/i },
  { kw: 'Concentrar', pattern: /\bConcentrar\b/i },
  { kw: 'Fluxo', pattern: /\bFluxo\b/i },
  { kw: 'Apoio', pattern: /\bApoio\b/i },
  { kw: 'Ressonância', pattern: /\bRessonância\b/i },
  { kw: 'Contagem', pattern: /\bContagem\b/i },
  { kw: 'Veneno', pattern: /\bVeneno\b/i },
  { kw: 'Parceiro', pattern: /\bParceiro\b/i },
  { kw: 'Formação', pattern: /\bFormação\b/i },
  { kw: 'Copiar', pattern: /\bCopiar\b/i },
];

const TEXT_STATUS_RULES: Array<{
  key: keyof typeof STATUS_SHORT_HELP;
  pattern: RegExp;
}> = [
  { key: 'barrier', pattern: /\bEsquiva\b/i },
  { key: 'spellShield', pattern: /\bAnulação\b/i },
  { key: 'stunned', pattern: /\bParalisad[oa]s?\b/i },
  { key: 'frozen', pattern: /\bBloqueio de Chakra\b/i },
  { key: 'silenced', pattern: /\bSelad[oa]s?\b/i },
  { key: 'genjutsu', pattern: /\bGenjutsu\b/i },
  { key: 'poison', pattern: /\bEnvenenad[oa]s?\b/i },
  { key: 'exposed', pattern: /\bExpost[oa]s?\b/i },
  { key: 'exhausted', pattern: /\bExaust(?:ão|ões)\b/i },
  { key: 'indefeso', pattern: /\bIndefes[oa]s?\b/i },
  { key: 'fleeting', pattern: /\bFugaz\b|\bFugazes\b/i },
];

const TEXT_TRIGGER_RULES: Array<{
  key: string;
  label: string;
  help: string;
  pattern: RegExp;
}> = [
  {
    key: 'entrada',
    label: 'Entrada',
    help: 'Dispara ao entrar em campo.',
    pattern: /\bEntrada(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'investida',
    label: 'Investida',
    help: RECURRING_TRIGGER_HELP.ao_atacar,
    pattern: /\b(?:Investida|Ao atacar)(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'ao_bloquear',
    label: 'Ao bloquear',
    help: RECURRING_TRIGGER_HELP.ao_bloquear,
    pattern: /\bAo bloquear(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'ao_golpear',
    label: 'Ao golpear',
    help: RECURRING_TRIGGER_HELP.ao_golpear,
    pattern: /\bAo golpear(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'ao_abater',
    label: 'Ao abater',
    help: 'Dispara ao matar a unidade inimiga em combate.',
    pattern: /\bAo abater(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'ao_sofrer_dano',
    label: 'Ao sofrer dano',
    help: 'Dispara ao perder Vida e sobreviver.',
    pattern: /\bAo sofrer dano(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'ao_conjurar',
    label: 'Ao conjurar',
    help: RECURRING_TRIGGER_HELP.ao_conjurar,
    pattern: /\bAo conjurar(?:\s+[^:]+)?\s*:/i,
  },
  {
    key: 'ultimo_desejo',
    label: 'Último Desejo',
    help: RECURRING_TRIGGER_HELP.ultimo_desejo,
    pattern: /\b(?:Último Desejo|Ao morrer)(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'vinganca',
    label: 'Vingança',
    help: RECURRING_TRIGGER_HELP.vinganca,
    pattern: /\bVingança(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'inicio_rodada',
    label: 'Início da rodada',
    help: RECURRING_TRIGGER_HELP.inicio_rodada,
    pattern: /\bInício da rodada(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'fim_rodada',
    label: 'Fim da rodada',
    help: RECURRING_TRIGGER_HELP.fim_rodada,
    pattern: /\bFim da rodada(?:\s*\([^)]*\))?\s*:/i,
  },
  {
    key: 'repouso',
    label: 'Repouso',
    help: RECURRING_TRIGGER_HELP.repouso,
    pattern: /\bRepouso(?:\s*\([^)]*\))?\s*:/i,
  },
];

const TEXT_ACTION_RULES: Array<{
  key: string;
  label: string;
  help: string;
  pattern: RegExp;
}> = [
  {
    key: 'causar_dano',
    label: 'Causar dano',
    help: 'Aplica dano a uma unidade ou à Vitalidade.',
    pattern: /\b\d+\s+de\s+dano\b|\bCause\s+\d+\s+de\s+dano\b/i,
  },
  {
    key: 'curar',
    label: 'Curar',
    help: 'Recupera Vida de uma unidade ou da Vitalidade.',
    pattern: /\bcur(?:e|a|ar)\b/i,
  },
  {
    key: 'paralisar',
    label: 'Paralisar',
    help: 'Aplica o status Paralisado ao alvo.',
    pattern: /\bParalis(?:e|a|ar)\b/i,
  },
  {
    key: 'selar',
    label: 'Selar',
    help: 'Aplica o status Selado ao alvo.',
    pattern: /\bSel(?:e|ar)\b/i,
  },
  {
    key: 'bloquear_chakra',
    label: 'Bloquear chakra',
    help: 'Aplica Bloqueio de Chakra ao alvo.',
    pattern: /\bBloquei(?:e|a|ar)\s+(?:o\s+)?chakra\b/i,
  },
  {
    key: 'envenenar',
    label: 'Envenenar',
    help: 'Aplica o status Envenenado ao alvo.',
    pattern: /\bEnvenen(?:e|a|ar)\b/i,
  },
  {
    key: 'kai',
    label: 'Kai',
    help: 'Remove Genjutsu e Selado de um aliado.',
    pattern: /\bKai\b/i,
  },
  {
    key: 'comprar',
    label: 'Comprar',
    help: 'Compra cartas do topo do baralho.',
    pattern: /\bcompr(?:e|a|ar)\b/i,
  },
  {
    key: 'drenar_reserva',
    label: 'Drenar Reserva',
    help: 'Retira Reserva de Jutsu do rival.',
    pattern: /\b(?:perde|drena)\s+\d+\s+de\s+Reserva\b/i,
  },
  {
    key: 'recarregar_reserva',
    label: 'Recarregar Reserva',
    help: 'Soma pontos na Reserva de Jutsu.',
    pattern: /\bRecarreg(?:ue|a|ar)\s+[^.]*\bReserva\b/i,
  },
  {
    key: 'criar',
    label: 'Criar',
    help: 'Cria uma carta diretamente na mão.',
    pattern: /\bcri(?:e|a|ar)\b/i,
  },
  {
    key: 'invocar',
    label: 'Invocar',
    help: 'Coloca uma unidade ou Token em campo.',
    pattern: /\binvo(?:que|ca|car)\b/i,
  },
  {
    key: 'equipar',
    label: 'Equipar',
    help: 'Anexa um Equipamento a um aliado.',
    pattern: /\bequip(?:e|a|ar)\b/i,
  },
  {
    key: 'pagar_vida',
    label: 'Pagar Vida',
    help: 'Paga pontos da sua própria Vitalidade como custo do efeito.',
    pattern: /\bpag(?:ar|a|ue)\s+\d+\s+de\s+Vida\b/i,
  },
  {
    key: 'recuar',
    label: 'Recuar',
    help: 'Devolve a carta à mão do dono, limpando bônus e efeitos.',
    pattern: /\bRecu(?:ar|e|a)\b/i,
  },
  {
    key: 'aprisionar',
    label: 'Aprisionar',
    help: 'Remove o alvo do campo até o capturador sair de jogo.',
    pattern: /\bAprision(?:ar|e|a)\b/i,
  },
  {
    key: 'atravessar',
    label: 'Atravessar',
    help: 'Ignora bloqueadores ou atinge direto através da defesa.',
    pattern: /\bAtravessar\b/i,
  },
];

const OCULTO_TRIGGER_HELP: Record<OcultoTriggerType, { label: string; help: string }> = {
  on_enemy_attack: {
    label: 'Quando o rival atacar',
    help: 'Carta virada ativa na declaração de ataque do rival.',
  },
  on_enemy_jutsu: {
    label: 'Quando o rival conjurar',
    help: 'Carta virada ativa quando o rival coloca um Jutsu na Pilha.',
  },
  on_enemy_summon: {
    label: 'Quando o rival invocar',
    help: 'Carta virada ativa quando o rival invoca um aliado.',
  },
};

/**
 * Extrai apenas os termos mencionados no texto visível da carta (e Oculto),
 * separados nos 4 grupos: palavra-chave, status, gatilho e ação.
 */
export function extractCardTextTerms(opts: {
  text?: string;
  levelUpText?: string;
  existingKeywords?: readonly Keyword[];
  recurring?: readonly RecurringAbility[];
  ocultoTrigger?: OcultoTriggerType;
}): ExtractedTerm[] {
  const { text = '', levelUpText = '', existingKeywords = [], recurring = [], ocultoTrigger } = opts;
  const out: ExtractedTerm[] = [];
  const seen = new Set<string>();
  const existingKwSet = new Set<Keyword>(existingKeywords);
  const fullVisibleText = levelUpText ? `${text} ${levelUpText}` : text;

  const push = (term: ExtractedTerm) => {
    const id = `${term.category}:${term.label.toLowerCase()}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(term);
  };

  // 1. Palavras-chave citadas no texto visível da carta (que já não estejam como keyword própria)
  for (const rule of TEXT_KEYWORD_RULES) {
    if (existingKwSet.has(rule.kw)) continue;
    if (rule.pattern.test(fullVisibleText)) {
      push({
        key: `tx-kw-${rule.kw}`,
        category: 'keyword',
        label: KEYWORD_DISPLAY_NAME[rule.kw] || rule.kw,
        help: KEYWORD_SHORT_HELP[rule.kw] ?? '',
        keyword: rule.kw,
      });
    }
  }

  // 2. Status mencionados no texto visível da carta
  for (const rule of TEXT_STATUS_RULES) {
    if (rule.pattern.test(fullVisibleText)) {
      const info = STATUS_SHORT_HELP[rule.key];
      push({
        key: `tx-st-${rule.key}`,
        category: 'status',
        label: info.label,
        help: info.help,
      });
    }
  }

  // 3. Gatilhos no texto da habilidade + Oculto (só os que aparecem na carta)
  for (const rule of TEXT_TRIGGER_RULES) {
    if (rule.pattern.test(text)) {
      push({
        key: `tx-tr-${rule.key}`,
        category: 'trigger',
        label: rule.label,
        help: rule.help,
      });
    }
  }
  for (const rec of recurring) {
    const label = RECURRING_TRIGGER_LABEL[rec.trigger];
    push({
      key: `rec-tr-${rec.trigger}`,
      category: 'trigger',
      label,
      help: RECURRING_TRIGGER_HELP[rec.trigger],
    });
  }
  if (ocultoTrigger && OCULTO_TRIGGER_HELP[ocultoTrigger]) {
    const info = OCULTO_TRIGGER_HELP[ocultoTrigger];
    push({
      key: `oc-tr-${ocultoTrigger}`,
      category: 'trigger',
      label: info.label,
      help: info.help,
    });
  }

  // 4. Ações especiais mencionadas no texto da carta
  for (const rule of TEXT_ACTION_RULES) {
    if (rule.pattern.test(text)) {
      push({
        key: `tx-ac-${rule.key}`,
        category: 'action',
        label: rule.label,
        help: rule.help,
      });
    }
  }

  return out;
}
