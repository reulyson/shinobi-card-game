# Conhecimento consolidado — Card Games Digitais (CCG/TCG)

**Tipo:** base de conhecimento (síntese + referências)  
**Data:** novembro de 2026  
**Público:** designers e engenheiros do Shinobi CardGame  
**Relacionado:** [01-fundamentos](./01-fundamentos.md) · [02-criacao-evolucao](./02-criacao-evolucao.md) · [03-manual-profissional](./03-manual-profissional.md) · [04-pesquisa-shinobi](./04-pesquisa-shinobi.md) · [Core Rules](../RULES/core-rules.md) · [Architecture](../architecture.md)

---

## 1. Objetivo / como usar

Este documento **não substitui** as regras oficiais nem os manuais de criação. Ele consolida pesquisa externa (blogs de designers, posts oficiais Riot/Blizzard/Wizards, artigos de UI, surveys de IA) cruzada com as decisões já tomadas no projeto.

**Use para:**

- alinhar vocabulário (tempo, card advantage, power budget, keywords…);
- checar se uma mecânica nova respeita o “contrato” do Shinobi;
- achar fontes antes de reinventar o que a indústria já documentou;
- priorizar o que ainda falta pesquisar (seção *Gaps*).

**Não use para:** inventar citações, copiar IP de franquias, ou alterar `core-rules` sem playtest.

---

## 2. Síntese aplicável ao Shinobi

### 2.1 Decisões já fechadas (mapa rápido)

| Decisão do projeto | Analogia na indústria | Implicação de design |
|--------------------|------------------------|----------------------|
| Deck **exatamente 24** | Decks curtos (ex.: LoR 40, Hearthstone 30, MTG Constructed 60+) — consistência alta | Cada carta pesa mais; tutor/draw e “dead cards” doem mais |
| Evolução **linear** Gennin → Chuunin → Jounnin | LoR Level Up (1→2); Pokémon estágios; LoR Ascended (2→3) como exceção temática | Condição deve reforçar fantasia; power budget = jornada, não só a forma final |
| **Jutsus exclusivos / tokens fora do deck** | Champion spells do LoR (cópias viram spell que ajuda a quest) | Economia de deck separada da economia de geração; não misturar no deck builder |
| Resolução em **pilha LIFO** + velocidades | Stack + priority do MTG; LoR com respostas; Hearthstone quase sem stack | UI precisa mostrar ordem; Instantâneo fora da pilha exige regra cristalina |
| Chakra **linear 1→10** + Reserva de Jutsu (até 3) | Mana automática estilo Hearthstone/LoR + “mana bank” limitado | Baixa variância de recurso; decisões = gastar vs reservar resposta |
| Vitalidade **20**, campo **5**, mão **9**, Ocultos **3** | Limites de board como restrição de UI e de swarm | Cap de campo é também ferramenta de balance |
| `ARENA_EFFECTS_ENABLED = false` | Locais (Snap) / arenas com efeito — desligados no MVP | Só atmosfera visual; não balancear decks em torno de arena ainda |
| Engine **independente da UI**; IA usa as mesmas ações legais | Padrão profissional LoR/Hearthstone engines | Zero regras em React; intents → engine → estado |
| MVP vs **IA heurística** | Heurística → depois PIMC/MCTS | Não bloquear release em MCTS |

Fontes internas: [core-rules.md](../RULES/core-rules.md), [04-pesquisa-shinobi.md](./04-pesquisa-shinobi.md).

### 2.2 O que o Shinobi “é” no espectro de produtos

