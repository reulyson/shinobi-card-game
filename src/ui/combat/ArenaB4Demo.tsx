import { ArenaB4Screen } from './ArenaB4Screen';
import { ARENA_B4_FIXTURES, parseDemoId } from './fixtures';
import type { ArenaB4DemoId } from './types';

export function ArenaB4Demo({ demoId }: { demoId: ArenaB4DemoId }) {
  const model = ARENA_B4_FIXTURES[demoId];
  return <ArenaB4Screen model={model} />;
}

export function resolveArenaB4DemoFromSearch(search: string): ArenaB4DemoId | null {
  const params = new URLSearchParams(search);
  return parseDemoId(params.get('b4demo') ?? params.get('demo'));
}
