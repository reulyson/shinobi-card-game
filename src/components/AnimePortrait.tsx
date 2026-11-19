import React, { useEffect, useState } from 'react';
import {
  CardDef,
  NinjaCardDef,
  UnitCardDef,
} from '../types/game';
import { getSavedCardImage, resolveCardImage } from '../utils/animeArtLoader';

interface AnimePortraitProps {
  card: CardDef;
  evolved?: boolean;
  evolutionLevel?: 1 | 2 | 3;
  className?: string;
}

const FACTION_BG: Record<string, string> = {
  'Time 7': 'from-orange-950/90 via-slate-900 to-sky-950/90',
  'Time 8': 'from-emerald-950/90 via-slate-900 to-indigo-950/90',
  'Time 9': 'from-green-950/90 via-slate-900 to-amber-950/90',
  'Time 10': 'from-slate-900 via-zinc-900 to-rose-950/90',
  'Som & Sannin': 'from-purple-950/90 via-slate-950 to-slate-900',
  Hokages: 'from-red-950/90 via-amber-950/60 to-slate-950',
  Areia: 'from-amber-950/90 via-stone-900 to-red-950/80',
  Névoa: 'from-cyan-950/90 via-slate-900 to-slate-950',
  Neutro: 'from-stone-900 via-slate-900 to-zinc-950',
  Akatsuki: 'from-red-950/90 via-slate-950 to-zinc-950',
};

