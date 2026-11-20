/**
 * Visual das palavras-chave em campo (estilo LoR):
 * - TODA palavra-chave tem ícone na carta.
 * - Algumas têm aura/efeito persistente enquanto a unidade tem a palavra-chave ou o estado.
 * - Disparos (Substituição estourando, Contra-Jutsu quebrando, Perfurante, Combo...) usam
 *   animações curtas definidas em KEYWORD_BURSTS.
 * Tudo é CSS (src/index.css, classes kw-*), sem assets externos, e respeita prefers-reduced-motion.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Anchor,
  ArrowBigRightDash,
  BrickWall,
  CircleSlash,
  Copy,
  CopyPlus,
  EyeClosed,
  FlaskConical,
  Crosshair,
  DoorOpen,
  Droplet,
  Droplets,
  Dumbbell,
  Eye,
  Flame,
  Gem,
  Ghost,
  HandHelping,
  HeartPulse,
  Infinity as InfinityIcon,
  Link,
  PawPrint,
  Lock,
  Megaphone,
  Shield,
  ShieldAlert,
  ShieldHalf,
  Skull,
  Snowflake,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  Users,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import type { BoardUnit, Keyword, KeywordBurstId } from '../types/game';
import { getKeywordLabel } from '../types/game';

export interface KeywordVisual {
  icon: LucideIcon;
  /** Cor do ícone (Tailwind). */
  color: string;
  /** Classe CSS da aura persistente em campo (se houver). */
  aura?: string;
}

export const KEYWORD_VISUALS: Record<Keyword, KeywordVisual> = {
  Elusivo: { icon: Ghost, color: 'text-violet-200', aura: 'kw-aura-stealth' },
  'Visão Aguçada': { icon: Eye, color: 'text-sky-200' },
  Sobrepujar: { icon: ArrowBigRightDash, color: 'text-orange-300', aura: 'kw-aura-pierce' },
  'Ataque Rápido': { icon: Zap, color: 'text-yellow-200', aura: 'kw-aura-quick' },
  'Ataque Duplo': { icon: Swords, color: 'text-amber-200', aura: 'kw-aura-combo' },
  Desafiador: { icon: Megaphone, color: 'text-red-300', aura: 'kw-aura-provoke' },
  Assustador: { icon: Skull, color: 'text-fuchsia-300', aura: 'kw-aura-fear' },
  Imprudente: { icon: Flame, color: 'text-orange-200', aura: 'kw-aura-reckless' },
  Formidável: { icon: BrickWall, color: 'text-stone-200', aura: 'kw-aura-wall' },
  Impacto: { icon: DoorOpen, color: 'text-orange-300', aura: 'kw-aura-impact' },
  'Não Bloqueia': { icon: CircleSlash, color: 'text-slate-300' },
  Imóvel: { icon: Anchor, color: 'text-slate-300', aura: 'kw-aura-immobile' },
  Barreira: { icon: Shield, color: 'text-amber-200', aura: 'kw-aura-barrier' },
  'Escudo de Feitiço': { icon: ShieldAlert, color: 'text-cyan-200', aura: 'kw-aura-spellshield' },
  Robusto: { icon: ShieldHalf, color: 'text-zinc-200', aura: 'kw-aura-tough' },
  Regeneração: { icon: HeartPulse, color: 'text-emerald-300', aura: 'kw-aura-regen' },
  Imortal: { icon: InfinityIcon, color: 'text-yellow-200', aura: 'kw-aura-second-chance' },
  'Roubo de Vida': { icon: Droplet, color: 'text-rose-300', aura: 'kw-aura-drain' },
  Drenar: { icon: Droplets, color: 'text-teal-200', aura: 'kw-aura-drain' },
  Efêmero: { icon: Copy, color: 'text-sky-100', aura: 'kw-aura-clone' },
  Vulnerável: { icon: Crosshair, color: 'text-red-300', aura: 'kw-aura-exposed' },
  Fúria: { icon: Activity, color: 'text-red-300', aura: 'kw-aura-fury' },
  Destinado: { icon: Target, color: 'text-amber-200' },
  Aperfeiçoar: { icon: Dumbbell, color: 'text-lime-200' },
  Evoluir: { icon: Sparkles, color: 'text-fuchsia-200' },
  Sagrado: { icon: Trophy, color: 'text-yellow-200' },
  Sintonia: { icon: Waves, color: 'text-sky-200' },
  Fluxo: { icon: Link, color: 'text-cyan-200' },
  Auxiliar: { icon: HandHelping, color: 'text-emerald-200' },
  Imbuir: { icon: Wind, color: 'text-sky-200' },
  Contagem: { icon: Timer, color: 'text-slate-200' },
  Veneno: { icon: FlaskConical, color: 'text-lime-300' },
  Parceiro: { icon: PawPrint, color: 'text-amber-200' },
  Formação: { icon: Users, color: 'text-emerald-200' },
  Copiar: { icon: CopyPlus, color: 'text-red-200' },
};

/** Estados (não são palavras-chave, mas têm ícone e aura em campo). */
export const STATUS_VISUALS = {
  stunned: { label: 'Paralisia', icon: Gem, color: 'text-purple-200', aura: 'kw-aura-stun' },
  frozen: { label: 'Bloqueio de Chakra', icon: Snowflake, color: 'text-sky-200', aura: 'kw-aura-chakra-block' },
  silenced: { label: 'Selado', icon: Lock, color: 'text-rose-200', aura: 'kw-aura-sealed' },
  barrier: { label: 'Substituição', icon: Shield, color: 'text-amber-200', aura: 'kw-aura-barrier' },
  spellShield: { label: 'Contra-Jutsu', icon: ShieldAlert, color: 'text-cyan-200', aura: 'kw-aura-spellshield' },
  genjutsu: { label: 'Genjutsu', icon: EyeClosed, color: 'text-fuchsia-200', aura: 'kw-aura-stun' },
  poison: { label: 'Envenenado', icon: FlaskConical, color: 'text-lime-300' },
} as const;

