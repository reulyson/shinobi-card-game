# Naruto Card Game — Regras v2

> Card game tático inspirado em Legends of Runeterra, ambientado no universo de Naruto, com evolução shinobi em 3 níveis (Gennin → Chuunin → Jounnin), combate por arrasto, pilha de Jutsus e Arenas Dinâmicas.

> **Vocabulário oficial:** os nomes nas **cartas** e no motor são os mesmos (Furtivo, Sensor, Ágil, Perfurante, Instantâneo, Rápido, Preparado…). Lista canônica: `KEYWORD_LIST` em `src/types/game.ts`. Nomes de jutsu e lore (ex.: Chidori) aparecem em flavor, não como palavra-chave na moldura. Glossário visual: `keyword_v2.png` e `keywords.png` nesta pasta.

> Legenda: **[REVISAR]** marca regras que são decisões de design propostas nesta revisão e que precisam da sua aprovação.

## 1. Objetivo e Condição de Vitória

- Cada jogador inicia a partida com Vitalidade de 20 pontos de Vida, 5 cartas na mão e um baralho embaralhado de 24 cartas.
- Vitória: reduza a Vitalidade adversária a 0 (ataques não bloqueados, excedente de **Perfurante**, **Impacto**, habilidades ou Jutsus diretos).
- Campo de Batalha: cada lado possui até 5 espaços de aliados (Ninjas, Unidades ou Tokens) e até 2 espaços ocultos de Ocultos.
- **Início da partida:** o jogador que vai primeiro é sorteado e começa com a Ficha de Ataque na Rodada 1.
- **Mulligan:** antes da Rodada 1, cada jogador pode trocar uma única vez qualquer quantidade das 5 cartas iniciais; as cartas trocadas voltam ao baralho, que é embaralhado, e novas cartas são compradas.
- **Baralho vazio:** se o jogador precisar comprar uma carta com o baralho vazio, ele perde a partida na hora.

## 2. Regras de Construção de Baralho (Deckbuilding)

- Tamanho do Baralho: exatamente 24 cartas.
- Ninjas (Campeões): máximo de 3 personagens Ninja distintos por baralho, com no máximo 2 cópias de cada Ninja (total máximo de 6 cartas de Ninja no deck).
- Demais Cartas (Unidades, Jutsus, Ocultos e Equipamentos): máximo de 3 cópias de qualquer carta repetida.
- Tokens não entram na montagem do baralho (veja 4.6).

## 3. Chakra e Reserva de Jutsu

- Chakra Principal: começa em 1/1 na Rodada 1 e aumenta em +1 a cada nova rodada até o máximo de 10/10.
- Reserva de Chakra (Mana de Feitiço): ao final de cada rodada, até 3 pontos de Chakra não gastos são armazenados na Reserva de Jutsu.
  - O Chakra da Reserva pode ser usado exclusivamente para conjurar Jutsus e armar Ocultos.
  - A Reserva é consumida automaticamente antes do Chakra principal ao jogar Jutsus ou Ocultos.

## 4. Os 5 Tipos de Cartas + Tokens

São 5 tipos de cartas que podem entrar no baralho (Ninjas, Unidades, Jutsus, Ocultos e Equipamentos). Os Tokens são um sexto grupo, mas **não são um tipo de baralho** (veja 4.6).

### 4.1. Ninjas (3 Níveis: Gennin → Chuunin → Jounnin)

Cartas icônicas que evoluem durante a partida ao cumprirem suas missões em campo:

1. Nível 1 — Gennin: forma base ao entrar em campo, com condição inicial de promoção.
2. Nível 2 — Chuunin: ao cumprir a primeira missão, o Ninja é promovido a Chuunin, recebendo aumento de Ataque/Vida, novas palavras-chave e habilidades aprimoradas.
3. Nível 3 — Jounnin: ao cumprir a segunda missão como Chuunin, atinge o auge Jounnin, desbloqueando status máximos e efeitos lendários.

Para cada graduação existe uma imagem.

### 4.2. Unidades

Shinobis comuns e tropas de apoio das vilas (Anbu, Raiz, Médicos de Campo, Policial Uchiha, Batedores, Oinin, etc.). Não sobem de nível (não evoluem), mas compõem a espinha dorsal do campo e aceitam até 3 cópias no deck.

### 4.3. Jutsus

Técnicas ninjas que afetam o campo, unidades ou Portões. Dividem-se por categoria:

- Ataque: Direto (na Vitalidade), Individual (1 alvo), Múltiplo (alvo + secundário/Vitalidade) e em Área (todos os inimigos).
- Fortalecer: concedem bônus de Poder/Vida ou palavras-chave defensivas.
- Enfraquecer: aplicam Genjutsu, Bloqueio de Chakra, Selar, Tenketsu Aberto ou Exaustão.
- Cura: restauram Vida de aliados e da Vitalidade.
- Invocação: colocam Tokens poderosos diretamente em campo.
- Detectar/Revelar: revelam e removem cartas Oculto do oponente (veja 4.4). **[REVISAR]**

