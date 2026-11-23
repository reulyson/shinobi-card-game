# Inventário de cartas — Shinobi CardGame

> Gerado a partir do código em `src/data/` (`cards.ts`, `ninjas.ts`, `units.ts`, `ninjaExtras.ts`) e tipos em `src/types/game.ts`.
> Contagens e campos refletem o estado atual do repositório (fonte de verdade = exports TypeScript).
>
> **Raridade (C/I/R/L):** mapa em `src/data/rarity.ts`, aplicado em `ALL_CARDS` via `withCollectionRarity`.  
> Afeta coleção/pack/craft (pós-MVP) — **não** poder nem visual. Tokens/exclusivos gerados: sem raridade de pack.

## 1. Resumo numérico

| Tipo | Quantidade | Onde vive | Deckable? |
|------|------------|-----------|-----------|
| **Ninja** | **34** | `ninjas.ts` → `NINJA_CARDS` | sim |
| **Unidade** | **44** | `units.ts` → `UNIT_CARDS_G7` | sim |
| **Jutsu (lista geral)** | **50** | `cards.ts` → `JUTSU_CARDS` | misto¹ |
|&nbsp;&nbsp;↳ deckable | 27 | | sim |
|&nbsp;&nbsp;↳ exclusivo (signature) | 23 | `SIGNATURE_JUTSU_IDS` | não |
| **Jutsu exclusivo (lista extra)** | **5** | `ninjaExtras.ts` → `NINJA_EXCLUSIVE_JUTSUS` | não |
| **Oculto (ex-Armadilha)** | **5** | `cards.ts` → `OCULTO_JUTSU_CARDS` | sim |
| **Equipamento (baralho)** | **3** | `cards.ts` → `EQUIPMENT_CARDS` | sim |
| **Equipamento token** | **2** | `ninjaExtras.ts` → `NINJA_EQUIPMENT_TOKENS` | não |
| **Tokens (unidades)** | **24** | `TOKEN_CARDS` (units + ninjaExtras) | não |

**Total de definições distintas:** **167**  
(`ALL_CARDS` = 143 + `TOKEN_CARDS` = 24; tokens não entram em `ALL_CARDS`, mas são resolvidos via `getCardById`).

### Por raridade (só deckable)

| C | I | R | L | Total |
|---|---|---|---|-------|
| 31 | 46 | 24 | 12 | **113** |

Critérios e ids: `src/data/rarity.ts`.

- **IDs de Jutsu Exclusivo** (`SIGNATURE_JUTSU_IDS`): **28** (23 em `JUTSU_CARDS` + 5 em `NINJA_EXCLUSIVE_JUTSUS`)
- **Criados só em partida** (`NINJA_CREATED_ONLY_IDS`): **7** (5 tokens ninja + 2 equipamentos token)
- **Deckable em `ALL_CARDS`:** 113 · **não deckable em `ALL_CARDS`:** 30
- **Presets de baralho:** 3

¹ Jutsus cujo `id` está em `SIGNATURE_JUTSU_IDS` não entram no baralho (`isDeckableCard`).

### Por facção (Ninjas)

| Facção | Ninjas |
|--------|--------|
| Akatsuki | 1 |
| Areia | 3 |
| Hokages | 3 |
| Névoa | 3 |
| Som & Sannin | 7 |
| Time 10 | 4 |
| Time 7 | 5 |
| Time 8 | 4 |
| Time 9 | 4 |

---

## 2. Tabelas por categoria

### 2.1 Ninjas (`NINJA_CARDS`)

