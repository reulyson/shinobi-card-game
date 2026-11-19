import { OFFICIAL_ART } from './officialArt';
import { ArenaDefinition, ArenaId } from '../types/game';

/**
 * Efeitos de regra das arenas. DESLIGADO por decisão do usuário (Parte 4c): a arena é só cenário sorteado.
 * Para reativar tudo (regras na engine/IA, troca de arena por Hashirama/Minato/Suiryūdan e textos), mude para true.
 */
export const ARENA_EFFECTS_ENABLED = false;

/** Arena usada quando os efeitos estão desligados: id fixo (sem sorteio); o fundo vem de OFFICIAL_ART.battleBackground. */
export const DEFAULT_ARENA_ID: ArenaId = 'arena_chunin';

/** Arena cujas regras valem agora (null quando os efeitos de arena estão desligados). */
export function activeArenaRule(arenaId: ArenaId): ArenaId | null {
  return ARENA_EFFECTS_ENABLED ? arenaId : null;
}


export const ARENAS: Record<ArenaId, ArenaDefinition> = {
  vale_do_fim: {
    id: 'vale_do_fim',
    name: 'Vale do Fim',
    subtitle: 'Estátuas dos Fundadores',
    imageUrl: OFFICIAL_ART.valleyOfTheEnd,
    accentColor: '#F59E0B',
    ruleSummary: 'Duelo de Rivais: Atacantes isolados (1–2 unidades) ganham +2/+0 em combate; promoções concedem +1/+1 extra.',
    detailedRule:
      'Quando um jogador ataca com no máximo 2 personagens, cada atacante recebe +2 de Poder durante o combate. Além disso, sempre que um Ninja é promovido nesta arena, ele ganha +1/+1 permanente adicional.',
  },
  floresta_da_morte: {
    id: 'floresta_da_morte',
    name: 'Floresta da Morte',
    subtitle: 'Zona de Treinamento 44',
    imageUrl: OFFICIAL_ART.forestOfDeath,
    accentColor: '#10B981',
    ruleSummary: 'Terreno Traiçoeiro: Armadilhas custam 1 de Chakra a menos. No início da rodada, a unidade mais ferida sofre 1 de dano.',
    detailedRule:
      'Cartas de Armadilha têm seu custo reduzido em 1 (mínimo 1). Ao iniciar cada rodada, o personagem com menor Vida atual de cada lado (se já estiver ferido e sem Cura Natural) sofre 1 de dano.',
  },
  arena_chunin: {
    id: 'arena_chunin',
    name: 'Arena dos Exames Chunin',
    subtitle: 'Estádio Central de Konoha',
    imageUrl: OFFICIAL_ART.chuninStadium,
    accentColor: '#EF4444',
    ruleSummary: 'Combate Honrado: Jutsus Instantâneos dão +1/+1 extra ao alvo. Unidades com Golpe Veloz recebem +1 de Vida.',
    detailedRule:
      'Sempre que você conjurar um Jutsu Instantâneo em um aliado, ele recebe +1/+1 adicional neste turno. Personagens invocados com Golpe Veloz entram com +1 de Vida máxima.',
  },
  telhados_konoha: {
    id: 'telhados_konoha',
    name: 'Telhados de Konoha',
    subtitle: 'Sob o Olhar dos Hokages',
    imageUrl: OFFICIAL_ART.konohaRooftops,
    accentColor: '#0EA5E9',
    ruleSummary: 'Vontade do Fogo: +1 de Reserva de Jutsu no início da rodada. Hokages e Senseis custam 1 a menos.',
    detailedRule:
      'No início de cada rodada, ambos os jogadores ganham +1 na Reserva de Jutsu (até o máximo de 3). Cartas de Hokage e Sensei custam 1 de Chakra a menos para invocar.',
  },
};

export const ARENA_LIST: ArenaDefinition[] = Object.values(ARENAS);
