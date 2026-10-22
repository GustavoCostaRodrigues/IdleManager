/**
 * Qualidades / Raridades Reais Oficiais do Poke Idle World
 */
export type PokemonQuality =
  | 'fraca'
  | 'comum'
  | 'incomum'
  | 'rara'
  | 'epica'
  | 'lendaria'
  | 'mitica'
  | 'ancia'
  | 'divina';

export type PokeballType =
  | 'pokeball'
  | 'greatball'
  | 'superball'
  | 'ultraball'
  | 'masterball'
  | 'idleball'
  | 'golden_idleball'
  | 'rubber_ball'
  | 'earth_ball';

export interface IVStats {
  percentage: number; // 0 a 100%
  total: number;
  maxPossible: number;
  tier: 'S' | 'A' | 'B' | 'C';
}

export interface CaptureRecord {
  id: string;
  gameRecordId?: string;
  timestamp: number;
  accountId: string;
  accountName: string;
  pokemonName: string;
  pokemonDexNumber?: number;
  quality: PokemonQuality;
  qualityMultiplier?: number;
  pokeball: PokeballType;
  iv: IVStats;
  level: number;
  isShiny: boolean;
}

export const QUALITY_DEFAULT_MULTIPLIERS: Record<PokemonQuality, number> = {
  divina: 4.0,
  ancia: 3.0,
  mitica: 2.0,
  lendaria: 1.8,
  epica: 1.5,
  rara: 1.3,
  incomum: 1.1,
  comum: 1.0,
  fraca: 0.8,
};

export interface CaptureFilterState {
  quality: 'all' | PokemonQuality;
  accountId: 'all' | string;
  minIv: number; // 0, 50, 75, 90, 100
  searchQuery: string;
}

export interface QualityAlertRule {
  enabled: boolean;
  minIv: number; // 0 a 192
}

export type CaptureAlertSettings = Record<PokemonQuality, QualityAlertRule>;

export const DEFAULT_CAPTURE_ALERT_SETTINGS: CaptureAlertSettings = {
  divina: { enabled: true, minIv: 0 },
  ancia: { enabled: true, minIv: 0 },
  mitica: { enabled: true, minIv: 0 },
  lendaria: { enabled: true, minIv: 120 },
  epica: { enabled: false, minIv: 140 },
  rara: { enabled: false, minIv: 150 },
  incomum: { enabled: false, minIv: 160 },
  comum: { enabled: false, minIv: 170 },
  fraca: { enabled: false, minIv: 180 },
};