| id | nome | custo | ATK/HP | facção | keywords | notas |
|----|------|-------|--------|--------|----------|-------|
| `hinata_hyuga` | Hinata Hyūga | 2 | 1/3 | Time 8 | Visão Aguçada | sem signature; general: `jutsu_byakugan_rastreio`; deckable |
| `ino_yamanaka` | Ino Yamanaka | 2 | 1/3 | Time 10 | — | exclusivo: `jutsu_shintenshin`; deckable |
| `kiba_inuzuka` | Kiba & Akamaru | 2 | 2/2 | Time 8 | Ataque Rápido | sem signature; general: `jutsu_gatsuga`; deckable |
| `rock_lee` | Rock Lee | 2 | 3/1 | Time 9 | Ataque Rápido | exclusivo: `jutsu_hachimon`; deckable |
| `sakura_haruno` | Sakura Haruno | 2 | 1/3 | Time 7 | — | exclusivo: `jutsu_palma_mistica`; deckable |
| `tenten` | Tenten | 2 | 2/2 | Time 9 | Ataque Rápido | exclusivo: `jutsu_rajada_shuriken`; deckable |
| `choji_akimichi` | Chōji Akimichi | 3 | 3/5 | Time 10 | Formidável | exclusivo: `jutsu_cho_baika`; deckable |
| `haku` | Haku | 3 | 2/2 | Névoa | Ataque Rápido, Elusivo | exclusivo: `jutsu_makyo_hyosho`; deckable |
| `jirobo` | Jirōbō | 3 | 3/4 | Som & Sannin | Formidável | exclusivo: `jutsu_doton_domu`; deckable |
| `kabuto_yakushi` | Kabuto Yakushi | 3 | 2/3 | Som & Sannin | Visão Aguçada | exclusivo: `jutsu_chakra_no_mesu`; deckable |
| `kankuro` | Kankurō | 3 | 2/3 | Areia | — | exclusivo: `jutsu_kugutsu_marionete`; deckable |
| `kidomaru` | Kidōmaru | 3 | 2/3 | Som & Sannin | Elusivo | exclusivo: `jutsu_kumo_sokai`; deckable |
| `naruto_uzumaki` | Naruto Uzumaki | 3 | 3/3 | Time 7 | Sobrepujar | exclusivo: `jutsu_rasengan`; deckable |
| `sasuke_uchiha` | Sasuke Uchiha | 3 | 3/2 | Time 7 | Ataque Rápido, Fúria | exclusivo: `jutsu_chidori`; deckable |
| `shikamaru_nara` | Shikamaru Nara | 3 | 2/3 | Time 10 | — | exclusivo: `jutsu_kagemane_tecnica`; deckable |
| `shino_aburame` | Shino Aburame | 3 | 2/3 | Time 8 | Visão Aguçada | sem signature; general: `jutsu_kikaichu`; deckable |
| `tayuya` | Tayuya | 3 | 2/3 | Som & Sannin | — | exclusivo: `jutsu_magen_onsa`; deckable |
| `temari` | Temari | 3 | 3/3 | Areia | — | exclusivo: `jutsu_kamaitachi`; deckable |
| `asuma_sarutobi` | Asuma Sarutobi | 4 | 3/4 | Time 10 | Ataque Rápido | sem signature; general: `jutsu_daitoppa`; deckable |
| `kurenai_yuhi` | Kurenai Yūhi | 4 | 2/5 | Time 8 | Visão Aguçada | exclusivo: `jutsu_magen_kurenai`; deckable |
| `neji_hyuga` | Neji Hyūga | 4 | 3/4 | Time 9 | Visão Aguçada, Barreira | exclusivo: `jutsu_rotacao_trigramas`; deckable |
| `sakon_ukon` | Sakon & Ukon | 4 | 3/3 | Som & Sannin | Desafiador | sem signature; general: `jutsu_rashomon`; deckable |
| `gaara` | Gaara | 5 | 4/6 | Areia | Barreira | exclusivo: `jutsu_sabaku_kyu`; deckable |
| `hiruzen_sarutobi` | Hiruzen Sarutobi | 5 | 4/6 | Hokages | Desafiador | exclusivo: `jutsu_shiki_fujin`; deckable |
| `kakashi_hatake` | Kakashi Hatake | 5 | 4/5 | Time 7 | Ataque Rápido, Visão Aguçada | exclusivo: `jutsu_raikiri`; deckable |
| `kimimaro` | Kimimaro | 5 | 5/5 | Som & Sannin | Ataque Rápido, Formidável | exclusivo: `jutsu_tsubaki_mai`; deckable |
| `kisame_hoshigaki` | Kisame Hoshigaki | 5 | 5/6 | Névoa | Roubo de Vida | sem signature; general: `jutsu_dragao_agua`; deckable |
| `might_guy` | Might Guy | 5 | 5/6 | Time 9 | Ataque Rápido, Formidável | exclusivo: `jutsu_dainamikku_entori`; deckable |
| `zabuza_momochi` | Zabuza Momochi | 5 | 5/5 | Névoa | Elusivo, Ataque Rápido | exclusivo: `jutsu_kirigakure`; deckable |
| `itachi_uchiha` | Itachi Uchiha | 6 | 5/5 | Akatsuki | Elusivo, Ataque Rápido | exclusivo: `jutsu_tsukuyomi`; deckable |
| `jiraiya` | Jiraiya | 6 | 6/7 | Time 7 | Sobrepujar | exclusivo: `jutsu_gamabunta`; deckable |
| `orochimaru` | Orochimaru | 6 | 5/6 | Som & Sannin | Visão Aguçada | exclusivo: `jutsu_edo_tensei`; deckable |
| `tsunade` | Tsunade | 6 | 5/8 | Hokages | Regeneração | exclusivo: `jutsu_sozo_saisei`; deckable |
| `minato_namikaze` | Minato Namikaze | 7 | 6/6 | Hokages | Ataque Rápido, Elusivo | exclusivo: `jutsu_hiraishin`; deckable |

