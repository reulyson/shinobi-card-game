# Manual profissional de Game Design

## Desenvolvimento de Card Games Digitais — Da concepção à implementação técnica

**Tipo:** documento técnico · **Âmbito:** completo · **Foco:** jogos digitais

**Objetivo:** metodologia para conceber, projetar, documentar, implementar, testar e balancear um card game digital — cartas, habilidades, combate, economia, progressão, evolução, coleções e arquitetura técnica.

O manual considera crescimento para **centenas ou milhares de cartas**, múltiplos arquétipos, efeitos complexos, expansões e evolução (incluindo ramificada). A estrutura serve como **base reutilizável** para diferentes projetos.

**Relacionado:** [01](./01-fundamentos.md) · [02](./02-criacao-evolucao.md) · [04 Shinobi](./04-pesquisa-shinobi.md) · [05 conhecimento](./05-conhecimento-card-games.md)

---

# PARTE I — FUNDAMENTOS DE GAME DESIGN

## Capítulo 1. Fundamentos e classificação dos Card Games

### 1.1 O que constitui um Card Game?

Sistema interativo baseado em **cartas** e **regras** que definem:

- Ações permitidas e momento de execução  
- Recursos necessários  
- Resolução de efeitos  
- Interação entre cartas  
- Modificação do estado da partida  
- Condições de vitória e derrota  

Em jogos **digitais**, há ainda o software que interpreta regras, administra estados, processa eventos e apresenta resultados.

**Três dimensões:**

```text
Design          → Regras · Cartas · Mecânicas · Estratégia · Progressão
        ↕
Implementação   → Dados · Motor · Eventos · Estados · Interface
        ↕
Experiência     → Decisões · Feedback · Diversão
```

O desafio é fazer as três funcionarem como **um único sistema**.

### 1.2 Principais categorias

| Categoria | Característica |
|-----------|----------------|
| TCG | Colecionáveis + construção de deck |
| CCG | Coleção digital |
| LCG | Expansões com distribuição estruturada |
| Deckbuilder | Deck montado durante a partida |
| Roguelike Deckbuilder | Partidas variáveis + progressão |
| Battler | Unidades + posicionamento |
| Living Card Game | Distribuição controlada |

Categorias **combinam** (ex.: CCG + evolução + combate tático).

### 1.3 Identidade do jogo

Antes das cartas, defina a experiência central:

1. Fantasia principal  
2. Decisão estratégica central  
3. Diferencial das cartas  
4. Como o jogador progride  
5. Identidade mecânica (distinguível de outros TCGs)  

| Elemento | Exemplo conceitual |
|----------|--------------------|
| Tema | Criaturas que evoluem |
| Fantasia | Descobrir e desenvolver seres |
| Estratégia | Sinergias e adaptação |
| Mecânica central | Evolução in-game |
| Progressão | Novas formas |
| Diferencial | Evolução condicionada ao combate |

A identidade mecânica deve ser **perceptível na partida**, não só no lore.

---

## Capítulo 2. Core Gameplay Loop e estrutura da partida

**Core loop:**

1. Comprar cartas  
2. Administrar recursos  
3. Jogar cartas / desenvolver campo  
4. Resolver habilidades e combates  
5. Desenvolver progressão (XP, evolução, contadores)  
6. Verificar vitória → repetir ou encerrar  

### 2.1 Estrutura de turno (modelo referência)

| Fase | Responsabilidade |
|------|------------------|
| Start | Atualizar estados |
| Draw | Comprar |
| Resource | Atualizar recursos |
| Main | Jogar cartas e ações |
| Combat | Ataques e defesas |
| End | Encerrar efeitos |

Ordem e fases são **livres** — definem o feel do jogo.

### 2.2 Documentação de regras

Cada regra deve responder:

- Evento que ativa  
- Quem executa  
- Quando  
- Condições  
- Efeito  
- Conflito com outras regras  
- Falha de execução  

Ambiguidade no GDD vira **bug** no motor.

---

# PARTE II — CARD DESIGN

## Capítulo 3. Arquitetura e anatomia das cartas

