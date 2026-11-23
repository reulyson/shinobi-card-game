# Game Design de Card Games — criação, mecânicas, cartas e evolução

Um card game é um **sistema de decisões**: probabilidade, recursos, combinações, progressão e interação. Para um jogo próprio, o desafio não é só criar cartas isoladas, mas um **ecossistema** em que cada carta tenha função, as mecânicas conversem entre si e existam várias estratégias viáveis.

**Referências úteis:** Legends of Runeterra (LoR), Magic: The Gathering, Hearthstone, Slay the Spire, Pokémon TCG, Marvel Snap.

**Foco da pesquisa:** evolução de unidades (especialmente **Level Up** no LoR): cumprir condições → carta mais forte, novos efeitos e às vezes novo papel estratégico.

---

## 1. O que é Game Design de card games?

É o processo de definir **regras, cartas, recursos, interações e estratégia** que formam a experiência.

O designer cria **possibilidades em conjunto**, não cartas soltas.

**Exemplo de sinergia:**

| Carta A | Carta B | Carta C |
|---------|---------|---------|
| Unidade que cresce quando aliado morre | Magia que sacrifica aliado para dar dano | Unidade que volta do cemitério quando aliado morre |

Juntas, formam um arquétipo (ex.: sacrifício).

### 1.1 Pilares fundamentais

| Pilar | O que representa |
|-------|------------------|
| Core Loop | Ciclo principal de ações |
| Resource System | Obter e gastar recursos |
| Card Advantage | Vantagem em quantidade/qualidade de cartas |
| Tempo | Velocidade de desenvolvimento |
| Board Control | Controle do campo |
| Synergy | Interação positiva entre cartas |
| Counterplay | Respostas às jogadas rivais |
| Win Condition | Como vencer |
| Risk vs Reward | Risco vs ganho de cada linha |
| Replayability | Partidas diferentes e interessantes |

### 1.2 Ciclo principal de uma partida

1. **Comprar cartas** — novas opções  
2. **Gerenciar recursos** — o que é jogável neste turno  
3. **Desenvolver o campo** — unidades, setups, engines  
4. **Interagir com o adversário** — ataque, defesa, respostas  
5. **Avançar a vitória** — pressionar vida, combo, controle  

O ciclo repete até a condição de fim. Cada etapa precisa de **decisões**; se existe sempre uma jogada óbvia, o jogo fica raso.

---

## 2. Concepção do zero

**Armadilha:** criar 100 cartas antes de ter sistema.

**Caminho saudável:** começar pela **experiência** desejada.

### 2.1 Identidade do jogo (perguntas)

- Qual é a fantasia central?  
- Personagens, criaturas, exércitos, equipamentos, conceitos?  
- Competitivo ou cooperativo?  
- Partidas rápidas ou longas?  
- Deckbuilding? Progressão in-game?  
- Sorte, skill ou mistura?  

**Exemplo de conceito — *Ecos da Ruína***

- Tema: fantasia sombria  
- Dois jogadores, facções  
- Objetivo: vida adversária a 0  
- Diferencial: unidades evoluem ao cumprir objetivos  
- Identidade: cada facção evolui de forma distinta  

Ainda sem cartas prontas — já há direção de sistema.

### 2.2 Regras fundamentais

| Sistema | Pergunta |
|---------|----------|
| Turnos | Ordem de jogo |
| Recursos | Como se paga |
| Compra | Quantas cartas por turno/rodada |
| Deck | Tamanho e limites |
| Campo | Slots de unidades |
| Combate | Ataque, bloqueio, dano |
| Descarte | Destino de cartas usadas/destruídas |
| Vitória | Fim de partida |

**Interação no turno rival:** LoR alterna iniciativa e permite respostas; Hearthstone é mais “turno isolado”. Isso muda o jogo inteiro.

### 2.3 Card Skeleton

Estrutura preliminar de quantidade por tipo (exemplo de 60 cartas):

| Categoria | Qtd |
|-----------|-----|
| Unidades | 30 |
| Magias | 12 |
| Equipamentos | 6 |
| Suportes | 6 |
| Especiais | 6 |
| **Total** | **60** |

Evita excesso de um tipo e falta de outro. Magic / Wizards usam **card file** + testes para refinar.

---

## 3. Como conceber uma carta

