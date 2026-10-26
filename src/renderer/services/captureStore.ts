import {
  type CaptureFilterState,
  type CaptureRecord,
  type IVStats,
  type PokeballType,
  type PokemonQuality,
  normalizePokeball,
  qualityFromNumberOrString,
} from '../../shared/captureTypes.js';
import { DEFAULT_ACCOUNTS } from '../../shared/constants.js';
import { MarketService } from './marketService.js';

type CaptureListener = (
  captures: CaptureRecord[],
  filter: CaptureFilterState,
  counts: Record<PokemonQuality | 'all', number>,
) => void;

const STORAGE_KEY = 'poke_idle_captures_history_v1';
const MAX_HISTORY_RECORDS = 500;

export class CaptureStore {
  private static instance: CaptureStore | null = null;
  private captures: CaptureRecord[] = [];
  private filter: CaptureFilterState = {
    quality: 'all',
    accountId: 'all',
    minIv: 0,
    searchQuery: '',
  };
  private listeners = new Set<CaptureListener>();
  private isBatchScheduled = false;

  // Governança de Requisições: por padrão inicia DESABILITADA quando o app for aberto
  private requestsEnabled = false;
  private requestsListeners = new Set<(enabled: boolean) => void>();

  private constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      (window as any).__POKE_CAPTURES_REQUESTS_ENABLED__ = false;
    }
  }

  public static getInstance(): CaptureStore {
    if (!CaptureStore.instance) {
      CaptureStore.instance = new CaptureStore();
    }
    return CaptureStore.instance;
  }

  public isRequestsEnabled(): boolean {
    if (typeof window !== 'undefined' && typeof (window as any).__POKE_CAPTURES_REQUESTS_ENABLED__ === 'boolean') {
      return this.requestsEnabled && (window as any).__POKE_CAPTURES_REQUESTS_ENABLED__;
    }
    return this.requestsEnabled;
  }

  public setRequestsEnabled(enabled: boolean): void {
    this.requestsEnabled = !!enabled;
    if (typeof window !== 'undefined') {
      (window as any).__POKE_CAPTURES_REQUESTS_ENABLED__ = this.requestsEnabled;
    }
    for (const listener of this.requestsListeners) {
      try {
        listener(this.requestsEnabled);
      } catch (err) {
        console.error('[CaptureStore] Erro no listener de requisições:', err);
      }
    }
  }

  public onRequestsEnabledChange(listener: (enabled: boolean) => void): () => void {
    this.requestsListeners.add(listener);
    return () => {
      this.requestsListeners.delete(listener);
    };
  }

  /**
   * Sincroniza o histórico oficial de capturas diretamente da API oficial do Poke Idle World
   * Endpoint: https://poke.idleworld.online/api/game/capture-log?filter=all
   *
   * Operação EXCLUSIVAMENTE sob demanda / acionada manualmente pelo usuário.
   */
  public async syncFromApi(targetAccountId?: string): Promise<{ success: boolean; count: number; error?: string }> {
    if (!this.isRequestsEnabled()) {
      return {
        success: false,
        count: 0,
        error: 'Requisições da tela de capturas estão pausadas. Habilite na tela de Ajustes para sincronizar.',
      };
    }

    const marketSvc = MarketService.getInstance();
    const accountsToSync = targetAccountId
      ? DEFAULT_ACCOUNTS.filter((a) => a.id === targetAccountId)
      : DEFAULT_ACCOUNTS;

    const accountsWithToken = accountsToSync.filter((a) => !!marketSvc.getActiveAccountToken(a.id));
    if (accountsWithToken.length === 0) {
      return {
        success: false,
        count: 0,
        error: 'Nenhuma conta possui token JWT ativo. Faça login no jogo para autenticar.',
      };
    }

    let totalSynced = 0;

    for (const acc of accountsToSync) {
      // Revalida a permissão a cada chamada
      if (!this.isRequestsEnabled()) {
        break;
      }

      const token = marketSvc.getActiveAccountToken(acc.id);
      if (!token) continue;

      try {
        const res = await fetch('https://poke.idleworld.online/api/game/capture-log?filter=all', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!res.ok) continue;
        const data = await res.json();
        if (!data || !Array.isArray(data.rows) || data.rows.length === 0) continue;

        const list = data.rows.map((row: any) => {
          const ivPts = typeof row.ivTotal === 'number' ? row.ivTotal : 0;
          const ivPct = ivPts > 0 ? Math.round((ivPts / 192) * 100 * 10) / 10 : 0;
          const rawName = String(row.name || 'Pokémon').trim();
          const cleanName = rawName.replace(/.*(?:Captura|selvagem|Loja|\d)+/gi, '').trim() || rawName;

          let qMult: number | undefined = undefined;
          if (typeof row.quality === 'number' && !isNaN(row.quality)) {
            qMult = row.quality;
          } else if (typeof row.qualityMultiplier === 'number' && !isNaN(row.qualityMultiplier)) {
            qMult = row.qualityMultiplier;
          }

          return {
            id: String(row.id || ''),
            pokemonName: cleanName,
            pokemonDexNumber: row.speciesId,
            level: row.level || 1,
            quality: qualityFromNumberOrString(row.quality),
            qualityMultiplier: qMult,
            pokeball: normalizePokeball(row.ballName || ''),
            ivPoints: ivPts,
            ivMaxPoints: 192,
            ivPercentage: ivPct,
            isShiny: Boolean(row.shiny),
            timestamp: row.at ? new Date(row.at).getTime() : Date.now(),
          };
        });

        this.syncCapturesBatch(acc.id, acc.name, list);
        totalSynced += list.length;
      } catch (err) {
        console.warn(`[CaptureStore] Erro ao sincronizar capturas da conta ${acc.name}:`, err);
      }
    }

    return { success: true, count: totalSynced };
  }

  /**
   * Carrega histórico persistido no localStorage exclusivamente com registros reais.
   * Filtra quaisquer dados legados de demonstração.
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove quaisquer registros de demonstração anteriores ou dados poluídos do DOM
          this.captures = parsed.filter(
            (item: CaptureRecord) =>
              !item.id.startsWith('cap-demo-') &&
              !item.pokemonName.includes('Captura') &&
              !item.pokemonName.includes('selvagem') &&
              !item.pokemonName.includes('Loja') &&
              !(item.iv && item.iv.total === 0 && item.iv.percentage === 0 && !item.gameRecordId),
          );
          return;
        }
      }
    } catch (err) {
      console.warn('[CaptureStore] Falha ao recuperar histórico salvo:', err);
    }

    this.captures = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const toPersist = this.captures.slice(0, MAX_HISTORY_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (err) {
      console.error('[CaptureStore] Erro ao salvar histórico no localStorage:', err);
    }
  }

  public subscribe(listener: CaptureListener): () => void {
    this.listeners.add(listener);
    listener(this.getFilteredCaptures(), { ...this.filter }, this.getQualityCounts());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    if (this.isBatchScheduled) return;
    this.isBatchScheduled = true;

    requestAnimationFrame(() => {
      this.isBatchScheduled = false;
      const filtered = this.getFilteredCaptures();
      const counts = this.getQualityCounts();
      const currentFilter = { ...this.filter };

      for (const listener of this.listeners) {
        try {
          listener(filtered, currentFilter, counts);
        } catch (err) {
          console.error('[CaptureStore] Erro ao invocar listener de capturas:', err);
        }
      }
    });
  }

  /**
   * Adiciona um novo registro de captura REAL no topo da tabela de forma fluida e reativa.
   */
  /**
   * Adiciona um novo registro de captura REAL no topo da tabela de forma fluida e reativa.
   */
  public addCapture(
    data: Omit<CaptureRecord, 'id' | 'timestamp'> & { timestamp?: number; gameRecordId?: string },
  ): CaptureRecord {
    const rawName = data.pokemonName.trim();
    const cleanName = rawName.replace(/.*(?:Captura|selvagem|Loja|\d)+/gi, '').trim() || rawName;
    if (cleanName.toLowerCase().includes('captura') || cleanName.toLowerCase().includes('selvagem')) {
      return null as any;
    }

    const ts = data.timestamp ?? Date.now();

    // Evita duplicatas se um registro com o mesmo ID do jogo ou mesmo pokemon/horário já existir
    const existing = this.captures.find(
      (c) =>
        (data.gameRecordId && c.gameRecordId === data.gameRecordId) ||
        (c.accountId === data.accountId &&
          c.pokemonName.toLowerCase() === cleanName.toLowerCase() &&
          Math.abs(c.timestamp - ts) < 2500),
    );
    if (existing) {
      return existing;
    }

    const record: CaptureRecord = {
      ...data,
      pokemonName: cleanName,
      id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: ts,
    };

    // Insere e mantém ordenado por timestamp descrescente
    this.captures.unshift(record);
    this.captures.sort((a, b) => b.timestamp - a.timestamp);

    // Limita tamanho máximo do histórico em memória
    if (this.captures.length > MAX_HISTORY_RECORDS) {
      this.captures.length = MAX_HISTORY_RECORDS;
    }

    this.saveToStorage();
    this.notify();
    return record;
  }

  /**
   * Sincroniza em lote múltiplas capturas extraídas do histórico real do Poke Idle World.
   */
  public syncCapturesBatch(
    accountId: string,
    accountName: string,
    records: Array<{
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
    }>,
  ): void {
    let hasNew = false;
    for (const item of records) {
      if (!item.pokemonName || item.pokemonName.trim().length === 0) continue;
      const rawName = item.pokemonName.trim();
      const cleanName = rawName.replace(/.*(?:Captura|selvagem|Loja|\d)+/gi, '').trim() || rawName;
      if (cleanName.toLowerCase().includes('captura') || cleanName.toLowerCase().includes('selvagem')) continue;

      const ts = item.timestamp || Date.now();

      // Se já houver um registro provisório sem gameRecordId nessa conta e horário similar, remove para dar lugar ao oficial
      const provisionalIdx = this.captures.findIndex(
        (c) => !c.gameRecordId && c.accountId === accountId && Math.abs(c.timestamp - ts) < 4000,
      );
      if (provisionalIdx !== -1) {
        this.captures.splice(provisionalIdx, 1);
        hasNew = true;
      }

      // Evita duplicatas se o mesmo registro já existir
      const exists = this.captures.some(
        (c) =>
          (item.id && c.gameRecordId === item.id) ||
          (c.accountId === accountId &&
            c.pokemonName.toLowerCase() === cleanName.toLowerCase() &&
            Math.abs(c.timestamp - ts) < 3000),
      );

      if (!exists) {
        let iv: IVStats;
        if (typeof item.ivPoints === 'number' && item.ivPoints > 0) {
          iv = CaptureStore.calculateIVStats(item.ivPoints, item.ivMaxPoints || 192);
        } else if (typeof item.ivPercentage === 'number') {
          iv = CaptureStore.createIVFromPercentage(item.ivPercentage);
        } else {
          iv = CaptureStore.createIVFromPercentage(0);
        }

        const record: CaptureRecord = {
          id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          gameRecordId: item.id,
          timestamp: ts,
          accountId,
          accountName,
          pokemonName: cleanName,
          pokemonDexNumber: item.pokemonDexNumber,
          quality: item.quality || 'comum',
          qualityMultiplier: item.qualityMultiplier,
          pokeball: item.pokeball || 'pokeball',
          iv,
          level: item.level || 1,
          isShiny: Boolean(item.isShiny),
        };

        this.captures.push(record);
        hasNew = true;
      }
    }

    if (hasNew) {
      this.captures.sort((a, b) => b.timestamp - a.timestamp);
      if (this.captures.length > MAX_HISTORY_RECORDS) {
        this.captures.length = MAX_HISTORY_RECORDS;
      }
      this.saveToStorage();
      this.notify();
    }
  }

  public setFilter(partial: Partial<CaptureFilterState>): void {
    this.filter = { ...this.filter, ...partial };
    this.notify();
  }

  public getFilter(): CaptureFilterState {
    return { ...this.filter };
  }

  public resetFilter(): void {
    this.filter = {
      quality: 'all',
      accountId: 'all',
      minIv: 0,
      searchQuery: '',
    };
    this.notify();
  }

  public clearHistory(): void {
    this.captures = [];
    this.saveToStorage();
    this.notify();
  }

  public getAllCaptures(): CaptureRecord[] {
    return [...this.captures];
  }

  /**
   * Retorna os registros filtrados com base na qualidade real e demais critérios.
   */
  public getFilteredCaptures(): CaptureRecord[] {
    const { quality, accountId, minIv, searchQuery } = this.filter;
    const cleanQuery = searchQuery.trim().toLowerCase();

    return this.captures.filter((record) => {
      // 1. Filtro de Qualidade Oficial do Poke Idle World
      if (quality !== 'all' && record.quality !== quality) {
        return false;
      }

      // 2. Filtro por Conta
      if (accountId !== 'all' && record.accountId !== accountId) {
        return false;
      }

      // 3. Filtro por IV Mínimo
      if (minIv > 0 && record.iv.percentage < minIv) {
        return false;
      }

      // 4. Busca por Nome do Pokémon
      if (cleanQuery.length > 0) {
        const nameMatches = record.pokemonName.toLowerCase().includes(cleanQuery);
        const dexMatches = record.pokemonDexNumber
          ? String(record.pokemonDexNumber).includes(cleanQuery)
          : false;
        if (!nameMatches && !dexMatches) return false;
      }

      return true;
    });
  }

  /**
   * Retorna os contadores reais para cada uma das 9 qualidades oficiais do Poke Idle World.
   */
  public getQualityCounts(): Record<PokemonQuality | 'all', number> {
    const counts: Record<PokemonQuality | 'all', number> = {
      all: this.captures.length,
      fraca: 0,
      comum: 0,
      incomum: 0,
      rara: 0,
      epica: 0,
      lendaria: 0,
      mitica: 0,
      ancia: 0,
      divina: 0,
    };

    for (const record of this.captures) {
      if (counts[record.quality] !== undefined) {
        counts[record.quality] += 1;
      }
    }

    return counts;
  }

  /**
   * Calcula as estatísticas de IV e determina o tier (S, A, B, C)
   * a partir dos dados numéricos reais obtidos do jogo.
   */
  public static calculateIVStats(totalPoints: number, maxPoints = 192): IVStats {
    const percentage = Math.round((totalPoints / maxPoints) * 100 * 10) / 10;
    let tier: IVStats['tier'] = 'C';

    if (percentage >= 90) {
      tier = 'S';
    } else if (percentage >= 75) {
      tier = 'A';
    } else if (percentage >= 50) {
      tier = 'B';
    }

    return {
      percentage,
      total: totalPoints,
      maxPossible: maxPoints,
      tier,
    };
  }

  /**
   * Cria estatísticas de IV diretamente de uma porcentagem real fornecida pelo jogo.
   */
  public static createIVFromPercentage(percentage: number): IVStats {
    const safePercent = Math.min(100, Math.max(0, Math.round(percentage * 10) / 10));
    let tier: IVStats['tier'] = 'C';

    if (safePercent >= 90) {
      tier = 'S';
    } else if (safePercent >= 75) {
      tier = 'A';
    } else if (safePercent >= 50) {
      tier = 'B';
    }

    const maxPossible = 192;
    const total = Math.round((safePercent / 100) * maxPossible);

    return {
      percentage: safePercent,
      total,
      maxPossible,
      tier,
    };
  }
}