/** Animações curtas de disparo: classe CSS + rótulo exibido. */
export const KEYWORD_BURSTS: Record<KeywordBurstId, { className: string; label: string; icon: LucideIcon }> = {
  substituicao: { className: 'kw-burst-substitution', label: 'Substituição!', icon: Shield },
  contra_jutsu: { className: 'kw-burst-shatter', label: 'Contra-Jutsu!', icon: ShieldAlert },
  perfurante: { className: 'kw-burst-pierce', label: 'Perfurante', icon: ArrowBigRightDash },
  golpe_veloz: { className: 'kw-burst-quick', label: 'Golpe Veloz!', icon: Zap },
  combo: { className: 'kw-burst-combo', label: 'Combo!', icon: Swords },
  segunda_chance: { className: 'kw-burst-second-chance', label: 'Segunda Chance!', icon: InfinityIcon },
  absorcao: { className: 'kw-burst-drain', label: 'Absorção de Chakra', icon: Droplet },
  resistente: { className: 'kw-burst-tough', label: 'Resistente', icon: ShieldHalf },
  ataque_portao: { className: 'kw-burst-impact', label: 'Ataque à Vitalidade', icon: DoorOpen },
  sede_batalha: { className: 'kw-burst-fury', label: 'Sede de Batalha!', icon: Activity },
  cura_natural: { className: 'kw-burst-regen', label: 'Cura Natural', icon: HeartPulse },
  paralisia: { className: 'kw-burst-stun', label: 'Paralisia', icon: Gem },
  bloqueio_chakra: { className: 'kw-burst-chakra-block', label: 'Bloqueio de Chakra', icon: Snowflake },
  selado: { className: 'kw-burst-sealed', label: 'Selado', icon: Lock },
  exposto: { className: 'kw-burst-exposed', label: 'Exposto', icon: Crosshair },
  provocar: { className: 'kw-burst-provoke', label: 'Provocar!', icon: Megaphone },
  clone: { className: 'kw-burst-clone', label: 'Clone desvanece', icon: Copy },
  muralha: { className: 'kw-burst-wall', label: 'Muralha', icon: BrickWall },
  intimidacao: { className: 'kw-burst-fear', label: 'Intimidação', icon: Skull },
};

export interface ActiveBadge {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

/** Ícones exibidos na carta em campo (estados primeiro, depois palavras-chave). */
export function getUnitBadges(unit: BoardUnit | undefined, keywords: readonly Keyword[]): ActiveBadge[] {
  const out: ActiveBadge[] = [];
  if (unit?.stunned) out.push({ key: 'stunned', ...STATUS_VISUALS.stunned });
  if (unit?.frozen) out.push({ key: 'frozen', ...STATUS_VISUALS.frozen });
  if (unit?.silenced) out.push({ key: 'silenced', ...STATUS_VISUALS.silenced });
  if (unit?.hasBarrier) out.push({ key: 'barrier', ...STATUS_VISUALS.barrier });
  if (unit?.hasSpellShield) out.push({ key: 'spellShield', ...STATUS_VISUALS.spellShield });
  if (unit && (unit.genjutsu ?? 0) > 0) out.push({ key: 'genjutsu', ...STATUS_VISUALS.genjutsu });
  if (unit && (unit.poison ?? 0) > 0) {
    out.push({ key: 'poison', ...STATUS_VISUALS.poison, label: `Envenenado (${unit.poison})` });
  }
  if (unit?.silenced) return out;
  for (const kw of keywords) {
    if (kw === 'Barreira' && unit) continue; // representado pelo estado hasBarrier
    if (kw === 'Escudo de Feitiço' && unit) continue; // representado pelo estado hasSpellShield
    if (kw === 'Imortal' && unit?.immortalUsed) continue;
    const v = KEYWORD_VISUALS[kw];
    if (!v) continue;
    const label =
      kw === 'Formação' && unit
        ? unit.formationActive
          ? 'Formação ativa (+1/+1)'
          : 'Formação (precisa de 3+ aliados)'
        : getKeywordLabel(kw);
    out.push({ key: kw, label, icon: v.icon, color: v.color });
  }
  return out;
}

/** Classes de aura persistente em campo. */
export function getUnitAuras(unit: BoardUnit | undefined, keywords: readonly Keyword[]): string[] {
  if (!unit) return [];
  const auras = new Set<string>();
  if (unit.stunned) auras.add(STATUS_VISUALS.stunned.aura);
  if (unit.frozen) auras.add(STATUS_VISUALS.frozen.aura);
  if (unit.silenced) auras.add(STATUS_VISUALS.silenced.aura);
  if (unit.hasBarrier) auras.add(STATUS_VISUALS.barrier.aura);
  if (unit.hasSpellShield) auras.add(STATUS_VISUALS.spellShield.aura);
  if ((unit.genjutsu ?? 0) > 0) auras.add(STATUS_VISUALS.genjutsu.aura);
  if (!unit.silenced) {
    for (const kw of keywords) {
      if (kw === 'Barreira' || kw === 'Escudo de Feitiço') continue;
      if (kw === 'Imortal' && unit.immortalUsed) continue;
      const aura = KEYWORD_VISUALS[kw]?.aura;
      if (aura) auras.add(aura);
    }
  }
  return Array.from(auras);
}

