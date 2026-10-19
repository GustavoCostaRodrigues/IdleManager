import type {
  CaptureFilterState,
  CaptureRecord,
  IVStats,
  PokeballType,
  PokemonQuality,
} from '../../shared/captureTypes.js';

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

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): CaptureStore {
    if (!CaptureStore.instance) {
      CaptureStore.instance = new CaptureStore();
    }
    return CaptureStore.instance;
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
          // Remove quaisquer registros de demonstração anteriores
          this.captures = parsed.filter(
            (item: CaptureRecord) => !item.id.startsWith('cap-demo-'),
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
  public addCapture(
    data: Omit<CaptureRecord, 'id' | 'timestamp'> & { timestamp?: number; gameRecordId?: string },
  ): CaptureRecord {
    const ts = data.timestamp ?? Date.now();

    // Evita duplicatas se um registro com o mesmo ID do jogo ou mesmo pokemon/horário já existir
    const existing = this.captures.find(
      (c) =>
        (data.gameRecordId && c.gameRecordId === data.gameRecordId) ||
        (c.accountId === data.accountId &&
          c.pokemonName.toLowerCase() === data.pokemonName.toLowerCase() &&
          Math.abs(c.timestamp - ts) < 2500),
    );
    if (existing) {
      return existing;
    }

    const record: CaptureRecord = {
      ...data,
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
      level?: number;
      quality?: PokemonQuality;
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
      const ts = item.timestamp || Date.now();

      // Evita duplicatas se o mesmo registro já existir
      const exists = this.captures.some(
        (c) =>
          (item.id && c.gameRecordId === item.id) ||
          (c.accountId === accountId &&
            c.pokemonName.toLowerCase() === item.pokemonName.toLowerCase() &&
            Math.abs(c.timestamp - ts) < 3000),
      );

      if (!exists) {
        let iv: IVStats;
        if (typeof item.ivPercentage === 'number') {
          iv = CaptureStore.createIVFromPercentage(item.ivPercentage);
        } else if (typeof item.ivPoints === 'number') {
          iv = CaptureStore.calculateIVStats(item.ivPoints, item.ivMaxPoints || 192);
        } else {
          iv = CaptureStore.createIVFromPercentage(0);
        }

        const record: CaptureRecord = {
          id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          gameRecordId: item.id,
          timestamp: ts,
          accountId,
          accountName,
          pokemonName: item.pokemonName,
          quality: item.quality || 'comum',
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
