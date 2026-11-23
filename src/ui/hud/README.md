# HUD — Histórico, moeda e chakra

Componentes autocontidos do HUD de combate. Layout absoluto na arena
(`214×588 @ 1178,128` para o pergaminho; coluna direita para moeda/chakra).

Demo isolada: `/?demo=hud` (timer rápido com `&ms=5000`; alias `?demo=part4`).

## APIs

### `<HistoricoScroll />`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `entries` | `(string \| BattleLogEntry)[]` | — | Linhas do log (`R{n} · texto` se for entry) |
| `open` | `boolean` | `true` | Dispara unroll ao iniciar a batalha |
| `progress` | `number` | — | Força `p`∈[0,1] (frames/demo) |
| `unrollMs` | `number` | `1100` | Duração da abertura (ignorada com reduced-motion) |

Footprint fixo **214×588**. Respeita `prefers-reduced-motion` (abre direto).

### `<TurnCoin ref />`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `side` | `'player' \| 'rival'` | — | Troca dispara poof + reset do líquido |
| `confirmLabel` | `string` | `CONFIRMAR ATAQUE` | No seu turno; rival = `AGUARDE O RIVAL` |
| `durationMs` | `number` | `60000` | Timer visual sem números |
| `paused` | `boolean` | `false` | Pausa (motor / cinemáticas) |
| `resetKey` | `string \| number` | — | Reset externo sem trocar lado |
| `onConfirm` | `() => void` | — | Clique no botão (seu turno) |
| `onTimeout` | `() => void` | — | Líquido chegou ao fim (auto-passar) |
| `hideButton` | `boolean` | `false` | Só a moeda (para usar dentro do anel) |

**Handle (`ref`)**: `pause()`, `resume()`, `reset(side?)`, `getLevel()`.

Seu turno: laranja esvazia cima→baixo. Rival: laranja enche baixo→cima.
Poof cartoon na troca de símbolo (忍 ↔ swirl Uzumaki).

### `<ChakraRing />` (opção B)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `player` / `rival` | `{ filled, unlocked, reserve }` | `filled`/`unlocked` ≤10; `reserve` ≤3 |
| `children` | `ReactNode` | Moeda central |
| `radius` | `number` | Raio dos pips (default 68) |
| `reserveRadius` | `number` | Raio dos losangos (default 88) |

Rival = arco superior vermelho; você = inferior azul.
Slots além de `unlocked` = selados (X). Reserva = 3 losangos no arco externo.

### `<TurnChakraHud />`

Composição pronta no crop **210×500** de `gen_timer` (moeda CR=52 em (135,226), anel R=68 / R2=88).
`size` (default 104) escala o canvas inteiro. Aceita as props de `TurnCoin` + `player`/`rival`.
Ideal para a coluna direita B4 (`1452,171`).

## Hook-up atual (mínimo)

- Painel de Registro → `<HistoricoScroll entries={logs} open={phase!=='MULLIGAN'} />`
- Botão Passar → `<TurnChakraHud … onConfirm={handlePassTurnButton} onTimeout={…} paused={isBusy} />`
