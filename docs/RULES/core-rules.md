# Core Rules — Shinobi CardGame (v2)

**Fonte:** regras oficiais refletidas em `src/ui/screens/RulesScreen.tsx` e limites em `src/engine/limits.ts`.  
**Nome na UI:** Naruto Combate — Documentação Oficial (v2).

---

## 01. Objetivo e vitória

- Cada jogador: **Vitalidade 20**, **5 cartas** na mão, baralho de **24**.
- **Vitória:** reduzir a Vitalidade adversária a 0 (ataques não bloqueados, excedente de Perfurante, Impacto, habilidades ou Jutsus).
- **Campo:** até **5** aliados (Ninjas, Unidades ou Tokens) e até **3** Ocultos por lado; **mão máx. 9**.
- **Sorteio:** quem começa com a Ficha de Ataque na Rodada 1.
- **Mulligan:** uma única vez, qualquer quantidade das 5 iniciais.
- **Baralho vazio** ao precisar comprar = derrota imediata.

---

## 02. Baralho e Chakra

- Baralho: **exatamente 24**.
- Ninjas: máx. **3 distintos**, até **2 cópias** cada (máx. 6 cartas de Ninja).
- Unidades, Jutsus e Equipamentos: até **3 cópias**. Tokens não entram no baralho.
- **Jutsus Exclusivos e Tokens** são criados durante a partida (não entram no deck).
- **Chakra:** começa 1/1, +1 por rodada até **10/10**.
- **Reserva de Jutsu:** até **3** Chakra não gasto; só paga Jutsus (incl. armar Ocultos); gasta antes do Chakra principal.
- **Custo mínimo 1** após descontos; descontos somados no máximo **−2** por carta.

---

## 03. Tipos de cartas + Tokens

### Ninjas (Gennin → Chuunin → Jounnin)

- Evolução **linear** ao cumprir missões em campo; cada graduação tem imagem.
- Jogados só com **Chakra principal**; entram como **Gennin** + Entrada + Jutsu Exclusivo na mão.
- **Ninja Único:** só 1 cópia em campo (qualquer forma).
- **Patente salva:** ao morrer, guarda patente e progresso; próxima cópia entra nessa patente (★). Custo de retorno: Gennin = normal, Chuunin **+1**, Jounnin **+2**.
- **Jutsu Exclusivo:** criado na mão ao entrar; conjurar com o Ninja em campo conta **+1** na missão de Promoção.
- Cópias na mão (com Ninja em campo) viram Token Exclusivo ou Jutsu Exclusivo.

### Outros tipos

- **Unidades:** tropas; não evoluem.
- **Jutsus:** Ataque, Fortalecer, Enfraquecer, Cura, Invocação, Detectar/Revelar.
- **Oculto:** velocidade de Jutsu; virado; máx. 3; dispara como Rápido na Pilha.
- **Equipamentos:** 1 por aliado; voltam à mão se o portador sai; Selado desliga bônus.
- **Tokens:** criados; Clone some ao golpear/fim de rodada.

---

## 04. Velocidades e Pilha (LIFO)

| Velocidade | Quando | Pilha |
|------------|--------|-------|
| Instantâneo | Sempre | Não — resolve na hora |
| Rápido | Sempre (incl. combate/resposta) | Sim |
| Preparado | Fora de combate, pilha vazia | Sim |
| Concentrado | Fora de combate, pilha vazia | Não |
| Oculto | Fora de combate, pilha vazia | Armado; disparo = Rápido |

Resolução: último a entrar resolve primeiro.

---

## 05. Fluxo de turno e combate

**Início da rodada:** Chakra enche, Reserva até 3, compra 1, Regenerar, limpa temporários/Paralisado/Bloqueio de Chakra, Clones caem, Ficha de Ataque alterna.

**Arrasto:** ninja/unidade → campo; equipamento → aliado; jutsu/oculto → alvo/zona.

**Atacar** (com Ficha): Zona de Combate → Passar Turno. Provocar/Exposto escolhe bloqueador.

**Bloquear:** defensores sobre atacantes → Passar resolve. Sem bloqueio = Poder inteiro na Vitalidade.

**Ágil** golpeia antes. **Veloz** golpeia antes e de novo. **Passar Duplo** sem ações = fim da rodada.

---

## 06. Termos (4 grupos)

Organização canônica: **Palavras-chave**, **Status**, **Gatilhos**, **Ações**.

Lista completa e textos: tela **Regras** no app (`RulesScreen`), tipo `Keyword` / `KEYWORD_LIST` em `src/types/game.ts` (motor = nomes na carta), glossário visual em `public/assets/aistudio/keyword_v2.png`.

---

## Arenas

Efeitos de arena **desligados** no MVP (`ARENA_EFFECTS_ENABLED = false` em `src/data/arenas.ts`) — apenas visual.

---

## Limites (código)

| Constante | Valor |
|-----------|-------|
| `STARTING_VITALIDADE` | 20 |
| `MAX_BOARD_UNITS` | 5 |
| `MAX_HAND_SIZE` | 9 |
| `MAX_OCULTO_IN_PLAY` | 3 |
