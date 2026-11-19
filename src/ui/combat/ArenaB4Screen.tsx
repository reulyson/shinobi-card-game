import type { ReactNode } from 'react';
import { ArenaBackground } from './ArenaBackground';
import { AttackArrows } from './AttackArrows';
import { BoardBands } from './BoardBands';
import { CombatBoard } from './CombatBoard';
import { DeckPile } from './DeckPile';
import { FixedStage } from './FixedStage';
import { HistoricoScroll } from './HistoricoScroll';
import { OcultoSlots } from './OcultoSlots';
import { PilhaStrip } from './PilhaStrip';
import { PlayerHandFan } from './PlayerHandFan';
import { RivalHand } from './RivalHand';
import { TurnCoin } from './TurnCoin';
import { VitalidadeBandanas } from './VitalidadeBandanas';
import type { ArenaB4Model, ArenaCardRef } from './types';

export interface ArenaB4ScreenProps {
  model: ArenaB4Model;
  onMainAction?: () => void;
  onCardClick?: (card: ArenaCardRef) => void;
  onHandCardClick?: (cardId: string, index: number) => void;
  /** Overlays extras (modais, cinematics) — filhos absolutos na tela 1600×900. */
  children?: ReactNode;
}

/**
 * Tela de combate B4: grade fixa 1600×900, fundo Chunin, tabuleiro e HUDs.
 * Slots Part 4: HistoricoScroll, TurnCoin (+ chakra ring).
 */
export function ArenaB4Screen({
  model,
  onMainAction,
  onCardClick,
  onHandCardClick,
  children,
}: ArenaB4ScreenProps) {
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

        {/* Part 4 mount: Histórico — laterais abertas para ver faixas/linha */}
        <HistoricoScroll lines={model.historicoLines} />

        <VitalidadeBandanas
          rival={model.rivalVitality}
          mine={model.myVitality}
          round={model.round}
        />

        <RivalHand count={model.rivalHandCount} />
        <PlayerHandFan cards={model.myHand} onCardClick={onHandCardClick} />

        <DeckPile side="enemy" remaining={model.rivalDeck.remaining} total={model.rivalDeck.total} />
        <DeckPile side="player" remaining={model.myDeck.remaining} total={model.myDeck.total} />

        {/* Part 4 mount: TurnCoin + chakra ring */}
        <TurnCoin
          myTurn={model.myTurn}
          label={model.mainActionLabel}
          rivalChakra={model.rivalChakra}
          myChakra={model.myChakra}
          onAction={onMainAction}
        />

        {children}
      </div>
    </FixedStage>
  );
}