Quatro dimensões:

1. Função mecânica  
2. Identidade estratégica  
3. Identidade temática  
4. Balanceamento  

### 3.1 Anatomia típica

| Elemento | Função |
|----------|--------|
| Nome | Identificação |
| Arte | Fantasia visual |
| Custo | Recursos |
| Tipo | Unidade, magia, equipamento… |
| Subtipo | Classe, tribo… |
| Atributos | Ataque, vida, etc. |
| Habilidades | Efeitos |
| Keywords | Regras encapsuladas |
| Raridade | Distribuição / coleção |
| Flavor text | Narrativa |

Nem todo jogo usa todos.

### 3.2 Processo (função primeiro)

**Exemplo — Guardião das Cinzas**

- **Tipo:** Unidade · Guardião  
- **Custo:** 4  
- **Ataque / Vida:** 3 / 5  
- **Habilidade — Cinzas Persistentes:** sempre que outra unidade aliada morrer, +1 ataque até o fim da partida  
- **Função:** escalonamento · **Arquétipo:** sacrifício  

**Passos:**

1. Papel (recompensar sacrifício)  
2. Interação (morte de aliados)  
3. Recompensa (+1 ataque por morte)  
4. Stats moderados (tem scaling)  
5. Custo (inclui potencial futuro)  
6. Testar abusos e combos  

Balancear **efeito isolado + combinações**.

### 3.3 Papéis das cartas

| Papel | Descrição |
|-------|-----------|
| Aggro | Pressão rápida |
| Control | Segurar o jogo |
| Removal | Tirar ameaça |
| Finisher | Fechar partida |
| Engine | Valor contínuo |
| Enabler | Liga estratégia |
| Payoff | Recompensa da condição |
| Support | Fortalece outras |
| Tech | Responde meta |
| Value Generator | Recursos/vantagem no tempo |
| Stabilizer | Recuperação |

Uma carta pode ter vários papéis (ex.: unidade que compra ao entrar = desenvolvimento + card advantage).

---

## 4. Tipos de mecânicas

### 4.1 Ativação (quando dispara)

| Termo | Significado |
|-------|-------------|
| On Play | Jogada da mão |
| On Summon | Entrou no campo (qualquer origem) |
| On Attack / On Defense | Combate |
| On Death / Last Breath | Ao morrer |
| End / Start of Turn | Início/fim de turno |
| Round Start / End | Início/fim de rodada |

**On Play ≠ On Summon** — permite designs mais ricos.

### 4.2 Atributos

Buff, Debuff, Heal, Damage, Shield, Barrier, Lifesteal, Overkill, Enrage, Scaling…

### 4.3 Campo

Summon, Transform, Recall, Obliterate, Silence, Stun, Freeze, Capture, Sacrifice, Bounce…

### 4.4 Cartas no deck/mão

Draw, Discard, Mill, Search, Tutor, Generate, Discover, Copy, Shuffle, Recycle…

### 4.5 Condicionais

Conditional, Threshold, Quest, Countdown, Charge, Stack, Combo, Chain, Trigger, Persistent, Delayed…

*Ex.:* “Se jogar 3 magias numa rodada, compre 1.”

---

## 5. Evolução (inspirada em LoR)

A carta **acompanha** o jogador na partida: estado inicial → objetivo → novo estado (stats, keywords, função).

### 5.1 Estrutura clássica

- **Level 1:** condição de evolução no texto  
- **Level 2:** após cumprir, transforma  

Evolução não é só +1/+1: pode **mudar o papel** da carta.

### 5.2 Seis componentes

| Componente | Pergunta |
|------------|----------|
| Base Form | Como começa? |
| Evolution Condition | O que exige? |
| Progress Tracker | Como contabiliza? |
| Evolution Trigger | Quando transforma? |
| Evolved Form | Stats/efeitos novos |
| Evolution Reward | Recompensa clara |

**Tracker:** magias jogadas, dano total, mortes, compras, turnos sobrevividos, etc.

LoR usa **histórico de eventos** na arquitetura — relevante para implementação digital.

### 5.3 Modelos de evolução

1. **Acúmulo** — ex.: 15 de dano na partida  
2. **Ação** — ex.: 5 magias  
3. **Estado** — ex.: sobreviver 3 combates  
4. **Tempo** — ex.: rodada 4  
5. **Sacrifício** — ex.: 3 aliados  
6. **Escolha** — ramificação ofensiva/defensiva  

