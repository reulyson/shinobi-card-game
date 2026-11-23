import React, { useMemo } from 'react';
import {
  Play,
  Layers,
  Sparkles,
  MapPin,
  BarChart3,
  Clock,
  Trophy,
  BookOpen,
  Hammer,
  ScrollText,
} from 'lucide-react';
import { ARENA_EFFECTS_ENABLED, ARENA_LIST } from '../../data/arenas';
import { ALL_CARDS, DECK_PRESETS, NINJA_CARDS, getCardById, validateDeck } from '../../data/cards';
import { ArenaId } from '../../types/game';
import { computeMatchStats, formatDuration, loadMatchHistory } from '../../utils/matchHistory';
import { CardView } from '../shared/CardView';
import { OFFICIAL_ART } from '../../data/officialArt';
import { OfficialImage, VillageSymbol } from '../shared/OfficialImage';
import { DomainPageHero, DomainPageShell, DomainPanel, DomainSection } from '../shell';

interface LobbyScreenProps {
  selectedArena: ArenaId;
  activeDeckIds: string[];
  activeDeckName?: string;
  onSelectPreset: (cardIds: string[], arena: ArenaId) => void;
  onSelectArena: (arena: ArenaId) => void;
  onStartBattle: () => void;
  onOpenBuilder: () => void;
  onOpenGrimorio: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
}

const SHOWCASE_IDS = [
  'naruto_uzumaki',
  'gaara',
  'jiraiya',
  'zabuza_momochi',
  'kurenai_yuhi',
  'equip_kubikiribocho',
];

const DOMAIN_PORTALS = [
  {
    key: 'grimorio',
    label: 'Grimório',
    hint: 'Só consulta — não edita deck',
    icon: BookOpen,
    onClick: (p: LobbyScreenProps) => p.onOpenGrimorio,
  },
  {
    key: 'deck',
    label: 'Montar Deck',
    hint: 'Lista dos seus decks',
    icon: Hammer,
    onClick: (p: LobbyScreenProps) => p.onOpenBuilder,
  },
  {
    key: 'guia',
    label: 'Guia Ninja',
    hint: 'Regras & glossário',
    icon: ScrollText,
    onClick: (p: LobbyScreenProps) => p.onOpenRules,
  },
  {
    key: 'hist',
    label: 'Histórico',
    hint: 'Stats & arenas',
    icon: BarChart3,
    onClick: (p: LobbyScreenProps) => p.onOpenHistory,
  },
] as const;

