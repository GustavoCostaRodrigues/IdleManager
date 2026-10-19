export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface DroppedItem {
  id: string;
  name: string;
  count: number;
  unitValueGold: number;
  totalValueGold: number;
  rarity: ItemRarity;
  iconSvg?: string;
}

export interface AccountHuntMetrics {
  accountId: string;
  accountName: string;
  activeStatus: 'hunting' | 'idle' | 'stopped';
  potionsUsed: number;
  potionsCostGold: number;
  pokemonCatches: number;
  catchesAttempted: number;
  droppedItems: DroppedItem[];
  totalLootValueGold: number;
  netProfitGold: number;
  sessionStartTime: number;
  lastActivityTime: number;
}

export interface HuntAggregatedSummary {
  totalPotionsUsed: number;
  totalPotionsCostGold: number;
  totalLootValueGold: number;
  totalCatches: number;
  totalCatchesAttempted: number;
  totalNetProfitGold: number;
  profitPerHourGold: number;
  sessionDurationFormatted: string;
}

export type HuntEventType =
  | 'POTION_USED'
  | 'ITEM_DROPPED'
  | 'POKEMON_CAUGHT'
  | 'CATCH_FAILED'
  | 'HUNT_RESET';

export interface HuntEvent {
  type: HuntEventType;
  accountId: string;
  timestamp: number;
  payload: {
    potionName?: string;
    potionCost?: number;
    itemName?: string;
    itemCount?: number;
    itemValue?: number;
    itemRarity?: ItemRarity;
    pokemonName?: string;
  };
}
