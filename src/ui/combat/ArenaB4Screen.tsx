import type { ReactNode, Ref } from 'react';
import {
  HistoricoScroll,
  TurnChakraHud,
  type TurnCoinHandle,
  type TurnCoinPreview,
} from '../../components/combat';
import { ArenaBackground } from './ArenaBackground';
import { AttackArrows } from './AttackArrows';
import { BoardBands } from './BoardBands';
import { CombatBoard } from './CombatBoard';
import { DeckPile } from './DeckPile';
import { FixedStage } from './FixedStage';
import { LINE_Y, ZONES } from './grid';
import { OcultoSlots } from './OcultoSlots';
import { PilhaStrip } from './PilhaStrip';
import { PlayerHandFan } from './PlayerHandFan';
import { RivalHand } from './RivalHand';
import { VitalidadeBandanas } from './VitalidadeBandanas';
import type { ArenaB4Model, ArenaCardRef } from './types';
import './arenaB4Part4.css';

/** Crop gen_timer: CXX=1525, CY=LINE_Y → origem (1390, 190). */
const TURN_HUD_X = 1525 - 135;
const TURN_HUD_Y = LINE_Y - 226;

export interface ArenaB4ScreenProps {
  model: ArenaB4Model;
  onMainAction?: () => void;
  onTurnTimeout?: () => void;
  /** Desliga o botão da moeda (motor busy / não é sua vez). */
  actionDisabled?: boolean;
  /** Pausa o timer da moeda (cinemáticas / mulligan). */
  turnPaused?: boolean;
  turnResetKey?: string | number;
  /** Congela a moeda (demos / capturas). */
  turnPreview?: TurnCoinPreview | null;
  historicoOpen?: boolean;
  /** Progresso forçado 0..1 do pergaminho (demos). */
  historicoProgress?: number;
  turnCoinRef?: Ref<TurnCoinHandle>;
  onCardClick?: (card: ArenaCardRef) => void;
  onHandCardClick?: (cardId: string, index: number) => void;
  /** Overlays extras (modais, cinematics) — filhos absolutos na tela 1600×900. */
  children?: ReactNode;
}

function toChakraSide(stats?: { current: number; max: number; reserve?: number }) {
  const current = stats?.current ?? 0;
  const max = stats?.max ?? 0;
  const reserve = stats?.reserve ?? 0;
  return {
    filled: Math.min(10, current),
    unlocked: Math.min(10, Math.max(max, current)),
    reserve: Math.min(3, reserve),
  };
}

/**
 * Tela de combate B4: grade fixa 1600×900, fundo Chunin, tabuleiro e HUDs.
 * Slots Part 4: HistoricoScroll + TurnChakraHud (moeda + chakra) da main.
 */
export function ArenaB4Screen({
  model,
  onMainAction,
  onTurnTimeout,
  actionDisabled = false,
  turnPaused = false,
  turnResetKey,
  turnPreview = null,
  historicoOpen = true,
  historicoProgress,
  turnCoinRef,
  onCardClick,
  onHandCardClick,
  children,
}: ArenaB4ScreenProps) {
  const historico = ZONES.historico;
  const side = model.myTurn ? 'player' : 'rival';

  return (
    <FixedStage>
      <div className="arena-b4-root relative h-full w-full select-none" data-screen="arena-b4">
        <ArenaBackground />

        <CombatBoard
          rivalBackrow={model.rivalBackrow}
          myBackrow={model.myBackrow}
          rivalCombat={model.rivalCombat}
          myCombat={model.myCombat}
          previaLabel={model.previaLabel}
          onCardClick={onCardClick}
        />

        {/* Faixas/linha 205→1395 atrás do Histórico (laterais do pergaminho transparentes). */}
        <BoardBands />

        <PilhaStrip items={model.pilha} compact={model.combatBusy || model.pilha.length > 6} />
        <AttackArrows arrows={model.arrows} />
        <OcultoSlots rivalCount={model.rivalOculto} myCount={model.myOculto} />

        {/* Part 4: pergaminho Histórico @ 1178,128 */}
        <div
          data-mount="HistoricoScroll"
          data-part4-slot="historico"
          className="absolute z-20"
          style={{ left: historico.x, top: historico.y, width: historico.w, height: historico.h }}
        >
          <HistoricoScroll
            entries={model.historicoLines ?? []}
            open={historicoOpen}
            progress={historicoProgress}
          />
        </div>

        <VitalidadeBandanas
          rival={model.rivalVitality}
          mine={model.myVitality}
          round={model.round}
        />

        <RivalHand count={model.rivalHandCount} />
        <PlayerHandFan cards={model.myHand} onCardClick={onHandCardClick} />

        <DeckPile side="enemy" remaining={model.rivalDeck.remaining} total={model.rivalDeck.total} />
        <DeckPile side="player" remaining={model.myDeck.remaining} total={model.myDeck.total} />

        {/* Part 4: moeda + anel de chakra @ crop 1390,190 */}
        <div
          data-mount="TurnChakraHud"
          data-part4-slot="turn-coin"
          className="arena-b4-turn-hud absolute z-[22]"
          style={{ left: TURN_HUD_X, top: TURN_HUD_Y }}
        >
          <TurnChakraHud
            ref={turnCoinRef}
            side={side}
            confirmLabel={model.mainActionLabel}
            paused={turnPaused || turnPreview != null}
            resetKey={turnResetKey}
            disabled={actionDisabled}
            onConfirm={onMainAction}
            onTimeout={onTurnTimeout}
            preview={turnPreview}
            size={104}
            player={toChakraSide(model.myChakra)}
            rival={toChakraSide(model.rivalChakra)}
          />
        </div>

        {children}
      </div>
    </FixedStage>
  );
}