export const LobbyScreen: React.FC<LobbyScreenProps> = (props) => {
  const {
    activeDeckIds,
    activeDeckName,
    onSelectPreset,
    onStartBattle,
  } = props;

  const historySummary = useMemo(() => computeMatchStats(loadMatchHistory()), []);
  const deckCheck = useMemo(() => validateDeck(activeDeckIds), [activeDeckIds]);
  const deckLabel = activeDeckName?.trim() || 'Deck ativo';

  const heroActions = (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={onStartBattle}
        disabled={!deckCheck.ok}
        className="btn-ember px-5 sm:px-7 py-2.5 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30 disabled:opacity-45"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Iniciar duelo</span>
      </button>
      <button type="button" onClick={props.onOpenBuilder} className="btn-ghost flex items-center justify-center gap-2 py-2.5">
        <Layers className="w-4 h-4" />
        <span>Meus decks</span>
      </button>
    </div>
  );

  return (
    <DomainPageShell wide dense className="pb-8">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-7 flex flex-col gap-3">
          <DomainPageHero
            domain="lobby"
            compact
            actions={heroActions}
          />

          <div className="lobby-command-bar" role="status">
            <span
              className={`lobby-deck-pill ${deckCheck.ok ? 'lobby-deck-pill--ready' : 'lobby-deck-pill--warn'}`}
            >
              {deckCheck.ok ? 'Pronto' : 'Ajustar deck'}
            </span>
            <span className="text-sm text-slate-200 truncate">
              <strong className="text-white font-medium">{deckLabel}</strong>
              <span className="text-slate-500 mx-1.5">·</span>
              <span className="font-mono-num text-slate-400">
                {activeDeckIds.length}/24
              </span>
            </span>
            {!deckCheck.ok && deckCheck.errors[0] && (
              <span className="text-xs text-amber-200/90 w-full sm:w-auto sm:ml-auto line-clamp-2">
                {deckCheck.errors[0]}
              </span>
            )}
          </div>

          {historySummary.totalMatches > 0 && (
            <button
              type="button"
              onClick={props.onOpenHistory}
              className="self-start text-left flex flex-wrap items-center gap-3 text-xs text-slate-200 px-3 py-2.5 rounded-lg domain-panel domain-panel--saffron"
            >
              <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  {historySummary.wins}V – {historySummary.losses}D ({historySummary.winRate}%)
                </span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 font-mono-num">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Média {formatDuration(historySummary.avgDurationSeconds)}</span>
              </span>
            </button>
          )}

          <DomainPanel accent="ember" className="p-4 sm:p-5">
            <p className="text-[11px] font-bold tracking-widest uppercase text-orange-300/90 mb-3">
              Acesso rápido
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {DOMAIN_PORTALS.map((portal) => {
                const Icon = portal.icon;
                return (
                  <button
                    key={portal.key}
                    type="button"
                    onClick={portal.onClick(props)}
                    className="domain-portal-card"
                  >
                    <Icon className="w-5 h-5 text-orange-400 mb-2" />
                    <div className="text-sm font-semibold text-white">{portal.label}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{portal.hint}</p>
                  </button>
                );
              })}
            </div>
          </DomainPanel>
        </div>

        <div className="xl:col-span-5 lobby-bento-visual">
          <OfficialImage
            src={OFFICIAL_ART.hokageRock}
            alt="Monte Hokage, Konohagakure"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a10] via-[#070a10]/40 to-transparent" />
          <VillageSymbol village="konoha" tone="white" className="absolute top-4 right-4 w-11 h-11 opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-1">
            <p className="text-xs text-orange-300 font-semibold tracking-wide">Combate por arrasto</p>
            <p className="text-lg font-display text-white tracking-wide leading-tight">
              Pilha de Jutsus · Equipamentos · Bloqueios táticos
            </p>
            <p className="text-xs text-slate-300/90 max-w-sm">
              {ALL_CARDS.length} cartas · {NINJA_CARDS.length} ninjas com promoção Gennin → Jounnin
            </p>
          </div>
        </div>
      </div>

      <DomainSection
        dense
        title="Baralhos prontos"
        accent="ember"
        icon={<VillageSymbol village="konoha" tone="orange" className="w-5 h-5" />}
      >
        <div className="lobby-preset-row">
          {DECK_PRESETS.map((preset) => {
            const isSelected =
              preset.cardIds.length === activeDeckIds.length &&
              preset.cardIds.every((id, i) => id === activeDeckIds[i]);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.cardIds, preset.preferredArena)}
                className={`lobby-preset-card text-left ${isSelected ? 'lobby-preset-card--active' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-display tracking-wide text-[#f3e3c3] line-clamp-1">{preset.name}</span>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 shrink-0">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-1">{preset.subtitle}</p>
              </button>
            );
          })}
        </div>
      </DomainSection>

      {ARENA_EFFECTS_ENABLED && (
        <DomainSection
          title="Cenários de batalha"
          description="Arena sorteada a cada duelo (efeitos visuais)."
          accent="sky"
          icon={<MapPin className="w-5 h-5 text-sky-400" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ARENA_LIST.map((arena) => (
              <DomainPanel key={arena.id} accent="sky" className="overflow-hidden flex flex-col">
                <div className="h-28 relative w-full bg-[#12100e]">
                  <OfficialImage src={arena.imageUrl} alt={arena.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <h3 className="absolute bottom-2 left-3 text-base font-display tracking-wider text-white">
                    {arena.name}
                  </h3>
                </div>
                <p className="p-3 text-xs text-slate-300 leading-relaxed">{arena.subtitle}</p>
              </DomainPanel>
            ))}
          </div>
        </DomainSection>
      )}

      <DomainSection
        dense
        title="Destaques"
        accent="jade"
        icon={<Sparkles className="w-5 h-5 text-emerald-400" />}
        actions={
          <button type="button" onClick={props.onOpenGrimorio} className="text-xs font-semibold text-sky-300 hover:text-white">
            Ver grimório →
          </button>
        }
      >
        <div className="lobby-showcase-track">
          {SHOWCASE_IDS.map((id) => {
            const card = getCardById(id);
            if (!card) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={props.onOpenGrimorio}
                className="lobby-showcase-slot"
                aria-label={`Ver ${card.name} no grimório`}
              >
                <CardView card={card} size="collection" />
              </button>
            );
          })}
        </div>
      </DomainSection>
    </DomainPageShell>
  );
};