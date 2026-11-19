import React, { useEffect, useRef, useState } from 'react';
import { Music, SlidersHorizontal, Volume2, VolumeX, Mic, Swords, X } from 'lucide-react';
import { ArenaId } from '../types/game';
import { ARENAS } from '../data/arenas';
import { AudioSettings, soundFX } from '../utils/sound';

interface AudioMixerPopoverProps {
  arenaId: ArenaId;
}

export const AudioMixerPopover: React.FC<AudioMixerPopoverProps> = ({ arenaId }) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>(() => soundFX.getSettings());
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return soundFX.subscribe(setSettings);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const arenaName = ARENAS[arenaId].name;

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          soundFX.ensureMusicRunning(arenaId);
          soundFX.updateSettings({ muted: !settings.muted });
        }}
        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
        title={settings.muted ? 'Ativar áudio' : 'Desativar áudio'}
        aria-label={settings.muted ? 'Ativar áudio' : 'Desativar áudio'}
      >
        {settings.muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
      </button>

      <button
        type="button"
        onClick={() => {
          soundFX.ensureMusicRunning(arenaId);
          setOpen((v) => !v);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
          open
            ? 'bg-amber-500/15 border-amber-400/70 text-amber-200'
            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
        }`}
        title="Mixer de Áudio e Música da Arena"
        aria-label="Mixer de Áudio e Música da Arena"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Áudio</span>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-slate-700 bg-[#0F172A]/95 backdrop-blur-md shadow-2xl p-3.5 z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <div className="text-xs font-bold text-white">Gerenciador de Áudio</div>
              <div className="text-[11px] text-amber-300/90 flex items-center gap-1 mt-0.5">
                <Music className="w-3 h-3 shrink-0" />
                <span className="truncate">Tema: {arenaName}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
              aria-label="Fechar mixer de áudio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span>Volume Geral</span>
                <span className="font-mono-num text-[11px] text-slate-400">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.masterVolume * 100)}
                onChange={(e) =>
                  soundFX.updateSettings({
                    masterVolume: Number(e.target.value) / 100,
                    muted: false,
                  })
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-sky-400" />
                  Música da Arena
                </span>
                <button
                  type="button"
                  onClick={() => soundFX.updateSettings({ musicEnabled: !settings.musicEnabled })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    settings.musicEnabled
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {settings.musicEnabled ? 'Ativa' : 'Pausada'}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.musicVolume * 100)}
                onChange={(e) =>
                  soundFX.updateSettings({
                    musicVolume: Number(e.target.value) / 100,
                    musicEnabled: true,
                    muted: false,
                  })
                }
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-red-400" />
                  Efeitos (Kunai e Golpes)
                </span>
                <span className="font-mono-num text-[11px] text-slate-400">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.sfxVolume * 100)}
                onChange={(e) =>
                  soundFX.updateSettings({
                    sfxVolume: Number(e.target.value) / 100,
                    muted: false,
                  })
                }
                className="w-full accent-red-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  Falas na Promoção
                </span>
                <button
                  type="button"
                  onClick={() => soundFX.updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    settings.voiceEnabled
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {settings.voiceEnabled ? 'Ativas' : 'Desligadas'}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.voiceVolume * 100)}
                onChange={(e) =>
                  soundFX.updateSettings({
                    voiceVolume: Number(e.target.value) / 100,
                    voiceEnabled: true,
                    muted: false,
                  })
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => soundFX.playKunaiDraw()}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition-colors"
            >
              Testar Kunai
            </button>
            <button
              type="button"
              onClick={() => soundFX.playImpact('heavy')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition-colors"
            >
              Testar Golpe
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
