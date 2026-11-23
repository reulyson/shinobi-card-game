# Shinobi CardGame

Card game digital no universo shinobi, inspirado em *Legends of Runeterra*: deckbuilding, combate tático, evolução linear **Gennin → Chuunin → Jounnin**, jutsus exclusivos gerados em partida e pilha de resolução.

**Demo (GitHub Pages):** https://reulyson.github.io/shinobi-card-game/

---

## Stack

- React 19 + Vite 8 + TypeScript  
- Tailwind CSS 4  
- Motor de regras em `src/engine/`  
- Dados de cartas em `src/data/`  
- Testes com `tsx` em `tests/`  

---

## Rodar localmente

**Pré-requisito:** Node.js 22+

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm test` | Suites de regras e UI de combate |
| `npm run clean` | Remove `dist/` |

Para Pages, o build usa `GITHUB_PAGES=true` (base `/shinobi-card-game/`). Em local, rode sem essa variável.

**Demos de layout** (`?demo=hud`, `?b4=…`) só funcionam em modo DEV.

---

## Estrutura

```text
docs/
  DESIGN/            # Manuais e pesquisa
  RULES/             # core-rules.md
  architecture.md
src/
  data/
  engine/
  types/
  ui/
    card/
    combat/          # ArenaScreen
    hud/
    screens/         # LobbyScreen, BattleScreen…
    shared/
tests/
public/
```

Detalhes: [docs/architecture.md](docs/architecture.md).

---

## Documentação

Índice: [docs/README.md](docs/README.md)

| Documento | Conteúdo |
|-----------|----------|
| [Core Rules](docs/RULES/core-rules.md) | Regras oficiais do jogo |
| [Architecture](docs/architecture.md) | Organização DESIGN / DATA / ENGINE / UI |
| [01 — Fundamentos](docs/DESIGN/01-fundamentos.md) | Game design de card games |
| [02 — Criação e evolução](docs/DESIGN/02-criacao-evolucao.md) | Pipeline de cartas, T-C-E-R |
| [03 — Manual profissional](docs/DESIGN/03-manual-profissional.md) | Concepção → implementação |
| [04 — Pesquisa Shinobi](docs/DESIGN/04-pesquisa-shinobi.md) | Decisões do projeto e fontes |

---

## Decisões de produto (resumo)

| Tópico | Decisão |
|--------|---------|
| Produto | **CCG** (sem trade entre jogadores) |
| Deck | 24 cartas |
| Evolução | Linear (sem ramificação) |
| Progresso | Híbrido (global + por instância) |
| Jutsus exclusivos | Gerados em runtime, fora do deck |
| MVP | vs IA; PvP online fora de prioridade |
| Arenas | Efeitos desligados no MVP (`ARENA_EFFECTS_ENABLED`) |

Detalhes e restrições técnicas: [docs/DESIGN/04-pesquisa-shinobi.md](docs/DESIGN/04-pesquisa-shinobi.md).

---

## Licença / IP

Franquia Naruto e materiais oficiais pertencem aos respectivos detentores. Este projeto é um protótipo de estudo; uso comercial de arte, nomes e personagens exige licença adequada.
