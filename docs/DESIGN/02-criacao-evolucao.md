# Manual de Game Design de Card Games

## Sistema de criação, mecânicas, evolução e balanceamento de cartas

## Introdução

Este manual combina **Game Design**, **Systems Design**, **Card Design** e **Progression Design**. O objetivo é uma metodologia utilizável da **concepção da carta** até a **implementação digital**.

A premissa central: cartas não são só atributos e texto — são parte de um sistema de **crescimento, transformação e progressão estratégica**. Neste documento, a **evolução linear** é o modelo prioritário (estágios fixos em cadeia), com menção breve a outros modelos apenas para contexto.

**Relacionado:** [01-fundamentos.md](./01-fundamentos.md) · [03-manual-profissional.md](./03-manual-profissional.md) · [04-pesquisa-shinobi.md](./04-pesquisa-shinobi.md) · [05-conhecimento-card-games.md](./05-conhecimento-card-games.md)

---

## 1. Estrutura do manual

| Capítulo | Conteúdo |
|----------|----------|
| **1 — Fundamentos** | Tipos de TCG/CCG, recursos, turnos, vitória, identidade mecânica |
| **2 — Card Design** | Anatomia, custos, habilidades, raridade, funções |
| **3 — Evolution Design** | Estágios, transformações, condições; **ênfase em evolução linear** |
| **4 — Mechanics Design** | Trigger, Condition, Effect, keywords, sinergias |
| **5 — Economy Design** | Recursos, curva de custo, card advantage, tempo |
| **6 — Balanceamento e Playtest** | Métricas, combos, meta, ajustes |
| **7 — Card Game Digital** | Eventos, estados, resolução de efeitos, UI |
| **8 — Identidade e live ops** | Facções, narrativa, coleção, expansões |

**Capítulo desenvolvido primeiro neste texto:** evolução linear e pipeline de criação de cartas evolutivas.

---

## 2. Capítulo prioritário — criação e evolução de cartas

### 2.1 Anatomia de uma carta

Defina o **schema** antes de escrever efeitos.

| Elemento | Função |
|----------|--------|
| ID | Identificação única |
| Nome | Identidade |
| Tipo | Criatura, magia, equipamento, etc. |
| Custo | Recurso para jogar |
| Ataque / Vida | (ou equivalente) |
| Keywords | Regras encapsuladas |
| Abilities | Habilidades estruturadas |
| **Evolution** | Estágio atual, próximo estágio, condição, contadores |
| Rarity | Distribuição / coleção |
| Faction | Facção ou afinidade |

**Separe:**

- **Atributos base** — do estágio atual  
- **Atributos derivados** — só após promoção/transformação  
- **Metadados de linha evolutiva** — `lineId`, `stageIndex`, `maxStage`, `nextCardId`  

Uma carta na linha linear é sempre **uma instância de um estágio**, não “a mesma carta que muda de número” sem regra clara.

---

### 2.2 Arquitetura de habilidades (T-C-E-R)

Modelo reutilizável para engine e redação:

| Camada | Pergunta |
|--------|----------|
| **Trigger** | O que dispara? |
| **Condition** | O que precisa ser verdade? |
| **Effect** | O que o sistema executa? |
| **Result** | Qual mudança no estado do jogo? |

**Exemplo — Adaptação Elemental (apoio à evolução linear)**

- **Trigger:** esta criatura sobrevive a dano  
- **Condition:** vida > 0 após o dano  
- **Effect:** +1 contador `adaptation`  
- **Result:** com 3 contadores, **elegível** para evoluir ao estágio 2 (regra de evolução separada)  

Habilidades de combate e habilidades de **progressão** podem compartilhar o mesmo pipeline de eventos.

---

### 2.3 Sistema de evolução — foco em evolução linear

#### O que é evolução linear

Sequência **fixa e ordenada** de formas:

```text
Estágio 1 → Estágio 2 → Estágio 3 → (fim da linha)
```

- Um único caminho por “linha evolutiva”  
- Cada estágio é uma **carta/estado** distinto (stats, keywords, habilidades podem mudar)  
- Condições de cada degrau são **específicas** daquele estágio  
- Não há escolha de ramo (isso seria evolução ramificada)  

**Vantagens:** clareza, onboarding fácil, implementação com máquina de estados simples, narrativa clara (aprendiz → veterano → lenda).

**Riscos:** previsibilidade; o rival pode “ler” o arco. Mitigue com counterplay na condição (não só na forma final).

#### Outros modelos (referência rápida)

| Modelo | Uso típico |
|--------|------------|
| Ramificada | Escolha estratégica no threshold |
| Adaptativa | Stats/habilidades mudam sem mudar “carta” |
| Fusão | Duas cartas → uma |

Para um primeiro set e para documentação técnica, **padronize linear**; introduza ramos em expansões.

#### Componentes de uma linha linear