Carta = identidade mecânica + função estratégica + apresentação visual.

### 3.1 Estrutura de dados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| card_id | string | ID único |
| name | string | Nome |
| description | string | Texto UI |
| card_type | enum | Tipo |
| faction_id | string | Facção |
| rarity | enum | Raridade |
| cost | int | Custo |
| attack / health | int | Combate |
| keywords | array | Palavras-chave |
| abilities | array | Habilidades (dados) |
| evolution_id | string/null | Próximo estágio / linha |
| artwork_id | string | Arte (separada do gameplay) |

**Separar** gameplay de apresentação.

### 3.2 Tipos de cartas

| Tipo | Função |
|------|--------|
| Creature | Combate |
| Character | Personagem especial |
| Spell | Instantâneo |
| Equipment | Modifica unidade |
| Artifact | Persistente |
| Support | Suporte |
| Terrain | Ambiente |
| Resource | Gera/modifica recursos |

Subtipos em hierarquia (ex.: Creature → Beast → Dragon) para sinergias e condições.

### 3.3 Funções estratégicas

Aggro, Control, Defender, Support, Removal, Finisher, Engine, Utility — identificar **função principal**; várias secundárias são aceitáveis.

---

## Capítulo 4. Atributos, custos e poder

### 4.1 Atributos comuns

Attack, Health, Defense, Speed, Energy, Range, Level, Experience — use só o que gera decisões.

### 4.2 Modelo de power (inicial)

`P = w_a·A + w_h·H + w_s·S + w_e·E`

| Componente | Peso ilustrativo |
|------------|------------------|
| Ataque | 1,0 |
| Vida | 0,7 |
| Habilidade simples | 1,5 |
| Habilidade complexa | 3,0 |

Ajustar por playtest e meta — não é fórmula universal.

### 4.3 Curva de custos (exemplo 100 cartas)

| Custo | Cartas |
|-------|--------|
| 0 | 4 |
| 1 | 16 |
| 2 | 22 |
| 3 | 24 |
| 4 | 16 |
| 5 | 10 |
| 6+ | 8 |

Evita mãos injogáveis cedo e falta de opções tarde.

---

# PARTE III — MECHANICS DESIGN

## Capítulo 5. Engenharia de mecânicas e habilidades

Objetivo: habilidades **combináveis e interpretáveis** pelo motor, sem código por carta.

### 5.1 Anatomia da habilidade

| Componente | Função |
|------------|--------|
| Trigger | Evento inicial |
| Condition | Requisitos |
| Target | Alvo |
| Effect | Operação |
| Duration | Duração |

**Exemplo — Chama Reativa:** OnDamaged → se viva → alvo atacante → 2 dano → instantâneo.

### 5.2 Triggers (taxonomia inicial)

OnPlay, OnDraw, OnDeath, OnAttack, OnDamaged, OnHeal, OnKill, **OnEvolve**, OnTurnStart/End, OnAllyDeath, OnEnemyPlay, OnSpellCast…

Distinguir **evento** de **reação**.

### 5.3 Conditions

- Estado (vida, estágio, keyword, aura)  
- Quantidade (contadores, aliados em campo)  
- Temporal (turno atual, sobreviveu N turnos)  
- Relacional (facção, elemento, inimigo)  

### 5.4 Lógica

AND, OR, NOT, XOR — exemplo:

```text
IF adaptation >= 3 AND health > 0 AND evolution_available
THEN allow_evolution
```

### 5.5 Effects (biblioteca inicial)

Damage, Heal, Draw, Summon, Destroy, Transform, **Evolve**, Buff, Debuff, Discard, Generate, Steal, Copy, Return, Silence, Counter…

Distinguir **instantâneo**, **until end of turn**, **permanente**.

### 5.6 Duration

Instant, ThisTurn, NextTurn, Permanent, UntilDestroyed, UntilCondition, Charges.

### 5.7 Fluxo de execução

```text
Evento → Consultar habilidades → Trigger+Condition válidos?
  Não → Ignorar
  Sim → Target + Effect → Atualizar estado → Novos eventos
```