### 2.2 Unidades (`UNIT_CARDS`)

| id | nome | custo | ATK/HP | facção | keywords | papel / notas |
|----|------|-------|--------|--------|----------|---------------|
| `unit_estudante_academia` | Estudante da Academia | 1 | 1/2 | Time 7 | — | Genin; deckable |
| `unit_kin_tsuchi` | Kin Tsuchi | 1 | 1/2 | Som & Sannin | Elusivo, Formação | Genin; deckable |
| `unit_tazuna` | Tazuna | 1 | 1/2 | Neutro | Desafiador | Genin; deckable |
| `unit_konohamaru` | Konohamaru Sarutobi | 1 | 1/2 | Time 7 | Desafiador | Genin; deckable |
| `unit_bikochu` | Besouro Bikōchū | 1 | 1/1 | Time 8 | — | Invocação; deckable |
| `unit_anbu_konoha` | Anbu de Konoha | 2 | 2/2 | Hokages | Elusivo | Anbu; deckable |
| `unit_medico_campo` | Ninja Médico de Campo | 2 | 1/3 | Time 7 | — | Chunin; deckable |
| `unit_examinador_chunin` | Examinador Chūnin | 2 | 2/3 | Time 8 | Visão Aguçada | Chunin; deckable |
| `unit_oinin_nevoa` | Oinin Caçador da Névoa | 2 | 2/3 | Névoa | Assustador | Anbu; deckable |
| `unit_gozu_meizu` | Gōzu & Meizu | 2 | 2/2 | Névoa | — | Chunin; deckable |
| `unit_dosu_kinuta` | Dosu Kinuta | 2 | 2/2 | Som & Sannin | Formação | Genin; deckable |
| `unit_kotetsu_izumo` | Kotetsu & Izumo | 2 | 2/3 | Hokages | Desafiador | Chunin; deckable |
| `unit_ebisu` | Ebisu | 2 | 1/3 | Time 7 | — | Sensei; deckable |
| `unit_batedor_som` | Ninjas do Som | 2 | 2/1 | Som & Sannin | Imprudente | Genin; deckable |
| `unit_genin_chuva` | Genin da Chuva (Time Oboro) | 2 | 1/2 | Neutro | Formação | Genin; deckable |
| `unit_mizuki` | Mizuki | 2 | 2/2 | Time 7 | — | Chunin; deckable |
| `unit_yoroi_misumi` | Yoroi Akadō & Misumi Tsurugi | 2 | 2/2 | Hokages | Roubo de Vida | Genin; deckable |
| `unit_genma_shiranui` | Genma Shiranui | 2 | 2/2 | Hokages | Veneno | Jounin; deckable |
| `unit_iruka_umino` | Iruka Umino | 2 | 2/3 | Time 7 | Auxiliar | Chunin; deckable |
| `unit_hayate_gekko` | Hayate Gekkō | 2 | 3/1 | Hokages | Ataque Rápido, Elusivo | Jounin; deckable |
| `unit_shizune` | Shizune | 2 | 1/3 | Hokages | — | Jounin; deckable |
| `unit_idate_morino` | Idate Morino | 2 | 2/2 | Neutro | Ataque Rápido | Genin; deckable |
| `unit_sasame_fuma` | Sasame Fūma | 2 | 2/2 | Som & Sannin | — | Genin; deckable |
| `unit_policia_uchiha` | Policial Militar Uchiha | 3 | 3/3 | Time 7 | — | Jounin; deckable |
| `unit_raiz_ne` | Agente da Raiz (Ne) | 3 | 3/2 | Hokages | Assustador | Anbu; deckable |
| `unit_escaramucador_nevoa` | Espadachim da Névoa | 3 | 3/2 | Névoa | Ataque Rápido | Chunin; deckable |
| `unit_brigada_marionetes` | Brigada de Marionetes | 3 | 2/3 | Areia | — | Chunin; deckable |
| `unit_zaku_abumi` | Zaku Abumi | 3 | 3/2 | Som & Sannin | Sobrepujar, Formação | Genin; deckable |
| `unit_gato_bandidos` | Gatō e seus Bandidos | 3 | 2/3 | Neutro | — | Genin; deckable |
| `unit_batedor_areia` | Ninjas da Areia | 3 | 2/2 | Areia | — | Genin; deckable |
| `unit_ibiki_morino` | Ibiki Morino | 3 | 3/3 | Hokages | Assustador | Jounin; deckable |
| `unit_esquadrao_anbu` | Esquadrão Anbu de Konoha | 3 | 2/2 | Hokages | Elusivo | Anbu; deckable |
| `unit_anko_mitarashi` | Anko Mitarashi | 3 | 3/2 | Hokages | Veneno | Jounin; deckable |
| `unit_arashi_fuma` | Arashi (Fūma) | 3 | 3/3 | Som & Sannin | — | Chunin; deckable |
| `unit_cla_fuma` | Clã Fūma | 3 | 2/3 | Som & Sannin | — | Chunin; deckable |
| `unit_irmaos_estupidos` | Irmãos Estúpidos Lendários | 3 | 2/4 | Neutro | Desafiador | Genin; deckable |
| `unit_ranmaru` | Ranmaru | 3 | 3/3 | Névoa | — | Genin; deckable |
| `unit_familia_kurosuki` | Família Kurosuki | 3 | 2/3 | Névoa | — | Chunin; deckable |
| `unit_capitao_jonin` | Capitão Jōnin da Folha | 4 | 4/4 | Time 9 | Robusto | Jounin; deckable |
| `unit_guerreiro_kaguya` | Guerreiro do Clã Kaguya | 4 | 3/5 | Som & Sannin | Formidável | Jounin; deckable |
| `unit_jonin_elite` | Jōnin de Elite de Konoha | 4 | 4/3 | Hokages | Auxiliar | Jounin; deckable |
| `unit_aoi_rokusho` | Aoi Rokushō | 4 | 4/4 | Neutro | Assustador | Jounin; deckable |
| `unit_esquadrao_anbu_elite` | Esquadrão Anbu de Elite | 5 | 5/4 | Hokages | Elusivo | Anbu; deckable |
| `unit_raiga_kurosuki` | Raiga Kurosuki | 5 | 5/4 | Névoa | Ataque Rápido, Impacto | Jounin; deckable |