### 5.4 Termos relacionados

Level Up, Transform, Upgrade, Evolution, Ascension, Awakening, Mutation, Promotion, Branching Evolution, Permanent Scaling — cada jogo define nomenclatura.

### 5.5 Boas condições

Devem:

- Incentivar uso coerente com o personagem  
- Exigir esforço proporcional à recompensa  
- Dar **counterplay**  

| Condição | Avaliação |
|----------|-----------|
| 1 ataque | Fácil demais |
| 100 ataques | Inviável |
| 10 de dano | Clara, mensurável |
| 3 kills | Combate + interação |
| 5 magias | Arquétipo spell |

**Assassino evolui matando; mago, lançando magias.**

### 5.6 Narrativa em 3 estágios

Aprendiz → Arcanista → Arquimago: cada estágio pode ter **papel** diferente (recursos → controle → finisher).

---

## 6. Sistemas de evolução avançados

| Sistema | Complexidade | Profundidade |
|---------|--------------|--------------|
| Linear | Baixa | Média |
| Ramificada | Média | Alta |
| Fusão | Média–alta | Alta |
| Reversível | Alta | Alta |
| Adaptativa | Alta | Muito alta |
| Por acúmulo | Baixa–média | Média–alta |

**Complexidade ≠ qualidade.** Simples com decisões boas > muitas transformações confusas.

- **Linear:** Filhote → Predador → Alfa  
- **Ramificada:** dragão fogo vs gelo conforme ações  
- **Fusão:** duas cartas → híbrido (cuidado com combo raro demais)  
- **Reversível:** forma humana vs monstro  
- **Adaptativa:** evolui conforme atacar/defender/magia  

---

## 7. Balanceamento

Objetivo: **custo, função e janela de uso** coerentes — não “todas iguais”.

### 7.1 Curva stats (referência, não lei)

| Custo | Ataque | Vida |
|-------|--------|------|
| 1 | 1 | 2 |
| 2 | 2 | 3 |
| 3 | 3 | 4 |
| 4 | 4 | 5 |
| 5 | 5 | 6 |
| 6 | 6 | 7 |

Habilidade forte → stats menores.

### 7.2 Conceitos

Mana Efficiency, Power Budget, Opportunity Cost, Power Creep, Win Rate, Pick Rate, Play Rate, Matchup, Metagame.

### 7.3 Quatro vantagens

Card Advantage, Tempo, Board, Resource.

### 7.4 Cartas evolutivas

Avaliar **antes e depois** da evolução:

| Critério | Pergunta |
|----------|----------|
| Custo inicial | Justo pelo Lv1? |
| Facilidade | Condição trivial? |
| Velocidade | Turno médio de evolução |
| Recompensa | Vale o esforço? |
| Interação | Rival pode atrasar? |
| Consistência | Evolui quase sempre? |
| Sinergia | Deck quebra condição? |

Testar: sem evoluir, evolução cedo, oponente preparado, uso fora do arquétipo.

---

## 8. Arquétipos

| Arquétipo | Ideia |
|-----------|-------|
| Aggro | Pressão barata |
| Control | Removal, atrasar, dominar tarde |
| Midrange | Valor + flexibilidade |
| Combo | Engine + payoff explosivo |
| Ramp | Recursos → threats grandes |
| Sacrifice | Morte/sac → vantagem |

**Exemplo sacrifício:** Cultista (enabler) + Payoff + Ritual (removal) + Necromante (engine) + Finisher.

---

## 9. Glossário resumido

**Estrutura:** TCG, CCG, Deck, Deckbuilding, Hand, Board, Graveyard, Exile, Mulligan, Format…

**Estratégia:** Archetype, Synergy, Combo, Engine, Payoff, Enabler, Finisher, Curve, Tempo, Value, OTK, Snowball, Win Condition…

**Design:** Keyword, Trigger, Card Skeleton, Card File, Templating, Playtest, Balance Pass, Power Budget, Design Space, Edge Case, Exploit…

---

## 10. Desenvolvimento profissional (Magic / Rosewater)

1. **Exploratory Design** — experimentação  
2. **Vision Design** — tema, pilares, estrutura  
3. **Set Design** — massa de cartas e interações  
4. **Play Design** — equilíbrio e padrões de meta  