**Anti-loop:** limite de profundidade, regras de interrupção (ex.: dano ao receber dano).

---

## Capítulo 6. Keywords Design

Reduzem texto e padronizam linguagem.

### 6.1 Categorias (exemplos)

Combate, Defesa, Ataque, Controle, Evolução, Recursos, Morte, Progressão.

### 6.2 Classificação técnica

Static, Triggered, Activated, Conditional, Consumable.

### 6.3 Ficha de keyword (template)

- ID, tipo, evento, condição, efeito, frequência, duração, prioridade  

### 6.4 Quando criar keyword

Reutilização em várias cartas, identidade clara, implementação compartilhada, compreensão do jogador. Habilidade única → ability id, não keyword.

---

# PARTE IV — EVOLUTION DESIGN

## Capítulo 7. Arquitetura de sistemas de evolução

| Conceito | Significado |
|----------|-------------|
| Leveling | Subir nível |
| Evolution | Novo estágio / forma |
| Transformation | Mudança de identidade |
| Mutation | Alteração pontual |

### 7.1 Evolução linear (modelo base)

```text
Estágio 1 → Estágio 2 → Estágio 3
```

Mais simples de implementar e documentar. Cada estágio: entrada + condição(ões) para o próximo.

### 7.2 Evolução ramificada

Forma inicial → ramos (ex.: fogo vs gelo). Motor precisa: destinos, condições simultâneas, escolha do jogador, forma atual, forms exclusivas/reversíveis.

### 7.3 Evolução adaptativa

Modifica stats/habilidades sem trocar `definition_id` — mais variedade, mais controle de atributos e histórico.

### 7.4 Fusão

A + B → validação → consumo → resultado. Definir herança de stats, keywords, alternativas.

---

## Capítulo 8. Evolution Condition System

### 8.1 Categorias

Experience, Counter, Combat, Survival, Resource, Collection, Environment, Elemental, Behavior, Sacrifice.

### 8.2 Contadores (entidade)

```json
{
  "entity_id": "unit_104",
  "counters": {
    "experience": 4,
    "adaptation": 2,
    "rage": 1
  }
}
```

Regras explícitas: cap, reset na evolução, herança, negativos, persistência ao sair do campo.

### 8.3 Requirement (exemplo)

```json
{
  "type": "all",
  "conditions": [
    { "type": "counter_threshold", "counter": "adaptation", "operator": ">=", "value": 3 },
    { "type": "entity_alive" },
    { "type": "resource_threshold", "resource": "energy", "operator": ">=", "value": 2 }
  ]
}
```

### 8.4 Momento da verificação

| Modelo | Uso |
|--------|-----|
| Continuous | A cada mudança de estado |
| Event-based | Após eventos (recomendado inicial) |
| Manual | Jogador inicia promoção |

---

## Capítulo 9. Evolution Reward Design

Recompensas: Stat Growth, New Ability, Keyword, Upgrade, Type/Element change, Branch, Aura.

Evolução pode **trocar função** (Filhote / Predador / Guardião / Oráculo) — não só +poder.

**Evolution Economy:** `V_e = B_e − C_e − R_e` (benefício, custo, risco) — ferramenta de análise, não lei.

---

## Capítulo 10. State Machine de evolução

```text
INITIAL → PROGRESSING → ELIGIBLE → EVOLVING → EVOLVED
```

Estados extras: BLOCKED, FAILED, REVERTED, DEAD, EXPIRED.

Estado evolutivo **≠** estado de combate (congelado, atordoado, etc.).

---

# PARTE V — SYSTEMS DESIGN E ECONOMIA

## Capítulo 11. Resource Design

Mana, Energy, Gold, Rage, Experience, Evolution Points, Charges…

Especificar: Source, Cap, Regeneration, Consumption, Persistence, Transfer, Visibility.

Recursos devem forçar **escolhas** (jogar vs guardar, evoluir vs habilidade).

---

## Capítulo 12. Deck Design

Grupos: Early, Mid, Late, Removal, Support, Draw Engine, Synergy, Finisher.