| Componente | Descrição |
|------------|-----------|
| `evolutionLineId` | Agrupa todos os estágios do mesmo personagem |
| `stage` | 1, 2, 3… |
| `isFinalStage` | Último estágio |
| `promotionCondition` | O que completa *este* degrau |
| `promotionTracker` | Contador, quest, flag, etc. |
| `onPromote` | Substitui stats, adiciona keywords, troca habilidades |
| `promotionMoment` | Instantâneo na resolução, fim de rodada, etc. |

**Decisões obrigatórias (linear):**

1. Progresso é **por carta em campo** ou global do jogador? (Recomendado: **por instância em campo**.)  
2. Progresso **persiste** se a carta sair e voltar? (Definir: reset vs memória de linha.)  
3. Promoção é **automática**, **opcional do jogador** ou exige **custo**?  
4. Pode pular estágio? (Em linear clássico: **não**.)  

---

### 2.4 Condições de evolução (objetivos estratégicos)

A condição deve reforçar **fantasia + arquétipo**, não ser número aleatório.

| Categoria | Exemplo (linear) |
|-----------|------------------|
| Temporal | Sobrevive N rodadas **neste estágio** |
| Combate | Elimina N criaturas **enquanto é estágio 1** |
| Acumulação | N contadores de missão (dano causado, magias, etc.) |
| Recursos | Gastar N de um recurso com esta carta em campo |
| Comportamental | Conjurar Jutsu exclusivo / atacar X vezes |
| Sacrifício | Sacrificar aliado como custo da promoção |
| Coleção | Ter parceiro/token específico em campo |

**Linear:** cada estágio pode usar **métrica diferente** (estágio 1 = sobreviver; estágio 2 = vencer combates; estágio 3 = causar dano ao Nexus).

**Modos de disparo da promoção**

| Modo | Quando usar |
|------|-------------|
| Automático | Ao atingir threshold — ritmo alto, estilo LoR/champion |
| Opcional | Jogador clica “Promover” — mais controle, menos feel-bad |
| Com custo | Paga Chakra/recurso — limita snowball |

---

### 2.5 Progressão e recompensas por estágio

Cada promoção deve mudar o **papel**, não só +stats.

| Tipo de recompensa | Exemplo linear |
|--------------------|----------------|
| Atributos | +2/+2 no estágio 2 |
| Nova keyword | Quick Attack só no estágio 3 |
| Habilidade nova | On promote: compra 1 |
| Troca de habilidade | Remove passiva fraca, ganha ativa forte |
| Mudança de tipo/subtipo | Gennin → Chuunin → Jounnin |
| Interação nova | Só Jounnin pode equipar X |

**Regra de design:** pelo menos um estágio troca **função** (ex.: estágio 1 = enabler; estágio 2 = combat; estágio 3 = finisher leve).

---

## 3. Exemplo documentado — linha linear: *Guardião de Cinzas*

Narrativa mecânica: **quanto mais sobrevive, mais perigoso fica.**

| Estágio | Nome | ATK | Vida | Papel |
|---------|------|-----|------|-------|
| 1 | Cinzentas | 1 | 3 | Tanque que acumula |
| 2 | Incandescente | 3 | 4 | Burst ao subir de estágio |
| 3 | Fênix de Cinzas | 5 | 6 | Renascimento único |

### Progressão linear (regras)

**Estágio 1 → 2**

- Contador `adaptation`: +1 cada vez que **sobrevive a dano** neste estágio  
- **Condição:** 3 contadores  
- **Promoção:** automática; ao evoluir, causa 2 de dano a um alvo (recompensa de transição)  

**Estágio 2 → 3**

- Contador `trials`: +1 cada vez que **vence um combate** (causar dano letal ou sobreviver bloqueio — definir no ruleset)  
- **Condição:** 2 combates  
- **Promoção:** opcional ou automática (playtest decide)  

**Estágio 3**

- **Last Breath (uma vez por partida):** ao morrer, retorna com 3 de vida (sem voltar ao estágio 1)  

### Ficha de balanceamento (linear)

| Pergunta | Estágio 1 | Estágio 2 | Estágio 3 |
|----------|-----------|-----------|-----------|
| Custo “justo” se jogado direto? | Sim, fraco | — | — |
| Turno médio de promoção? | R3–5 | R6–9 | — |
| O rival pode atrasar? | Focus fire, removal | Idem | Save removal para pós-revival |
| Sem promoção, carta ainda jogável? | Sim, como wall | N/A | N/A |

---

## 4. Framework de desenvolvimento (carta → digital)

```text
Concept Design     → fantasia, função, arquétipo, linha evolutiva (quantos estágios)
        ↓
Mechanical Design  → stats por estágio, T-C-E-R, keywords
        ↓
Progression Design → condições por degrau, contadores, modo de promoção
        ↓
System Integration → Chakra, campo cheio, unique rules, vitória
        ↓
Prototyping        → cartas sem arte, IDs de linha no data file
        ↓
Playtesting        → turno de promoção, taxa de conclusão da linha, feel-bad
        ↓
Balancing          → power budget soma dos estágios ponderada por probabilidade
        ↓
Technical Impl.    → event bus, state machine por instância, promote()
```

