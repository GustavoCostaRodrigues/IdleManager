import { DEFAULT_ACCOUNTS } from '../../shared/constants.js';
import { getPokemonBaseDollarPrice } from '../data/pokemonBasePrices.js';
import { MarketService } from './marketService.js';
import { HuntStore } from './huntStore.js';

export interface HuntLootItem {
  id: string;
  name: string;
  kind: 'item' | 'pokemon';
  count: number;
  unitValueDollar: number;
  totalValueDollar: number;
}

export interface AccountHuntCardState {
  accountId: string;
  accountName: string;
  status: 'farming' | 'idle';
  loots: HuntLootItem[];
  totalHuntDollar: number;
  lastSyncTime: number | null;
  syncError: string | null;
  isSyncing: boolean;
  nextCheckSeconds: number;
}

type HuntClientListener = (states: Map<string, AccountHuntCardState>) => void;

interface AccountBaseline {
  established: boolean;
  inventoryMap: Map<number, { name: string; quantity: number; npcPrice: number }>;
  capturedIdSet: Set<string>;
}

export class HuntClientService {
  private static instance: HuntClientService | null = null;
  private states = new Map<string, AccountHuntCardState>();
  private baselines = new Map<string, AccountBaseline>();
  private timers: Record<string, any> = {};
  private nextCheckTimes: Record<string, number> = {};
  private listeners = new Set<HuntClientListener>();
  private countdownInterval: any = null;
  private isDestroyed = false;

  private constructor() {
    this.initAccounts();
    this.startCountdownTicker();
    this.startDesynchronizedLoops();
  }

  public static getInstance(): HuntClientService {
    if (!HuntClientService.instance) {
      HuntClientService.instance = new HuntClientService();
    }
    return HuntClientService.instance;
  }

  private initAccounts(): void {
    for (const acc of DEFAULT_ACCOUNTS) {
      this.states.set(acc.id, {
        accountId: acc.id,
        accountName: acc.name,
        status: 'idle',
        loots: [],
        totalHuntDollar: 0,
        lastSyncTime: null,
        syncError: null,
        isSyncing: false,
        nextCheckSeconds: 0,
      });

      this.baselines.set(acc.id, {
        established: false,
        inventoryMap: new Map(),
        capturedIdSet: new Set(),
      });
    }
  }

