/**
 * Serviço de Integração com a API de Mercado do Poke Idle World
 * Endpoint: https://poke.idleworld.online/api/game/market?category={category}
 */

export type MarketItemType = 'diamonds' | 'pheromones';
export type MarketCurrency = 'dollars' | 'diamonds';

export interface MarketItemConfig {
  id: MarketItemType;
  name: string;
  category: string;
  refId?: number;
  icon: string;
  color: string;
  unitLabel: string;
}

export const MONITORED_ITEMS: Record<MarketItemType, MarketItemConfig> = {
  diamonds: {
    id: 'diamonds',
    name: 'Diamonds',
    category: 'Diamonds',
    icon: '💎',
    color: '#38BDF8',
    unitLabel: 'un',
  },
  pheromones: {
    id: 'pheromones',
    name: 'Strange Pheromones',
    category: 'Items',
    refId: 44417,
    icon: '🧪',
    color: '#A855F7',
    unitLabel: 'un',
  },
};

export interface MarketListing {
  id: string | number;
  refId?: number;
  name: string;
  amount: number;
  price: number;
  unitPrice: number;
  currency: MarketCurrency;
  type: 'offer' | 'request';
  sellerName?: string;
  createdAt: number;
  isOutlier?: boolean;
}

export interface MarketPricePoint {
  timestamp: number;
  formattedTime: string;
  minOfferPrice: number;
  avgOfferPrice: number;
  requestPrice: number;
  totalVolume: number;
  activeOffersCount: number;
}

export interface MarketMetrics {
  currentMinPrice: number;
  currentAvgPrice: number;
  totalVolume: number;
  bestRequestPrice: number;
  offersCount: number;
  requestsCount: number;
  priceChange24hPercent: number;
  isOpportunity: boolean;
}

export interface MyMarketOrder {
  id: string | number;
  refId?: number;
  name: string;
  category: string;
  amount: number;
  price: number;
  unitPrice: number;
  currency: MarketCurrency;
  type: 'offer' | 'request';
  createdAt: number;
  status?: string;
  sellerName?: string;
  rawData?: any;
}

export interface MyMarketData {
  myOffers: MyMarketOrder[];
  myRequests: MyMarketOrder[];
  lastUpdated: number;
}

const STORAGE_KEY_TOKEN = 'poke_idle_market_jwt_token';
const STORAGE_KEY_ACCOUNT_TOKENS = 'poke_idle_market_account_tokens_v1';
const STORAGE_KEY_ACCOUNT_JWT_ACTIVE = 'poke_idle_account_jwt_active_v1';
const STORAGE_KEY_ACTIVE_ACCOUNT = 'poke_idle_market_active_account_id';
const STORAGE_KEY_REQUESTS_ENABLED = 'poke_idle_market_requests_enabled';
const STORAGE_KEY_HISTORY = 'poke_idle_market_history_v1';
const STORAGE_KEY_TARGETS = 'poke_idle_market_target_prices';

export class MarketService {
  private static instance: MarketService | null = null;
  private cachedToken: string | null = null;
  private accountTokens: Record<string, string> = {};
  private accountJwtActive: Record<string, boolean> = {};
  private activeAccountId = 'account_01';
  // Por padrão, TODAS AS REQUISIÇÕES DEVEM INICIAR DESABILITADAS quando o app for aberto.
  private requestsEnabled = false;
  private myMarketCache: Record<string, MyMarketData> = {};
  private priceHistory: Record<string, MarketPricePoint[]> = {};
  private targetPrices: Record<string, number> = {};
  private tokenListeners = new Set<(accountId: string, token: string | null) => void>();
  private requestsListeners = new Set<(enabled: boolean) => void>();
  private accountMarketPresence: Record<string, { inMarket: boolean; lastTimestamp: number }> = {};
  private marketPresenceListeners = new Set<(accountId: string, inMarket: boolean) => void>();
  private latestDiamondPriceDollars = 4_500_000;

  private constructor() {
    this.loadTokensAndActiveAccount();
    this.loadHistory();
    this.loadTargets();
  }

  public static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  // ==========================================
  // SWITCH DE PERMISSÃO DE REQUISIÇÕES
  // ==========================================

  public isRequestsEnabled(): boolean {
    return this.requestsEnabled;
  }