### Power budget em evolução linear

Estime:

\[
\text{Poder esperado} = P_1 + p_{1 \to 2} \cdot \Delta_2 + p_{2 \to 3} \cdot \Delta_3
\]

Onde \(p\) é a probabilidade de chegar a cada estágio em playtests. Não balanceie só o estágio final.

---

## 5. Separação dados × regras (implementação digital)

Cartas como **dados**; motor como **interpretador** de triggers, contadores e `promote`.

### Exemplo — estágio 1 (JSON ilustrativo)

```json
{
  "id": "creature_001_stage1",
  "evolutionLineId": "guardiao_cinzas",
  "name": "Guardião de Cinzas — Cinzentas",
  "type": "creature",
  "stage": 1,
  "maxStage": 3,
  "stats": { "attack": 1, "health": 3 },
  "counters": { "adaptation": 0 },
  "abilities": [
    {
      "id": "ash_survival",
      "trigger": "on_survive_damage",
      "condition": { "health_gt": 0 },
      "effect": { "type": "add_counter", "counter": "adaptation", "amount": 1 }
    }
  ],
  "evolution": {
    "mode": "automatic",
    "nextCardId": "creature_001_stage2",
    "condition": {
      "type": "counter_threshold",
      "counter": "adaptation",
      "value": 3
    },
    "onPromoteEffects": []
  }
}
```

### Estágio 2 (trecho)

```json
{
  "id": "creature_001_stage2",
  "evolutionLineId": "guardiao_cinzas",
  "stage": 2,
  "evolution": {
    "nextCardId": "creature_001_stage3",
    "condition": {
      "type": "counter_threshold",
      "counter": "trials",
      "value": 2
    },
    "onPromoteEffects": [
      { "type": "deal_damage", "amount": 2, "target": "enemy_unit_or_nexus" }
    ]
  }
}
```

### Motor — conceitos a estudar/implementar

| Conceito | Papel na evolução linear |
|----------|--------------------------|
| **Data-driven design** | Um JSON/TS por estágio |
| **Event-driven architecture** | `DamageDealt`, `UnitDied`, `RoundEnd` |
| **State machine** | `stage` + transição válida só para `nextCardId` |
| **Effect resolution** | Fila de efeitos; promoção após resolver dano |
| **Rule validation** | Ninja único, substituir instância, manter equipamentos? |
| **Serialization** | Salvar `stage`, contadores, se revival já foi usado |

**Promoção linear típica (pseudocódigo)**

```text
onEvent(e):
  updateCountersForInstance(e)
  if meetsThreshold(instance) and instance.stage < maxStage:
    if evolution.mode == automatic:
      promote(instance, evolution.nextCardId)
```

`promote` deve: trocar definição, resetar contadores **do estágio anterior** (ou arquivar), aplicar `onPromoteEffects`, disparar animação/UI.

---

## 6. Checklist — nova carta em linha linear

- [ ] `evolutionLineId` e lista ordenada de `cardId` por estágio  
- [ ] Condição e contador **por degrau** documentados no GDD  
- [ ] Promoção: automática / opcional / com custo  
- [ ] O que acontece com equipamentos, buffs e debuffs na promoção  
- [ ] Arte e nome distintos por estágio (clareza em UI)  
- [ ] Testes: promoção cedo, nunca promove, rival remove no threshold  
- [ ] Entrada no card file com campos Evolution preenchidos  

---

## 7. Bibliografia e referências

| Fonte | Foco |
|-------|------|
| **Magic: The Gathering** — Making Magic, Drive to Work | Curvas, cores, arquétipos, set design |
| **Jesse Schell** — *The Art of Game Design* | Experiência, sistemas, lenses |
| **Ernest Adams & Joris Dormans** — *Game Mechanics: Advanced Game Design* | Mecânicas e interação |
| **Katie Salen & Eric Zimmerman** — *Rules of Play* | Regras, sistemas, jogadores |
| **Riot (LoR)** — artigos de engenharia para designers | Eventos, ferramentas, cartas complexas |

---

## 8. Relação com projetos no estilo Shinobi CardGame

Evolução **Gennin → Chuunin → Jounnin** com **missões de promoção** e **Jutsu exclusivo** é implementação de **linha linear** com:

- estágios como dados (`rank`, `missionProgress`),  
- condições por ninja (`ninjaEffects`, progresso),  
- transformação in-place no campo (não “nova carta do deck”),  
- testes automatizados de regras (`tests/`).  

Este manual serve como **camada de design** acima das regras já escritas no jogo. Detalhes técnicos do projeto: [04-pesquisa-shinobi.md](./04-pesquisa-shinobi.md).
