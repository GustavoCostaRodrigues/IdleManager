import { DEFAULT_ACCOUNTS } from '../../shared/constants.js';
import type {
  AccountHuntMetrics,
  DroppedItem,
  HuntAggregatedSummary,
  HuntEvent,
  ItemRarity,
} from '../../shared/huntTypes.js';

type HuntListener = (
  accounts: Map<string, AccountHuntMetrics>,
  summary: HuntAggregatedSummary,
) => void;

export class HuntStore {
  private static instance: HuntStore | null = null;
  private accounts = new Map<string, AccountHuntMetrics>();
  private listeners = new Set<HuntListener>();
  private sessionStartTime: number = Date.now();
  private isBatchUpdateScheduled = false;

  private constructor() {
    this.initDefaultAccounts();
  }

  public static getInstance(): HuntStore {
    if (!HuntStore.instance) {
      HuntStore.instance = new HuntStore();
    }
    return HuntStore.instance;
  }

  private initDefaultAccounts(): void {
    this.accounts.clear();
    this.sessionStartTime = Date.now();

    for (const acc of DEFAULT_ACCOUNTS) {
      this.accounts.set(acc.id, {
        accountId: acc.id,
        accountName: acc.name,
        activeStatus: 'idle',
        potionsUsed: 0,
        potionsCostGold: 0,
        pokemonCatches: 0,
        catchesAttempted: 0,
        droppedItems: [],
        totalLootValueGold: 0,
        netProfitGold: 0,
        sessionStartTime: Date.now(),
        lastActivityTime: Date.now(),
      });
    }
  }

  public subscribe(listener: HuntListener): () => void {
    this.listeners.add(listener);
    listener(new Map(this.accounts), this.getAggregatedSummary());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    if (this.isBatchUpdateScheduled) return;
    this.isBatchUpdateScheduled = true;

    requestAnimationFrame(() => {
      this.isBatchUpdateScheduled = false;
      const snapshot = new Map(this.accounts);
      const summary = this.getAggregatedSummary();
      for (const listener of this.listeners) {
        try {
          listener(snapshot, summary);
        } catch (err) {
          console.error('[HuntStore] Erro no listener:', err);
        }
      }
    });
  }

  public setAccountStatus(accountId: string, status: 'hunting' | 'idle' | 'stopped'): void {
    const acc = this.accounts.get(accountId);
    if (!acc) return;
    acc.activeStatus = status;
    acc.lastActivityTime = Date.now();
    this.notify();
  }

  public recordPotionUsed(accountId: string, cost = 300): void {
    const acc = this.accounts.get(accountId);
    if (!acc) return;

    acc.potionsUsed += 1;
    acc.potionsCostGold += cost;
    acc.netProfitGold = acc.totalLootValueGold - acc.potionsCostGold;
    acc.lastActivityTime = Date.now();
    acc.activeStatus = 'hunting';

    this.notify();
  }