- **Mecanicamente:** CCG digital com construção de deck, combate com bloqueio, respostas na pilha e progressão in-match (promoção).
- **Produto (oficial):** classificado como **CCG** — coleção digital com packs + craft, **sem venda/troca entre jogadores** (por isso não TCG). Pool estável; F2P completo no poder. Detalhes: [07-produto-ccg.md](./07-produto-ccg.md). Overview de categorias: [Virtual Post Gaming](https://virtualpostgaming.com/ccg-tcg-lcg-deckbuilder-terms-explained/).
- **Feel desejado:** midrange com evolução + counterplay (Ocultos / Rápido), não “só aggro de curva”.

### 2.3 Leituras prioritárias internas

1. Regras → [core-rules](../RULES/core-rules.md)  
2. Arquitetura → [architecture](../architecture.md)  
3. Aplicação → [04-pesquisa-shinobi](./04-pesquisa-shinobi.md)  
4. Criação linear → [02](./02-criacao-evolucao.md)  
5. Este arquivo, quando precisar de *por quê a indústria faz X*

---

## 3. Mecânicas e padrões (com referências)

### 3.1 Fundamentos: CCG/TCG, recursos, tempo, card advantage

**Card advantage** — vantagem de cartas (quantidade/qualidade útil). Remover 2 ameaças com 1 carta, comprar extras, gerar valor contínuo. Rosewater discute a ideia em Making Magic (ex.: [Leading a Horse to Water](https://magic.wizards.com/en/news/making-magic/leading-horse-water-2009-10-05)).

**Tempo** — eficiência por turno: desenvolver ameaça/resposta enquanto o rival “perde” turnos. Aggro compra tempo; control vende tempo por vantagem futura. Síntese clara: [GameDesign.gg — Tempo, Synergy, Economy of the Turn](https://gamedesign.gg/articles/card-and-board-game-design/).

**Sistema de recursos** — três eixos úteis (variância, linearidade, restritividade): [Adrian Gaudebert — The design of CCGs](https://adrian.gaudebert.fr/blog/post/the-design-of-ccgs). Shinobi = linearidade alta (Chakra sobe todo turno), variância baixa no recurso, restritividade baixa (sem “cores de mana” à la Magic). O “filtro” de deck vem de **limites de cópias / ninjas** e identidade de arquétipo, não de mana colorido.

**Por que custo existe** — pace + diversidade de cartas úteis em momentos diferentes: [Mana Action (Rosewater)](https://magic.wizards.com/en/news/making-magic/mana-action-2011-05-30); curva e math: [Do the Math](https://magic.wizards.com/en/news/making-magic/do-the-math).

**Aplicação Shinobi:** avaliar cartas pelo trio *custo de Chakra × custo de carta × tempo*. Jutsus gerados e Reserva mudam a economia — uma carta “de graça” na mão ainda consome ação e slot de mão.

---

### 3.2 Combate e resolução (stack vs “turno fechado”)

| Modelo | Exemplos | Prós | Contras |
|--------|----------|------|---------|
| Stack LIFO + priority | Magic | Counterplay profundo, design de “tricks” | Curva de aprendizado, UI complexa |
| Respostas / rodadas alternadas | LoR | Interação sem full MTG rules | Ainda exige clareza de “quem pode agir” |
| Turno quase isolado | Hearthstone clássico | Onboarding fácil | Menos interação no turno rival |

**Magic (referência canônica):** spells/abilities vão à stack; último a entrar resolve primeiro; prioridade passa até ambos passarem; combate tem janelas (declare attackers → blockers → damage). Visão didática: [The Dynamics of a Turn](https://magic.wizards.com/en/news/feature/dynamics-turn-2006-11-04); blockers: [Attacking and Blocking](https://magic.wizards.com/en/news/feature/attacking-and-blocking-2014-11-10); regras oficiais (PDF periodicamente atualizado): [Magic Comprehensive Rules](https://media.wizards.com/2026/downloads/MagicCompRules%2020260417.pdf) *(URL versionada — conferir a data no site da Wizards)*.

**Shinobi já escolheu:** pilha LIFO para Rápido/Preparado/Oculto; Instantâneo resolve na hora; Concentrado fora de combate sem pilha; Ágil/Veloz alteram ordem de golpe. Isso é **mais próximo de MTG/LoR** que de Hearthstone.

**Padrões de keywords de combate** (indústria): Taunt/Provocar, Quick Attack/Ágil, Overwhelm/Perfurante, Barrier, etc. — cada uma muda a *math* de bloqueio. Keyword só vale se for frequente e com texto de lembrete acessível (seção 3.4).

---

### 3.3 Evolução / level-up / upgrade

**LoR — Level Up:** champions começaram *sem* level up; o sistema foi introduzido para dar identidade e incentivar deckbuilding em torno da quest (ex.: Teemo + cogumelos). Entrevista IGN com o time: [How the Game Has Evolved…](https://me.ign.com/en/pc/167040/the-legends-of-runeterra-team-on-how-the-game-has-evolved-the-path-ahead-and-more). Champion spells: segunda cópia vira spell que ajuda a quest e devolve cópia ao deck — paralelo direto aos **Jutsus exclusivos** / conversão de cópias no Shinobi.

**Resonance temática vs mecânica:** [Bringing Champions to Life in LoR](https://playruneterra.com/en-us/news/dev/bringing-champions-to-life-in-lor) — condição de level deve “soar” como o personagem (Nasus = stacks/Slay; etc.).

**Level 3 / Ascended (Shurima):** segundo level-up como tema de set, com cuidado para não tornar Lv2 irrelevante ([Inven Global — Shurima](https://www.invenglobal.com/articles/13420/time-glory-brutality-how-the-legends-of-the-runeterra-team-brought-shurima-to-life)). No Shinobi, a linha de **3 patentes** já é o “Lv1–3”; não precisa de quarto estágio no MVP.

**Pokémon TCG:** evolução física (estágios no deck) ≠ LoR/Shinobi (transformação in-place). Útil como contraste: custo de “ter a evolução na mão” vs “cumprir missão em campo”.

**Boas práticas (já no [02](./02-criacao-evolucao.md)):**

- condição mensurável + counterplay;
- promoção muda **função**, não só +stats;
- balancear \(P_1 + p_{1\to2}\Delta_2 + p_{2\to3}\Delta_3\);
- definir herança (equipamentos, dano, debuffs, patente salva).

---

### 3.4 Keywords, templating e densidade

**Por que keyword existe:** compactar texto, chunking cognitivo, hooks (“dê +1/+1 a criaturas com X”), consistência. Rosewater: [Keyword Play](https://magic.wizards.com/en/news/making-magic/keyword-play-2007-06-18).

**Quando *não* keywordar:** habilidade rara, texto curto o bastante, ou keyword sem hooks. Blizzard removeu **Enrage** por baixa prevalência e pouca utilidade de design: [Designer Insights — Enrage Changes](https://news.blizzard.com/en-us/article/21614307/designer-insights-with-peter-whalen-enrage-changes).

**Densidade:** cada keyword nova aumenta carga cognitiva; preferir evergreen estável + poucas keywords de set. Overview prático: [Cloudfall — Design Tips: Keywords](https://www.cloudfallstudios.com/blog/2021/6/17/design-tips-keywords).

**Digital:** tooltip / reminder text no hover/toque; no onboarding, preferir texto completo ou ícone + tooltip. Shinobi já agrupa termos em **Palavras-chave / Status / Gatilhos / Ações** (`RulesScreen`) — mantenha essa taxonomia estável.

**Templating:** mesma estrutura gramatical para o mesmo efeito (“Sempre que…”, “Quando este ninja…”) — ver Parte IX do [03](./03-manual-profissional.md).

---

### 3.5 Deck construction e formatos

| Família | Ideia | Exemplo de regra |
|---------|-------|------------------|
| **Constructed** | Deck montado antes | MTG 60 / ≤4 cópias; Lorcana Core ≥60 / ≤4 / ≤2 inks ([Tournament Rules PDF](https://files.disneylorcana.com/Tournament-Rules-6.11.2026_Update-EN.pdf)) |
| **Limited** | Pool gerado no evento | Sealed/Draft; decks menores |
| **LCG / fixed pool** | Conteúdo fixo por produto | FFG Living Card Game |

**Shinobi (hoje):** Constructed fechado — 24 cartas; ninjas ≤3 distintos / ≤2 cópias; outros ≤3; exclusivos e tokens **não** entram no deck.

**Implicações de deck curto (24):**

- hipergeométrica: consistência alta → “bombas” e tutores são mais perigosos;
- curva deve caber em ~8–12 turnos típicos de Chakra;
- formatos futuros (Draft, singleton, banlist) devem ser **documentados à parte**, sem alterar o MVP.

---

### 3.6 Balanceamento: budget, playtest, telemetria

**Power budget** — soma ponderada de stats + efeitos − restrições; ferramenta, não lei ([03](./03-manual-profissional.md) Cap. 17; [04](./04-pesquisa-shinobi.md) §5).

**Stages of design + playtesting (Magic):** Exploratory → Vision → Set → Play Design; tipos de teste mudam por estágio: [Playtesting (Rosewater)](https://magic.wizards.com/en/news/making-magic/playtesting); [Nuts & Bolts — Three Stages](https://magic.wizards.com/en/news/making-magic/nuts-bolts-three-stages-design-2015-03-30).

**Filosofia de mudança (Hearthstone):** não só win rate — interatividade, frustração, clareza, diversidade de escolhas no custo: [Card Balance Philosophy](https://hearthstone.blizzard.com/en-us/news/12383909).

**Telemetria / otimização (digital):** Arena do Hearthstone usa win-rate, pick-rate, buckets e pesos de draft com modelo preditivo: [Arena Balance Through Science](https://news.blizzard.com/en-us/article/22788308/developer-insights-arena-balance-through-science). Para o Shinobi no MVP: planilha + simulação seedada + métricas manuais (taxa de promoção, turno de kill, uso de Reserva) bastam; A/B live só faz sentido com tráfego real.

**Matriz útil de playtest:**

| Eixo | Pergunta |
|------|----------|
| Isolada | Carta justa no vácuo? |
| Arquétipo | Brilha no deck certo? |
| Matchup | Dominada / dominante? |
| Evolução | Turno médio de promoção / % que completa linha |
| Feel | Frustrante mesmo com WR ~50%? |

---

### 3.7 UI/UX de card games digitais

Padrões recorrentes (Hearthstone e análises de UI):

- **Uma tela = estado completo** da partida (mão, campo, vida, recurso).
- **Hand fan** na base; enlarge no hover/toque; recurso **perto da mão**.
- **Board com slots limitados** e espaço negativo (Gestalt) — o cap de 5 do Shinobi ajuda a UI.
- **Targeting:** alvos válidos destacados, inválidos esmaecidos, seta/highlight claro.
- **Histórico/log:** narrativa escaneável (“quem fez o quê”); passado à esquerda é padrão HS. Crítica útil de layout HS: [Any Key To Start — Hearthstone](https://anykeytostart.wordpress.com/2015/03/19/hearthstone/); breakdown de zonas: [GDKeys — Card Games UI](https://gdkeys.com/the-card-games-ui-design-of-fairtravel-battle/).
- **Logs:** [Board Game Arena UX Guidelines (PDF)](https://doc.studio.boardgamearena.com/assets/framework-documentation/guidelines/Guidelines_UX.pdf) — ator + mudança; agrupar micro-ações.

**Shinobi:** ArenaScreen + HUD de histórico/chakra já seguem essa direção (`architecture.md`). Priorizar: (1) clareza da **pilha**, (2) progresso de **missão/patente**, (3) Ocultos virados sem vazar informação ilegal à IA/UI.

---

### 3.8 Arquitetura: data-driven, engine vs UI, efeitos

**Separação:** Definition (dados) × Instance (estado) × Engine (regras) × UI (intents). Já prescrito em [architecture](../architecture.md) e [03](./03-manual-profissional.md) Parte VII.

**LoR — ferramentas para designers:** scripts por carta ligados a **eventos** do motor (IronPython sobre C#), histórico/state na carta, para iterar sem bloqueio de engenharia: [Engineering Tools for Designers (Riot)](https://www.riotgames.com/en/news/engineering-tools-designers-legends-runeterra); pipeline de features: [Bringing Features to Life](https://www.riotgames.com/en/news/bringing-features-life-legends-runeterra).

**Para o Shinobi (TypeScript):** o equivalente saudável é **catálogo de efeitos + handlers de eventos + dados declarativos** (JSON/TS), não Python embutido no MVP. Scripts livres só se o time sentir o mesmo gargalo que a Riot descreveu.

**Anti-loop / determinismo:** fila de efeitos, limite de profundidade, seed — ver [04](./04-pesquisa-shinobi.md) §3.

---

### 3.9 IA adversária (alto nível)

| Nível | Método | Quando |
|-------|--------|--------|
| MVP | Heurística ponderada + ações legais da engine | Agora ([04](./04-pesquisa-shinobi.md) §4) |
| Intermediário | Busca rasa / rollout com avaliação | Quando heurística “joga burro” em combate |
| Avançado | **PIMC** (determinizar mão/deck oculto e rodar MCTS) ou IS-MCTS | Pesquisa / pós-MVP |

Surveys e papers: [MCTS review (arXiv)](https://arxiv.org/abs/2103.04931); [Survey AI for card games (arXiv HTML)](https://arxiv.org/html/1906.04439); Hearthstone + MCTS: [IEEE CoG paper](https://ieee-cog.org/2020/papers2019/paper_257.pdf); tese CCG AI: [Artificial Intelligence Methods for Playing Collectible Card Games](http://hdl.handle.net/10467/82741).

**Regra de ouro:** a IA **nunca** reimplementa regras; só escolhe entre ações legais. Não espiar mão/Ocultos rivais (`PlayerObservation`).

---

### 3.10 Licenciamento / IP (alto nível, projetos fã)

Não é aconselhamento jurídico. Padrões recorrentes em políticas de fan content de publishers:

- conteúdo **não comercial** / gratuito;
- **disclaimer** claro de não afiliação / não endosso;
- não usar marcas de forma confusa com produto oficial;
- assets oficiais muitas vezes **proibidos** de redistribuir;
- a política do dono da IP **prevalece**; disclaimer **não** cria licença.

Exemplos de políticas públicas (outras IPs — para *padrão*, não para Naruto): [Epic Fan Content Policy](https://legal.epicgames.com/epicgames/fan-art-policy); [Big Blue Bubble Fan Content](https://www.bigbluebubble.com/fan-content-policy/); [Team Salvato IP Guidelines](https://teamsalvato.com/ip-guidelines).

No projeto: já há nota em [04 §13.4](./04-pesquisa-shinobi.md) — dados/wikis aceleram catálogo; **não** autorizam uso comercial de personagens/arte. Para qualquer distribuição pública, consultar termos do licenciador (ex. VIZ / Shueisha) e, se necessário, assessoria legal.

---

## 4. Anti-padrões / armadilhas

| Armadilha | Por que dói | Mitigação no Shinobi |
|-----------|-------------|----------------------|
| 100 cartas antes do core loop | Meta e motor instáveis | Skeleton pequeno + testes de regra |
| Balancear só a forma Jounnin | Lv1–2 viram lixo ou snowball | Power esperado ponderado por taxa de promoção |
| Keyword para tudo | Sobrecarga cognitiva | Evergreen curto; habilidade única = texto |
| Draw/tutor sem custo em deck 24 | Consistência absurda | Custo alto, single-use, ou anti-sinergia |
| Geração ilimitada de exclusivos | Card advantage infinito | Caps, custo, “só com ninja em campo” |
| Regras na UI | Desync humano/IA | Intents → engine |
| Arena com efeito sem telemetria | Meta aleatória | Manter `ARENA_EFFECTS` off até haver métricas |
| MCTS no caminho crítico do MVP | Custo/complexidade | Heurística primeiro |
| Copiar kit LoL/anime 1:1 | Quebra de formato e IP | Resonance mecânica do *card game*, arte original |
| Pilha invisível | “Jogada injusta” percebida | Log + visual da ordem LIFO |
| Evolução sem counterplay | Feel-bad do rival | Remoção, Selado, tempo de missão |

---

## 5. Checklist de design (carta / mecânica / set pequeno)

### Identidade

- [ ] Fantasia clara em uma frase  
- [ ] Arquétipo primário (Aggro / Mid / Control / Combo / Ocultos)  
- [ ] Papel: enabler / payoff / removal / finisher / engine / tech  

### Economia

- [ ] Custo de Chakra e impacto na curva do deck 24  
- [ ] Usa Reserva? Gera carta? Quantas “cartas líquidas”?  
- [ ] Tempo vs card advantage explícitos  

### Evolução (se ninja)

- [ ] Missão alinhada à fantasia  
- [ ] Tracker individual vs global documentado  
- [ ] Herança na promoção e patente salva  
- [ ] Playtest: nunca promove / promove cedo / rival remove no limiar  

### Keywords & texto

- [ ] Keyword justificada (frequência + hook) ou texto aberto  
- [ ] Reminder / tooltip na UI  
- [ ] Templating consistente com cartas similares  

### Interação

- [ ] Counterplay na pilha ou no combate  
- [ ] Alvos ilegais tratados pelo motor  
- [ ] Sem loop óbvio (depth limit)  

### Implementação

- [ ] Dados em `src/data`, efeito no registry/engine  
- [ ] Teste automatizado da regra  
- [ ] UI só envia intent; log registra resultado  

### Meta / balance

- [ ] Comparada a cartas do mesmo custo  
- [ ] Não colapsa o meta desejado (Mid → Aggro → Control…)  
- [ ] Métricas a observar após merge  

---

## 6. Fontes (links)

### Design clássico / Magic

- [Mana Action — Rosewater](https://magic.wizards.com/en/news/making-magic/mana-action-2011-05-30)  
- [Do the Math — Rosewater](https://magic.wizards.com/en/news/making-magic/do-the-math)  
- [Leading a Horse to Water — card advantage](https://magic.wizards.com/en/news/making-magic/leading-horse-water-2009-10-05)  
- [Keyword Play — Rosewater](https://magic.wizards.com/en/news/making-magic/keyword-play-2007-06-18)  
- [Playtesting — Rosewater](https://magic.wizards.com/en/news/making-magic/playtesting)  
- [Nuts & Bolts: Three Stages of Design](https://magic.wizards.com/en/news/making-magic/nuts-bolts-three-stages-design-2015-03-30)  
- [Dynamics of a Turn (stack)](https://magic.wizards.com/en/news/feature/dynamics-turn-2006-11-04)  
- [Attacking and Blocking](https://magic.wizards.com/en/news/feature/attacking-and-blocking-2014-11-10)  
- [Magic Comprehensive Rules (PDF)](https://media.wizards.com/2026/downloads/MagicCompRules%2020260417.pdf)  

### LoR / Riot

- [Engineering Tools for Designers](https://www.riotgames.com/en/news/engineering-tools-designers-legends-runeterra)  
- [Bringing Features to Life](https://www.riotgames.com/en/news/bringing-features-life-legends-runeterra)  
- [Bringing Champions to Life](https://playruneterra.com/en-us/news/dev/bringing-champions-to-life-in-lor)  
- [IGN — LoR team / level up origin](https://me.ign.com/en/pc/167040/the-legends-of-runeterra-team-on-how-the-game-has-evolved-the-path-ahead-and-more)  
- [Inven — Shurima / Level 3](https://www.invenglobal.com/articles/13420/time-glory-brutality-how-the-legends-of-the-runeterra-team-brought-shurima-to-life)  

### Hearthstone / keywords / balance

- [Enrage keyword removal — Whalen](https://news.blizzard.com/en-us/article/21614307/designer-insights-with-peter-whalen-enrage-changes)  
- [Card Balance Philosophy](https://hearthstone.blizzard.com/en-us/news/12383909)  
- [Arena Balance Through Science](https://news.blizzard.com/en-us/article/22788308/developer-insights-arena-balance-through-science)  

### Economia / categorias / UI

- [The design of CCGs — Gaudebert](https://adrian.gaudebert.fr/blog/post/the-design-of-ccgs)  
- [Tempo & economy of the turn — GameDesign.gg](https://gamedesign.gg/articles/card-and-board-game-design/)  
- [CCG/TCG/LCG explained](https://virtualpostgaming.com/ccg-tcg-lcg-deckbuilder-terms-explained/)  
- [Fantasy Flight — Living Card Games](https://www.fantasyflightgames.com/more/living-card-games/)  
- [Keywords tips — Cloudfall](https://www.cloudfallstudios.com/blog/2021/6/17/design-tips-keywords)  
- [Hearthstone UI critique](https://anykeytostart.wordpress.com/2015/03/19/hearthstone/)  
- [Card game UI zones — GDKeys](https://gdkeys.com/the-card-games-ui-design-of-fairtravel-battle/)  
- [BGA UX Guidelines (logs)](https://doc.studio.boardgamearena.com/assets/framework-documentation/guidelines/Guidelines_UX.pdf)  

### IA (surveys)

- [MCTS modifications — arXiv](https://arxiv.org/abs/2103.04931)  
- [Survey AI for card games](https://arxiv.org/html/1906.04439)  
- [MCTS for Hearthstone — CoG PDF](https://ieee-cog.org/2020/papers2019/paper_257.pdf)  
- [AI methods for CCGs — thesis](http://hdl.handle.net/10467/82741)  

### IP (exemplos de política de fan content)

- [Epic Fan Content Policy](https://legal.epicgames.com/epicgames/fan-art-policy)  
- [Big Blue Bubble Fan Content](https://www.bigbluebubble.com/fan-content-policy/)  
- [Team Salvato IP Guidelines](https://teamsalvato.com/ip-guidelines)  

### Docs internos cruzados

- [01-fundamentos](./01-fundamentos.md) · [02-criacao-evolucao](./02-criacao-evolucao.md) · [03-manual-profissional](./03-manual-profissional.md) · [04-pesquisa-shinobi](./04-pesquisa-shinobi.md)

---

## 7. Gaps — o que ainda vale pesquisar depois

Itens **específicos** em que este doc ficou propositalmente raso ou sem fonte primária do dono da IP Naruto:

1. **Política oficial de fan content / licensing** do detentor da franquia Naruto (VIZ / Shueisha / Spin Master conforme território) — só há cautela genérica aqui.  
2. **GDC talks** concretas (vídeos/slides) sobre digital CCG UX e balance live — buscas apontam temas, mas vale curar 2–3 talks com timestamps.  
3. **Números hipergeométricos** do deck 24 (tabelas: P(abrir ≥1 de K cópias até o turno N)) — calcular e anexar como apêndice de balance.  
4. **Telemetria mínima** schema (eventos a logar: promoção, pilha depth, mulligan keep rate) alinhado ao código real.  
5. **Comparativo formal** Oculto vs Secret (HS) vs Trap (YGO) — regras de disparo e “bluff equity”.  
6. **Patente salva + custo de retorno** — poucos paralelos públicos documentados; playtest dedicado > analogia.  
7. **Quando ligar `ARENA_EFFECTS`** — critérios de meta e UI (Marvel Snap locations como estudo de caso).  
8. **PIMC leve** no simulador headless — só depois da heurística estável.

---

*Documento vivo: ao incorporar uma fonte nova, atualize a seção 6 e, se mudar uma decisão de produto, atualize também `core-rules` e `04-pesquisa-shinobi`.*
