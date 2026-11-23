import { ArenaScreen } from './ArenaScreen';
import { ARENA_FIXTURES, parseDemoId } from './fixtures';
import type { ArenaDemoId } from './types';

export function ArenaDemo({ demoId }: { demoId: ArenaDemoId }) {
  const model = ARENA_FIXTURES[demoId];
  return (
    <ArenaScreen
      model={model}
      historicoOpen
      historicoProgress={1}
      turnPaused
      actionDisabled={!model.myTurn}
      turnPreview={{
        level: model.myTurn ? 0.72 : 0.28,
        displaySide: model.myTurn ? 'player' : 'rival',
        symbol: model.myTurn ? 'kanji' : 'swirl',
      }}
    />
  );
}

export function resolveArenaDemoFromSearch(search: string): ArenaDemoId | null {
  const params = new URLSearchParams(search);
  return parseDemoId(params.get('b4demo') ?? params.get('demo'));
}
