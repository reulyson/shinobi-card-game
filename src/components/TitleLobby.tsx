import React, { useMemo } from 'react';
import { Play, Layers, Sparkles, MapPin, BarChart3, Clock, Trophy } from 'lucide-react';
import { ARENA_EFFECTS_ENABLED, ARENA_LIST } from '../data/arenas';
import { ALL_CARDS, DECK_PRESETS, NINJA_CARDS, getCardById } from '../data/cards';
import { ArenaId } from '../types/game';
import { computeMatchStats, formatDuration, loadMatchHistory } from '../utils/matchHistory';
import { CardView } from './CardView';
import { OFFICIAL_ART } from '../data/officialArt';
import { OfficialImage, VillageSymbol } from './OfficialImage';

interface TitleLobbyProps {
  selectedArena: ArenaId;
  activeDeckIds: string[];
  onSelectPreset: (cardIds: string[], arena: ArenaId) => void;
  onSelectArena: (arena: ArenaId) => void;
  onStartBattle: () => void;
  onOpenBuilder: () => void;
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

export const TitleLobby: React.FC<TitleLobbyProps> = ({
  selectedArena,
  activeDeckIds,
  onSelectPreset,
  onSelectArena,
  onStartBattle,
  onOpenBuilder,
  onOpenHistory,
}) => {
  const historySummary = useMemo(() => computeMatchStats(loadMatchHistory()), []);

  return (
    <div className="relative overflow-x-clip">
      {/* Faixa do hero em largura total: panorama oficial de Konoha + véu forte e degradê suave para o fundo */}
      <div className="hero-band relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <OfficialImage src={OFFICIAL_ART.konohaRooftops} className="hero-band-img" />
          <div className="hero-band-veil" />
        </div>
      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 pt-8 pb-10">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center gap-5 py-2">
          <div className="text-sm font-display text-orange-400 tracking-wider text-over-art">
            Card Game Tático · Times 7, 8, 9, 10 · Sannins, Areia, Névoa e Hokages
          </div>
          <h1 className="hero-title text-4xl sm:text-6xl font-display text-white leading-[1.05] tracking-wider text-balance">
            Estratégia de Chakra, Evolução Shinobi e Arenas Dinâmicas
          </h1>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed max-w-xl text-over-art">
            Construa seu baralho entre {ALL_CARDS.length} cartas: {NINJA_CARDS.length} Ninjas com Promoção (Gennin → Chuunin → Jounnin), Unidades aliadas, Equipamentos reutilizáveis, cartas Oculto e Jutsus Instantâneos, Rápidos, Preparados e Concentrados em Pilha tática.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStartBattle}
              className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-display text-lg tracking-wider border border-orange-300/60 shadow-[0_0_18px_rgba(249,115,22,0.35)] flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jogar Partida ({activeDeckIds.length} cartas)</span>
            </button>

            <button
              type="button"
              onClick={onOpenBuilder}
              className="px-5 py-3 rounded-lg border border-slate-700 bg-[#12100e]/90 hover:border-orange-400/60 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              <span>Personalizar Deck</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="px-4 py-3 rounded-lg border border-slate-700 bg-[#12100e]/90 hover:border-orange-400/60 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <span>Histórico</span>
            </button>
          </div>

          {historySummary.totalMatches > 0 && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="self-start text-left flex flex-wrap items-center gap-3 text-xs text-slate-100 px-3 py-2 rounded-lg bg-[#0d0b0a]/90 border border-orange-900/60 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5 font-semibold text-orange-300">
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
              {historySummary.topJutsus[0] && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>
                    Top Jutsu: <strong className="text-white">{historySummary.topJutsus[0].name}</strong>
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border-2 border-orange-700/50 bg-[#12100e] min-h-[280px] lg:min-h-[340px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          {/* Monte Hokage (arte oficial da Narutopedia) */}
          <OfficialImage
            src={OFFICIAL_ART.hokageRock}
            alt="Monte Hokage, Konohagakure"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B111A] via-[#0B111A]/35 to-transparent" />
          <VillageSymbol village="konoha" tone="white" className="absolute top-4 right-4 w-12 h-12 opacity-70" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs text-orange-300 font-semibold">Combate Fluido por Arrasto</div>
              <div className="text-xl font-display text-white tracking-wider">
                Pilha de Jutsus · Equipamentos · Bloqueios Táticos
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
      </div>

    <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 pt-2 pb-8 flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between border-b border-orange-800/50 pb-3">
          <div>
            <h2 className="text-2xl font-display text-white tracking-wider flex items-center gap-2">
              <VillageSymbol village="konoha" tone="orange" className="w-6 h-6" />
              <span>Escolha seu Baralho Pronto</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Máx. 3 Ninjas distintos (2 cópias cada) e até 3 cópias para Unidades, Jutsus, Ocultos e Equipamentos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DECK_PRESETS.map((preset) => {
            const isSelected =
              preset.cardIds.length === activeDeckIds.length &&
              preset.cardIds.every((id, i) => id === activeDeckIds[i]);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.cardIds, preset.preferredArena)}
                className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'scroll-panel !border-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.4)]'
                    : 'scroll-panel'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-display tracking-wider text-[#f3e3c3]">{preset.name}</span>
                    {isSelected && (
                      <span className="text-xs font-semibold text-orange-300">Ativo</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                    {preset.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Arenas: escondidas enquanto não têm efeito (fundo de batalha fixo). Reativar com ARENA_EFFECTS_ENABLED. */}
      {ARENA_EFFECTS_ENABLED && (
      <section className="flex flex-col gap-4">
        <div className="border-b border-orange-800/50 pb-3">
          <h2 className="text-2xl font-display text-white tracking-wider flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            <span>Cenários de Batalha</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            A arena de cada duelo é sorteada entre estes cenários oficiais. Por enquanto ela é só visual: não muda as regras.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARENA_LIST.map((arena) => (
            <div key={arena.id} className="rounded-xl overflow-hidden border flex flex-col scroll-panel">
              <div className="h-28 relative w-full bg-[#12100e]">
                <OfficialImage src={arena.imageUrl} alt={arena.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <span className="text-base font-display tracking-wider text-white">{arena.name}</span>
                </div>
              </div>
              <p className="p-3 text-xs text-slate-300 leading-relaxed">{arena.subtitle}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-orange-800/50 pb-3">
          <div>
            <h2 className="text-2xl font-display text-white tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span>Destaques da Coleção</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ninjas, Sannins, Vila da Areia, Névoa e Equipamentos táticos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SHOWCASE_IDS.map((id) => {
            const card = getCardById(id);
            if (!card) return null;
            return <CardView key={id} card={card} size="collection" />;
          })}
        </div>
      </section>
    </div>
    </div>
  );
};
