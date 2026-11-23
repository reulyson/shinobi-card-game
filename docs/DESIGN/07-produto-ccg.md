# Produto — Shinobi CardGame como CCG

**Status:** decisões de produto (novembro 2026)  
**Classificação:** **CCG** (Collectible Card Game) digital

---

## Por que CCG (e não TCG / LCG)

| Modelo | Motivo |
|--------|--------|
| **CCG** | Coleção digital; packs + craft; **sem venda/troca entre jogadores** |
| Não TCG | TCG enfatiza *trading*; não haverá mercado/trade P2P |
| Não LCG | Aquisição inclui packs e craft (não só expansões fechadas tipo “caixa completa”) |

Combate e regras de partida são independentes dessa classificação; ela define o **loop de coleção**.

---

## Decisões v1

| Tópico | Decisão |
|--------|---------|
| Classificação | **CCG** |
| Poder | **F2P completo** — todas as cartas obtíveis de graça; cash (se houver) = tempo / cosmético / conveniência |
| Aquisição | Packs (moeda do jogo + missão semanal) · craft via recurso de duplicata · modo história (moeda + recurso) |
| Pool | **Estável** — ver seção abaixo |
| Formato (v1) | **Único (= todo o pool)** — ver seção abaixo |
| Formato (v2, opcional) | Só se o catálogo/meta exigir modos separados |
| MVP combate | **Só vs IA** (ranked/PvP online fora do MVP) |
| Economia / packs / pity / missões / história / cash / sets nomeados | **Fora do MVP** — documentado como intenção; implementar depois |

---

## Pool × Formato (o que não misturar)

São duas perguntas diferentes:

| | **Pool** | **Formato** |
|--|----------|------------|
| Pergunta | Quais cartas **existem no jogo** (no catálogo / packs)? | Quais cartas **podem entrar no deck** neste modo de jogo? |
| Escopo | Produto / coleção / expansões | Ranked, casual, desafio… |
| Muda quando | Lança set novo (ou retira set, se rotativo) | Você cria um modo com lista legal diferente |
| Analogia | “O que tem na loja/coleção” | “O que vale nesta mesa” |

```text
POOL (catálogo do CCG)
  └── todas as cartas que o jogador pode possuir / craftar

FORMATO (filtro por modo)
  └── subconjunto do pool permitido no deck daquele modo
```

Hoje no código há **um catálogo** e **um builder** — na prática pool = formato. Isso é normal no início.

### Pool no Shinobi

**Decisão: pool estável**

1. Lança “Set 1” (catálogo atual) → todas essas cartas existem para sempre na coleção.  
2. Lança “Set 2” → cartas novas **somam**; as do Set 1 **não saem** dos packs/craft/coleção.  
3. Ninguém perde o valor do que craftou de graça.

**O que pool estável NÃO é:**
- Não é “rotação” (rotação = cartas antigas **saem** do ranked).  
- Não impede **ban** pontual de uma carta abusiva (ban ≠ tirar do pool de coleção).

**Organização útil (mesmo com pool estável):** cada carta ganha um `setId` (ex.: `core`, `chuunin_exams`) só para packs, UI e lore — o set **não remove** a carta depois.

### Formato no Shinobi

**Decisão v1: um formato só = “Coleção completa”**

- Qualquer carta que você **possui** e que é **deckable** pode ir no baralho de 24 (sujeito às regras: máx. ninjas, cópias, etc.).  
- Não existe ainda “Standard” separado.  
- Casual e ranked (quando existir) usam a **mesma** lista legal.

**Quando pensar em um segundo formato (v2):**

| Sintoma | Possível resposta |
|---------|-------------------|
| Meta travada por combos muito antigos | Banlist no formato único **ou** modo Standard (só sets recentes) |
| Novatos afogados em 500+ cartas | Modo “Core / Iniciante” com pool reduzido |
| Evento temático | Formato especial (ex.: só Vila da Folha) |

Até o catálogo ser grande e o meta doer, **não precisa** de segundo formato — evita confundir o jogador e dobra trabalho de balance.

### Resumo em uma frase

- **Pool estável** = o jogo **nunca apaga** cartas do catálogo.  
- **Formato único** = no ranked/casual v1, **tudo do pool** (deckable) vale.  
- Depois, se precisar, o formato vira um **filtro** em cima do mesmo pool — o pool continua estável.

---

## Fluxo de aquisição (alvo)

