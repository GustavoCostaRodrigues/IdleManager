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

export function normalizePokeball(rawName: string | undefined | null): PokeballType {
  if (!rawName) return 'pokeball';
  const clean = String(rawName).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('ultra')) return 'ultraball';
  if (clean.includes('super')) return 'superball';
  if (clean.includes('great')) return 'greatball';
  if (clean.includes('master')) return 'masterball';
  if (clean.includes('golden')) return 'golden_idleball';
  if (clean.includes('rubber')) return 'rubber_ball';
  if (clean.includes('earth')) return 'earth_ball';
  if (clean.includes('idle')) return 'idleball';
  return 'pokeball';
}

export function qualityFromNumberOrString(q: any): PokemonQuality {
  if (q === undefined || q === null) return 'comum';
  if (typeof q === 'string') {
    const lower = q.toLowerCase();
    if (lower.includes('divin')) return 'divina';
    if (lower.includes('anci')) return 'ancia';
    if (lower.includes('mitic') || lower.includes('mític')) return 'mitica';
    if (lower.includes('lendar') || lower.includes('lendár')) return 'lendaria';
    if (lower.includes('epic') || lower.includes('épic')) return 'epica';
    if (lower.includes('rar')) return 'rara';
    if (lower.includes('incom')) return 'incomum';
    if (lower.includes('comum')) return 'comum';
    if (lower.includes('frac')) return 'fraca';
    const num = parseFloat(q.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) q = num;
  }
  if (typeof q === 'number') {
    if (q >= 4.0) return 'divina';
    if (q >= 3.0) return 'ancia';
    if (q >= 2.0) return 'mitica';
    if (q >= 1.7) return 'lendaria';
    if (q >= 1.4) return 'epica';
    if (q >= 1.2) return 'rara';
    if (q >= 1.05) return 'incomum';
    if (q >= 0.95) return 'comum';
    return 'fraca';
  }
  return 'comum';
}