function CharacterAnimeSVG({
  card,
  evolutionLevel = 1,
}: {
  card: NinjaCardDef | UnitCardDef;
  evolutionLevel?: 1 | 2 | 3;
}) {
  const dna = card.visualDNA;
  const evolved = evolutionLevel >= 2;
  const auraColor =
    evolutionLevel === 3 ? '#F97316' : evolutionLevel === 2 ? dna.evolvedAura : '#38BDF8';

  const renderHairBack = () => {
    switch (dna.hairStyle) {
      case 'indigo_long':
      case 'brown_long':
      case 'black_wavy':
      case 'pale_long':
      case 'long_brown_sage':
        return (
          <path
            d="M32 45 C25 75 24 115 28 140 L112 140 C116 115 115 75 108 45 C102 22 40 22 32 45 Z"
            fill={dna.hairColor}
          />
        );
      case 'pink_bob':
        return (
          <path
            d="M34 45 C28 65 28 96 36 108 L104 108 C112 96 112 65 106 45 C98 20 42 20 34 45 Z"
            fill={dna.hairColor}
          />
        );
      case 'silver_ponytail':
      case 'blonde_ponytail':
        return (
          <path
            d="M40 30 L70 18 L100 30 L114 95 L95 100 L45 100 L26 95 Z"
            fill={dna.hairColor}
          />
        );
      default:
        return null;
    }
  };

  const renderHairFront = () => {
    switch (dna.hairStyle) {
      case 'spiky_blonde':
      case 'orange_spiky':
        return (
          <path
            d="M28 58 L20 34 L40 42 L48 16 L64 36 L76 12 L88 36 L108 20 L102 44 L120 38 L108 60 C96 48 44 48 28 58 Z"
            fill={dna.hairColor}
          />
        );
      case 'yellow_flash':
        return (
          <path
            d="M24 62 L18 38 L38 44 L44 16 L64 34 L74 10 L86 34 L112 18 L104 46 L122 42 L106 64 L96 76 L92 50 L48 50 L44 76 Z"
            fill={dna.hairColor}
          />
        );
      case 'spiky_duckbutt':
        return (
          <path
            d="M24 62 L14 40 L34 42 L38 18 L58 32 L72 14 L86 32 L106 20 L104 42 L124 44 L110 64 L92 50 L78 72 L70 50 L60 72 L48 50 Z"
            fill={dna.hairColor}
          />
        );
      case 'silver_gravity':
        return (
          <path
            d="M32 54 L26 24 L46 34 L58 10 L76 30 L94 12 L106 34 L118 24 L106 58 L86 48 L60 66 L54 46 Z"
            fill={dna.hairColor}
          />
        );
      case 'bowl_cut':
        return (
          <path
            d="M33 56 C33 24 107 24 107 56 L96 50 L82 54 L70 48 L58 54 L44 50 Z"
            fill={dna.hairColor}
          />
        );
      case 'buns_twin':
        return (
          <g fill={dna.hairColor}>
            <circle cx="28" cy="36" r="14" />
            <circle cx="112" cy="36" r="14" />
            <path d="M34 52 C38 24 102 24 106 52 L92 48 L70 58 L48 48 Z" />
          </g>
        );
      case 'pineapple':
        return (
          <path
            d="M48 44 L54 20 L70 8 L88 22 L82 44 L106 54 L70 48 L34 54 Z"
            fill={dna.hairColor}
          />
        );
      case 'hokage_hat':
        return (
          <g>
            <path d="M16 52 L70 16 L124 52 Z" fill="#F8FAFC" stroke="#DC2626" strokeWidth="3" />
            <rect x="52" y="34" width="36" height="16" rx="2" fill="#DC2626" />
          </g>
        );
      case 'dark_hood':
        return (
          <path
            d="M28 110 C22 50 38 18 70 18 C102 18 118 50 112 110 L96 90 L98 52 L42 52 L44 90 Z"
            fill={dna.outfitColor}
          />
        );
      case 'red_short':
        return (
          <path
            d="M34 56 L30 32 L48 36 L60 18 L72 34 L86 18 L96 36 L110 34 L106 56 L88 46 L70 52 L52 46 Z"
            fill={dna.hairColor}
          />
        );
      default:
        return (
          <path
            d="M32 56 C36 22 104 22 108 56 L94 48 L78 62 L70 46 L60 62 L46 48 Z"
            fill={dna.hairColor}
          />
        );
    }
  };

  const renderEyes = () => {
    if (dna.eyeStyle === 'sunglasses') {
      return (
        <g>
          <rect x="43" y="62" width="22" height="13" rx="6" fill="#090D16" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="75" y="62" width="22" height="13" rx="6" fill="#090D16" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="65" y1="68" x2="75" y2="68" stroke="#94A3B8" strokeWidth="2" />
        </g>
      );
    }

    const irisColor =
      dna.eyeStyle === 'sharingan'
        ? '#DC2626'
        : dna.eyeStyle === 'crimson'
          ? '#B91C1C'
          : dna.eyeStyle === 'byakugan'
          ? '#E2E8F0'
          : dna.eyeStyle === 'emerald'
            ? '#10B981'
            : dna.eyeStyle === 'snake_gold'
              ? '#FACC15'
              : dna.eyeStyle === 'blue_normal'
                ? '#38BDF8'
                : dna.eyeStyle === 'amber'
                  ? '#F59E0B'
                  : '#334155';

    const showLeftEye = card.id !== 'kakashi_hatake';

    return (
      <g>
        {showLeftEye ? (
          <g>
            <ellipse cx="53" cy="69" rx="8" ry="5" fill="#FFFFFF" />
            <circle cx="54" cy="69" r="4" fill={irisColor} />
            <circle cx="54" cy="69" r={dna.eyeStyle === 'snake_gold' ? 1.3 : 1.8} fill="#090D16" />
          </g>
        ) : (
          <path d="M44 69 L62 67" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
        )}
        <g>
          <ellipse cx="87" cy="69" rx="8" ry="5" fill="#FFFFFF" />
          <circle cx="86" cy="69" r="4" fill={irisColor} />
          <circle cx="86" cy="69" r={dna.eyeStyle === 'snake_gold' ? 1.3 : 1.8} fill="#090D16" />
          {dna.eyeStyle === 'sharingan' && (
            <circle cx="86" cy="69" r="2.8" fill="none" stroke="#090D16" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
          )}
        </g>
        <path
          d="M44 61 L62 63"
          stroke="#1E293B"
          strokeWidth={card.id === 'rock_lee' || card.id === 'might_guy' ? 4 : 2}
          strokeLinecap="round"
        />
        <path
          d="M78 63 L96 61"
          stroke="#1E293B"
          strokeWidth={card.id === 'rock_lee' || card.id === 'might_guy' ? 4 : 2}
          strokeLinecap="round"
        />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 140 150" className="w-full h-full select-none" aria-hidden="true">
      <defs>
        <radialGradient id={`aura-${card.id}-${evolutionLevel}`} cx="50%" cy="45%" r="55%">
          <stop
            offset="0%"
            stopColor={auraColor}
            stopOpacity={evolutionLevel === 3 ? '0.62' : evolutionLevel === 2 ? '0.45' : '0.22'}
          />
          <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="140" height="150" fill="transparent" />
      <circle cx="70" cy="70" r="65" fill={`url(#aura-${card.id}-${evolutionLevel})`} />

      {evolved && (
        <g opacity={evolutionLevel === 3 ? '0.92' : '0.72'}>
          <path d="M22 125 Q35 80 28 35" stroke={auraColor} strokeWidth={evolutionLevel === 3 ? '2.8' : '2'} fill="none" strokeLinecap="round" />
          <path d="M118 125 Q105 80 112 35" stroke={auraColor} strokeWidth={evolutionLevel === 3 ? '2.8' : '2'} fill="none" strokeLinecap="round" />
          {evolutionLevel === 3 && (
            <>
              <path d="M36 135 Q45 92 40 52" stroke="#FBBF24" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <path d="M104 135 Q95 92 100 52" stroke="#FBBF24" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </>
          )}
        </g>
      )}

      {renderHairBack()}
      <path d="M20 150 C24 114 42 104 70 104 C98 104 116 114 120 150 Z" fill={dna.outfitColor} />
      {evolutionLevel >= 2 && (
        <path
          d="M28 150 C31 120 46 110 70 110 C94 110 109 120 112 150 Z"
          fill={evolutionLevel === 3 ? '#7F1D1D' : '#14532D'}
          opacity="0.88"
        />
      )}
      <path d="M44 106 L70 128 L96 106 L88 102 L70 116 L52 102 Z" fill={dna.accentColor} />
      <rect x="59" y="88" width="22" height="22" rx="6" fill={dna.skinTone} />
      <path d="M41 56 C41 36 99 36 99 56 L97 80 C97 95 82 104 70 104 C58 104 43 95 43 80 Z" fill={dna.skinTone} />

      {dna.marking === 'whiskers' && (
        <g stroke="#7C2D12" strokeWidth="1.5" opacity="0.7" strokeLinecap="round">
          <line x1="46" y1="77" x2="54" y2="78" />
          <line x1="46" y1="81" x2="54" y2="81" />
          <line x1="47" y1="85" x2="54" y2="84" />
          <line x1="94" y1="77" x2="86" y2="78" />
          <line x1="94" y1="81" x2="86" y2="81" />
          <line x1="93" y1="85" x2="86" y2="84" />
        </g>
      )}
      {dna.marking === 'fangs' && (
        <g fill="#DC2626">
          <polygon points="48,76 54,76 51,85" />
          <polygon points="86,76 92,76 89,85" />
        </g>
      )}
      {dna.marking === 'swirls' && (
        <g fill="none" stroke="#EC4899" strokeWidth="1.6">
          <circle cx="50" cy="80" r="4" />
          <circle cx="90" cy="80" r="4" />
        </g>
      )}
      {dna.marking === 'purple_eyes' && (
        <g fill="#7E22CE" opacity="0.8">
          <polygon points="46,72 52,72 49,79" />
          <polygon points="88,72 94,72 91,79" />
        </g>
      )}
      {dna.marking === 'face_paint' && (
        <g fill="#DC2626" opacity="0.75">
          <rect x="47" y="76" width="5" height="6" rx="1" />
          <rect x="88" y="76" width="5" height="6" rx="1" />
        </g>
      )}
      {dna.marking === 'sand_tattoo' && (
        <path d="M48 48 L56 48 M52 44 L52 54 M49 52 L55 52" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" />
      )}

      {card.id === 'kakashi_hatake' ? (
        <path d="M43 76 L97 76 L95 96 C88 103 78 105 70 105 C62 105 52 103 45 96 Z" fill="#1E293B" />
      ) : (
        <path d="M62 91 Q70 94 78 91" stroke="#78350F" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}

      {dna.marking === 'beard' && (
        <path d="M54 92 Q70 108 86 92 L78 105 L70 107 L62 105 Z" fill="#334155" opacity="0.85" />
      )}

      {renderEyes()}

      {dna.marking === 'glasses' && (
        <g fill="none" stroke="#E2E8F0" strokeWidth="1.6">
          <circle cx="53" cy="69" r="9" />
          <circle cx="87" cy="69" r="9" />
          <line x1="62" y1="69" x2="78" y2="69" />
        </g>
      )}

      {dna.hasHeadband && dna.hairStyle !== 'hokage_hat' && (
        <g>
          <rect x="40" y="45" width="60" height="12" rx="3" fill={dna.headbandColor} />
          <rect x="54" y="47" width="32" height="8" rx="2" fill="#CBD5E1" stroke="#475569" strokeWidth="1" />
          <path d="M67 51 C70 48 74 51 70 53 C68 54 66 52 67 51 Z" fill="#334155" />
        </g>
      )}

      {renderHairFront()}
    </svg>
  );
}

const KIND_LABEL: Record<CardDef['kind'], string> = {
  ninja: 'Ninja',
  unidade: 'Unidade',
  token: 'Token',
  jutsu: 'Jutsu',
  armadilha: 'Armadilha',
  equipamento: 'Equipamento',
};

/** Placeholder exibido quando a imagem da Narutopedia não carrega: só o nome da própria carta. */
function NamePlaceholder({ card }: { card: CardDef }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
      <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500">{KIND_LABEL[card.kind]}</span>
      <span className="text-xs sm:text-sm font-display font-bold text-amber-200 leading-tight">{card.name}</span>
      <span className="text-[8px] text-slate-500">Imagem indisponível</span>
    </div>
  );
}

function useCardImage(card: CardDef, rank: 1 | 2 | 3) {
  const saved = getSavedCardImage(card, rank);
  const [url, setUrl] = useState<string | null>(saved);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    const direct = getSavedCardImage(card, rank);
    setUrl(direct);
    if (!direct) {
      resolveCardImage(card, rank).then((resolved) => {
        if (active) {
          setUrl(resolved);
          if (!resolved) setFailed(true);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [card, rank]);

  // 1ª falha: tenta de novo com um parâmetro extra. Um 404 recebido antes (quando o navegador
  // ainda mandava Referer e o CDN bloqueava o hotlink) pode ter ficado no cache do navegador.
  const onError = () => {
    if (url && !url.includes('nr=1')) {
      setUrl(url + (url.includes('?') ? '&' : '?') + 'nr=1');
      return;
    }
    setFailed(true);
  };
  return { url, failed, onError };
}

export const AnimePortrait: React.FC<AnimePortraitProps> = ({
  card,
  evolved = false,
  evolutionLevel,
  className = '',
}) => {
  const effectiveRank: 1 | 2 | 3 =
    card.kind === 'ninja' ? evolutionLevel ?? (evolved ? 2 : 1) : 1;
  const { url, failed, onError } = useCardImage(card, effectiveRank);
  const rankName = effectiveRank === 3 ? 'Jounnin' : effectiveRank === 2 ? 'Chuunin' : 'Gennin';

  if (card.kind === 'jutsu' || card.kind === 'armadilha' || card.kind === 'equipamento') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-slate-950 ${className}`}>
        {url && !failed ? (
          <>
            <img
              src={url}
              alt={card.name}
              referrerPolicy="no-referrer"
              onError={onError}
              className="w-full h-full object-cover object-center opacity-95 scale-105"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 42%, transparent 25%, rgba(9,13,22,0.55) 100%)`,
              }}
            />
          </>
        ) : (
          <NamePlaceholder card={card} />
        )}
      </div>
    );
  }

  const bgGrad = FACTION_BG[card.faction] || 'from-slate-900 to-slate-950';

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-b ${bgGrad} ${className}`}>
      {url && !failed ? (
        <img
          src={url}
          alt={card.kind === 'ninja' ? `${card.name} (${rankName})` : card.name}
          referrerPolicy="no-referrer"
          onError={onError}
          className={`w-full h-full object-cover object-top transition-transform duration-200 ${
            effectiveRank === 3
              ? 'brightness-110 contrast-115 saturate-115 scale-[1.07]'
              : effectiveRank === 2
                ? 'brightness-105 contrast-105 scale-[1.03]'
                : ''
          }`}
        />
      ) : (
        <>
          <CharacterAnimeSVG card={card} evolutionLevel={effectiveRank} />
          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-1 py-0.5 text-center">
            <span className="text-[9px] font-semibold text-amber-200 leading-tight">{card.name}</span>
          </div>
        </>
      )}
      {effectiveRank >= 2 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              effectiveRank === 3
                ? 'inset 0 0 26px rgba(249,115,22,0.72)'
                : `inset 0 0 20px ${card.visualDNA.evolvedAura}99`,
          }}
        />
      )}
    </div>
  );
};