### 2.3 Jutsus deckable (`JUTSU_CARDS` sem signature)

| id | nome | custo | velocidade | família | facção | categoria |
|----|------|-------|------------|---------|--------|-----------|
| `jutsu_substituicao` | Kawarimi no Jutsu | 2 | Oculta | Ninjutsu | Time 7 | Fortalecer |
| `jutsu_lamina_vento` | Fūton: Lâmina de Chakra | 3 | Rapida | — | Time 10 | Fortalecer |
| `jutsu_rasenshuriken` | Fūton: Rasenshuriken | 6 | Lenta | — | Time 7 | Ataque Múltiplo |
| `jutsu_bola_de_fogo` | Katon: Gōkakyū no Jutsu | 4 | Lenta | — | Time 7 | Ataque em Área |
| `jutsu_goka_mekkyaku` | Katon: Gōka Mekkyaku | 5 | Lenta | — | Time 7 | Ataque em Área |
| `jutsu_manda` | Kuchiyose: Manda | 6 | Lenta | — | Som & Sannin | Invocação |
| `jutsu_128_palmas` | Hakke Hyaku Nijūhachi Shō | 4 | Lenta | — | Time 9 | Ataque Individual |
| `jutsu_dragao_agua` | Suiton: Suiryūdan no Jutsu | 4 | Lenta | — | Hokages | Ataque Individual |
| `jutsu_daibakufu` | Suiton: Daibakufu no Jutsu | 5 | Lenta | — | Névoa | Ataque em Área |
| `jutsu_daitoppa` | Fūton: Daitoppa | 3 | Rapida | — | Areia | Ataque Múltiplo |
| `jutsu_suna_shuriken` | Suna Shuriken | 2 | Imediata | — | Areia | Ataque Direto |
| `jutsu_katsuyu_cura` | Katsuyu: Mōryōka | 4 | Lenta | — | Hokages | Cura |
| `jutsu_pilula_soldado` | Pílulas de Três Cores | 2 | Imediata | — | Time 10 | Fortalecer |
| `jutsu_rashomon` | Kuchiyose: Rashōmon | 3 | Imediata | — | Som & Sannin | Fortalecer |
| `jutsu_doryuheki` | Doton: Doryūheki | 2 | Rapida | — | Hokages | Fortalecer |
| `jutsu_clones_sombras` | Kage Bunshin no Jutsu | 3 | Focada | — | Time 7 | Invocação |
| `jutsu_vontade_fogo` | Vontade do Fogo | 3 | Focada | — | Hokages | Fortalecer |
| `jutsu_jukai_kotan` | Mokuton: Jukai Kōtan | 5 | Lenta | — | Hokages | Enfraquecer |
| `jutsu_byakugan_rastreio` | Byakugan: Rastreamento | 2 | Focada | — | Time 9 | Detectar/Revelar |
| `jutsu_kagura_shingan` | Kagura Shingan | 1 | Rapida | — | Time 8 | Detectar/Revelar |
| `jutsu_gatsuga` | Gatsūga | 3 | Rapida | — | Time 8 | Ataque Múltiplo |
| `jutsu_kikaichu` | Kikaichū no Jutsu | 3 | Lenta | — | Time 8 | Enfraquecer |
| `jutsu_omote_renge` | Omote Renge | 2 | Imediata | — | Time 9 | Fortalecer |
| `jutsu_seneijashu` | Seneijashu | 2 | Rapida | — | Time 8 | Ataque Individual |
| `jutsu_mikazuki_mai` | Mikazuki no Mai | 2 | Imediata | — | Time 9 | Fortalecer |
| `jutsu_fuma_shuriken` | Fūma Shuriken | 2 | Rapida | Taijutsu | Time 9 | Ataque Individual |
| `jutsu_kai` | Kai | 1 | Rapida | Genjutsu | Neutro | Fortalecer |