Arquétipos: Aggro, Control, Midrange, Combo, Tempo, Ramp, **Evolution**, Swarm.

Sinergia: avaliar custo total, cópias, probabilidade, tempo, interrupção, payoff.

---

## Capítulo 13. Combat System

Dano base: `D = max(0, A − R)`.

Ordem de resolução (exemplo): declarar ataque → validar → triggers de ataque → prevenção → cálculo → aplicação → OnDamaged → mortes → OnDeath → atualizar campo.

Deve ser **determinística**.

---

# PARTE VI — PROGRESSION DESIGN

## Capítulo 14. Dentro e fora da partida

- **Intrapartida:** evolução, XP, contadores, buffs temporários  
- **Extrapartida:** coleção, mastery, missões, expansões  

Mastery (exemplo): uso → emblema → moldura → arte alt — preferir **cosméticos** em PvP justo.

---

# PARTE VII — DIGITAL GAME ARCHITECTURE

## Capítulo 15. Arquitetura técnica

### 15.1 Camadas

```text
Presentation     → UI, animação, feedback
Game Logic       → Turnos, combate, evolução
Rules & Effects  → Triggers, conditions, effects
Game State       → Entidades, recursos, histórico
Infrastructure   → Persistência, rede, DB
```

### 15.2 Game State (esboço)

Match, turn, active_player, players (health, mana, hand, field), status.

Separar: público, privado, motor, histórico, temporários.

### 15.3 Definition vs Instance

- **Definition:** imutável (`creature_001`)  
- **Instance:** `unit_104`, stats atuais, contadores, `current_stage`, status  

### 15.4 Event-Driven

```text
CreatureDamaged → Dispatcher → Trigger Registry → Condition → Effect → State → New Events
```

### 15.5 Event Queue

Profundidade, prioridade, cancelamento, eventos aninhados — especialmente para **evolução após contador**.

### 15.6 Determinismo

RNG seed, validação no servidor, versionamento de regras, replay. **UI não valida** — motor valida e executa.

---

## Capítulo 16. Efeitos reutilizáveis

### 16.1 Effect Registry (exemplos)

| ID | Parâmetros |
|----|------------|
| damage | target, amount |
| heal | target, amount |
| draw | player, amount |
| buff | target, stat, value |
| add_counter | target, counter, amount |
| evolve | target, evolution_id |
| transform | target, definition_id |

### 16.2 Ability JSON (exemplo)

```json
{
  "ability_id": "ability_001",
  "name": "Instinto Adaptativo",
  "trigger": { "event": "creature_damaged" },
  "conditions": [{ "type": "entity_alive", "target": "self" }],
  "effects": [{
    "type": "add_counter",
    "target": "self",
    "counter": "adaptation",
    "amount": 1
  }]
}
```

### 16.3 Escalabilidade

500 cartas com código único = manutenção insuportável. Exceções existem, mas devem ser **minoria**.

---

# PARTE VIII — BALANCEAMENTO E MATEMÁTICA

## Capítulo 17. Fundamentos

Dimensões: individual, econômica, temporal, sinérgica, probabilística, competitiva, progressiva.

**Power Budget** (ilustrativo): ataque + vida + passivas − custo = total estimado.

Métricas: Win Rate, Pick/Play Rate, Mulligan, Evolution Rate, duração média — interpretar com contexto.

**Hipergeométrica** (≥1 cópia em n compras de deck N com K cópias): ferramenta de consistência de deck.

---

## Capítulo 18. Balanceamento de evolução

Analisar **toda a jornada**, não só forma final.

| Estágio | Atributos | Risco | Recompensa |
|---------|-----------|-------|------------|
| Inicial | Baixos | Sobreviver | Progressão |
| Intermediário | Médios | Manter em campo | Especializar |
| Final | Altos | Investimento | Poder / função nova |

`EV = P_s × V_r − C_t − C_r`

| Problema | Solução típica |
|----------|----------------|
| Evolução trivial | Endurecer condição |
| Impossível | Relaxar requisito |
| Final OP | Nerf pós-evolução |
| Nunca compensa | Reduzir custo de oportunidade |