  public setRequestsEnabled(enabled: boolean): void {
    this.requestsEnabled = !!enabled;
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS_ENABLED, String(this.requestsEnabled));
    } catch (_) {}
    this.notifyRequestsChange(this.requestsEnabled);
  }

  public onRequestsEnabledChange(listener: (enabled: boolean) => void): () => void {
    this.requestsListeners.add(listener);
    return () => {
      this.requestsListeners.delete(listener);
    };
  }

  private notifyRequestsChange(enabled: boolean): void {
    for (const listener of this.requestsListeners) {
      try {
        listener(enabled);
      } catch (err) {
        console.error('[MarketService] Erro no listener de requisições:', err);
      }
    }
  }

  // ==========================================
  // PRESENÇA FÍSICA NO MERCADO (PASSIVA) & COTAÇÃO
  // ==========================================

  public getLatestDiamondPrice(): number {
    return this.latestDiamondPriceDollars;
  }

  public setLatestDiamondPrice(price: number): void {
    if (price > 0) {
      this.latestDiamondPriceDollars = Math.round(price);
    }
  }

  public setAccountMarketPresence(accountId: string, inMarket: boolean): void {
    const cleanId = (accountId || 'account_01').trim();
    this.accountMarketPresence[cleanId] = {
      inMarket: !!inMarket,
      lastTimestamp: Date.now(),
    };
    for (const listener of this.marketPresenceListeners) {
      try {
        listener(cleanId, !!inMarket);
      } catch (_) {}
    }
  }

  public isAccountInMarket(accountId: string, maxAgeMs = 180_000): boolean {
    const cleanId = (accountId || 'account_01').trim();
    const entry = this.accountMarketPresence[cleanId];
    if (!entry) return false;
    if (!entry.inMarket) return false;
    return Date.now() - entry.lastTimestamp < maxAgeMs;
  }

  public onMarketPresenceChange(listener: (accountId: string, inMarket: boolean) => void): () => void {
    this.marketPresenceListeners.add(listener);
    return () => {
      this.marketPresenceListeners.delete(listener);
    };
  }

  // ==========================================
  // GESTÃO DE CONTA ATIVA E TOKENS JWT
  // ==========================================

  public getActiveAccountId(): string {
    return this.activeAccountId;
  }

  public setActiveAccountId(accountId: string): void {
    const cleanId = (accountId || 'account_01').trim();
    this.activeAccountId = cleanId;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ACCOUNT, cleanId);
    } catch (_) {}

    // Sincroniza o token cached com o token associado a esta conta
    this.cachedToken = this.accountTokens[cleanId] || null;
    if (this.cachedToken) {
      localStorage.setItem(STORAGE_KEY_TOKEN, this.cachedToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }

  public onTokenChange(listener: (accountId: string, token: string | null) => void): () => void {
    this.tokenListeners.add(listener);
    return () => {
      this.tokenListeners.delete(listener);
    };
  }

  private notifyTokenChange(accountId: string, token: string | null): void {
    for (const listener of this.tokenListeners) {
      try {
        listener(accountId, token);
      } catch (err) {
        console.error('[MarketService] Erro no listener de token:', err);
      }
    }
  }

  public isAccountJwtActive(accountId: string): boolean {
    const cleanId = (accountId || 'account_01').trim();
    if (this.accountJwtActive[cleanId] !== undefined) {
      return this.accountJwtActive[cleanId];
    }
    // Por padrão, se possui um token configurado, inicia ativo
    return !!this.accountTokens[cleanId];
  }

  public setAccountJwtActive(accountId: string, active: boolean): void {
    const cleanId = (accountId || 'account_01').trim();
    this.accountJwtActive[cleanId] = !!active;
    this.saveAccountJwtActive();
    this.notifyTokenChange(cleanId, this.getActiveAccountToken(cleanId));
  }

  public getActiveAccountToken(accountId: string): string | null {
    if (!this.isAccountJwtActive(accountId)) return null;
    return this.getAccountToken(accountId);
  }

  public getAccountToken(accountId: string): string | null {
    return this.accountTokens[accountId] || null;
  }

  public setAccountToken(accountId: string, token: string): void {
    const cleanToken = (token || '').trim();
    const cleanId = (accountId || 'account_01').trim();
    const prevToken = this.accountTokens[cleanId] || null;

    if (cleanToken) {
      this.accountTokens[cleanId] = cleanToken;
      // Ao salvar ou alterar um token novo, ativa automaticamente se não estiver definido
      if (this.accountJwtActive[cleanId] === undefined) {
        this.accountJwtActive[cleanId] = true;
        this.saveAccountJwtActive();
      }
    } else {
      delete this.accountTokens[cleanId];
    }
    this.saveAccountTokens();

    if (cleanId === this.activeAccountId) {
      this.cachedToken = cleanToken || null;
      if (this.cachedToken) {
        localStorage.setItem(STORAGE_KEY_TOKEN, this.cachedToken);
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }
    }

    const currentToken = cleanToken || null;
    if (prevToken !== currentToken) {
      this.notifyTokenChange(cleanId, currentToken);
    }
  }

  public removeAccountToken(accountId: string): void {
    const cleanId = (accountId || 'account_01').trim();
    delete this.accountTokens[cleanId];
    this.accountJwtActive[cleanId] = false;
    this.saveAccountTokens();
    this.saveAccountJwtActive();

    if (cleanId === this.activeAccountId) {
      this.cachedToken = null;
      try {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      } catch (_) {}
    }
    this.notifyTokenChange(cleanId, null);
  }

  public getAllAccountTokens(): Record<string, string> {
    return { ...this.accountTokens };
  }

  public getToken(): string | null {
    return this.cachedToken || this.accountTokens[this.activeAccountId] || null;
  }

  public setToken(token: string): void {
    this.setAccountToken(this.activeAccountId, token);
  }

  private saveAccountTokens(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNT_TOKENS, JSON.stringify(this.accountTokens));
    } catch (_) {}
  }

  private saveAccountJwtActive(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNT_JWT_ACTIVE, JSON.stringify(this.accountJwtActive));
    } catch (_) {}
  }

  private loadTokensAndActiveAccount(): void {
    try {
      const rawTokens = localStorage.getItem(STORAGE_KEY_ACCOUNT_TOKENS);
      if (rawTokens) {
        this.accountTokens = JSON.parse(rawTokens);
      }
    } catch (_) {}

    try {
      const rawActive = localStorage.getItem(STORAGE_KEY_ACCOUNT_JWT_ACTIVE);
      if (rawActive) {
        this.accountJwtActive = JSON.parse(rawActive);
      }
    } catch (_) {}

    // Fallback/Migração: se a Conta 01 não tem token mas existe o token legado no STORAGE_KEY_TOKEN
    try {
      const legacyToken = (localStorage.getItem(STORAGE_KEY_TOKEN) || '').trim();
      if (legacyToken && !this.accountTokens['account_01']) {
        this.accountTokens['account_01'] = legacyToken;
        this.saveAccountTokens();
      }
    } catch (_) {}

    try {
      const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_ACCOUNT);
      if (savedActive) {
        this.activeAccountId = savedActive;
      }
    } catch (_) {}

    // Por padrão, TODAS AS REQUISIÇÕES DEVEM INICIAR DESABILITADAS quando o app for aberto.
    this.requestsEnabled = false;

    this.cachedToken = this.accountTokens[this.activeAccountId] || null;
  }

  /**
   * Script injetável para extrair token JWT de um Webview
   */
  private getDetectionScript(): string {
    return `
      (() => {
        try {
          // 1. pokeweb:tokens
          var raw = sessionStorage.getItem('pokeweb:tokens') || localStorage.getItem('pokeweb:tokens');
          if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.accessToken) return parsed.accessToken;
            if (typeof parsed === 'string') return parsed;
          }
          // 2. Busca chaves com 'token'
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.toLowerCase().indexOf('token') !== -1) {
              var val = localStorage.getItem(k);
              if (val && val.startsWith('ey')) return val;
              try {
                var p = JSON.parse(val);
                if (p && p.accessToken) return p.accessToken;
                if (p && p.token) return p.token;
              } catch (_) {}
            }
          }
          for (var j = 0; j < sessionStorage.length; j++) {
            var sk = sessionStorage.key(j);
            if (sk && sk.toLowerCase().indexOf('token') !== -1) {
              var sval = sessionStorage.getItem(sk);
              if (sval && sval.startsWith('ey')) return sval;
              try {
                var sp = JSON.parse(sval);
                if (sp && sp.accessToken) return sp.accessToken;
              } catch (_) {}
            }
          }
          return null;
        } catch (_) {
          return null;
        }
      })();
    `;
  }

  /**
   * Extrai o token JWT de um webview específico e associa à conta informada
   */
  public async autoDetectTokenForAccount(
    accountId: string,
    webview: Electron.WebviewTag,
  ): Promise<string | null> {
    try {
      if (!webview || !webview.isConnected) return null;
      const script = this.getDetectionScript();
      const token = (await webview.executeJavaScript(script, true)) as string | null;
      if (token && typeof token === 'string' && token.startsWith('ey')) {
        this.setAccountToken(accountId, token);
        return token;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Tenta extrair automaticamente o token JWT de todos os webviews fornecidos
   */
  public async autoDetectAllTokens(
    accounts: { id: string; webview: Electron.WebviewTag }[],
  ): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    for (const acc of accounts) {
      if (!acc.webview || !acc.webview.isConnected) {
        results[acc.id] = null;
        continue;
      }
      const token = await this.autoDetectTokenForAccount(acc.id, acc.webview);
      results[acc.id] = token;
    }
    return results;
  }

  /**
   * Tenta extrair automaticamente o token JWT do primeiro webview logado (compatibilidade retroativa)
   */
  public async autoDetectTokenFromWebviews(
    webviews: Electron.WebviewTag[],
  ): Promise<string | null> {
    const script = this.getDetectionScript();

    for (const wv of webviews) {
      try {
        if (!wv || !wv.isConnected) continue;
        const token = (await wv.executeJavaScript(script, true)) as string | null;
        if (token && typeof token === 'string' && token.startsWith('ey')) {
          this.setToken(token);
          return token;
        }
      } catch (_) {}
    }

    return null;
  }

  // ==========================================
  // REQUISIÇÃO DA API DE MERCADO (GERAL)
  // ==========================================

  public async fetchMarket(
    itemType: MarketItemType,
    currencyFilter: MarketCurrency = 'dollars',
    filterOutliers = true,
  ): Promise<{
    listings: MarketListing[];
    metrics: MarketMetrics;
    history: MarketPricePoint[];
    myOffers: MyMarketOrder[];
    myRequests: MyMarketOrder[];
  }> {
    if (!this.requestsEnabled) {
      throw new Error(
        'Requisições à API de mercado desativadas na tela de Ajustes. Ative o switch para buscar dados.',
      );
    }

    if (!this.isAccountJwtActive(this.activeAccountId)) {
      throw new Error(
        `Token JWT da conta ativa (${this.activeAccountId}) está desativado na tela de Ajustes.`,
      );
    }

    const itemConfig = MONITORED_ITEMS[itemType];
    const token = this.getActiveAccountToken(this.activeAccountId);

    if (!token) {
      throw new Error(
        'Token de autenticação JWT não configurado para a conta ativa. Faça login no slot do jogo ou configure o token.',
      );
    }

    const url = `https://poke.idleworld.online/api/game/market?category=${encodeURIComponent(
      itemConfig.category,
    )}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch (err: any) {
      throw new Error(`Falha de rede ao conectar à API de mercado: ${err.message || err}`);
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token JWT expirado ou inválido. Faça login no jogo para renovar.');
      }
      throw new Error(`A API do mercado retornou status ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();
    const parsedListings = this.parseRawApiResponse(rawData, itemConfig, currencyFilter);

    // Extrai myOffers e myRequests caso o payload JSON inclua os dados da conta
    const rawMyOffers = rawData?.myOffers || rawData?.data?.myOffers || rawData?.my_offers || [];
    const rawMyRequests = rawData?.myRequests || rawData?.data?.myRequests || rawData?.my_requests || [];

    const myOffers = this.parseRawMyMarketOrders(rawMyOffers, 'offer');
    const myRequests = this.parseRawMyMarketOrders(rawMyRequests, 'request');

    if (myOffers.length > 0 || myRequests.length > 0) {
      this.updateMyMarketCache(this.activeAccountId, myOffers, myRequests);
    }

    // Trata e filtra outliers se solicitado
    const processedListings = filterOutliers
      ? this.applyOutlierFilter(parsedListings)
      : parsedListings;

    // Calcula KPIs atuais
    const metrics = this.calculateMetrics(processedListings, itemType, currencyFilter);

    // Salva ponto na timeline histórica
    const currentPoint: MarketPricePoint = {
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      minOfferPrice: metrics.currentMinPrice,
      avgOfferPrice: metrics.currentAvgPrice,
      requestPrice: metrics.bestRequestPrice,
      totalVolume: metrics.totalVolume,
      activeOffersCount: metrics.offersCount,
    };

    if (metrics.currentMinPrice > 0) {
      this.recordHistoryPoint(itemType, currencyFilter, currentPoint);
    }

    if (itemType === 'diamonds' && currencyFilter === 'dollars') {
      const bestPrice = metrics.currentAvgPrice > 0 ? metrics.currentAvgPrice : metrics.currentMinPrice;
      if (bestPrice > 0) {
        this.setLatestDiamondPrice(bestPrice);
      }
    }

    const history = this.getHistory(itemType, currencyFilter);

    return {
      listings: processedListings,
      metrics,
      history,
      myOffers,
      myRequests,
    };
  }

  // ==========================================
  // REQUISIÇÃO DA ABA "MEU MERCADO" (CONTA ATIVA)
  // ==========================================

  public async fetchMyMarket(
    accountId?: string,
    tokenOverride?: string,
  ): Promise<{
    myOffers: MyMarketOrder[];
    myRequests: MyMarketOrder[];
  }> {
    if (!this.requestsEnabled) {
      throw new Error(
        'Requisições à API de mercado desativadas na tela de Ajustes. Ative o switch para buscar dados.',
      );
    }

    const targetAccountId = accountId || this.activeAccountId;
    if (!this.isAccountJwtActive(targetAccountId)) {
      throw new Error(`Token JWT da conta ${targetAccountId} está desativado na tela de Ajustes.`);
    }

    const token = tokenOverride || this.getActiveAccountToken(targetAccountId);

    if (!token) {
      throw new Error(
        `Token JWT não configurado para a conta ${targetAccountId}. Faça login no slot correspondente ou insira o token em Ajustes.`,
      );
    }

    // Busca nas duas categorias principais de mercado em paralelo para consolidar tudo
    const categories = ['Diamonds', 'Items'];
    const responses = await Promise.allSettled(
      categories.map(async (category) => {
        const url = `https://poke.idleworld.online/api/game/market?category=${encodeURIComponent(category)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Token JWT expirado ou inválido para esta conta.');
          }
          throw new Error(`Erro na API (${res.status})`);
        }
        return await res.json();
      }),
    );

    const combinedOffers: MyMarketOrder[] = [];
    const combinedRequests: MyMarketOrder[] = [];

    for (const item of responses) {
      if (item.status === 'fulfilled' && item.value) {
        const raw = item.value;
        const rawOffers = raw.myOffers || raw.data?.myOffers || raw.my_offers || [];
        const rawRequests = raw.myRequests || raw.data?.myRequests || raw.my_requests || [];

        combinedOffers.push(...this.parseRawMyMarketOrders(rawOffers, 'offer'));
        combinedRequests.push(...this.parseRawMyMarketOrders(rawRequests, 'request'));
      }
    }

    // Deduplica por ID caso a API retorne as mesmas ordens nas duas requisições
    const uniqueOffers = new Map<string | number, MyMarketOrder>();
    for (const off of combinedOffers) {
      uniqueOffers.set(off.id, off);
    }

    const uniqueRequests = new Map<string | number, MyMarketOrder>();
    for (const req of combinedRequests) {
      uniqueRequests.set(req.id, req);
    }

    const finalOffers = Array.from(uniqueOffers.values()).sort((a, b) => b.createdAt - a.createdAt);
    const finalRequests = Array.from(uniqueRequests.values()).sort((a, b) => b.createdAt - a.createdAt);

    this.updateMyMarketCache(targetAccountId, finalOffers, finalRequests);

    return {
      myOffers: finalOffers,
      myRequests: finalRequests,
    };
  }

  public getMyMarketCache(accountId?: string): MyMarketData | null {
    const acc = accountId || this.activeAccountId;
    return this.myMarketCache[acc] || null;
  }

  private updateMyMarketCache(
    accountId: string,
    offers: MyMarketOrder[],
    requests: MyMarketOrder[],
  ): void {
    this.myMarketCache[accountId] = {
      myOffers: offers,
      myRequests: requests,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Parser normalizado de ordens pessoais (myOffers / myRequests)
   */
  public parseRawMyMarketOrders(
    rawList: any[],
    type: 'offer' | 'request',
  ): MyMarketOrder[] {
    if (!Array.isArray(rawList)) return [];

    const results: MyMarketOrder[] = [];

    for (const row of rawList) {
      if (!row) continue;

      const refId = row.refId ?? row.ref_id ?? row.itemId ?? row.item_id;
      const numRef = refId !== undefined ? Number(refId) : undefined;
      const id = row.id ?? row._id ?? `${type}-${numRef || ''}-${Date.now()}-${Math.random()}`;

      let name = row.name || row.itemName || row.title || '';
      if (!name) {
        if (numRef === 44417) name = 'Strange Pheromones';
        else if (row.category === 'Diamonds' || row.currency === 'diamonds') name = 'Diamonds';
        else name = numRef ? `Item #${numRef}` : 'Ordem de Mercado';
      }

      const category =
        row.category ||
        row.itemCategory ||
        (numRef === 44417 ? 'Items' : name.toLowerCase().includes('diamond') ? 'Diamonds' : 'Mercado');

      const amount = Math.max(1, Number(row.amount ?? row.quantity ?? row.count ?? 1));
      const price = Number(row.price ?? row.totalPrice ?? row.total_price ?? row.unitPrice ?? 0);
      let unitPrice = price;

      if (row.unitPrice !== undefined) {
        unitPrice = Number(row.unitPrice);
      } else if (amount > 1 && (row.isTotal === true || price > 500)) {
        unitPrice = price / amount;
      }

      const rawCurrency = (row.currency || row.currencyType || row.coin || row.priceType || 'dollars')
        .toString()
        .toLowerCase();
      const currency: MarketCurrency =
        rawCurrency.includes('diamond') || rawCurrency === 'diamante' || rawCurrency === '2'
          ? 'diamonds'
          : 'dollars';

      let createdAt = Date.now();
      if (row.at) {
        createdAt = typeof row.at === 'number' ? (row.at > 1e11 ? row.at : row.at * 1000) : new Date(row.at).getTime();
      } else if (row.createdAt || row.created_at) {
        createdAt = new Date(row.createdAt || row.created_at).getTime();
      }

      results.push({
        id,
        refId: numRef,
        name,
        category,
        amount,
        price,
        unitPrice: Math.round(unitPrice * 100) / 100,
        currency,
        type,
        createdAt: isNaN(createdAt) ? Date.now() : createdAt,
        status: row.status || 'Ativa',
        sellerName: row.userName || row.sellerName || row.user,
        rawData: row,
      });
    }

    return results;
  }

  // ==========================================
  // PARSER DE RESPOSTA DA API
  // ==========================================

  private parseRawApiResponse(
    rawData: any,
    itemConfig: MarketItemConfig,
    currencyFilter: MarketCurrency,
  ): MarketListing[] {
    let rawListings: any[] = [];

    // 1. Mapeamento estrito conforme especificação:
    if (itemConfig.id === 'diamonds') {
      // Diamonds: Parâmetro ?category=Diamonds -> Alvo no JSON: propriedade .listings (ignorar .requests)
      if (rawData && Array.isArray(rawData.listings)) {
        rawListings = rawData.listings;
      } else if (Array.isArray(rawData)) {
        const itemObj = rawData.find(
          (it) =>
            it &&
            (it.category === 'Diamonds' ||
              (it.name && it.name.toLowerCase().includes('diamond')) ||
              Array.isArray(it.listings)),
        );
        rawListings = itemObj && Array.isArray(itemObj.listings) ? itemObj.listings : rawData;
      } else if (rawData && Array.isArray(rawData.data?.listings)) {
        rawListings = rawData.data.listings;
      }
    } else if (itemConfig.id === 'pheromones') {
      // Strange Pheromones: Parâmetro ?category=Items -> Filtrar no array onde refId === 44417 e extrair .listings
      let itemsArray: any[] = [];
      if (Array.isArray(rawData)) {
        itemsArray = rawData;
      } else if (rawData && Array.isArray(rawData.items)) {
        itemsArray = rawData.items;
      } else if (rawData && Array.isArray(rawData.data)) {
        itemsArray = rawData.data;
      } else if (rawData && Array.isArray(rawData.rows)) {
        itemsArray = rawData.rows;
      }

      // Procura o item de refId 44417
      const pheromoneObj = itemsArray.find((it) => {
        if (!it) return false;
        const ref = it.refId ?? it.ref_id ?? it.itemId ?? it.item_id ?? it.id;
        if (Number(ref) === 44417) return true;
        const nm = (it.name || it.itemName || '').toLowerCase();
        return nm.includes('pheromone') || nm.includes('feromonio') || nm.includes('feromônio');
      });

      if (pheromoneObj && Array.isArray(pheromoneObj.listings)) {
        rawListings = pheromoneObj.listings;
      } else if (rawData && Array.isArray(rawData.listings)) {
        // Se vier uma lista plana de listings contendo refId
        rawListings = rawData.listings.filter((l: any) => {
          const ref = l.refId ?? l.ref_id ?? l.itemId ?? l.item_id;
          return Number(ref) === 44417 || (l.name && l.name.toLowerCase().includes('pheromone'));
        });
      }
    }

    // Fallback de segurança se listings estiver em outro container
    if (rawListings.length === 0) {
      if (rawData && Array.isArray(rawData.listings)) {
        rawListings = rawData.listings;
      } else if (Array.isArray(rawData)) {
        rawListings = rawData;
      }
    }

    const results: MarketListing[] = [];

    for (const row of rawListings) {
      if (!row) continue;

      // 2. Normalização de Moeda / Método de Pagamento
      // A moeda corrente do jogo é o Dollar ($). Diamond (💎) é a moeda especial/cash.
      const rawCurrency = (row.currency || row.currencyType || row.coin || row.priceType || 'dollars')
        .toString()
        .toLowerCase();
      let currency: MarketCurrency = 'dollars';
      if (
        rawCurrency.includes('diamond') ||
        rawCurrency === 'diamonds' ||
        rawCurrency === 'diamante' ||
        rawCurrency === '2'
      ) {
        currency = 'diamonds';
      } else {
        // Moeda corrente do próprio jogo: Dollar ($)
        currency = 'dollars';
      }

      // Se filtrou por moeda e não bate, ignora
      if (currency !== currencyFilter) continue;

      // 3. Normalização de Quantidade e Preço
      const amount = Math.max(1, Number(row.amount ?? row.quantity ?? row.count ?? 1));
      const price = Number(row.price ?? row.totalPrice ?? row.unitPrice ?? 0);
      let unitPrice = price;

      if (row.unitPrice !== undefined) {
        unitPrice = Number(row.unitPrice);
      } else if (amount > 1 && row.isTotal === true) {
        unitPrice = price / amount;
      }

      if (unitPrice <= 0) continue;

      // 4. Data / Horário cronológico (campo 'at')
      let createdAt = Date.now();
      if (row.at) {
        if (typeof row.at === 'number') {
          createdAt = row.at > 1e11 ? row.at : row.at * 1000;
        } else {
          createdAt = new Date(row.at).getTime();
        }
      } else if (row.createdAt || row.created_at) {
        createdAt = new Date(row.createdAt || row.created_at).getTime();
      }

      results.push({
        id: row.id || `${itemConfig.id}-${unitPrice}-${amount}-${Math.random()}`,
        refId: itemConfig.refId,
        name: row.name || itemConfig.name,
        amount,
        price,
        unitPrice: Math.round(unitPrice * 100) / 100,
        currency,
        type: 'offer', // Foco estrito em anúncios de venda (listings)
        sellerName: row.userName || row.sellerName || row.user || row.seller || 'Vendedor',
        createdAt: isNaN(createdAt) ? Date.now() : createdAt,
      });
    }

    // Ordena do menor preço para o maior por padrão (para KPIs e Tabela)
    results.sort((a, b) => a.unitPrice - b.unitPrice);

    return results;
  }

  // ==========================================
  // FILTRAGEM ESTATÍSTICA DE OUTLIERS (IQR)
  // ==========================================

  private applyOutlierFilter(listings: MarketListing[]): MarketListing[] {
    const offers = listings.filter((l) => l.type === 'offer');
    if (offers.length === 0) return listings;

    const prices = offers.map((o) => o.unitPrice).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)] ?? 0;

    let lowerBound = 0;
    let upperBound = Infinity;

    if (offers.length >= 4) {
      const q1 = prices[Math.floor(prices.length * 0.25)] ?? prices[0] ?? 0;
      const q3 = prices[Math.floor(prices.length * 0.75)] ?? prices[prices.length - 1] ?? 0;
      const iqr = q3 - q1;
      lowerBound = Math.max(1, q1 - 2.5 * iqr);
      upperBound = q3 + 3.0 * iqr;
    }

    return listings.map((item) => {
      if (item.type !== 'offer') return item;

      let isOutlier = false;
      // 1. Verificação de piso irreal (ex: 1 gold quando a mediana é > 500)
      if (median > 500 && item.unitPrice <= 10) {
        isOutlier = true;
      } else if (median > 50 && item.unitPrice < median * 0.15) {
        isOutlier = true;
      }
      // 2. Verificação de teto irreal (ex: 999.999.999 quando a mediana é 10.000)
      else if (median > 0 && item.unitPrice > median * 5.0) {
        isOutlier = true;
      }
      // 3. Verificação por IQR estatístico se houver 4+ ofertas
      else if (offers.length >= 4 && (item.unitPrice < lowerBound || item.unitPrice > upperBound)) {
        isOutlier = true;
      }

      return {
        ...item,
        isOutlier,
      };
    });
  }

  // ==========================================
  // CÁLCULO DE KPIS & MÉTRICAS
  // ==========================================

  private calculateMetrics(
    listings: MarketListing[],
    itemType: MarketItemType,
    currency: MarketCurrency,
  ): MarketMetrics {
    const validOffers = listings.filter((l) => l.type === 'offer' && !l.isOutlier);
    const validRequests = listings.filter((l) => l.type === 'request');

    let currentMinPrice = 0;
    let currentAvgPrice = 0;
    let totalVolume = 0;

    if (validOffers.length > 0) {
      currentMinPrice = validOffers[0]?.unitPrice ?? 0;
      totalVolume = validOffers.reduce((acc, o) => acc + o.amount, 0);

      // Média ponderada pelo volume
      const totalCost = validOffers.reduce((acc, o) => acc + o.unitPrice * o.amount, 0);
      currentAvgPrice = Math.round((totalCost / totalVolume) * 100) / 100;
    }

    let bestRequestPrice = 0;
    if (validRequests.length > 0) {
      bestRequestPrice = Math.max(...validRequests.map((r) => r.unitPrice));
    }

    const targetPrice = this.getTargetPrice(itemType, currency);
    const isOpportunity =
      targetPrice > 0 && currentMinPrice > 0 && currentMinPrice <= targetPrice;

    // Variação 24h
    const history = this.getHistory(itemType, currency);
    let priceChange24hPercent = 0;
    if (history.length > 1) {
      const oldestPoint = history[0];
      if (oldestPoint && oldestPoint.minOfferPrice > 0 && currentMinPrice > 0) {
        priceChange24hPercent =
          Math.round(
            ((currentMinPrice - oldestPoint.minOfferPrice) / oldestPoint.minOfferPrice) * 1000,
          ) / 10;
      }
    }

    return {
      currentMinPrice,
      currentAvgPrice,
      totalVolume,
      bestRequestPrice,
      offersCount: validOffers.length,
      requestsCount: validRequests.length,
      priceChange24hPercent,
      isOpportunity,
    };
  }

  // ==========================================
  // HISTÓRICO LOCAL & TIMELINE (PERSISTÊNCIA)
  // ==========================================

  private getHistoryKey(itemType: MarketItemType, currency: MarketCurrency): string {
    return `${itemType}_${currency}`;
  }

  public getHistory(itemType: MarketItemType, currency: MarketCurrency): MarketPricePoint[] {
    const key = this.getHistoryKey(itemType, currency);
    return this.priceHistory[key] || [];
  }

  public recordHistoryPoint(
    itemType: MarketItemType,
    currency: MarketCurrency,
    point: MarketPricePoint,
  ): void {
    const key = this.getHistoryKey(itemType, currency);
    if (!this.priceHistory[key]) {
      this.priceHistory[key] = [];
    }

    const list = this.priceHistory[key]!;

    // Evita duplicar registros se foi chamado há menos de 10 segundos
    const last = list[list.length - 1];
    if (last && Math.abs(point.timestamp - last.timestamp) < 10000) {
      // Atualiza o último ponto
      list[list.length - 1] = point;
    } else {
      list.push(point);
    }

    // Mantém no máximo 100 pontos históricos para performance
    if (list.length > 100) {
      this.priceHistory[key] = list.slice(list.length - 100);
    }

    this.saveHistory();
  }

  private loadHistory(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (raw) {
        this.priceHistory = JSON.parse(raw);
      }
    } catch (_) {}
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.priceHistory));
    } catch (_) {}
  }

  // ==========================================
  // PREÇOS ALVO DE COMPRA (OPORTUNIDADE)
  // ==========================================

  public getTargetPrice(itemType: MarketItemType, currency: MarketCurrency): number {
    const key = this.getHistoryKey(itemType, currency);
    return this.targetPrices[key] || 0;
  }

  public setTargetPrice(
    itemType: MarketItemType,
    currency: MarketCurrency,
    price: number,
  ): void {
    const key = this.getHistoryKey(itemType, currency);
    if (price > 0) {
      this.targetPrices[key] = price;
    } else {
      delete this.targetPrices[key];
    }
    this.saveTargets();
  }

  private loadTargets(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TARGETS);
      if (raw) {
        this.targetPrices = JSON.parse(raw);
      }
    } catch (_) {}
  }

  private saveTargets(): void {
    try {
      localStorage.setItem(STORAGE_KEY_TARGETS, JSON.stringify(this.targetPrices));
    } catch (_) {}
  }
}
