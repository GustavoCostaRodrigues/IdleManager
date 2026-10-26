import type { PokeballType, PokemonQuality } from './captureTypes.js';
import type { ItemRarity } from './huntTypes.js';

export interface PokemonCaptureTelemetry {
  type: 'CAPTURE';
  pokemonName: string;
  pokemonDexNumber?: number;
  level?: number;
  isShiny?: boolean;
  pokeball?: PokeballType;
  quality?: PokemonQuality;
  ivPercentage?: number;
  ivPoints?: number;
  ivMaxPoints?: number;
  timestamp?: number;
}

export interface BatchCapturesTelemetry {
  type: 'BATCH_CAPTURES';
  captures: Array<{
    id?: string;
    pokemonName: string;
    pokemonDexNumber?: number;
    level?: number;
    quality?: PokemonQuality;
    qualityMultiplier?: number;
    pokeball?: PokeballType;
    ivPoints?: number;
    ivMaxPoints?: number;
    ivPercentage?: number;
    isShiny?: boolean;
    timestamp?: number;
  }>;
  timestamp?: number;
}

export interface TokenDetectedTelemetry {
  type: 'TOKEN_DETECTED';
  token: string;
  timestamp?: number;
}

export interface PotionUsedTelemetry {
  type: 'POTION';
  potionName?: string;
  potionCost?: number;
  timestamp?: number;
}

export interface ItemDropTelemetry {
  type: 'ITEM_DROP';
  itemName: string;
  itemCount?: number;
  itemValue?: number;
  rarity?: ItemRarity;
  timestamp?: number;
}

export interface HuntSessionSyncTelemetry {
  type: 'HUNT_SYNC';
  defeats?: number;
  xpGained?: number;
  catchesCount: number;
  catchesValueGold?: number;
  lootTotalGold: number;
  lootItemsCount?: number;
  supplyCostGold: number;
  supplyBallsCount?: number;
  supplyPotionsCount?: number;
  netBalanceGold: number;
  profitPerHourGold?: number;
  drops: Array<{
    name: string;
    count: number;
    valueGold: number;
    rarity?: ItemRarity;
  }>;
  timestamp?: number;
}

export interface HuntStatusTelemetry {
  type: 'STATUS';
  status: 'hunting' | 'idle';
  timestamp?: number;
}

export type BallInventoryType =
  | 'pokeball'
  | 'greatball'
  | 'superball'
  | 'ultraball'
  | 'idleball'
  | 'golden_idleball'
  | 'masterball'
  | 'rubber_ball'
  | 'earth_ball';

export type PotionInventoryType =
  | 'small'
  | 'great'
  | 'ultra'
  | 'hyper'
  | 'ultimate'
  | 'potion';

export interface SupplyStatusTelemetry {
  type: 'SUPPLY_STATUS';
  ball: {
    name: string;
    type: BallInventoryType;
    count: number;
    countFormatted: string;
    spriteUrl?: string;
    fileName?: string;
  };
  potion: {
    name: string;
    type: PotionInventoryType;
    count: number;
    countFormatted: string;
    spriteUrl?: string;
    fileName?: string;
    fromLiveInventory?: boolean;
  };
  timestamp?: number;
}

export interface MarketPresenceTelemetry {
  type: 'MARKET_PRESENCE_DETECTED';
  url?: string;
  timestamp?: number;
}

export type TelemetryPayload =
  | PokemonCaptureTelemetry
  | BatchCapturesTelemetry
  | TokenDetectedTelemetry
  | PotionUsedTelemetry
  | ItemDropTelemetry
  | HuntSessionSyncTelemetry
  | SupplyStatusTelemetry
  | HuntStatusTelemetry
  | MarketPresenceTelemetry;

export interface TelemetryMessage {
  channel: 'poke-telemetry';
  accountId: string;
  payload: TelemetryPayload;
}