---

# PARTE IX — UX, UI E APRESENTAÇÃO

## Capítulos 19–20

Componentes: battlefield, hand, recursos, graveyard, evolution indicator, combat feedback.

Evolução na UI: requisito atingido, opções, mudança de stats/habilidades, custo, reversibilidade.

Hierarquia na carta: nome, custo, arte, ATK/HP, keywords, texto, **bloco de evolução**.

**Templating textual** único (ex.: sempre “Sempre que esta unidade receber dano, recebe 1 contador de Adaptação”).

---

# PARTE X — TESTES E QA

## Capítulo 21

| Tipo | Objetivo |
|------|----------|
| Unit | Componente |
| Integration | Interação |
| Rules | GDD = motor |
| Simulation | Monte Carlo / bots |
| Playtest | Diversão |
| Balance | Métricas |
| Regression | Update não quebra |
| Load | Escala técnica |

**Testes de evolução (mínimo):** todos os requisitos; um só; simultâneos; morte; freeze; sem recurso; destino indisponível; herança de contadores; duas evoluções elegíveis.

```python
def test_evolution_requires_three_counters():
    unit = create_unit(stage=1, counters={"adaptation": 2})
    assert can_evolve(unit) is False
    unit.counters["adaptation"] = 3
    assert can_evolve(unit) is True
```

---

# PARTE XI — PRODUÇÃO E PIPELINE

## Capítulo 22. Pipeline

1. Concept  
2. Core Rules  
3. Card System  
4. Mechanics System  
5. Evolution System  
6. Technical Prototype  
7. Testing & Balancing  
8. Visual Production  
9. Release Preparation  

### Estrutura de pastas (referência)

```text
CARD_GAME/
├── DESIGN/
├── DATA/        (Cards, Abilities, Keywords, Evolutions)
├── ENGINE/      (GameState, EventSystem, EvolutionSystem…)
├── UI/
├── TESTS/
└── ART/
```

No repositório Shinobi: mapeamento concreto em [docs/architecture.md](../architecture.md).

## Capítulo 23. Coleção e monetização

Aquisição: F2P progress, missões, packs, crafting, eventos.

Raridade ≠ poder obrigatório.

Crafting transparente; P2W competitivo evitado ou isolado em formatos casuais.

---

# PARTE XII — DOCUMENTAÇÃO

## Capítulos 24–25

**GDD** + documentos especializados:

| Sigla | Documento |
|-------|-----------|
| GDD | Visão geral |
| TDD | Técnico |
| CDD | Cartas |
| MDD | Mecânicas |
| EDD | Evolução |
| BDD | Balance |
| + UI Spec, QA Plan, Content Pipeline | |

*(Siglas são convenção interna do projeto.)*

---

# PARTE XIII — TEMPLATES

## Capítulo 26 — Card Design Sheet

| Campo | Exemplo |
|-------|---------|
| Card ID | CREATURE_001 |
| Nome | Guardião de Cinzas |
| Tipo | Creature / Fire / Rare / Estágio 1 |
| Custo | 2 · 1 ATK · 3 HP |
| Habilidade | OnDamaged → +1 Adaptation |
| Evolução | CREATURE_002 se Adaptation ≥ 3 (+ custo 2 Energy) |
| Função | Progression · Evolution archetype |

## Capítulo 27 — Ability YAML

```yaml
ability:
  id: ability_001
  name: Adaptive Instinct
  trigger:
    event: creature_damaged
  conditions:
    operator: AND
    rules:
      - type: entity_alive
        target: self
  effects:
    - type: add_counter
      counter: adaptation
      amount: 1
  duration:
    type: instant
  limits:
    max_activations_per_event: 1
```

## Capítulo 28 — Evolution YAML

```yaml
evolution:
  id: evolution_001
  source: creature_001
  destination: creature_002
  requirements:
    operator: AND
    rules:
      - type: counter_threshold
        counter: adaptation
        value: 3
      - type: resource_threshold
        resource: energy
        value: 2
  cost:
    energy: 2
  transition:
    preserve_damage: true
    preserve_counters: false
    preserve_status: true
    preserve_modifiers: false
  rewards:
    - type: replace_card_definition
      target: creature_002
```

