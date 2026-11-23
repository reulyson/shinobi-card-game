# Arquitetura do repositório — Shinobi CardGame

Alinhado à estrutura de referência do [manual profissional](./DESIGN/03-manual-profissional.md) (Parte XI):

```text
CARD_GAME/
├── DESIGN/   → docs/DESIGN/
├── DATA/     → src/data/
├── ENGINE/   → src/engine/
├── UI/       → src/ui/
├── TESTS/    → tests/
└── ART/      → public/ (+ src/assets)
```

---

## Árvore atual

```text
shinobi-card-game/
├── docs/
│   ├── DESIGN/            # Pesquisa e manuais de game design
│   ├── RULES/             # Regras jogáveis
│   ├── architecture.md
│   └── README.md
├── public/                # Arte estática (ART)
├── scripts/
├── src/
│   ├── data/
│   ├── engine/
│   ├── types/
│   ├── ui/
│   │   ├── card/
│   │   ├── combat/        # ArenaScreen, campo, pilha
│   │   ├── hud/           # Histórico, moeda, chakra
│   │   ├── screens/       # Lobby, deck, regras, batalha…
│   │   └── shared/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
└── tests/
```

---

## Telas (`src/ui/screens`)

| Arquivo | Papel |
|---------|--------|
| `LobbyScreen.tsx` | Lobby / título |
| `DeckBuilderScreen.tsx` | Deck builder + coleção |
| `RulesScreen.tsx` | Regras no app |
| `MatchHistoryScreen.tsx` | Histórico de partidas |
| `BattleScreen.tsx` | Partida (lógica + ArenaScreen) |

---

## Responsabilidades

| Camada | Pode | Não deve |
|--------|------|----------|
| `docs/DESIGN` | Visão, metodologias, pesquisa | Código executável |
| `docs/RULES` | Regras oficiais do jogo | Specs de implementação |
| `src/data` | Definições de cartas / conteúdo | Lógica de combate |
| `src/engine` | Validar e aplicar regras | Importar React / UI |
| `src/ui/*` | Renderizar e enviar intents | Duplicar regras de combate |
| `tests` | Provar regras e contratos | Depender de browser desnecessário |

---

## Fluxo (alvo)

```text
UI (screens/combat/hud) → intents → engine → estado → UI
                ↑
              data + types
```

Ver também: [04 — Pesquisa Shinobi](./DESIGN/04-pesquisa-shinobi.md) · [05 — Conhecimento card games](./DESIGN/05-conhecimento-card-games.md).

---

## DRY / reuso

Preferir fonte única e apresentação compartilhada (sem god-modules):

| Área | Fonte |
|------|--------|
| Limites de regra (mão, campo, Oculto, deck, Reserva, Vitalidade) | `src/engine/limits.ts` (reexport em `battleEngine`; aliases de layout em `ui/combat/grid.ts`) |
| Keywords (motor = nomes na carta) | `src/types/game.ts` (`Keyword`, `KEYWORD_LIST`, `keywordFromDisplayLabel`, `formatKeywords`) |
| Ícone SVG por palavra-chave na carta | `src/ui/card/theme.ts` (`KEYWORD_ICON`, `keywordIconId`) + `public/icons/` |
| Créditos dos ícones de keyword | `src/data/keywordIconCredits.ts` |
| Velocidades de Jutsu (rótulos na carta) | `SPEED_DISPLAY_NAME` em `src/types/game.ts` |
| Help / visuals de keyword | `src/data/keywordHelp.ts`, `src/data/keywordVisuals.ts` |
| Face / verso de carta | `src/ui/card/CardFace.tsx`, `src/ui/card/CardBack.tsx` (reexport em `ui/shared/CardBack`) |
| Match → modelo de arena | `src/ui/combat/mapBattleToArena.ts` |
| Custo / pagar / jogabilidade | `getEffectiveCost` / `canPayCard` / `getUnplayableReason` em `battleEngine` (UI não reimplementa) |