### 2.4 Jutsus exclusivos (signature)

Inclui signatures dentro de `JUTSU_CARDS` e a lista `NINJA_EXCLUSIVE_JUTSUS`. **Não entram no baralho.**

| id | nome | custo | velocidade | dono | origem |
|----|------|-------|------------|------|--------|
| `jutsu_chidori` | Chidori | 3 | Rapida | Sasuke Uchiha | `JUTSU_CARDS` |
| `jutsu_raikiri` | Raikiri | 4 | Rapida | Kakashi Hatake | `JUTSU_CARDS` |
| `jutsu_hiraishin` | Hiraishin no Jutsu | 2 | Imediata | Minato Namikaze | `JUTSU_CARDS` |
| `jutsu_rajada_shuriken` | Sōshōryū | 2 | Rapida | Tenten | `JUTSU_CARDS` |
| `jutsu_rasengan` | Rasengan | 4 | Lenta | Naruto Uzumaki | `JUTSU_CARDS` |
| `jutsu_edo_tensei` | Kuchiyose: Edo Tensei | 5 | Lenta | Orochimaru | `JUTSU_CARDS` |
| `jutsu_rotacao_trigramas` | Hakkeshou Kaiten | 3 | Rapida | Neji Hyūga | `JUTSU_CARDS` |
| `jutsu_palma_mistica` | Shōsen Jutsu | 2 | Imediata | Sakura Haruno | `JUTSU_CARDS` |
| `jutsu_sozo_saisei` | Sōzō Saisei | 4 | Imediata | Tsunade | `JUTSU_CARDS` |
| `jutsu_cho_baika` | Chō Baika no Jutsu | 3 | Imediata | Chōji Akimichi | `JUTSU_CARDS` |
| `jutsu_gamabunta` | Kuchiyose: Gamabunta | 6 | Lenta | Jiraiya | `JUTSU_CARDS` |
| `jutsu_sabaku_kyu` | Sabaku Kyū | 3 | Lenta | Gaara | `JUTSU_CARDS` |
| `jutsu_shintenshin` | Shintenshin no Jutsu | 3 | Lenta | Ino Yamanaka | `JUTSU_CARDS` |
| `jutsu_tsukuyomi` | Tsukuyomi | 5 | Lenta | Itachi Uchiha | `JUTSU_CARDS` |
| `jutsu_makyo_hyosho` | Makyō Hyōshō | 3 | Rapida | Haku | `JUTSU_CARDS` |
| `jutsu_kirigakure` | Kirigakure no Jutsu | 2 | Oculta | Zabuza Momochi | `JUTSU_CARDS` |
| `jutsu_magen_kurenai` | Magen: Kurenai | 3 | Rapida | Kurenai Yūhi | `JUTSU_CARDS` |
| `jutsu_hachimon` | Hachimon Tonkō | 4 | Imediata | Rock Lee | `JUTSU_CARDS` |
| `jutsu_kagemane_tecnica` | Kage Kubishibari | 3 | Rapida | Shikamaru Nara | `JUTSU_CARDS` |
| `jutsu_tsubaki_mai` | Tsubaki no Mai | 3 | Rapida | Kimimaro | `JUTSU_CARDS` |
| `jutsu_kumo_sokai` | Kumo Sōkai | 2 | Imediata | Kidōmaru | `JUTSU_CARDS` |
| `jutsu_magen_onsa` | Magen: Onsa | 4 | Lenta | Tayuya | `JUTSU_CARDS` |
| `jutsu_kugutsu_marionete` | Kugutsu no Jutsu | 3 | Focada | Kankurō | `JUTSU_CARDS` |
| `jutsu_doton_domu` | Doton: Domu | 2 | Rapida | Jirōbō | `NINJA_EXCLUSIVE_JUTSUS` |
| `jutsu_chakra_no_mesu` | Chakra no Mesu | 2 | Rapida | Kabuto Yakushi | `NINJA_EXCLUSIVE_JUTSUS` |
| `jutsu_kamaitachi` | Fūton: Kamaitachi no Jutsu | 3 | Rapida | Temari | `NINJA_EXCLUSIVE_JUTSUS` |
| `jutsu_shiki_fujin` | Shiki Fūjin | 5 | Imediata | Hiruzen Sarutobi | `NINJA_EXCLUSIVE_JUTSUS` |
| `jutsu_dainamikku_entori` | Konoha Dainamikku Entorī | 3 | Rapida | Might Guy | `NINJA_EXCLUSIVE_JUTSUS` |