### 10.1 Tipos de teste

| Tipo | Objetivo |
|------|----------|
| Mechanical | Regras corretas |
| Balance | Cartas/decks OP |
| Synergy | Combos |
| Stress | Edge cases |
| Experience | Diversão e clareza |

### 10.2 Ficha de playtest

Duração, vencedor, decks, turno final, cartas starred/ignoradas, frustrações, bugs de interação, sugestões.

### 10.3 Banco de cartas (campos sugeridos)

ID, Name, Type, Archetype, Cost, Attack, Health, Keywords, Triggers, Effects, Rarity, Evolution flags, Design/Balance status.

**Evolução extra:** condition, progress, threshold, result, arte por estágio.

---

## 11. Evolution Framework (proposta)

**Camada 1 — Identidade** → função e narrativa  

**Camada 2 — Condição** → comportamento exigido  

**Camada 3 — Progressão** → eventos e contadores  

**Camada 4 — Transformação** → nova forma (stats, skills, VFX)  

### 11.1 Exemplo — Kael

**Lv1 — Kael, Aprendiz Esquecido (3):** 2/3. Cada magia: +1 Conhecimento. Evoluir com 5.

**Lv2 — Kael, Arquimago do Vazio:** 5/5. Cada magia: 1 dano ao Nexus. Primeira evolução: comprar 1.

### 11.2 Implementação

Definir se progresso é **global**, **individual**, **só com carta em campo** ou **híbrido** (ex.: magias antes de Kael entrar contam ou não?).

### 11.3 Evolução com escolha

Ao atingir threshold: **Arquimago da Ruína** (dano) vs **Arquimago da Eternidade** (defesa/recursos).

---

## 12. O que estudar em cada jogo

| Jogo | Foco de estudo |
|------|----------------|
| LoR | Level up, keywords, respostas, sinergia |
| Magic | Mana curve, cores, set design, card advantage |
| Hearthstone | Battlecries, claridade, RNG |
| Slay the Spire | Roguelike deckbuilding, risco |
| Marvel Snap | 3 locais, partidas rápidas, condicionais |
| Pokémon TCG | Estágios, energia, evolução física |

---

## 13. Referências úteis (oficiais)

- Wizards — Playtesting, Initial Playtesting, Card Advantage, Stages of Design, Nuts & Bolts: Iteration  
- Riot — *Engineering Tools for Designers* (LoR: eventos, scripts, ferramentas para designers)  

*(Buscar nos artigos oficiais Wizards / Riot Dev.)*

---

## 14. Documentos do projeto

| Documento | Conteúdo |
|-----------|----------|
| GDD | Visão geral |
| Core Rules | Turnos e fundamentos |
| Card Design | Tipos e templating |
| Mechanics | Triggers, keywords |
| Evolution System | Promoção / transform |
| Archetypes | Identidades de deck |
| Balance | Curvas e budgets |
| Art Bible | Visual |
| Playtest Log | Iteração |
| Technical Design | Engine, eventos |

---

## 15. Ordem de desenvolvimento recomendada

1. Identidade do jogo  
2. Core gameplay (turnos, recursos, combate, vitória)  
3. Tipos de carta  
4. Sistema de mecânicas (eventos, keywords)  
5. Arquétipos  
6. Sistema de evolução  
7. Primeiro set pequeno  
8. Protótipo + playtest  
9. Balance pass  
10. Produção visual/técnica  

---

## 16. Três áreas para aprofundar

1. **Card design & card economy** — função, custo, vantagens  
2. **Mechanics & systems design** — interação, anti-explode  
3. **Progression & evolution design** — identidade do jogo  

---

## 17. Próximo passo sugerido

Manual dedicado: **criação e evolução de cartas**, com:

- Pipeline ideia → carta final  
- Triggers + conditions + effects  
- Sistema de keywords  
- Evolução 2–3+ estágios, árvores ramificadas  
- Contadores e balanceamento evolutivo  
- Documentação e implementação digital (event bus, como no LoR)  

→ Ver [02-criacao-evolucao.md](./02-criacao-evolucao.md).  
→ Base consolidada com fontes externas: [05-conhecimento-card-games.md](./05-conhecimento-card-games.md).