  public recordItemDrop(
    accountId: string,
    itemName: string,
    unitValueGold: number,
    count = 1,
    rarity: ItemRarity = 'common',
  ): void {
    const acc = this.accounts.get(accountId);
    if (!acc) return;

    const existing = acc.droppedItems.find((item) => item.name === itemName);
    if (existing) {
      existing.count += count;
      existing.totalValueGold += unitValueGold * count;
    } else {
      acc.droppedItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: itemName,
        count,
        unitValueGold,
        totalValueGold: unitValueGold * count,
        rarity,
      });
    }

    acc.totalLootValueGold += unitValueGold * count;
    acc.netProfitGold = acc.totalLootValueGold - acc.potionsCostGold;
    acc.lastActivityTime = Date.now();
    acc.activeStatus = 'hunting';

    this.notify();
  }

  public recordPokemonCatch(accountId: string, success: boolean, pokemonName?: string): void {
    const acc = this.accounts.get(accountId);
    if (!acc) return;

    acc.catchesAttempted += 1;
    if (success) {
      acc.pokemonCatches += 1;
    }

    acc.lastActivityTime = Date.now();
    acc.activeStatus = 'hunting';
    this.notify();
  }

  /**
   * Sincroniza métricas consolidadas reais extraídas diretamente do "Hunt Analyzer" do Poke Idle World
   */
  public syncHuntSession(
    accountId: string,
    data: {
      catchesCount: number;
      supplyCostGold: number;
      potionsUsed?: number;
      lootTotalGold: number;
      netBalanceGold: number;
      drops: Array<{
        name: string;
        count: number;
        valueGold: number;
        rarity?: ItemRarity;
      }>;
    },
  ): void {
    const acc = this.accounts.get(accountId);
    if (!acc) return;

    acc.pokemonCatches = data.catchesCount;
    acc.catchesAttempted = Math.max(acc.catchesAttempted, data.catchesCount);
    acc.potionsCostGold = Math.abs(data.supplyCostGold);
    if (typeof data.potionsUsed === 'number') {
      acc.potionsUsed = data.potionsUsed;
    }
    acc.totalLootValueGold = data.lootTotalGold;
    acc.netProfitGold = data.netBalanceGold;
    acc.activeStatus = 'hunting';
    acc.lastActivityTime = Date.now();

    // Sincroniza a lista de itens dropados sem perda de itens
    for (const d of data.drops) {
      const existing = acc.droppedItems.find(
        (item) => item.name.toLowerCase() === d.name.toLowerCase(),
      );
      if (existing) {
        existing.count = d.count;
        existing.totalValueGold = d.valueGold;
        existing.unitValueGold = d.count > 0 ? Math.round(d.valueGold / d.count) : d.valueGold;
      } else {
        acc.droppedItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: d.name,
          count: d.count,
          unitValueGold: d.count > 0 ? Math.round(d.valueGold / d.count) : d.valueGold,
          totalValueGold: d.valueGold,
          rarity: d.rarity || 'common',
        });
      }
    }

    this.notify();
  }

  public processHuntEvent(event: HuntEvent): void {
    switch (event.type) {
      case 'POTION_USED':
        this.recordPotionUsed(event.accountId, event.payload.potionCost ?? 300);
        break;
      case 'ITEM_DROPPED':
        if (event.payload.itemName) {
          this.recordItemDrop(
            event.accountId,
            event.payload.itemName,
            event.payload.itemValue ?? 500,
            event.payload.itemCount ?? 1,
            event.payload.itemRarity ?? 'common',
          );
        }
        break;
      case 'POKEMON_CAUGHT':
        this.recordPokemonCatch(event.accountId, true, event.payload.pokemonName);
        break;
      case 'CATCH_FAILED':
        this.recordPokemonCatch(event.accountId, false);
        break;
      case 'HUNT_RESET':
        this.resetAccount(event.accountId);
        break;
    }
  }

  public resetAccount(accountId: string): void {
    const acc = this.accounts.get(accountId);
    if (!acc) return;

    acc.potionsUsed = 0;
    acc.potionsCostGold = 0;
    acc.pokemonCatches = 0;
    acc.catchesAttempted = 0;
    acc.droppedItems = [];
    acc.totalLootValueGold = 0;
    acc.netProfitGold = 0;
    acc.sessionStartTime = Date.now();
    acc.lastActivityTime = Date.now();

    this.notify();
  }

  public resetAll(): void {
    this.initDefaultAccounts();
    this.notify();
  }

  public getAggregatedSummary(): HuntAggregatedSummary {
    let totalPotionsUsed = 0;
    let totalPotionsCostGold = 0;
    let totalLootValueGold = 0;
    let totalCatches = 0;
    let totalCatchesAttempted = 0;

    for (const acc of this.accounts.values()) {
      totalPotionsUsed += acc.potionsUsed;
      totalPotionsCostGold += acc.potionsCostGold;
      totalLootValueGold += acc.totalLootValueGold;
      totalCatches += acc.pokemonCatches;
      totalCatchesAttempted += acc.catchesAttempted;
    }

    const totalNetProfitGold = totalLootValueGold - totalPotionsCostGold;

    // Cálculo do lucro por hora
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - this.sessionStartTime) / 1000));
    const profitPerHourGold = Math.round((totalNetProfitGold / elapsedSeconds) * 3600);

    return {
      totalPotionsUsed,
      totalPotionsCostGold,
      totalLootValueGold,
      totalCatches,
      totalCatchesAttempted,
      totalNetProfitGold,
      profitPerHourGold,
      sessionDurationFormatted: this.formatDuration(elapsedSeconds),
    };
  }

  private formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(minutes)}m ${pad(seconds)}s`;
  }
}
