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
  pokeball: PokeballType;
  iv: IVStats;
  level: number;
  isShiny: boolean;
}

export interface CaptureFilterState {
  quality: 'all' | PokemonQuality;
  accountId: 'all' | string;
  minIv: number; // 0, 50, 75, 90, 100
  searchQuery: string;
}