### 4.4. Ocultos

Cartas secretas armadas face para baixo (até 2 simultâneas). O oponente sabe quantas ocultos existem, mas não qual técnica foi ocultada. Disparam automaticamente quando o inimigo executa o gatilho específico:

- Ao Declarar Ataque (Kibaku Fuda, Kagemane no Jutsu, Dokugiri) — Jutsus velocidade Oculto
- Ao Conjurar Jutsu (Gogyō Fūin) — Jutsu velocidade Oculto
- Ao Invocar Unidade (Magen: Jubaku Satsu)

Regras de Ocultos:

- **Armar:** custa Chakra (a Reserva de Jutsu pode ser usada) e tem velocidade **Preparado**: só pode ser feito fora de combate e com a Pilha vazia.
- **Disparo:** ao disparar, o efeito entra na Pilha com velocidade **Rápido** e pode ser respondido pelo oponente.
- **Depois de disparar:** o Oculto é revelada e descartada.
- **Limite:** no máximo 1 Oculto dispara por gatilho. Se houver 2 Ocultos com o mesmo gatilho, o dono escolhe qual ativar, e a outra continua oculta.
- **Remoção:** o oponente pode remover uma carta Oculto com Jutsus da categoria Detectar/Revelar, que a revelam e a descartam sem ativar o efeito.

### 4.5. Equipamentos

Ferramentas ninja acopladas a um Ninja ou Unidade aliado (máx. 1 equipamento por aliado; equipar outro devolve o anterior à mão).

- Concedem atributos (+Ataque/+Vida) e palavras-chave permanentes enquanto equipados.
- Regra de Retorno: sempre que o portador deixar o campo (por morte em combate ou por Jutsu, Kuchiyose Reverso ou Kekkai), o Equipamento retorna automaticamente para a mão do dono.
- Mão cheia: se a mão já tiver 9 cartas, o Equipamento é destruído. **[REVISAR]**
- Selar: enquanto o portador estiver Selado, o Equipamento fica ligado a ele, mas seus bônus e palavras-chave ficam desligados até o fim do efeito. **[REVISAR]**

### 4.6. Tokens

Cartas geradas exclusivamente por habilidades de personagens ou Jutsus durante a partida. Não são um tipo de baralho: não entram na montagem do deck. Exemplos: Clone das Sombras, Shinobi Reanimado (Edo Tensei), Gamabunta, Katsuyu, Marionete Karasu e Manda. Podem ser Bunshins (desaparecem ao golpear ou no fim da rodada).

- **Contam como Unidades para todas as regras:** podem receber Equipamento, ser aprisionados por Kekkai, afetados por Kuchiyose Reverso, Selados, sob Genjutsu etc. **[REVISAR]**
- Um Token que seria afetado por Kuchiyose Reverso deixa de existir, em vez de voltar à mão.

## 5. Velocidades de Jutsu e Pilha (Stack LIFO)

| Velocidade (na carta) | Quando pode ser usada | Pilha / resposta do oponente | Uso típico |
|---|---|---|---|
| **Instantâneo** | A qualquer momento (mesmo em combate ou com a Pilha cheia) | Não entra na Pilha; o oponente não responde; resolve na hora e você mantém a vez | Truques instantâneos |
| **Rápido** | A qualquer momento (inclusive em combate ou como resposta) | Entra na Pilha; o oponente pode responder com Rápido ou Instantâneo | Reações e truques de combate |
| **Preparado** | Só fora de combate e com a Pilha vazia | Entra na Pilha; passa a prioridade antes de resolver | Jutsus mais fortes; armar Ocultos |
| **Concentrado** | Só fora de combate e com a Pilha vazia | Não entra na Pilha; resolve na hora, sem resposta | Jutsus de compra, invocação e utilidade **[REVISAR]** |
| **Oculto** | Fora de combate, pilha vazia (armar virado) | Disparo entra como **Rápido** (veja 4.4) | Armadilhas secretas |

- Pilha LIFO: quando ambos passam a vez e o jogador ativo confirma **Passar Turno**, a Pilha resolve de cima para baixo.
- Ocultos disparados entram na Pilha com velocidade **Rápido** (veja 4.4).

## 6. Fluxo Fluido de Turno e Combate por Arrasto (um único botão)

1. **Início da Rodada:** o Chakra enche até o novo máximo (1–10), a Reserva guarda até 3, ambos compram 1 carta, unidades com **Regenerar** curam totalmente, efeitos temporários, Genjutsu e Bloqueio de Chakra expiram, **Clones** caem e a Ficha de Ataque alterna.
2. **Arrasto:**
   - Ninjas/Unidades vão da mão ao campo; Equipamentos são arrastados sobre um aliado; Jutsus e Ocultos vão ao alvo (ou à zona central).
   - Atacar: com a Ficha ativa, arraste os atacantes para o Campo de Duelo; **Passar Turno** dispara o ataque.
   - Bloquear: arraste defensores sobre os atacantes; **Passar Turno** resolve.
   - Todo ataque passa pela fase de bloqueio. Ataque direto à Vitalidade só quando o oponente não pode bloquear (ex.: **Furtivo** sem bloqueador **Furtivo** ou **Sensor**). **[REVISAR]**