### 2.5 Ocultos (`OCULTO_JUTSU_CARDS`)

| id | nome | custo | facção | gatilho | notas |
|----|------|-------|--------|---------|-------|
| `trap_selo_explosivo` | Kibaku Fuda | 2 | Time 10 | ao ataque inimigo | deckable |
| `trap_possessao_sombras` | Kagemane no Jutsu | 2 | Time 10 | ao ataque inimigo | deckable |
| `trap_nevoa_venenosa` | Dokugiri | 3 | Som & Sannin | ao ataque inimigo | deckable |
| `trap_selo_cinco_elementos` | Gogyō Fūin | 2 | Hokages | ao jutsu inimigo | deckable |
| `trap_arvore_genjutsu` | Magen: Jubaku Satsu | 2 | Time 8 | ao summon inimigo | deckable |

### 2.6 Equipamentos

| id | nome | custo | facção | bônus | keywords | notas |
|----|------|-------|--------|-------|----------|-------|
| `equip_kubikiribocho` | Kubikiribōchō | 3 | Névoa | +3/1 | Sobrepujar, Fúria | deckable; deckable |
| `equip_leque_temari` | Kyodai Sensu | 2 | Areia | +2/1 | Ataque Rápido, Impacto | deckable; deckable |
| `equip_kunai` | Kunai Tática | 1 | Time 7 | +1/1 | Visão Aguçada | deckable; deckable |
| `equip_osso_kaguya` | Osso (Shikotsumyaku) | 1 | Som & Sannin | +2/0 | — | token / criado em partida; não deckable |
| `equip_laminas_chakra` | Lâminas de Chakra | 1 | Time 10 | +1/0 | Ataque Rápido | token / criado em partida; não deckable |

