import React from 'react';
import { VillageSymbol } from '../shared/OfficialImage';
import type { ScreenFromDomain } from '../../navigation/domains';

type ActiveScreen = ScreenFromDomain;

const NAV_ITEMS: { screen: ActiveScreen; label: string }[] = [
  { screen: 'lobby', label: 'Início' },
  { screen: 'grimorio', label: 'Grimório' },
  { screen: 'montar-deck', label: 'Montar Deck' },
  { screen: 'guia-ninja', label: 'Guia Ninja' },
  { screen: 'historico', label: 'Histórico' },
];

interface AppNavProps {
  screen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onStartBattle: () => void;
}

export const AppNav: React.FC<AppNavProps> = ({ screen, onNavigate, onStartBattle }) => {
  return (
    <>
      <header className="sticky top-0 z-30 app-nav-v2 shrink-0">
        <div className="h-14 px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-4 max-w-[1680px] mx-auto w-full">
          <button
            type="button"
            onClick={() => onNavigate('lobby')}
            className="group flex items-center gap-2 text-lg sm:text-xl font-brush text-white hover:text-orange-300 transition-colors whitespace-nowrap shrink-0"
          >
            <VillageSymbol
              village="konoha"
              tone="orange"
              className="w-7 h-7 group-hover:rotate-12 transition-transform"
            />
            <span className="hidden sm:inline">Shinobi CardGame</span>
            <span className="sm:hidden">Shinobi</span>
          </button>

          <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-black/35 border border-white/5 shrink min-w-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.screen}
                type="button"
                onClick={() => onNavigate(item.screen)}
                className={`app-nav-pill whitespace-nowrap ${
                  screen === item.screen ? 'app-nav-pill--active' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onStartBattle}
            className="btn-ember whitespace-nowrap shrink-0 text-sm px-4 py-2"
          >
            Iniciar Duelo
          </button>
        </div>
      </header>

      <div className="lg:hidden shrink-0 flex items-center justify-around border-b border-slate-800/80 bg-[#0a0d12]/95 px-1 py-2 text-[11px] sm:text-xs font-medium text-slate-300">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
            className={`px-2 py-1 rounded-md ${
              screen === item.screen ? 'text-amber-300 font-semibold bg-amber-500/10' : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};