  public subscribe(listener: HuntClientListener): () => void {
    this.listeners.add(listener);
    listener(new Map(this.states));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = new Map(this.states);
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[HuntClientService] Erro no listener:', err);
      }
    }
  }

  /**
   * Inicia os loops individuais de checagem com desincronização inicial e jitter de 25s a 45s.
   * As 4 contas nunca disparam requisições simultâneas.
   */
  private startDesynchronizedLoops(): void {
    const initialOffsetsMs = [
      1500 + Math.floor(Math.random() * 2000),   // Conta 01: ~1.5s - 3.5s
      8000 + Math.floor(Math.random() * 3000),   // Conta 02: ~8s - 11s
      16000 + Math.floor(Math.random() * 3000),  // Conta 03: ~16s - 19s
      24000 + Math.floor(Math.random() * 3000),  // Conta 04: ~24s - 27s
    ];

    DEFAULT_ACCOUNTS.forEach((acc, index) => {
      const offset = initialOffsetsMs[index] || (index * 7000 + 2000);
      this.nextCheckTimes[acc.id] = Date.now() + offset;
      const state = this.states.get(acc.id);
      if (state) {
        state.nextCheckSeconds = Math.ceil(offset / 1000);
      }

      this.timers[acc.id] = setTimeout(() => {
        if (!this.isDestroyed) {
          this.checkAccount(acc.id);
        }
      }, offset);
    });

    this.notify();
  }

  /**
   * Ticker de segundo em segundo para atualizar os contadores regressivos na UI
   */
  private startCountdownTicker(): void {
    this.countdownInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [id, targetTime] of Object.entries(this.nextCheckTimes)) {
        const state = this.states.get(id);
        if (state && !state.isSyncing) {
          const remaining = Math.max(0, Math.ceil((targetTime - now) / 1000));
          if (state.nextCheckSeconds !== remaining) {
            state.nextCheckSeconds = remaining;
            changed = true;
          }
        }
      }

      if (changed) {
        this.notify();
      }
    }, 1000);
  }

  /**
   * Agenda a próxima verificação para a conta com Jitter Aleatório de 25s a 45s
   */
  private scheduleNextJitterCheck(accountId: string): void {
    if (this.timers[accountId]) {
      clearTimeout(this.timers[accountId]);
      delete this.timers[accountId];
    }

    if (this.isDestroyed) return;

    // Jitter dinâmico obrigatório: randômico entre 25 a 45 segundos
    const jitterDelayMs = 25000 + Math.floor(Math.random() * 20000);
    this.nextCheckTimes[accountId] = Date.now() + jitterDelayMs;

    const state = this.states.get(accountId);
    if (state) {
      state.nextCheckSeconds = Math.ceil(jitterDelayMs / 1000);
    }

    this.timers[accountId] = setTimeout(() => {
      if (!this.isDestroyed) {
        this.checkAccount(accountId);
      }
    }, jitterDelayMs);
  }

  /**
   * Realiza a checagem client-side (fetch) dos dados de inventário e capturas para uma conta
   */
  public async checkAccount(accountId: string): Promise<void> {
    const state = this.states.get(accountId);
    const baseline = this.baselines.get(accountId);
    if (!state || !baseline) return;

    state.isSyncing = true;
    this.notify();

    try {
      // 1. Obtém o JWT Token da conta através do MarketService
      let token = MarketService.getInstance().getAccountToken(accountId);
      if (!token) {
        state.syncError = 'Token não configurado';
        state.status = 'idle';
        state.isSyncing = false;
        this.notify();
        this.scheduleNextJitterCheck(accountId);
        return;
      }

      // 2. Consumo do endpoint de inventário do jogador (/api/game/depot)
      const depotRes = await fetch('https://poke.idleworld.online/api/game/depot', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (depotRes.status === 401) {
        state.syncError = 'Token expirado';
        state.status = 'idle';
        state.isSyncing = false;
        this.notify();
        this.scheduleNextJitterCheck(accountId);
        return;
      }

      if (!depotRes.ok) {
        state.syncError = `Erro HTTP ${depotRes.status}`;
        state.isSyncing = false;
        this.notify();
        this.scheduleNextJitterCheck(accountId);
        return;
      }

      const depotData = await depotRes.json();
      const currentInventory: Array<{
        id: number;
        name: string;
        icon?: string;
        category?: string;
        npcPrice?: number;
        quantity: number;
      }> = Array.isArray(depotData?.inventory) ? depotData.inventory : [];

      // 3. Consumo do histórico oficial de capturas (/api/game/capture-log?filter=all)
      let currentCaptures: Array<{
        id: string;
        speciesId: number;
        name: string;
        at: string;
      }> = [];

      try {
        const capRes = await fetch('https://poke.idleworld.online/api/game/capture-log?filter=all', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (capRes.ok) {
          const capData = await capRes.json();
          if (Array.isArray(capData?.rows)) {
            currentCaptures = capData.rows;
          }
        }
      } catch (_) {
        // Falha no log de capturas não impede o monitoramento de itens de inventário
      }

      // 4. Se a baseline inicial desta conta ainda não foi gravada, estabelece o ponto zero
      if (!baseline.established) {
        baseline.inventoryMap.clear();
        for (const item of currentInventory) {
          baseline.inventoryMap.set(item.id, {
            name: item.name,
            quantity: item.quantity,
            npcPrice: typeof item.npcPrice === 'number' ? item.npcPrice : 0,
          });
        }

        baseline.capturedIdSet.clear();
        for (const cap of currentCaptures) {
          baseline.capturedIdSet.add(cap.id);
        }

        baseline.established = true;
        state.syncError = null;
        state.lastSyncTime = Date.now();
        state.isSyncing = false;

        // Atualiza status se houver atividade no HuntStore
        this.syncStatusFromHuntStore(accountId, state);

        this.notify();
        this.scheduleNextJitterCheck(accountId);
        return;
      }

      // 5. Comparação e cálculo de loots acumulados (Itens e Pokémon)
      const lootMap = new Map<string, HuntLootItem>();

      // A) Itens Dropados (delta positivo em relação à baseline)
      for (const item of currentInventory) {
        const base = baseline.inventoryMap.get(item.id);
        const baseQty = base ? base.quantity : 0;
        const delta = item.quantity - baseQty;

        if (delta > 0) {
          const unitPrice =
            typeof item.npcPrice === 'number' && item.npcPrice > 0
              ? item.npcPrice
              : this.getItemFallbackPrice(item.name);
          const totalDollar = delta * unitPrice;

          lootMap.set(`item_${item.id}`, {
            id: `item_${item.id}`,
            name: item.name,
            kind: 'item',
            count: delta,
            unitValueDollar: unitPrice,
            totalValueDollar: totalDollar,
          });
        }
      }

      // B) Pokémon Capturados (novas capturas não presentes na baseline inicial)
      for (const cap of currentCaptures) {
        if (!baseline.capturedIdSet.has(cap.id)) {
          const rawName = cap.name || 'Pokémon';
          const cleanName = rawName.replace(/.*(?:Captura|selvagem|Loja|\d)+/gi, '').trim() || rawName;
          const key = `poke_${cleanName.toLowerCase()}`;

          const unitPrice = getPokemonBaseDollarPrice(cleanName);

          const existing = lootMap.get(key);
          if (existing) {
            existing.count += 1;
            existing.totalValueDollar = existing.count * unitPrice;
          } else {
            lootMap.set(key, {
              id: key,
              name: cleanName,
              kind: 'pokemon',
              count: 1,
              unitValueDollar: unitPrice,
              totalValueDollar: unitPrice,
            });
          }
        }
      }

      // C) Consolidação da lista de loots
      const lootsList = Array.from(lootMap.values());

      // Ordena por maior valor acumulado primeiro
      lootsList.sort((a, b) => b.totalValueDollar - a.totalValueDollar);

      const totalHuntDollar = lootsList.reduce((sum, item) => sum + item.totalValueDollar, 0);

      state.loots = lootsList;
      state.totalHuntDollar = totalHuntDollar;
      state.syncError = null;
      state.lastSyncTime = Date.now();
      state.isSyncing = false;

      // Status: FARMANDO se houver loots novos ou atividade registrada no HuntStore
      this.syncStatusFromHuntStore(accountId, state, lootsList.length > 0);

      this.notify();
    } catch (err) {
      state.syncError = 'Falha de requisição';
      state.isSyncing = false;
      this.notify();
    } finally {
      this.scheduleNextJitterCheck(accountId);
    }
  }

  /**
   * Sincroniza o status visual (🟢 FARMANDO / ⚪ OCIOSA)
   */
  private syncStatusFromHuntStore(
    accountId: string,
    state: AccountHuntCardState,
    hasActiveLoot = false,
  ): void {
    try {
      const huntStore = HuntStore.getInstance();
      const accountsSummary = (huntStore as any).accounts?.get(accountId);
      const isStoreHunting = accountsSummary?.activeStatus === 'hunting';

      if (isStoreHunting || hasActiveLoot) {
        state.status = 'farming';
      } else {
        // Se a última atividade foi há menos de 45 segundos, considera farmando
        const lastAct = accountsSummary?.lastActivityTime || 0;
        if (Date.now() - lastAct < 45000) {
          state.status = 'farming';
        } else {
          state.status = 'idle';
        }
      }
    } catch (_) {
      state.status = hasActiveLoot ? 'farming' : 'idle';
    }
  }

  /**
   * Fallback de preço de itens caso não venha no endpoint do depot
   */
  private getItemFallbackPrice(itemName: string): number {
    const clean = itemName.toLowerCase();
    if (clean.includes('stone')) return 5000;
    if (clean.includes('diamond')) return 10000;
    if (clean.includes('rare')) return 5000;
    if (clean.includes('belt')) return 1000;
    if (clean.includes('band aid')) return 1;
    if (clean.includes('orb')) return 2000;
    if (clean.includes('token')) return 500;
    return 100;
  }

  /**
   * Zera a Hunt de uma conta específica:
   * Reseta os contadores locais, esvazia a lista e reestabelece a baseline para o estado atual
   */
  public async resetAccountHunt(accountId: string): Promise<void> {
    const state = this.states.get(accountId);
    const baseline = this.baselines.get(accountId);
    if (!state || !baseline) return;

    state.loots = [];
    state.totalHuntDollar = 0;
    state.syncError = null;
    baseline.established = false;
    baseline.inventoryMap.clear();
    baseline.capturedIdSet.clear();

    this.notify();

    // Executa uma sincronização para capturar a nova baseline imediatamente
    await this.checkAccount(accountId);
  }

  /**
   * Atualiza Tudo: Dispara requisições manuais sob demanda para todas as 4 contas.
   * Aplica um micro-escalonamento de 250ms para evitar colisões exatas de pacotes de rede.
   */
  public async refreshAll(): Promise<void> {
    const accountIds = DEFAULT_ACCOUNTS.map((a) => a.id);

    for (let i = 0; i < accountIds.length; i++) {
      const accId = accountIds[i];
      if (this.timers[accId]) {
        clearTimeout(this.timers[accId]);
        delete this.timers[accId];
      }

      // Micro-escalonamento para segurança
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.checkAccount(accId);
        }
      }, i * 250);
    }
  }

  /**
   * Define o status de farm da conta explicitamente (ex: chamado pelo auto-clicker)
   */
  public setAccountStatus(accountId: string, status: 'farming' | 'idle'): void {
    const state = this.states.get(accountId);
    if (state && state.status !== status) {
      state.status = status;
      this.notify();
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    for (const id of Object.keys(this.timers)) {
      clearTimeout(this.timers[id]);
    }
    this.timers = {};
    this.listeners.clear();
  }
}