### 2.7 Tokens (`TOKEN_CARDS`)

Não entram em `ALL_CARDS`; resolvidos por `getCardById`. **Nunca deckable.**

| id | nome | custo | ATK/HP | facção | keywords |
|----|------|-------|--------|--------|----------|
| `token_meizu` | Meizu | 1 | 1/1 | Névoa | Parceiro |
| `token_izumo` | Izumo | 1 | 1/2 | Hokages | Desafiador |
| `token_bandido` | Bandido | 1 | 1/1 | Neutro | — |
| `token_ninja_areia` | Ninja de Areia | 1 | 1/1 | Areia | — |
| `token_ninja_som` | Ninja do Som | 1 | 2/1 | Som & Sannin | Imprudente |
| `token_genin_chuva` | Genin da Chuva | 1 | 1/1 | Neutro | Formação |
| `token_misumi` | Misumi Tsurugi | 1 | 1/2 | Hokages | Parceiro |
| `token_anbu` | Anbu | 1 | 2/1 | Hokages | Elusivo |
| `token_guerreiro_fuma` | Guerreiro Fūma | 1 | 1/1 | Som & Sannin | Desafiador |
| `token_marionete` | Marionete | 1 | 1/1 | Som & Sannin | — |
| `token_irmao_estupido` | Irmão Estúpido | 1 | 2/2 | Neutro | — |
| `token_capanga_kurosuki` | Capanga Kurosuki | 1 | 1/1 | Névoa | — |
| `token_tonton` | Ton-Ton | 1 | 1/2 | Hokages | Regeneração, Parceiro |
| `token_kage_bunshin` | Clone das Sombras | 1 | 2/2 | Time 7 | Efêmero |
| `token_edo_shinobi` | Shinobi Reanimado | 4 | 4/3 | Som & Sannin | Sobrepujar |
| `token_gamabunta` | Gamabunta | 6 | 5/5 | Time 7 | Sobrepujar, Impacto |
| `token_katsuyu` | Katsuyu | 2 | 1/4 | Hokages | Regeneração, Roubo de Vida |
| `token_karasu` | Marionete Karasu | 2 | 3/2 | Areia | Ataque Rápido, Efêmero |
| `token_manda` | Manda | 6 | 6/5 | Som & Sannin | Assustador, Sobrepujar |
| `token_akamaru` | Akamaru | 1 | 1/2 | Time 8 | Ataque Rápido, Parceiro |
| `token_ukon` | Ukon | 1 | 2/2 | Som & Sannin | Parceiro |
| `token_doki` | Doki | 1 | 1/1 | Som & Sannin | — |
| `token_enxame` | Enxame de Kikaichū | 1 | 1/1 | Time 8 | Elusivo |
| `token_espelho_gelo` | Espelho de Gelo | 1 | 0/3 | Névoa | Desafiador, Efêmero |

---

## 3. Presets de baralho (`DECK_PRESETS`)

| id | nome | cartas | IDs únicos | composição (kind) |
|----|------|--------|------------|-------------------|
| `deck_time7_sannin` | Time 7, Sannin & Konoha | **24** | 15 | ninja: 6, unidade: 6, equipamento: 2, jutsu: 10 |
| `deck_areia_nevoa` | Tempestade da Areia & Névoa | **24** | 14 | ninja: 6, unidade: 8, equipamento: 4, jutsu: 6 |
| `deck_som_quarteto` | Sombras de Otogakure | **24** | 13 | ninja: 6, unidade: 7, jutsu: 11 |

Detalhe:

- **Time 7, Sannin & Konoha** (`deck_time7_sannin`): Naruto, Sasuke e Jiraiya com Anbu, Médicos, Kunai e Rasenshuriken — 24 cartas.
- **Tempestade da Areia & Névoa** (`deck_areia_nevoa`): Gaara, Haku e Zabuza com Brigada de Marionetes, Oinin e Kubikiribōchō — 24 cartas.
- **Sombras de Otogakure** (`deck_som_quarteto`): Orochimaru, Kimimaro e Tayuya com Guerreiros Kaguya, Manda e Edo Tensei — 24 cartas.

---