3. **Resolução:** **Ágil** golpeia antes do bloqueador; **Veloz** golpeia antes e de novo junto com o bloqueador. **Provocar** / **Exposto** escolhem bloqueador. **Passar Duplo** (ambos passam seguidos sem agir) encerra a rodada.

## 7. Arenas Dinâmicas

As Arenas são aleatórias por partida ou trocadas por Jutsus/Habilidades como Minato, Hashirama ou Suiryūdan. São apenas estas 4:

- Vale do Fim: atacantes isolados (1 ou 2 unidades) recebem +2/+0 no combate. Evoluções (Chuunin/Jounnin) concedem +1/+1 extra.
- Floresta da Morte: Ocultos custam 1 a menos (mín. 1). No início de cada rodada, a unidade mais ferida sem **Regenerar** sofre 1 de dano.
- Arena do Exame Chūnin: unidades com **Ágil** entram com +0/+1. Jutsus **Instantâneos** concedem +1/+1 temporário ao alvo.
- Telhados de Konoha: cartas com função Hokage ou Sensei custam 1 a menos. Início da rodada recarrega +1 de Reserva de Jutsu.

## 8. Termos do jogo (4 grupos — nomes da UI)

Organização canônica alinhada às cartas e à tela **Regras** do app (`RulesScreen.tsx`). Referência visual: `keyword_v2.png`.

### 8.1 Palavras-chave (na moldura da carta)

Furtivo · Sensor · Perfurante · Ágil · Veloz · Provocar · Intimidação · Imprudente · Muralha · Impacto · Imobilizado · Indefeso · Esquiva · Anulação · Resistente · Regenerar · Renascer · Roubo de Vida · Drenar · Clone · Fúria · Determinação · Treinamento · Despertar · Legado · Concentrar · Apoio · Fluxo · Ressonância · Contagem · Veneno · Parceiro · Formação · Copiar · Fugaz / Exclusivo (propriedades de carta).

Definições curtas: `src/data/keywordHelp.ts` (`KEYWORD_SHORT_HELP`) e créditos de ícones em `keywords.png`.

### 8.2 Status (temporários)

Esquiva ativa · Anulação ativa · Paralisado · Bloqueio de Chakra · Selado · Genjutsu · Envenenado · Formação ativa · Exposto · Exaustão · Indefeso · Bônus temporário (+X/+Y nesta rodada) · Cópia Fugaz (na mão).

### 8.3 Gatilhos (texto em negrito)

Entrada · Investida (Ao atacar) · Ao bloquear · Ao golpear · Ao abater · Ao sofrer dano · Ao conjurar · Último Desejo (Ao morrer) · Vingança · Início / Fim da rodada · Repouso · Gatilhos de Oculto («Quando o rival atacar/conjurar/invocar»).

### 8.4 Ações (verbos nas habilidades)

Causar dano · Curar · Paralisar · Selar · Bloquear chakra · Dar Esquiva · Envenenar · Genjutsu / Kai · Comprar · Drenar Reserva · Recarregar Reserva · Criar · Invocar · Equipar · Ganhar palavra-chave até a próxima rodada · Pagar Vida · Atravessar.

**Promoção (Subir de Nível):** Gennin → Chuunin → Jounnin ao cumprir missões em campo (barra na carta).

## Mudanças nesta versão

- Alvo principal padronizado como **Portão** em todo o documento (antes: Escudo / Vitalidade Rival / Vitalidade Principal).
- Melancolia corrigida para -1/-1 permanente cumulativo (agora **Exaustão**).
- Tokens: não são tipo de baralho e contam como Unidades; Token que sofre Kuchiyose Reverso deixa de existir. Título da seção 4 virou "5 tipos de cartas + Tokens".
- Ocultos: armar custa Chakra e é **Preparado**; o disparo entra na Pilha como **Rápido** e pode ser respondido; descartada após disparar; máx. 1 por gatilho (o dono escolhe qual, se houver mais de uma); removível por Jutsus Detectar/Revelar (nova categoria).
- Equipamento: volta à mão quando o portador deixa o campo; destruído com mão cheia (9); Selado desliga o bônus.
- **Provocar:** o atacante escolhe o bloqueador.
- Velocidade **Concentrado** na tabela de velocidades.
- **Despertar** (palavra-chave) separado de Promoção de patente.
- Ataque direto só contra atacante que não pode ser bloqueado; removida a ideia de ataque que pula bloqueios.
- Novas regras: sorteio e Ficha de Ataque inicial, mulligan e baralho vazio (derrota imediata).
- Vocabulário padronizado para os **nomes da UI/cartas** (glossário §8 e `KEYWORD_DISPLAY_NAME` no código).
- Decisões confirmadas: sorteio do primeiro jogador, mulligan, derrota imediata com baralho vazio e escolha do dono entre Ocultos com o mesmo gatilho.