Documentar **herança** em toda linha: dano, contadores, equipamentos, instance_id, habilidades.

---

# PARTE XIV — CASO PRÁTICO: Guardiões Elementais (linear)

**Arquétipo:** Evolution Control.

| Carta | ATK | HP | Custo |
|-------|-----|----|-------|
| Cinzento | 1 | 3 | 2 |
| Incandescente | 3 | 4 | 4 |
| Fênix de Cinzas | 5 | 6 | 6 |

**Habilidades:**

- Cinzento: sobrevive dano → +1 Adaptação  
- Incandescente: ao atacar → 1 dano aleatório inimigo  
- Fênix: primeira morte → fica com 1 HP (habilidade consumida)  

**Transições:**

```text
CINZENTO ──(3 Adaptação)──► INCANDESCENTE ──(sobreviver 2 ataques)──► FÊNIX
```

**Testes:** promoções, preserve damage, reset contadores, ordem de resolução, morte bloqueia evolução.

**Expansões futuras:** ramos elementais, fusão, evolução temporária.

---

# PARTE XV — ROADMAP (ilustrativo)

| Fase | Semanas (ex.) |
|------|---------------|
| Conceito | 2 |
| Regras | 3 |
| Cartas | 3 |
| Motor | 5 |
| Evolução | 3 |
| Testes | 4 |
| Polimento | 3 |

| Marco | Critério |
|-------|----------|
| M1 Concept | Identidade aprovada |
| M2 Rules | GDD core fechado |
| M3 Prototype | Cartas no motor |
| M4 Evolution | Sistema promove |
| M5 Playable | Partida fim-a-fim |
| M6 Balance | Métricas + ajustes |
| M7 Production | Arte + release |

Testar **cada componente** assim que existir MVP.

---

# PARTE XVI — REFERÊNCIAS

| Área | Referência |
|------|------------|
| Card design | Magic — Making Magic |
| Game design | Jesse Schell — *The Art of Game Design* |
| Mecânicas | Adams & Dormans — *Game Mechanics* |
| Sistemas | Salen & Zimmerman — *Rules of Play* |
| Digital TCG | Hearthstone, LoR (event tools) |
| Deckbuilding | Slay the Spire, Monster Train |
| Evolução física | Pokémon TCG |

Links úteis: Making Magic, BoardGameGeek, Game Programming Patterns, Game Developer.

---

# PARTE XVII — CHECKLIST DE QUALIDADE

### Game Design

- [ ] Identidade mecânica definida  
- [ ] Core loop documentado  
- [ ] Regras e vitória completas  
- [ ] Arquétipos distintos  

### Card Design

- [ ] Tipos documentados  
- [ ] Atributos com função clara  
- [ ] Critérios de custo  
- [ ] IDs únicos  
- [ ] Habilidades padronizadas  

### Evolution Design

- [ ] Estágios definidos  
- [ ] Condições verificáveis  
- [ ] Ramificações com identidade (se houver)  
- [ ] Regras de contadores  
- [ ] Recompensas balanceadas  
- [ ] Regras de herança na transformação  

### Technical Design

- [ ] Definition vs Instance  
- [ ] Sistema de eventos  
- [ ] Effect registry  
- [ ] State machine de evolução  
- [ ] Validação e anti-loop  
- [ ] Versionamento de regras  

### QA

- [ ] Unit / integration / evolution / regression  
- [ ] Telemetria  
- [ ] Processo de balance  

---

# Conclusão

Um card game digital é um **ecossistema interligado**:

```text
Card Design ──┐
Mechanics ────┼──► CARD GAME DIGITAL (experiência estratégica)
Evolution ────┤
Economy ──────┤
Systems ──────┤
Balance ──────┤
Technical ────┤
UX ───────────┘
```

Não desenvolver como “N cartas isoladas”, e sim como **sistemas que se alimentam**.
