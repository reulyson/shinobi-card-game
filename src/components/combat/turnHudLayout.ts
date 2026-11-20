/**
 * Geometria do crop gen_timer (210×500 @ CXX=1525, CY=416 → origem do crop 1390,190).
 * Centro da moeda no crop: (135, 226). CR=52 → diâmetro 104.
 */
export const TURN_HUD = {
  width: 210,
  height: 500,
  cx: 135,
  cy: 226,
  coinRadius: 52,
  pipRadius: 68,
  reserveRadius: 88,
  /** Etiqueta rival — gen_b4prev B: cy-152 → y=74 */
  labelRivalTop: 226 - 152,
  /** Etiqueta jogador — gen_b4prev B: cy+110 → y=336 */
  labelPlayerTop: 226 + 110,
  /** Botão — gen_b4prev B: at(tab(...), cx-82, cy+142) */
  buttonTop: 226 + 142,
  buttonLeft: 135 - 82,
  labelLeft: 135 - 72,
  kanjiSize: 50,
  /** Diâmetro de referência da moeda (CR=52). */
  coinSize: 104,
} as const;

export const TURN_HUD_COIN_SIZE = TURN_HUD.coinSize;
