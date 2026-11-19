import { useEffect, useState } from 'react';
import { ARENA_EFFECTS_ENABLED, ARENA_LIST, DEFAULT_ARENA_ID } from './data/arenas';
import { DECK_PRESETS, validateDeck } from './data/cards';
import { ArenaId } from './types/game';
import { TitleLobby } from './components/TitleLobby';
import { DeckBuilderView } from './components/DeckBuilderView';
import { RulesView } from './components/RulesView';
import { MatchHistoryView } from './components/MatchHistoryView';
import { BattleArena } from './components/BattleArena';
import { soundFX } from './utils/sound';
import { OFFICIAL_ART } from './data/officialArt';
import { OfficialImage, VillageSymbol } from './components/OfficialImage';

type ActiveScreen = 'lobby' | 'battle' | 'collection' | 'builder' | 'rules' | 'history';

const STORAGE_DECK_KEY = 'shinobi_chronicles_deck_v4';
const STORAGE_ARENA_KEY = 'shinobi_chronicles_arena_v1';

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>('lobby');

  const [activeDeckIds, setActiveDeckIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DECK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Baralhos salvos antes da regra nova (Jutsu Exclusivo fora do deck) são descartados.
        if (Array.isArray(parsed) && validateDeck(parsed).ok) return parsed;
      }
    } catch {
      // Fallback to preset
    }
    return DECK_PRESETS[0].cardIds;
  });

  const [selectedArena, setSelectedArena] = useState<ArenaId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ARENA_KEY) as ArenaId | null;
      if (saved) return saved;
    } catch {
      // Fallback
    }
    return 'vale_do_fim';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DECK_KEY, JSON.stringify(activeDeckIds));
    } catch {
      // Ignore storage error
    }
  }, [activeDeckIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ARENA_KEY, selectedArena);
    } catch {
      // Ignore storage error
    }
  }, [selectedArena]);

  // Arena: sorteio só quando os efeitos de arena estiverem ligados; hoje é sempre o cenário fixo.
  const pickBattleArena = (): ArenaId =>
    ARENA_EFFECTS_ENABLED ? ARENA_LIST[Math.floor(Math.random() * ARENA_LIST.length)].id : DEFAULT_ARENA_ID;
  const [battleArena, setBattleArena] = useState<ArenaId>(pickBattleArena);

  const handleStartBattle = () => {
    if (validateDeck(activeDeckIds).ok) {
      soundFX.playKunaiDraw();
      setBattleArena(pickBattleArena());
      setScreen('battle');
    } else {
      setScreen('builder');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B111A] text-slate-100 flex flex-col">
      {/* Top Bar Contract: [Wordmark] — [4 nav links] — [1 primary action] */}
      {screen !== 'battle' && (
      <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 border-b-2 border-orange-600/60 bg-[#0d0b0a]/95 backdrop-blur-md flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => setScreen('lobby')}
          className="group flex items-center gap-2 text-lg sm:text-xl font-brush text-white hover:text-orange-300 transition-colors whitespace-nowrap shrink-0"
        >
          <VillageSymbol village="konoha" tone="orange" className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <span>Shinobi CardGame</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setScreen('lobby')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              screen === 'lobby' ? 'text-orange-400 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Início
          </button>
          <button
            type="button"
            onClick={() => setScreen('collection')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              screen === 'collection' ? 'text-orange-400 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Grimório
          </button>
          <button
            type="button"
            onClick={() => setScreen('builder')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              screen === 'builder' ? 'text-orange-400 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Montar Deck
          </button>
          <button
            type="button"
            onClick={() => setScreen('rules')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              screen === 'rules' ? 'text-orange-400 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Guia Ninja
          </button>
          <button
            type="button"
            onClick={() => setScreen('history')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              screen === 'history' ? 'text-orange-400 underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Histórico
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleStartBattle}
            className="px-4 py-1.5 text-sm font-display rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 border border-orange-300/60 shadow-[0_0_12px_rgba(249,115,22,0.35)] transition-colors whitespace-nowrap shrink-0"
          >
            Iniciar Duelo
          </button>
        </div>
      </header>
      )}

      {/* Mobile Nav Strip */}
      {screen !== 'battle' && (
        <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-950 px-2 py-2 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setScreen('lobby')}
            className={screen === 'lobby' ? 'text-amber-400 font-semibold' : ''}
          >
            Início
          </button>
          <button
            type="button"
            onClick={() => setScreen('collection')}
            className={screen === 'collection' ? 'text-amber-400 font-semibold' : ''}
          >
            Grimório
          </button>
          <button
            type="button"
            onClick={() => setScreen('builder')}
            className={screen === 'builder' ? 'text-amber-400 font-semibold' : ''}
          >
            Montar Deck
          </button>
          <button
            type="button"
            onClick={() => setScreen('rules')}
            className={screen === 'rules' ? 'text-amber-400 font-semibold' : ''}
          >
            Guia Ninja
          </button>
          <button
            type="button"
            onClick={() => setScreen('history')}
            className={screen === 'history' ? 'text-amber-400 font-semibold' : ''}
          >
            Histórico
          </button>
        </div>
      )}

      {/* Active Screen */}
      <main className="flex-1 relative">
        {/* Arte oficial da Narutopedia ao fundo dos menus, com véu escuro para leitura */}
        {screen !== 'battle' && screen !== 'lobby' && (
          <div className="pointer-events-none fixed inset-x-0 top-14 bottom-0 overflow-hidden" aria-hidden="true">
            <OfficialImage
              key={screen}
              src={
                screen === 'rules' || screen === 'history'
                    ? OFFICIAL_ART.scrolls
                    : OFFICIAL_ART.konohaAerial
              }
              className="page-backdrop-img"
              style={{ width: '100%', height: '100%', maxWidth: 'none' }}
            />
            <div className="page-backdrop-fade" />
          </div>
        )}
        <div className="relative">
        {screen === 'lobby' && (
          <TitleLobby
            selectedArena={selectedArena}
            activeDeckIds={activeDeckIds}
            onSelectPreset={(ids, arena) => {
              setActiveDeckIds(ids);
              setSelectedArena(arena);
            }}
            onSelectArena={setSelectedArena}
            onStartBattle={handleStartBattle}
            onOpenBuilder={() => setScreen('builder')}
            onOpenHistory={() => setScreen('history')}
          />
        )}

        {(screen === 'collection' || screen === 'builder') && (
          <DeckBuilderView
            mode={screen}
            activeDeckIds={activeDeckIds}
            selectedArena={selectedArena}
            onUpdateDeck={setActiveDeckIds}
            onSelectArena={setSelectedArena}
            onStartMatch={handleStartBattle}
          />
        )}

        {screen === 'rules' && <RulesView onStartMatch={handleStartBattle} />}

        {screen === 'history' && <MatchHistoryView onStartMatch={handleStartBattle} />}

        {screen === 'battle' && (
          <BattleArena
            playerDeckIds={activeDeckIds}
            initialArena={battleArena}
            onExitToBuilder={() => setScreen('builder')}
            onExit={() => setScreen('lobby')}
            onOpenHistory={() => setScreen('history')}
          />
        )}
        </div>
      </main>
    </div>
  );
}