## 4. Gaps e qualidade dos dados

### Referências quebradas

- Nenhuma: todas as referências de `signatureJutsuId`, `exclusiveTokenId`, `generalJutsuId`, `DECK_PRESETS` e `UNIT_PARTNER_TOKENS` resolvem via `getCardById`.

### Ninjas sem Jutsu Exclusivo (`signatureJutsuId` vazio)

Usam `generalJutsuId` (jutsu geral, deckable) em vez de signature:

| id | nome | generalJutsuId |
|----|------|----------------|
| `hinata_hyuga` | Hinata Hyūga | `jutsu_byakugan_rastreio` |
| `kiba_inuzuka` | Kiba & Akamaru | `jutsu_gatsuga` |
| `shino_aburame` | Shino Aburame | `jutsu_kikaichu` |
| `asuma_sarutobi` | Asuma Sarutobi | `jutsu_daitoppa` |
| `sakon_ukon` | Sakon & Ukon | `jutsu_rashomon` |
| `kisame_hoshigaki` | Kisame Hoshigaki | `jutsu_dragao_agua` |

### Keywords pendentes (`UNIT_PENDING_KEYWORDS`)

Flags declaradas à parte (Formação / Parceiro / Veneno) — podem ainda não estar materializadas no array `keywords` da carta:

```json
{
  "unit_kin_tsuchi": {
    "formacao": true
  },
  "unit_dosu_kinuta": {
    "formacao": true
  },
  "unit_zaku_abumi": {
    "formacao": true
  },
  "unit_genin_chuva": {
    "formacao": true
  },
  "token_genin_chuva": {
    "formacao": true
  },
  "unit_genma_shiranui": {
    "venenoX": 1
  },
  "unit_anko_mitarashi": {
    "venenoX": 1
  },
  "token_meizu": {
    "parceiro": true
  },
  "token_misumi": {
    "parceiro": true
  },
  "token_tonton": {
    "parceiro": true
  }
}
```

### Parceiros de unidade (`UNIT_PARTNER_TOKENS`)

```json
{
  "unit_gozu_meizu": "token_meizu",
  "unit_yoroi_misumi": "token_misumi",
  "unit_shizune": "token_tonton"
}
```

### Observações estruturais

- `TOKEN_CARDS` (24) **não** entram em `ALL_CARDS` (143); catálogo completo = união dos dois.
- `TRAP_CARDS` é alias deprecado de `OCULTO_JUTSU_CARDS` (Grupo 8).
- Sem IDs duplicados em `ALL_CARDS` (dups: 0).
- Ocultos (`OCULTO_JUTSU_CARDS`) têm `kind: 'jutsu'` e `speed: 'Oculta'` (IDs ainda `trap_*`); por isso a composição dos presets os conta como `jutsu`.
- Subtitle do preset `deck_som_quarteto` menciona "Manda e Edo Tensei", mas a lista `cardIds` **não** inclui `token_manda` / `jutsu_edo_tensei` (só flavor do subtítulo).
- Várias unidades/tokens têm Formação/Parceiro/Veneno só em `UNIT_PENDING_KEYWORDS`, não necessariamente no array `keywords` da def.

---

## Fontes

| Arquivo | Exports relevantes |
|---------|-------------------|
| `src/data/ninjas.ts` | `NINJA_CARDS` |
| `src/data/units.ts` | `UNIT_CARDS_G7`, `UNIT_TOKENS_G7`, `UNIT_PENDING_KEYWORDS`, `UNIT_PARTNER_TOKENS` |
| `src/data/ninjaExtras.ts` | `NINJA_EXCLUSIVE_JUTSUS`, `NINJA_TOKEN_CARDS`, `NINJA_EQUIPMENT_TOKENS`, `NINJA_CREATED_ONLY_IDS` |
| `src/data/cards.ts` | `JUTSU_CARDS`, `OCULTO_JUTSU_CARDS`, `EQUIPMENT_CARDS`, `TOKEN_CARDS`, `ALL_CARDS`, `DECK_PRESETS`, `SIGNATURE_JUTSU_IDS`, `isDeckableCard` |
| `src/types/game.ts` | `NinjaCardDef`, `UnitCardDef`, `JutsuCardDef`, `TrapCardDef`, `EquipmentCardDef`, `Keyword`, `TeamFaction` |