```text
Missão semanal / História / jogar
        ↓
   moeda do jogo ──→ packs ──→ carta nova → coleção
        ↓                         ↓
   recurso craft ←── duplicata
        ↓
   craft da carta que falta
```

---

## Raridade (decisão — 4 níveis)

| Nível | Código | Papel na coleção |
|-------|--------|------------------|
| Comum | `C` | Staples, curva baixa, enchimento de pack |
| Incomum | `I` | Peças de arquétipo sólidas |
| Rara | `R` | Cartas de identidade / fantasia forte |
| Lendária | `L` | Rosto do set, ninjas icônicos, “chase” de coleção |

**Tokens e jutsus exclusivos gerados em partida:** sem raridade de pack (não dropam em booster). Opcional: craft só do **ninja pai** ou da carta deckable associada.

### O que a raridade AFETA

| Sistema | Como |
|---------|------|
| **Packs** | Chance de aparecer (C ≫ I ≫ R ≫ L); pity opcional para L |
| **Craft** | Custo em recurso sobe com a raridade |
| **Duplicata** | Recurso devolvido sobe com a raridade (desmontar / auto-dust) |
| **Missão / história** | Recompensas podem ser pack ou recurso; raramente carta L direta |
| **Metas de coleção** | % completo, álbuns por set, “falta 1 lendária” |

### O que a raridade NÃO deve afetar (F2P no poder)

| Sistema | Por quê |
|---------|---------|
| **Poder da carta** | Lendária ≠ mais forte; power budget é independente |
| **Visual da carta** | Sem borda/brilho/FX por raridade — o molde é o mesmo para C e L |
| **Legalidade no deck / formato** | Formato único: C e L entram igual (se deckable) |
| **Regras de combate** | Motor não lê raridade para dano, keywords, evolução |
| **Acesso a modos** | Ranked/casual não exigem raridade mínima |

### Números-alvo (v1 — calibrar no playtest)

Pack (exemplo 5 cartas): curva típica **3C + 1I + 1R**, com **L** substituindo a R em ~5–8% dos packs (ou pity a cada N packs).

Craft / duplicata (unidade relativa “pó”):

| Raridade | Craft | Duplicata devolve |
|----------|-------|-------------------|
| C | 40 | 5 |
| I | 100 | 20 |
| R | 400 | 100 |
| L | 1600 | 400 |

(Ajustar depois da economia de missão semanal / história.)

### Dados no código

- Tipo `CardRarity` em `src/types/game.ts`  
- Mapa + aplicação: `src/data/rarity.ts` → `withCollectionRarity` em `ALL_CARDS`  
- `validateDeck` / motor / visual **ignoram** raridade  
- Economia de pack/craft: **fora do MVP** (números-alvo abaixo só como referência futura)  

---

## Arquétipos (decisão)

**Base oficial (4)** — alinhado a Hearthstone / LoR:

| Arquétipo | Plano |
|-----------|--------|
| **Aggro** | Vencer rápido, antes do rival desenvolver / evoluir |
| **Midrange (Mid)** | Valor e campo no meio do jogo; flexível vs aggro/control |
| **Control** | Remover ameaças, sobreviver, virar tarde |
| **Combo** | Sequência / peças específicas → explosão ou vantagem decisiva |

**Subtipos** — permitidos e desejáveis (não substituem a base). Exemplos possíveis no Shinobi:

| Subtipo | Costuma viver sob | Ideia |
|---------|-------------------|--------|
| Ocultos / armadilha | Control ou Mid | Pilha, punir jogadas do rival |
| Evolução / patente | Mid | Apostar em promoção Gennin→Jounnin |
| Swarm / tokens | Aggro ou Mid | Campo largo com gerados |
| Burn / dano direto | Aggro ou Combo | Vitalidade como relógio |
| Tempo | Mid | Curva eficiente turno a turno |

Regra de design: toda carta ou preset declara **1 arquétipo base** (+ subtipo opcional).  
No MVP, balance deve garantir que **Aggro, Mid e Control** sejam viáveis; **Combo** pode ser menos comum no início.

Meta desejado (ciclo): Mid → Aggro → Control → Combo → Mid (ajustar com playtest).

---

## Fora de escopo (por enquanto)

- Trade / marketplace entre jogadores  
- Cartas exclusivas de cash (P2W)  
- Rotação que invalida cartas craftadas  

---

## Relacionados

- [04 — Pesquisa Shinobi](./04-pesquisa-shinobi.md)  
- [05 — Conhecimento card games](./05-conhecimento-card-games.md)  
- [Inventário de cartas](../DATA/inventario-cartas.md)  
