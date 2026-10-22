import {
  MONITORED_ITEMS,
  MarketService,
  type MarketCurrency,
  type MarketItemType,
  type MarketListing,
  type MarketMetrics,
  type MarketPricePoint,
  type MyMarketOrder,
} from '../services/marketService.js';
import type { AccountOption } from './familyDepotComponent.js';
import { Chart } from 'chart.js/auto';

export interface MarketAccountConfig {
  id: string;
  name: string;
  short: string;
}

export const MARKET_ACCOUNTS: readonly MarketAccountConfig[] = [
  { id: 'account_01', name: 'Conta 01', short: '01' },
  { id: 'account_02', name: 'Conta 02', short: '02' },
  { id: 'account_03', name: 'Conta 03', short: '03' },
  { id: 'account_04', name: 'Conta 04', short: '04' },
];

export class MarketMonitorComponent {
  public readonly element: HTMLElement;
  private readonly marketService: MarketService;

  // Estado da Conta Ativa e Navegação de Abas
  private activeAccountId = 'account_01';
  private currentMainTab: 'general' | 'my-market' = 'general';

  // Estado do Mercado Geral
  private currentItem: MarketItemType = 'diamonds';
  private currentCurrency: MarketCurrency = 'dollars';
  private filterOutliers = true;
  private orderTypeFilter: 'all' | 'offer' | 'request' = 'all';
  private chartMode: 'listings' | 'history' = 'listings';

  private autoRefreshTimer: number | null = null;
  private autoRefreshInterval = 30000; // 30s padrão
  private isAutoRefreshEnabled = true;
  private isRefreshing = false;

  private latestListings: MarketListing[] = [];
  private latestMetrics: MarketMetrics | null = null;
  private latestHistory: MarketPricePoint[] = [];

  // Instância do Chart.js
  private chartInstance: Chart | null = null;

  // Estado da Aba "Meu Mercado"
  private myOffers: MyMarketOrder[] = [];
  private myRequests: MyMarketOrder[] = [];
  private isMyMarketRefreshing = false;
  private myMarketFilterType: 'all' | 'offer' | 'request' = 'all';
  private myMarketCurrencyFilter: 'all' | MarketCurrency = 'all';
  private myMarketSearchQuery = '';

  // Estado de Permissão de Requisições de Rede
  private isRequestsEnabled = true;
  private modalSelectedAccountId = 'account_01';

  // Referências DOM - Barra Horizontal de Contas
  private elAccountsTrack!: HTMLElement;
  private elBtnAutoDetectAllTokens!: HTMLButtonElement;
  private elBtnManageTokens!: HTMLButtonElement;

  // Referências DOM - Switch Master de Requisições
  private elRequestsToggle!: HTMLInputElement;
  private elRequestsMasterText!: HTMLElement;
  private elRequestsMasterDot!: HTMLElement;
  private elRequestsDisabledBanner!: HTMLElement;

  // Referências DOM - Navegação Principal de Abas
  private elBtnMainTabGeneral!: HTMLButtonElement;
  private elBtnMainTabMyMarket!: HTMLButtonElement;
  private elMyMarketCountBadge!: HTMLElement;
  private elMyMarketAccountIndicator!: HTMLElement;
  private elGeneralViewContainer!: HTMLElement;
  private elMyViewContainer!: HTMLElement;

  // Referências DOM - Cabeçalho Geral
  private elItemIndicatorLabel!: HTMLElement;
  private elTokenStatusBadge!: HTMLElement;
  private elTokenDot!: HTMLElement;
  private elBtnAutoDetectToken!: HTMLButtonElement;
  private elBtnConfigureToken!: HTMLButtonElement;
  private elBtnRefreshNow!: HTMLButtonElement;
  private elAutoRefreshToggle!: HTMLInputElement;

  // Referências DOM - Mercado Geral (Controles & KPIs)
  private elBtnItemDiamonds!: HTMLButtonElement;
  private elBtnItemPheromones!: HTMLButtonElement;
  private elCurrencySelect!: HTMLSelectElement;
  private elOutlierToggle!: HTMLInputElement;
  private elLastUpdateText!: HTMLElement;

  private elKpiMinPrice!: HTMLElement;
  private elKpiAvgPrice!: HTMLElement;
  private elKpiVolume!: HTMLElement;
  private elKpiRequestPrice!: HTMLElement;
  private elOpportunityCard!: HTMLElement;
  private elOpportunityBadge!: HTMLElement;
  private elTargetPriceInput!: HTMLInputElement;
  private elBtnSaveTargetPrice!: HTMLButtonElement;

  // Referências DOM - Gráfico
  private elChartCanvas!: HTMLCanvasElement;
  private elChartEmptyState!: HTMLElement;
  private elBtnModeListings!: HTMLButtonElement;
  private elBtnModeHistory!: HTMLButtonElement;
  private elChartSubtitle!: HTMLElement;

  // Referências DOM - Tabela Geral
  private elOrderTypeFilterSelect!: HTMLSelectElement;
  private elTableBody!: HTMLElement;
  private elEmptyState!: HTMLElement;
  private elOrdersCounter!: HTMLElement;

  // Referências DOM - Meu Mercado
  private elMyMarketTitle!: HTMLElement;
  private elMyMarketSubtitle!: HTMLElement;
  private elBtnRefreshMyMarket!: HTMLButtonElement;
  private elBtnOpenMyMarketInGame!: HTMLButtonElement;

  private elMyKpiOffersCount!: HTMLElement;
  private elMyKpiOffersValue!: HTMLElement;
  private elMyKpiRequestsCount!: HTMLElement;
  private elMyKpiRequestsValue!: HTMLElement;

  private elBtnMyFilterAll!: HTMLButtonElement;
  private elBtnMyFilterOffers!: HTMLButtonElement;
  private elBtnMyFilterRequests!: HTMLButtonElement;
  private elMySearchInput!: HTMLInputElement;
  private elMyCurrencySelect!: HTMLSelectElement;
  private elMyOrdersCounter!: HTMLElement;
  private elMyTableBody!: HTMLElement;
  private elMyEmptyState!: HTMLElement;

  // Referências DOM - Modal de Tokens Multi-Contas
  private elTokenModal!: HTMLElement;
  private elTokenModalAccountTabs!: HTMLElement;
  private elTokenModalSelectedLabel!: HTMLElement;
  private elTokenModalInput!: HTMLTextAreaElement;
  private elBtnSaveModalToken!: HTMLButtonElement;
  private elBtnAutoDetectModalAccount!: HTMLButtonElement;
  private elBtnAutoDetectModalAll!: HTMLButtonElement;
  private elBtnClearModalToken!: HTMLButtonElement;
  private elBtnCloseTokenModal!: HTMLButtonElement;

  constructor(
    private readonly getAccountOptions: () => AccountOption[],
    private readonly onToast?: (message: string, type?: 'info' | 'success' | 'danger', durationMs?: number) => void,
    private readonly onNavigateToAccount?: (accountId: string) => void,
  ) {
    this.marketService = MarketService.getInstance();
    this.isRequestsEnabled = this.marketService.isRequestsEnabled();
    this.activeAccountId = this.marketService.getActiveAccountId() || 'account_01';
    this.modalSelectedAccountId = this.activeAccountId;

    this.element = document.createElement('div');
    this.element.className = 'market-monitor-container';
    this.element.id = 'market-monitor-view';

    this.render();
    this.bindDom();
    this.initEvents();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="market-wrapper">

        <!-- 1. SELETOR DE CONTAS EM LINHA ÚNICA HORIZONTAL -->
        <section class="market-accounts-bar" id="market-accounts-bar">
          <div class="accounts-bar-left">
            <div class="accounts-bar-title-wrap">
              <span class="accounts-bar-icon">🎮</span>
              <span class="accounts-bar-label">CONTAS (SLOTS):</span>
            </div>
            <div class="accounts-horizontal-track" id="accounts-horizontal-track">
              <!-- Renderizado dinamicamente via updateAccountsBar() -->
            </div>
          </div>

          <div class="accounts-bar-actions">
            <button id="btn-market-auto-all-tokens" class="btn-account-bar-action btn-pulse-action" title="Escanear e detectar tokens JWT das contas logadas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Auto-Detectar</span>
            </button>
            <button id="btn-market-manage-tokens" class="btn-account-bar-action" title="Gerenciar Tokens JWT manualmente">
              <span class="action-emoji">🔑</span>
              <span>Tokens JWT</span>
            </button>
          </div>
        </section>

        <!-- 2. CABEÇALHO DO MONITOR DE MERCADO -->
        <header class="market-header">
          <div class="market-header-left">
            <div class="market-badge-tag">
              <span class="live-pulse-dot"></span>
              <span>MONITOR DE MERCADO EM TEMPO REAL</span>
            </div>
            <h1 class="market-title">
              Cotação & Oportunidades de Compra
              <span class="market-item-indicator" id="market-current-item-label">Diamonds</span>
            </h1>
            <p class="market-subtitle">
              Acompanhe a variação histórica de preços no <strong>Poke Idle World</strong>, filtre outliers e gerencie as ofertas da sua conta ativa.
            </p>
          </div>

          <!-- AÇÕES DO TOPO & STATUS DO TOKEN ATIVO -->
          <div class="market-header-actions">
            <!-- Switch Master de Permissão de Requisições -->
            <div class="market-requests-switch-box" id="market-requests-switch-box" title="Ativar ou pausar todas as requisições de rede da tela de mercado">
              <label class="switch-label master-requests-switch">
                <input type="checkbox" id="market-requests-master-toggle" ${this.isRequestsEnabled ? 'checked' : ''} />
                <span class="switch-slider switch-slider-requests"></span>
              </label>
              <div class="requests-switch-text-col">
                <span class="requests-switch-title" id="market-requests-master-text">
                  ${this.isRequestsEnabled ? 'Requisições Ativas' : 'Requisições Pausadas'}
                </span>
                <span class="requests-status-dot ${this.isRequestsEnabled ? 'dot-active' : 'dot-inactive'}" id="market-requests-master-dot"></span>
              </div>
            </div>

            <div class="token-status-pill" id="market-token-status-pill">
              <span class="token-dot" id="market-token-dot"></span>
              <span id="market-token-status-text">Verificando Token...</span>
              <button id="btn-market-auto-token" class="btn-token-action" title="Detectar token da conta ativa">
                Detectar
              </button>
              <button id="btn-market-cfg-token" class="btn-token-action" title="Editar Token JWT">
                ⚙️
              </button>
            </div>

            <!-- Auto-Refresh Switch -->
            <div class="auto-refresh-box">
              <label class="switch-label">
                <input type="checkbox" id="market-auto-refresh-toggle" checked />
                <span class="switch-slider"></span>
              </label>
              <span class="auto-refresh-text">Auto (30s)</span>
            </div>

            <!-- Botão Atualizar Geral -->
            <button id="btn-market-refresh" class="btn-market btn-refresh-primary" title="Buscar cotações e ordens agora">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span>Atualizar</span>
            </button>
          </div>
        </header>

        <!-- BANNER DE AVISO: REQUISIÇÕES DESATIVADAS -->
        <div class="market-requests-disabled-banner" id="market-requests-disabled-banner" style="display: ${this.isRequestsEnabled ? 'none' : 'flex'};">
          <div class="banner-left">
            <span class="banner-icon">🛑</span>
            <div class="banner-text-col">
              <span class="banner-title">Requisições de Mercado Desativadas</span>
              <span class="banner-desc">O switch de requisições está desligado. Nenhuma requisição ou consulta à API do jogo será realizada pela tela de mercado.</span>
            </div>
          </div>
          <button id="btn-banner-enable-requests" class="btn-banner-enable">
            <span>Ativar Requisições</span>
          </button>
        </div>

        <!-- 3. NAVEGAÇÃO PRINCIPAL DE ABAS: MERCADO GERAL VS MEU MERCADO -->
        <nav class="market-main-tabs" role="tablist">
          <button class="market-main-tab-btn active" id="btn-main-tab-general" data-tab="general" role="tab" aria-selected="true">
            <span class="tab-btn-icon">🌐</span>
            <div class="tab-btn-text">
              <span class="tab-btn-title">Mercado Geral</span>
              <span class="tab-btn-sub">Cotações, Gráficos & Listings Globais</span>
            </div>
          </button>

          <button class="market-main-tab-btn" id="btn-main-tab-my-market" data-tab="my-market" role="tab" aria-selected="false">
            <span class="tab-btn-icon">💼</span>
            <div class="tab-btn-text">
              <div class="tab-title-row">
                <span class="tab-btn-title">Meu Mercado</span>
                <span class="tab-count-badge" id="my-market-count-badge">0</span>
              </div>
              <span class="tab-btn-sub" id="my-market-account-indicator">Vinculado à Conta 01</span>
            </div>
          </button>
        </nav>

        <!-- ==========================================================
             VISÃO 1: MERCADO GERAL (PRESERVADO)
             ========================================================== -->
        <div id="market-general-view-container" class="market-tab-content active">

          <!-- BARRA DE SELEÇÃO: ITENS E MOEDAS -->
          <section class="market-control-bar">
            <div class="item-tabs-group">
              <button class="item-tab active" data-item="diamonds" id="tab-item-diamonds">
                <span class="tab-icon">💎</span>
                <span class="tab-text">Diamonds</span>
              </button>
              <button class="item-tab" data-item="pheromones" id="tab-item-pheromones">
                <span class="tab-icon">🧪</span>
                <span class="tab-text">Strange Pheromones</span>
                <span class="tab-badge">#44417</span>
              </button>
            </div>

            <div class="currency-filter-group">
              <label for="market-currency-select" class="currency-label">Moeda / Pagamento:</label>
              <select id="market-currency-select" class="market-select currency-dropdown">
                <option value="dollars" selected>💵 Dollar ($)</option>
                <option value="diamonds">💎 Diamonds</option>
              </select>
            </div>

            <div class="outlier-filter-group">
              <label class="checkbox-container" title="Remove ofertas com valores absurdos de troll para não distorcer o gráfico e as médias">
                <input type="checkbox" id="market-outlier-toggle" checked />
                <span class="checkbox-checkmark"></span>
                <span>Filtrar Outliers</span>
              </label>
            </div>

            <div class="last-update-box">
              <span id="market-last-update-time">Aguardando dados...</span>
            </div>
          </section>

          <!-- KPI CARDS + ALERTA DE OPORTUNIDADE -->
          <section class="market-kpi-grid">
            <!-- 1. Menor Preço de Venda -->
            <div class="market-kpi-card highlight-card-blue">
              <div class="kpi-top">
                <span class="kpi-title">Menor Preço de Venda</span>
                <span class="kpi-icon">🏷️</span>
              </div>
              <div class="kpi-main-value" id="kpi-market-min-price">--</div>
              <div class="kpi-footer-meta">Valor mais barato disponível para compra imediata</div>
            </div>

            <!-- 2. Quantidade Disponível -->
            <div class="market-kpi-card">
              <div class="kpi-top">
                <span class="kpi-title">Quantidade Disponível</span>
                <span class="kpi-icon">📦</span>
              </div>
              <div class="kpi-main-value" id="kpi-market-volume">--</div>
              <div class="kpi-footer-meta">Volume total atualmente à venda no mercado</div>
            </div>

            <!-- 3. Preço Médio Ponderado -->
            <div class="market-kpi-card">
              <div class="kpi-top">
                <span class="kpi-title">Preço Médio Ponderado</span>
                <span class="kpi-icon">📊</span>
              </div>
              <div class="kpi-main-value" id="kpi-market-avg-price">--</div>
              <div class="kpi-footer-meta">Média ponderada pelo volume das ofertas</div>
            </div>

            <!-- 4. Melhor Pedido de Compra -->
            <div class="market-kpi-card">
              <div class="kpi-top">
                <span class="kpi-title">Melhor Pedido de Compra</span>
                <span class="kpi-icon">🤝</span>
              </div>
              <div class="kpi-main-value" id="kpi-market-request-price">--</div>
              <div class="kpi-footer-meta">Maior oferta ativa de compra (Requests)</div>
            </div>

            <!-- 5. Card de Alerta de Oportunidade -->
            <div class="market-kpi-card opportunity-card" id="market-opportunity-card">
              <div class="kpi-top">
                <span class="kpi-title">Alerta de Oportunidade</span>
                <span class="opportunity-pill" id="market-opportunity-badge">Definir Alvo</span>
              </div>
              <div class="opportunity-input-row">
                <span class="currency-symbol">🎯</span>
                <input type="number" id="market-target-price-input" class="target-input" placeholder="Preço Máximo de Compra..." />
                <button id="btn-save-target-price" class="btn-save-target" title="Salvar preço alvo">Salvar</button>
              </div>
              <div class="kpi-footer-meta" id="market-opportunity-meta">Avisa quando o menor preço de venda estiver igual ou abaixo do alvo</div>
            </div>
          </section>

          <!-- GRÁFICO DE HISTÓRICO DE PREÇOS (CHART.JS) -->
          <section class="market-chart-section">
            <div class="chart-card">
              <div class="chart-header">
                <div class="chart-header-left">
                  <h3 class="chart-title">Gráfico de Histórico de Preços</h3>
                  <span class="chart-subtitle" id="market-chart-subtitle">
                    Anúncios de venda ordenados cronologicamente pelo campo <strong>at</strong> (do mais antigo para o mais recente)
                  </span>
                </div>

                <div class="chart-view-modes">
                  <button class="mode-tab active" id="btn-chart-mode-listings" title="Exibe cada anúncio do mercado ordenado cronologicamente por 'at'">
                    <span>Anúncios de Venda (at vs Preço)</span>
                  </button>
                  <button class="mode-tab" id="btn-chart-mode-history" title="Exibe a evolução do menor preço e média ao longo do tempo">
                    <span>Evolução Temporal</span>
                  </button>
                </div>
              </div>

              <div class="chart-viewport" id="market-chart-container">
                <canvas id="market-chart-canvas"></canvas>
                <div class="chart-empty" id="market-chart-empty" style="display: none;">
                  <span class="empty-icon">📈</span>
                  <span id="market-chart-empty-msg">Nenhum anúncio encontrado para este item nesta moeda.</span>
                  <small>Clique em Atualizar ou verifique se há ordens ativas no jogo.</small>
                </div>
              </div>
            </div>
          </section>

          <!-- BOOK DE OFERTAS & LISTAGEM DO MERCADO GERAL -->
          <section class="market-orders-section">
            <div class="orders-card">
              <div class="orders-header">
                <div class="orders-header-left">
                  <h3 class="orders-title">Anúncios de Venda (Listings Globais)</h3>
                  <span class="orders-count" id="market-orders-counter">0 ofertas</span>
                </div>

                <div class="orders-filters">
                  <select id="market-order-type-select" class="market-select">
                    <option value="offer" selected>Apenas Vendas (Listings)</option>
                    <option value="all">Todas as Ordens</option>
                    <option value="request">Apenas Compras (Requests)</option>
                  </select>
                </div>
              </div>

              <div class="table-container">
                <table class="market-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">Tipo</th>
                      <th style="min-width: 160px;">Item</th>
                      <th style="width: 110px;">Quantidade</th>
                      <th style="width: 140px;">Preço Unitário</th>
                      <th style="width: 140px;">Preço Total</th>
                      <th style="width: 130px;">Vendedor</th>
                      <th style="width: 110px;">Data/Hora (at)</th>
                    </tr>
                  </thead>
                  <tbody id="market-orders-tbody">
                    <!-- Linhas renderizadas dinamicamente -->
                  </tbody>
                </table>
              </div>

              <!-- ESTADO VAZIO DO MERCADO GERAL -->
              <div id="market-empty-state" class="market-empty-state">
                <div class="empty-icon-circle">🛒</div>
                <h4>Nenhum anúncio encontrado no mercado</h4>
                <p>Verifique o token JWT ou clique em <strong>Atualizar</strong> acima para carregar as ofertas ativas.</p>
              </div>
            </div>
          </section>
        </div>

        <!-- ==========================================================
             VISÃO 2: "MEU MERCADO" (VINCULADO À CONTA SELECIONADA)
             ========================================================== -->
        <div id="market-my-view-container" class="market-tab-content my-market-view" style="display: none;">

          <!-- BANNER TOPO DE "MEU MERCADO" -->
          <section class="my-market-banner">
            <div class="my-market-banner-left">
              <div class="my-market-pill-tag">
                <span class="pill-account-badge" id="my-market-account-tag">CONTA 01</span>
                <span>CARTEIRA & ORDENS ATIVAS NO SERVIDOR</span>
              </div>
              <h2 class="my-market-headline" id="my-market-main-title">
                Posições no Mercado da Conta 01
              </h2>
              <p class="my-market-subtext" id="my-market-main-desc">
                Exibe em tempo real suas ofertas de venda (<code class="code-tag">myOffers</code>) e pedidos de compra (<code class="code-tag">myRequests</code>) posicionados no Poke Idle World.
              </p>
            </div>

            <div class="my-market-banner-actions">
              <button id="btn-refresh-my-market" class="btn-market btn-refresh-primary" title="Consultar ordens desta conta na API">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <span>Atualizar Meu Mercado</span>
              </button>

              <button id="btn-open-game-market" class="btn-market btn-open-game" title="Focar a janela do jogo desta conta para criar ou editar ordens">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                <span>Focar no Jogo</span>
              </button>
            </div>
          </section>

          <!-- KPIS CONSOLIDADOS DE "MEU MERCADO" -->
          <section class="my-market-kpis-grid">
            <!-- 1. Total de Minhas Vendas -->
            <div class="market-kpi-card my-kpi-card my-kpi-offers">
              <div class="kpi-top">
                <span class="kpi-title">Minhas Ofertas de Venda</span>
                <span class="kpi-icon">🏷️</span>
              </div>
              <div class="kpi-main-value" id="kpi-my-offers-count">0</div>
              <div class="kpi-footer-meta" id="kpi-my-offers-meta">0 itens posicionados à venda</div>
            </div>

            <!-- 2. Capital Esperado em Vendas -->
            <div class="market-kpi-card my-kpi-card my-kpi-offers-val">
              <div class="kpi-top">
                <span class="kpi-title">Valor Total à Venda</span>
                <span class="kpi-icon">💰</span>
              </div>
              <div class="kpi-main-value" id="kpi-my-offers-value">$ 0</div>
              <div class="kpi-footer-meta">Montante bruto se todas as vendas forem concluídas</div>
            </div>

            <!-- 3. Total de Meus Pedidos de Compra -->
            <div class="market-kpi-card my-kpi-card my-kpi-requests">
              <div class="kpi-top">
                <span class="kpi-title">Meus Pedidos de Compra</span>
                <span class="kpi-icon">📥</span>
              </div>
              <div class="kpi-main-value" id="kpi-my-requests-count">0</div>
              <div class="kpi-footer-meta" id="kpi-my-requests-meta">0 ordens ativas aguardando vendedores</div>
            </div>

            <!-- 4. Capital Alocado em Compras -->
            <div class="market-kpi-card my-kpi-card my-kpi-requests-val">
              <div class="kpi-top">
                <span class="kpi-title">Capital Alocado em Compras</span>
                <span class="kpi-icon">🔒</span>
              </div>
              <div class="kpi-main-value" id="kpi-my-requests-value">$ 0</div>
              <div class="kpi-footer-meta">Fundos retidos no cofre do mercado para as compras</div>
            </div>
          </section>

          <!-- TABELA E FILTROS DE "MEU MERCADO" -->
          <section class="orders-card my-market-orders-card">
            <div class="orders-header my-orders-header">
              <div class="orders-header-left">
                <div class="my-filter-pills">
                  <button class="my-filter-btn active" id="btn-my-filter-all" data-filter="all">
                    Todas as Ordens
                  </button>
                  <button class="my-filter-btn" id="btn-my-filter-offers" data-filter="offer">
                    Minhas Vendas (myOffers)
                  </button>
                  <button class="my-filter-btn" id="btn-my-filter-requests" data-filter="request">
                    Meus Pedidos (myRequests)
                  </button>
                </div>
                <span class="orders-count" id="my-market-orders-counter">0 ordens</span>
              </div>

              <div class="my-orders-filters-right">
                <!-- Busca de Item -->
                <div class="my-search-box">
                  <span class="search-icon">🔍</span>
                  <input type="text" id="my-market-search-input" class="my-search-input" placeholder="Filtrar por nome ou ID..." />
                </div>

                <!-- Moeda -->
                <select id="my-market-currency-select" class="market-select">
                  <option value="all" selected>Todas as Moedas</option>
                  <option value="dollars">💵 Dollar ($)</option>
                  <option value="diamonds">💎 Diamonds</option>
                </select>
              </div>
            </div>

            <div class="table-container">
              <table class="market-table my-market-table">
                <thead>
                  <tr>
                    <th style="width: 110px;">Tipo</th>
                    <th style="min-width: 170px;">Item Anunciado</th>
                    <th style="width: 100px;">Categoria</th>
                    <th style="width: 110px;">Quantidade</th>
                    <th style="width: 130px;">Preço Unitário</th>
                    <th style="width: 130px;">Preço Total</th>
                    <th style="width: 100px;">Moeda</th>
                    <th style="width: 120px;">Data/Hora (at)</th>
                    <th style="width: 110px;">Status</th>
                    <th style="width: 90px; text-align: center;">Ações</th>
                  </tr>
                </thead>
                <tbody id="my-market-orders-tbody">
                  <!-- Linhas renderizadas dinamicamente -->
                </tbody>
              </table>
            </div>

            <!-- ESTADO VAZIO DE "MEU MERCADO" -->
            <div id="my-market-empty-state" class="market-empty-state">
              <div class="empty-icon-circle">💼</div>
              <h4 id="my-market-empty-title">Nenhuma ordem encontrada nesta conta</h4>
              <p id="my-market-empty-desc">
                A <strong>Conta 01</strong> não possui ofertas de venda (<code class="code-tag">myOffers</code>) ou pedidos de compra (<code class="code-tag">myRequests</code>) ativos no momento.
              </p>
              <div class="empty-actions-row">
                <button id="btn-empty-refresh-my" class="btn-market btn-refresh-primary">
                  Atualizar Agora
                </button>
                <button id="btn-empty-detect-token" class="btn-token-action" style="padding: 6px 14px; font-size: 12px;">
                  Re-detectar Token JWT
                </button>
              </div>
            </div>
          </section>
        </div>

      </div>

      <!-- ==========================================================
           MODAL DE CONFIGURAÇÃO DE TOKENS JWT (MULTI-CONTAS)
           ========================================================== -->
      <div class="market-modal-backdrop" id="market-token-modal" style="display: none;">
        <div class="market-modal-card">
          <div class="modal-top">
            <div class="modal-title-wrap">
              <span class="modal-icon">🔑</span>
              <div>
                <h3>Gerenciador de Tokens JWT das 4 Contas</h3>
                <span class="modal-sub">Mapeamento individual de Bearer Token para cada slot do jogo</span>
              </div>
            </div>
            <button id="btn-close-token-modal" class="btn-modal-close" aria-label="Fechar">✕</button>
          </div>

          <div class="modal-body">
            <!-- Abas internas para escolher a conta -->
            <div class="modal-account-tabs" id="modal-account-tabs">
              <!-- Renderizado dinamicamente -->
            </div>

            <div class="token-input-box">
              <div class="token-box-header">
                <label for="market-manual-token-input" id="modal-token-target-label">
                  Bearer Token JWT da <strong>Conta 01</strong>:
                </label>
                <span class="token-length-badge" id="modal-token-length-badge">Não configurado</span>
              </div>
              <textarea id="market-manual-token-input" rows="4" placeholder="Cole aqui o token JWT que começa com 'ey...' para esta conta..."></textarea>
            </div>

            <p class="modal-tip">
              💡 <em>Dica:</em> Você pode clicar em <strong>"Auto-Detectar Desta Conta"</strong> ou <strong>"Detectar Todas"</strong> para que o app extraia automaticamente os tokens dos slots logados via WebView!
            </p>
          </div>

          <div class="modal-footer">
            <div class="modal-footer-left">
              <button id="btn-modal-autodetect-acc" class="btn-token-action btn-modal-tool" title="Tenta ler o token do webview da conta selecionada">
                Auto-Detectar Desta Conta
              </button>
              <button id="btn-modal-autodetect-all" class="btn-token-action btn-modal-tool" title="Varre todos os 4 slots abertos">
                Detectar Todas as 4
              </button>
              <button id="btn-modal-clear-token" class="btn-token-action btn-modal-danger" title="Limpa o token salvo para esta conta">
                Limpar
              </button>
            </div>

            <div class="modal-footer-right">
              <button id="btn-save-manual-token" class="btn-market btn-save-primary">Salvar Token</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindDom(): void {
    // Barra Horizontal de Contas
    this.elAccountsTrack = this.element.querySelector('#accounts-horizontal-track') as HTMLElement;
    this.elBtnAutoDetectAllTokens = this.element.querySelector('#btn-market-auto-all-tokens') as HTMLButtonElement;
    this.elBtnManageTokens = this.element.querySelector('#btn-market-manage-tokens') as HTMLButtonElement;

    // Navegação Principal de Abas
    this.elBtnMainTabGeneral = this.element.querySelector('#btn-main-tab-general') as HTMLButtonElement;
    this.elBtnMainTabMyMarket = this.element.querySelector('#btn-main-tab-my-market') as HTMLButtonElement;
    this.elMyMarketCountBadge = this.element.querySelector('#my-market-count-badge') as HTMLElement;
    this.elMyMarketAccountIndicator = this.element.querySelector('#my-market-account-indicator') as HTMLElement;
    this.elGeneralViewContainer = this.element.querySelector('#market-general-view-container') as HTMLElement;
    this.elMyViewContainer = this.element.querySelector('#market-my-view-container') as HTMLElement;

    // Switch Master de Permissão de Requisições
    this.elRequestsToggle = this.element.querySelector('#market-requests-master-toggle') as HTMLInputElement;
    this.elRequestsMasterText = this.element.querySelector('#market-requests-master-text') as HTMLElement;
    this.elRequestsMasterDot = this.element.querySelector('#market-requests-master-dot') as HTMLElement;
    this.elRequestsDisabledBanner = this.element.querySelector('#market-requests-disabled-banner') as HTMLElement;

    const btnBannerEnable = this.element.querySelector('#btn-banner-enable-requests') as HTMLButtonElement | null;
    btnBannerEnable?.addEventListener('click', () => {
      this.setRequestsEnabled(true);
    });

    // Cabeçalho Geral
    this.elItemIndicatorLabel = this.element.querySelector('#market-current-item-label') as HTMLElement;
    this.elTokenStatusBadge = this.element.querySelector('#market-token-status-text') as HTMLElement;
    this.elTokenDot = this.element.querySelector('#market-token-dot') as HTMLElement;
    this.elBtnAutoDetectToken = this.element.querySelector('#btn-market-auto-token') as HTMLButtonElement;
    this.elBtnConfigureToken = this.element.querySelector('#btn-market-cfg-token') as HTMLButtonElement;
    this.elBtnRefreshNow = this.element.querySelector('#btn-market-refresh') as HTMLButtonElement;
    this.elAutoRefreshToggle = this.element.querySelector('#market-auto-refresh-toggle') as HTMLInputElement;

    // Mercado Geral - Controles
    this.elBtnItemDiamonds = this.element.querySelector('#tab-item-diamonds') as HTMLButtonElement;
    this.elBtnItemPheromones = this.element.querySelector('#tab-item-pheromones') as HTMLButtonElement;
    this.elCurrencySelect = this.element.querySelector('#market-currency-select') as HTMLSelectElement;
    this.elOutlierToggle = this.element.querySelector('#market-outlier-toggle') as HTMLInputElement;
    this.elLastUpdateText = this.element.querySelector('#market-last-update-time') as HTMLElement;

    // Mercado Geral - KPIs
    this.elKpiMinPrice = this.element.querySelector('#kpi-market-min-price') as HTMLElement;
    this.elKpiAvgPrice = this.element.querySelector('#kpi-market-avg-price') as HTMLElement;
    this.elKpiVolume = this.element.querySelector('#kpi-market-volume') as HTMLElement;
    this.elKpiRequestPrice = this.element.querySelector('#kpi-market-request-price') as HTMLElement;
    this.elOpportunityCard = this.element.querySelector('#market-opportunity-card') as HTMLElement;
    this.elOpportunityBadge = this.element.querySelector('#market-opportunity-badge') as HTMLElement;
    this.elTargetPriceInput = this.element.querySelector('#market-target-price-input') as HTMLInputElement;
    this.elBtnSaveTargetPrice = this.element.querySelector('#btn-save-target-price') as HTMLButtonElement;

    // Mercado Geral - Gráfico
    this.elChartCanvas = this.element.querySelector('#market-chart-canvas') as HTMLCanvasElement;
    this.elChartEmptyState = this.element.querySelector('#market-chart-empty') as HTMLElement;
    this.elBtnModeListings = this.element.querySelector('#btn-chart-mode-listings') as HTMLButtonElement;
    this.elBtnModeHistory = this.element.querySelector('#btn-chart-mode-history') as HTMLButtonElement;
    this.elChartSubtitle = this.element.querySelector('#market-chart-subtitle') as HTMLElement;

    // Mercado Geral - Tabela
    this.elOrderTypeFilterSelect = this.element.querySelector('#market-order-type-select') as HTMLSelectElement;
    this.elTableBody = this.element.querySelector('#market-orders-tbody') as HTMLElement;
    this.elEmptyState = this.element.querySelector('#market-empty-state') as HTMLElement;
    this.elOrdersCounter = this.element.querySelector('#market-orders-counter') as HTMLElement;

    // Meu Mercado - Banner & Ações
    this.elMyMarketTitle = this.element.querySelector('#my-market-main-title') as HTMLElement;
    this.elMyMarketSubtitle = this.element.querySelector('#my-market-main-desc') as HTMLElement;
    this.elBtnRefreshMyMarket = this.element.querySelector('#btn-refresh-my-market') as HTMLButtonElement;
    this.elBtnOpenMyMarketInGame = this.element.querySelector('#btn-open-game-market') as HTMLButtonElement;

    // Meu Mercado - KPIs
    this.elMyKpiOffersCount = this.element.querySelector('#kpi-my-offers-count') as HTMLElement;
    this.elMyKpiOffersValue = this.element.querySelector('#kpi-my-offers-value') as HTMLElement;
    this.elMyKpiRequestsCount = this.element.querySelector('#kpi-my-requests-count') as HTMLElement;
    this.elMyKpiRequestsValue = this.element.querySelector('#kpi-my-requests-value') as HTMLElement;

    // Meu Mercado - Filtros & Tabela
    this.elBtnMyFilterAll = this.element.querySelector('#btn-my-filter-all') as HTMLButtonElement;
    this.elBtnMyFilterOffers = this.element.querySelector('#btn-my-filter-offers') as HTMLButtonElement;
    this.elBtnMyFilterRequests = this.element.querySelector('#btn-my-filter-requests') as HTMLButtonElement;
    this.elMySearchInput = this.element.querySelector('#my-market-search-input') as HTMLInputElement;
    this.elMyCurrencySelect = this.element.querySelector('#my-market-currency-select') as HTMLSelectElement;
    this.elMyOrdersCounter = this.element.querySelector('#my-market-orders-counter') as HTMLElement;
    this.elMyTableBody = this.element.querySelector('#my-market-orders-tbody') as HTMLElement;
    this.elMyEmptyState = this.element.querySelector('#my-market-empty-state') as HTMLElement;

    // Modal de Tokens
    this.elTokenModal = this.element.querySelector('#market-token-modal') as HTMLElement;
    this.elTokenModalAccountTabs = this.element.querySelector('#modal-account-tabs') as HTMLElement;
    this.elTokenModalSelectedLabel = this.element.querySelector('#modal-token-target-label') as HTMLElement;
    this.elTokenModalInput = this.element.querySelector('#market-manual-token-input') as HTMLTextAreaElement;
    this.elBtnSaveModalToken = this.element.querySelector('#btn-save-manual-token') as HTMLButtonElement;
    this.elBtnAutoDetectModalAccount = this.element.querySelector('#btn-modal-autodetect-acc') as HTMLButtonElement;
    this.elBtnAutoDetectModalAll = this.element.querySelector('#btn-modal-autodetect-all') as HTMLButtonElement;
    this.elBtnClearModalToken = this.element.querySelector('#btn-modal-clear-token') as HTMLButtonElement;
    this.elBtnCloseTokenModal = this.element.querySelector('#btn-close-token-modal') as HTMLButtonElement;

    // Botões dentro do estado vazio de Meu Mercado
    const btnEmptyRefresh = this.element.querySelector('#btn-empty-refresh-my') as HTMLButtonElement | null;
    const btnEmptyDetect = this.element.querySelector('#btn-empty-detect-token') as HTMLButtonElement | null;

    btnEmptyRefresh?.addEventListener('click', () => this.refreshMyMarketData(true));
    btnEmptyDetect?.addEventListener('click', () => this.tryAutoDetectTokenForActiveAccount(true));
  }

  private initEvents(): void {
    // ------------------------------------------
    // AÇÕES DA BARRA HORIZONTAL DE CONTAS
    // ------------------------------------------
    this.elBtnAutoDetectAllTokens.addEventListener('click', async () => {
      await this.tryAutoDetectAllAccounts(true);
    });

    this.elBtnManageTokens.addEventListener('click', () => {
      this.openTokenModal(this.activeAccountId);
    });

    // ------------------------------------------
    // NAVEGAÇÃO ENTRE ABAS PRINCIPAIS
    // ------------------------------------------
    this.elBtnMainTabGeneral.addEventListener('click', () => {
      this.switchMainTab('general');
    });

    this.elBtnMainTabMyMarket.addEventListener('click', () => {
      this.switchMainTab('my-market');
    });

    // ------------------------------------------
    // SWITCH MASTER DE REQUISIÇÕES
    // ------------------------------------------
    this.elRequestsToggle?.addEventListener('change', () => {
      this.setRequestsEnabled(this.elRequestsToggle.checked);
    });

    // ------------------------------------------
    // BOTÕES DO CABEÇALHO GERAL
    // ------------------------------------------
    this.elBtnRefreshNow.addEventListener('click', () => {
      if (this.currentMainTab === 'general') {
        this.refreshMarketData(true);
      } else {
        this.refreshMyMarketData(true);
      }
    });

    this.elAutoRefreshToggle.addEventListener('change', () => {
      this.isAutoRefreshEnabled = this.elAutoRefreshToggle.checked;
      this.setupAutoRefreshTimer();
    });

    this.elBtnAutoDetectToken.addEventListener('click', async () => {
      await this.tryAutoDetectTokenForActiveAccount(true);
    });

    this.elBtnConfigureToken.addEventListener('click', () => {
      this.openTokenModal(this.activeAccountId);
    });

    // ------------------------------------------
    // EVENTOS DO MERCADO GERAL
    // ------------------------------------------
    this.elBtnItemDiamonds.addEventListener('click', () => {
      this.switchItem('diamonds');
    });

    this.elBtnItemPheromones.addEventListener('click', () => {
      this.switchItem('pheromones');
    });

    this.elCurrencySelect.addEventListener('change', () => {
      this.currentCurrency = this.elCurrencySelect.value as MarketCurrency;
      this.loadSavedTargetPriceInput();
      this.refreshMarketData();
    });

    this.elOutlierToggle.addEventListener('change', () => {
      this.filterOutliers = this.elOutlierToggle.checked;
      this.refreshMarketData();
    });

    this.elOrderTypeFilterSelect.addEventListener('change', () => {
      this.orderTypeFilter = this.elOrderTypeFilterSelect.value as any;
      this.renderTable();
    });

    this.elBtnModeListings.addEventListener('click', () => {
      if (this.chartMode === 'listings') return;
      this.chartMode = 'listings';
      this.elBtnModeListings.classList.add('active');
      this.elBtnModeHistory.classList.remove('active');
      this.elChartSubtitle.innerHTML =
        'Anúncios de venda ordenados cronologicamente pelo campo <strong>at</strong> (do mais antigo para o mais recente)';
      this.renderChart();
    });

    this.elBtnModeHistory.addEventListener('click', () => {
      if (this.chartMode === 'history') return;
      this.chartMode = 'history';
      this.elBtnModeHistory.classList.add('active');
      this.elBtnModeListings.classList.remove('active');
      this.elChartSubtitle.innerHTML =
        'Evolução contínua do <strong>Menor Preço de Venda</strong> e da <strong>Média</strong> gravados ao longo do tempo';
      this.renderChart();
    });

    this.elBtnSaveTargetPrice.addEventListener('click', () => {
      const val = parseFloat(this.elTargetPriceInput.value);
      this.marketService.setTargetPrice(this.currentItem, this.currentCurrency, isNaN(val) ? 0 : val);
      this.onToast?.(`Preço alvo para ${MONITORED_ITEMS[this.currentItem].name} salvo!`, 'success');
      this.refreshMarketData();
    });

    // ------------------------------------------
    // EVENTOS DE "MEU MERCADO"
    // ------------------------------------------
    this.elBtnRefreshMyMarket.addEventListener('click', () => {
      this.refreshMyMarketData(true);
    });

    this.elBtnOpenMyMarketInGame.addEventListener('click', () => {
      this.onNavigateToAccount?.(this.activeAccountId);
      this.onToast?.(`Janela do jogo alterada para a ${this.getAccountName(this.activeAccountId)}`, 'info', 2500);
    });

    this.elBtnMyFilterAll.addEventListener('click', () => {
      this.setMyMarketFilterType('all');
    });

    this.elBtnMyFilterOffers.addEventListener('click', () => {
      this.setMyMarketFilterType('offer');
    });

    this.elBtnMyFilterRequests.addEventListener('click', () => {
      this.setMyMarketFilterType('request');
    });

    this.elMySearchInput.addEventListener('input', () => {
      this.myMarketSearchQuery = this.elMySearchInput.value.toLowerCase().trim();
      this.renderMyMarketTable();
    });

    this.elMyCurrencySelect.addEventListener('change', () => {
      this.myMarketCurrencyFilter = this.elMyCurrencySelect.value as any;
      this.renderMyMarketTable();
    });

    // ------------------------------------------
    // EVENTOS DO MODAL DE TOKENS
    // ------------------------------------------
    this.elBtnCloseTokenModal.addEventListener('click', () => {
      this.elTokenModal.style.display = 'none';
    });

    this.elBtnSaveModalToken.addEventListener('click', () => {
      const token = this.elTokenModalInput.value.trim();
      this.marketService.setAccountToken(this.modalSelectedAccountId, token);
      this.updateAccountsBar();
      this.updateTokenStatusBadge();
      this.updateModalTokenLength();
      this.onToast?.(`Token da ${this.getAccountName(this.modalSelectedAccountId)} salvo!`, 'success');

      // Se foi a conta ativa, recarrega os dados
      if (this.modalSelectedAccountId === this.activeAccountId) {
        if (this.currentMainTab === 'general') {
          this.refreshMarketData();
        } else {
          this.refreshMyMarketData();
        }
      }
    });

    this.elBtnAutoDetectModalAccount.addEventListener('click', async () => {
      await this.tryAutoDetectTokenForAccount(this.modalSelectedAccountId, true);
      this.elTokenModalInput.value = this.marketService.getAccountToken(this.modalSelectedAccountId) || '';
      this.updateModalTokenLength();
    });

    this.elBtnAutoDetectModalAll.addEventListener('click', async () => {
      await this.tryAutoDetectAllAccounts(true);
      this.elTokenModalInput.value = this.marketService.getAccountToken(this.modalSelectedAccountId) || '';
      this.updateModalTokenLength();
    });

    this.elBtnClearModalToken.addEventListener('click', () => {
      this.marketService.setAccountToken(this.modalSelectedAccountId, '');
      this.elTokenModalInput.value = '';
      this.updateAccountsBar();
      this.updateTokenStatusBadge();
      this.updateModalTokenLength();
      this.onToast?.(`Token da ${this.getAccountName(this.modalSelectedAccountId)} removido.`, 'info');
    });

    // Inicialização da interface
    this.updateAccountsBar();
    this.updateTokenStatusBadge();
    this.loadSavedTargetPriceInput();
    this.setupAutoRefreshTimer();
  }

  // ==========================================
  // GESTÃO DA BARRA HORIZONTAL DE CONTAS
  // ==========================================

  private getAccountName(accountId: string): string {
    const acc = MARKET_ACCOUNTS.find((a) => a.id === accountId);
    return acc ? acc.name : accountId;
  }

  public updateAccountsBar(): void {
    if (!this.elAccountsTrack) return;

    this.elAccountsTrack.innerHTML = MARKET_ACCOUNTS.map((acc) => {
      const isActive = acc.id === this.activeAccountId;
      const token = this.marketService.getAccountToken(acc.id);
      const hasToken = !!token;

      return `
        <button class="account-pill-btn ${isActive ? 'active' : ''}" data-account-id="${acc.id}">
          <span class="pill-dot ${hasToken ? 'dot-active' : 'dot-inactive'}"></span>
          <span class="pill-short-badge">${acc.short}</span>
          <span class="pill-name">${acc.name}</span>
          <span class="pill-token-tag ${hasToken ? 'tag-ok' : 'tag-missing'}">
            ${hasToken ? 'JWT OK' : 'Sem Token'}
          </span>
          ${isActive ? '<span class="pill-active-glow"></span>' : ''}
        </button>
      `;
    }).join('');

    // Reanexa eventos de clique nas 4 opções
    this.elAccountsTrack.querySelectorAll('.account-pill-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-account-id');
        if (targetId) {
          await this.selectAccount(targetId);
        }
      });
    });

    // Atualiza rótulo de Meu Mercado
    if (this.elMyMarketAccountIndicator) {
      this.elMyMarketAccountIndicator.textContent = `Vinculado à ${this.getAccountName(this.activeAccountId)}`;
    }
    const tag = document.getElementById('my-market-account-tag');
    if (tag) {
      tag.textContent = this.getAccountName(this.activeAccountId).toUpperCase();
    }
    if (this.elMyMarketTitle) {
      this.elMyMarketTitle.textContent = `Posições no Mercado da ${this.getAccountName(this.activeAccountId)}`;
    }
  }

  /**
   * Dispara a seleção de uma conta na linha horizontal:
   * 1. Atualiza o token global/ativo
   * 2. Aplica destaque visual imediato
   * 3. Dispara a busca correspondente na API
   */
  public async selectAccount(accountId: string): Promise<void> {
    if (this.activeAccountId === accountId) return;

    this.activeAccountId = accountId;
    this.marketService.setActiveAccountId(accountId);

    this.updateAccountsBar();
    this.updateTokenStatusBadge();

    // Se a conta selecionada ainda não tem token, tenta auto-detectar silenciosamente do webview correspondente
    if (!this.marketService.getAccountToken(accountId)) {
      await this.tryAutoDetectTokenForAccount(accountId, false);
      this.updateAccountsBar();
      this.updateTokenStatusBadge();
    }

    const accountName = this.getAccountName(accountId);
    const hasToken = !!this.marketService.getToken();

    this.onToast?.(
      hasToken
        ? `${accountName} selecionada! Token ativo carregado.`
        : `${accountName} selecionada. (Sem token JWT configurado)`,
      hasToken ? 'info' : 'danger',
      2000,
    );

    // Se as requisições estiverem desativadas pelo switch, apenas avisa e não dispara consultas
    if (!this.isRequestsEnabled) {
      this.onToast?.(
        `${accountName} selecionada (Requisições pausadas pelo switch)`,
        'info',
        2500,
      );
      return;
    }

    // Dispara a busca de dados correspondente à aba atualmente visível
    if (this.currentMainTab === 'general') {
      this.refreshMarketData(true);
    } else {
      this.refreshMyMarketData(true);
    }
  }

  // ==========================================
  // NAVEGAÇÃO DE ABAS (MERCADO GERAL VS MEU MERCADO)
  // ==========================================

  public switchMainTab(tab: 'general' | 'my-market'): void {
    if (this.currentMainTab === tab) return;
    this.currentMainTab = tab;

    this.elBtnMainTabGeneral.classList.toggle('active', tab === 'general');
    this.elBtnMainTabGeneral.setAttribute('aria-selected', String(tab === 'general'));

    this.elBtnMainTabMyMarket.classList.toggle('active', tab === 'my-market');
    this.elBtnMainTabMyMarket.setAttribute('aria-selected', String(tab === 'my-market'));

    if (tab === 'general') {
      this.elGeneralViewContainer.style.display = 'block';
      this.elMyViewContainer.style.display = 'none';
      if (this.latestListings.length === 0) {
        this.refreshMarketData();
      }
    } else {
      this.elGeneralViewContainer.style.display = 'none';
      this.elMyViewContainer.style.display = 'block';
      this.refreshMyMarketData();
    }
  }

  // ==========================================
  // AUTO-DETECÇÃO DE TOKENS JWT
  // ==========================================

  private async tryAutoDetectTokenForAccount(accountId: string, showToast = true): Promise<boolean> {
    const accounts = this.getAccountOptions();
    const targetOption = accounts.find((a) => a.id === accountId);

    if (!targetOption || !targetOption.webview) {
      if (showToast) {
        this.onToast?.(
          `Slot da ${this.getAccountName(accountId)} não encontrado ou não inicializado.`,
          'danger',
        );
      }
      return false;
    }

    const token = await this.marketService.autoDetectTokenForAccount(accountId, targetOption.webview);
    if (token) {
      this.updateAccountsBar();
      this.updateTokenStatusBadge();
      if (showToast) {
        this.onToast?.(`✔ Token detectado com sucesso para a ${this.getAccountName(accountId)}!`, 'success');
      }
      return true;
    } else {
      if (showToast) {
        this.onToast?.(
          `Não foi possível encontrar o token na ${this.getAccountName(accountId)}. Verifique se você já fez login no jogo.`,
          'info',
        );
      }
      return false;
    }
  }

  private async tryAutoDetectTokenForActiveAccount(showToast = true): Promise<void> {
    const ok = await this.tryAutoDetectTokenForAccount(this.activeAccountId, showToast);
    if (ok) {
      if (this.currentMainTab === 'general') {
        this.refreshMarketData();
      } else {
        this.refreshMyMarketData();
      }
    }
  }

  public async tryAutoDetectAllAccounts(showToast = true): Promise<void> {
    const accounts = this.getAccountOptions();
    if (!accounts || accounts.length === 0) {
      if (showToast) {
        this.onToast?.('Nenhuma conta carregada para detecção.', 'danger');
      }
      return;
    }

    if (showToast) {
      this.onToast?.('Varrendo webviews das 4 contas para detectar tokens...', 'info', 2000);
    }

    const results = await this.marketService.autoDetectAllTokens(
      accounts.map((a) => ({ id: a.id, webview: a.webview })),
    );

    let detectedCount = 0;
    for (const id of Object.keys(results)) {
      if (results[id]) detectedCount++;
    }

    this.updateAccountsBar();
    this.updateTokenStatusBadge();

    if (showToast) {
      if (detectedCount > 0) {
        this.onToast?.(`✔ ${detectedCount} token(s) JWT detectado(s) e mapeados nas contas!`, 'success');
        if (this.currentMainTab === 'general') {
          this.refreshMarketData();
        } else {
          this.refreshMyMarketData();
        }
      } else {
        this.onToast?.(
          'Nenhum token JWT foi encontrado nos slots abertos. Faça login no jogo primeiro.',
          'info',
        );
      }
    }
  }

  // ==========================================
  // MODAL DE CONFIGURAÇÃO DE TOKENS
  // ==========================================

  private openTokenModal(targetAccountId = 'account_01'): void {
    this.modalSelectedAccountId = targetAccountId;
    this.renderModalAccountTabs();
    this.updateModalInput();
    this.elTokenModal.style.display = 'flex';
  }

  private renderModalAccountTabs(): void {
    this.elTokenModalAccountTabs.innerHTML = MARKET_ACCOUNTS.map((acc) => {
      const isSelected = acc.id === this.modalSelectedAccountId;
      const token = this.marketService.getAccountToken(acc.id);
      const hasToken = !!token;

      return `
        <button class="modal-tab-btn ${isSelected ? 'active' : ''}" data-modal-acc-id="${acc.id}">
          <span class="pill-dot ${hasToken ? 'dot-active' : 'dot-inactive'}"></span>
          <span>${acc.name}</span>
          ${hasToken ? '<span class="modal-tab-badge">OK</span>' : ''}
        </button>
      `;
    }).join('');

    this.elTokenModalAccountTabs.querySelectorAll('.modal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-modal-acc-id');
        if (id) {
          this.modalSelectedAccountId = id;
          this.renderModalAccountTabs();
          this.updateModalInput();
        }
      });
    });
  }

  private updateModalInput(): void {
    const accName = this.getAccountName(this.modalSelectedAccountId);
    this.elTokenModalSelectedLabel.innerHTML = `Bearer Token JWT da <strong>${accName}</strong>:`;

    const token = this.marketService.getAccountToken(this.modalSelectedAccountId) || '';
    this.elTokenModalInput.value = token;
    this.updateModalTokenLength();
  }

  private updateModalTokenLength(): void {
    const token = this.elTokenModalInput.value.trim();
    const badge = document.getElementById('modal-token-length-badge');
    if (!badge) return;

    if (token) {
      badge.textContent = `Token válido (${token.length} chars)`;
      badge.className = 'token-length-badge badge-valid';
    } else {
      badge.textContent = 'Não configurado';
      badge.className = 'token-length-badge badge-empty';
    }
  }

  private updateTokenStatusBadge(): void {
    const token = this.marketService.getToken();
    const accName = this.getAccountName(this.activeAccountId);

    if (token) {
      this.elTokenStatusBadge.textContent = `${accName}: Token Ativo`;
      this.elTokenDot.className = 'token-dot dot-active';
    } else {
      this.elTokenStatusBadge.textContent = `${accName}: Sem Token`;
      this.elTokenDot.className = 'token-dot dot-inactive';
    }
  }

  // ==========================================
  // CONTROLE DO SWITCH DE REQUISIÇÕES
  // ==========================================

  public setRequestsEnabled(enabled: boolean): void {
    this.isRequestsEnabled = enabled;
    this.marketService.setRequestsEnabled(enabled);

    if (this.elRequestsToggle && this.elRequestsToggle.checked !== enabled) {
      this.elRequestsToggle.checked = enabled;
    }

    if (this.elRequestsMasterText) {
      this.elRequestsMasterText.textContent = enabled ? 'Requisições Ativas' : 'Requisições Pausadas';
    }

    if (this.elRequestsMasterDot) {
      this.elRequestsMasterDot.className = `requests-status-dot ${enabled ? 'dot-active' : 'dot-inactive'}`;
    }

    if (this.elRequestsDisabledBanner) {
      this.elRequestsDisabledBanner.style.display = enabled ? 'none' : 'flex';
    }

    if (enabled) {
      this.onToast?.('✔ Requisições da tela de mercado ATIVADAS!', 'success');
      this.setupAutoRefreshTimer();
      // Dispara a busca correspondente à aba ativa
      if (this.currentMainTab === 'general') {
        this.refreshMarketData(true);
      } else {
        this.refreshMyMarketData(true);
      }
    } else {
      this.onToast?.('🛑 Requisições DESATIVADAS. Nenhuma requisição será feita pela tela.', 'info');
      if (this.autoRefreshTimer) {
        window.clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
    }
  }

  // ==========================================
  // CICLO DE VIDA E ATIVAÇÃO
  // ==========================================

  public activate(): void {
    this.updateAccountsBar();
    this.updateTokenStatusBadge();

    // Se as requisições estiverem desativadas pelo switch, não faz chamadas à API
    if (!this.isRequestsEnabled) {
      return;
    }

    // Se a conta ativa ainda não tiver token, tenta auto-detectar
    if (!this.marketService.getToken()) {
      this.tryAutoDetectTokenForActiveAccount(false);
    }

    if (this.currentMainTab === 'general') {
      this.refreshMarketData();
    } else {
      this.refreshMyMarketData();
    }
  }

  private setupAutoRefreshTimer(): void {
    if (this.autoRefreshTimer) {
      window.clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }

    // Só inicia o timer se o auto-refresh E as requisições estiverem ativadas
    if (this.isAutoRefreshEnabled && this.isRequestsEnabled) {
      this.autoRefreshTimer = window.setInterval(() => {
        if (!this.isRequestsEnabled) return;
        if (this.currentMainTab === 'general') {
          this.refreshMarketData(false);
        } else {
          this.refreshMyMarketData(false);
        }
      }, this.autoRefreshInterval);
    }
  }

  private switchItem(item: MarketItemType): void {
    if (this.currentItem === item) return;
    this.currentItem = item;

    this.elBtnItemDiamonds.classList.toggle('active', item === 'diamonds');
    this.elBtnItemPheromones.classList.toggle('active', item === 'pheromones');

    if (this.elItemIndicatorLabel) {
      this.elItemIndicatorLabel.textContent = MONITORED_ITEMS[item].name;
    }

    this.loadSavedTargetPriceInput();

    // Se requisições estiverem ativadas, atualiza cotações
    if (this.isRequestsEnabled) {
      this.refreshMarketData();
    }
  }

  private loadSavedTargetPriceInput(): void {
    const target = this.marketService.getTargetPrice(this.currentItem, this.currentCurrency);
    this.elTargetPriceInput.value = target > 0 ? String(target) : '';
  }

  private formatPrice(price: number, currency: MarketCurrency = this.currentCurrency): string {
    if (!price || price <= 0) return '--';
    const formatted = price.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    if (currency === 'diamonds') return `${formatted} 💎`;
    return `$ ${formatted}`;
  }

  // ==========================================
  // BUSCA E RENDERIZAÇÃO DO MERCADO GERAL
  // ==========================================

  public async refreshMarketData(isManual = false): Promise<void> {
    // Bloqueia se as requisições estiverem desativadas pelo switch
    if (!this.isRequestsEnabled) {
      if (isManual) {
        this.onToast?.('Requisições desativadas pelo switch. Ative o switch para buscar dados.', 'info');
      }
      return;
    }

    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.elBtnRefreshNow.classList.add('loading');

    try {
      const res = await this.marketService.fetchMarket(
        this.currentItem,
        this.currentCurrency,
        this.filterOutliers,
      );

      this.latestListings = res.listings;
      this.latestMetrics = res.metrics;
      this.latestHistory = res.history;

      // Se retornou myOffers e myRequests no JSON, aproveita para atualizar
      if (res.myOffers && res.myRequests) {
        this.myOffers = res.myOffers;
        this.myRequests = res.myRequests;
        this.updateMyMarketBadge();
      }

      this.renderKpis();
      this.renderChart();
      this.renderTable();

      this.elLastUpdateText.textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR')}`;

      if (res.metrics.isOpportunity) {
        this.onToast?.(
          `🚨 Oportunidade! ${MONITORED_ITEMS[this.currentItem].name} está por ${this.formatPrice(
            res.metrics.currentMinPrice,
          )} (menor ou igual ao seu alvo)!`,
          'success',
        );
      } else if (isManual) {
        this.onToast?.('Cotações de mercado atualizadas.', 'info');
      }
    } catch (err: any) {
      console.warn('[MarketMonitor] Erro ao carregar mercado:', err);
      if (isManual) {
        this.onToast?.(err.message || 'Erro ao consultar API do mercado.', 'danger');
      }
    } finally {
      this.isRefreshing = false;
      this.elBtnRefreshNow.classList.remove('loading');
    }
  }

  private renderKpis(): void {
    if (!this.latestMetrics) return;
    const m = this.latestMetrics;

    this.elKpiMinPrice.textContent = this.formatPrice(m.currentMinPrice);
    this.elKpiAvgPrice.textContent = this.formatPrice(m.currentAvgPrice);
    this.elKpiVolume.textContent = m.totalVolume > 0 ? m.totalVolume.toLocaleString('pt-BR') : '--';
    this.elKpiRequestPrice.textContent = this.formatPrice(m.bestRequestPrice);

    const target = this.marketService.getTargetPrice(this.currentItem, this.currentCurrency);
    if (target > 0) {
      if (m.isOpportunity) {
        this.elOpportunityCard.classList.add('is-active-opportunity');
        this.elOpportunityBadge.className = 'opportunity-pill pill-alert';
        this.elOpportunityBadge.textContent = '🔥 COMPRA IDEAL!';
      } else {
        this.elOpportunityCard.classList.remove('is-active-opportunity');
        this.elOpportunityBadge.className = 'opportunity-pill pill-monitoring';
        this.elOpportunityBadge.textContent = `Alvo: ${this.formatPrice(target)}`;
      }
    } else {
      this.elOpportunityCard.classList.remove('is-active-opportunity');
      this.elOpportunityBadge.className = 'opportunity-pill pill-default';
      this.elOpportunityBadge.textContent = 'Definir Alvo';
    }
  }

  private renderChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    if (this.chartMode === 'listings') {
      this.renderListingsChart();
    } else {
      this.renderHistoryChart();
    }
  }

  private renderListingsChart(): void {
    const rawOffers = this.latestListings.filter((l) => l.type === 'offer');
    const validOffers = this.filterOutliers
      ? rawOffers.filter((l) => !l.isOutlier)
      : rawOffers;

    if (validOffers.length === 0) {
      this.elChartCanvas.style.display = 'none';
      this.elChartEmptyState.style.display = 'flex';
      const msg = this.element.querySelector('#market-chart-empty-msg');
      if (msg) msg.textContent = 'Nenhum anúncio de venda encontrado no momento para esta moeda.';
      return;
    }

    this.elChartCanvas.style.display = 'block';
    this.elChartEmptyState.style.display = 'none';

    const sorted = [...validOffers].sort((a, b) => a.createdAt - b.createdAt);
    const labels = sorted.map((item) => {
      const d = new Date(item.createdAt);
      return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    });

    const prices = sorted.map((item) => item.price);

    const ctx = this.elChartCanvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.00)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Preço do Anúncio',
            data: prices,
            borderColor: '#38BDF8',
            backgroundColor: gradient,
            fill: true,
            tension: 0.2,
            borderWidth: 2.5,
            pointBackgroundColor: '#0F1117',
            pointBorderColor: '#38BDF8',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#FFFFFF',
            pointHoverBorderColor: '#38BDF8',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#161B22',
            titleColor: '#58A6FF',
            bodyColor: '#C9D1D9',
            borderColor: '#30363D',
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            cornerRadius: 8,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 11, family: 'monospace' },
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                const it = sorted[idx];
                if (!it) return '';
                const d = new Date(it.createdAt);
                return `📅 Anúncio (${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR')})`;
              },
              label: (context) => {
                const idx = context.dataIndex;
                const it = sorted[idx];
                if (!it) return '';
                const lines = [`🏷️ Preço: ${this.formatPrice(it.price)}`];
                if (it.amount > 1) {
                  lines.push(`💰 Preço Unitário: ${this.formatPrice(it.unitPrice)}`);
                }
                lines.push(
                  `📦 Quantidade: ${it.amount.toLocaleString('pt-BR')} un`,
                  `💳 Moeda: ${it.currency.toUpperCase()}`,
                  `👤 Vendedor: ${it.sellerName || 'Jogador'}`,
                );
                if (it.isOutlier) {
                  lines.push(`⚠️ Alerta: Valor fora da curva normal`);
                }
                return lines;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8B949E',
              font: { family: 'monospace', size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
            title: {
              display: true,
              text: 'Horário do Anúncio (Campo "at")',
              color: '#8B949E',
              font: { size: 10 },
            },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8B949E',
              font: { family: 'monospace', size: 10 },
              callback: (val) => Number(val).toLocaleString('pt-BR'),
            },
            title: {
              display: true,
              text: `Preço (${this.currentCurrency.toUpperCase()})`,
              color: '#8B949E',
              font: { size: 10 },
            },
          },
        },
      },
    });
  }

  private renderHistoryChart(): void {
    const history = this.latestHistory;

    if (!history || history.length === 0) {
      this.elChartCanvas.style.display = 'none';
      this.elChartEmptyState.style.display = 'flex';
      const msg = this.element.querySelector('#market-chart-empty-msg');
      if (msg) msg.textContent = 'Sem pontos históricos gravados ainda para este item nesta moeda.';
      return;
    }

    this.elChartCanvas.style.display = 'block';
    this.elChartEmptyState.style.display = 'none';

    const labels = history.map((p) => p.formattedTime);
    const minPrices = history.map((p) => (p.minOfferPrice > 0 ? p.minOfferPrice : null));
    const avgPrices = history.map((p) => (p.avgOfferPrice > 0 ? p.avgOfferPrice : null));

    const ctx = this.elChartCanvas.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Menor Oferta',
            data: minPrices,
            borderColor: '#38BDF8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
            tension: 0.25,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 7,
          },
          {
            label: 'Preço Médio Ponderado',
            data: avgPrices,
            borderColor: '#FACC15',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#C9D1D9', font: { size: 11 }, boxWidth: 14 },
          },
          tooltip: {
            backgroundColor: '#161B22',
            titleColor: '#58A6FF',
            bodyColor: '#C9D1D9',
            borderColor: '#30363D',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = context.raw as number | null;
                if (val === null || val === undefined) return '';
                return `${context.dataset.label}: ${this.formatPrice(val)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8B949E',
              font: { family: 'monospace', size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8B949E',
              font: { family: 'monospace', size: 10 },
              callback: (val) => Number(val).toLocaleString('pt-BR'),
            },
          },
        },
      },
    });
  }

  private renderTable(): void {
    let list = [...this.latestListings];

    if (this.orderTypeFilter !== 'all') {
      list = list.filter((l) => l.type === this.orderTypeFilter);
    }

    if (this.elOrdersCounter) {
      this.elOrdersCounter.textContent = `${list.length} ordens`;
    }

    if (list.length === 0) {
      this.elTableBody.innerHTML = '';
      this.elEmptyState.style.display = 'flex';
      return;
    }

    this.elEmptyState.style.display = 'none';

    this.elTableBody.innerHTML = list
      .map((item) => {
        const isOffer = item.type === 'offer';
        const typeBadge = isOffer
          ? `<span class="order-badge badge-offer">Venda</span>`
          : `<span class="order-badge badge-request">Compra</span>`;

        const outlierTag = item.isOutlier
          ? `<span class="outlier-pill" title="Outlier detectado estatisticamente (preço fora da curva normal)">Irreal</span>`
          : '';

        const dateObj = new Date(item.createdAt);
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        return `
          <tr class="order-row ${item.isOutlier ? 'is-outlier-row' : ''}">
            <td>${typeBadge}</td>
            <td>
              <div class="item-name-cell">
                <span class="item-icon">${MONITORED_ITEMS[this.currentItem].icon}</span>
                <span class="item-title">${item.name}</span>
                ${outlierTag}
              </div>
            </td>
            <td class="col-qty"><strong>${item.amount.toLocaleString('pt-BR')}</strong></td>
            <td class="col-price-unit"><span class="price-val">${this.formatPrice(item.unitPrice)}</span></td>
            <td class="col-price-total">${this.formatPrice(item.price)}</td>
            <td class="col-seller"><span class="user-tag">${item.sellerName || 'Jogador'}</span></td>
            <td class="col-time" title="${dateObj.toLocaleString('pt-BR')}">${dateStr} ${timeStr}</td>
          </tr>
        `;
      })
      .join('');
  }

  // ==========================================
  // BUSCA E RENDERIZAÇÃO DE "MEU MERCADO"
  // ==========================================

  public async refreshMyMarketData(isManual = false): Promise<void> {
    // Bloqueia se as requisições estiverem desativadas pelo switch
    if (!this.isRequestsEnabled) {
      if (isManual) {
        this.onToast?.('Requisições desativadas pelo switch. Ative o switch para buscar dados.', 'info');
      }
      return;
    }

    if (this.isMyMarketRefreshing) return;
    this.isMyMarketRefreshing = true;
    this.elBtnRefreshMyMarket.classList.add('loading');

    try {
      const res = await this.marketService.fetchMyMarket(this.activeAccountId);
      this.myOffers = res.myOffers;
      this.myRequests = res.myRequests;

      this.updateMyMarketBadge();
      this.renderMyMarketKpis();
      this.renderMyMarketTable();

      if (isManual) {
        this.onToast?.(`Ordens da ${this.getAccountName(this.activeAccountId)} atualizadas!`, 'info');
      }
    } catch (err: any) {
      console.warn('[MyMarket] Erro ao carregar Meu Mercado:', err);
      // Tenta recuperar do cache se existir
      const cached = this.marketService.getMyMarketCache(this.activeAccountId);
      if (cached) {
        this.myOffers = cached.myOffers;
        this.myRequests = cached.myRequests;
        this.updateMyMarketBadge();
        this.renderMyMarketKpis();
        this.renderMyMarketTable();
      } else {
        this.renderMyMarketKpis();
        this.renderMyMarketTable();
      }

      if (isManual) {
        this.onToast?.(err.message || 'Erro ao consultar ordens pessoais da conta.', 'danger');
      }
    } finally {
      this.isMyMarketRefreshing = false;
      this.elBtnRefreshMyMarket.classList.remove('loading');
    }
  }

  private updateMyMarketBadge(): void {
    const totalCount = this.myOffers.length + this.myRequests.length;
    if (this.elMyMarketCountBadge) {
      this.elMyMarketCountBadge.textContent = String(totalCount);
      this.elMyMarketCountBadge.classList.toggle('has-items', totalCount > 0);
    }
  }

  private setMyMarketFilterType(type: 'all' | 'offer' | 'request'): void {
    this.myMarketFilterType = type;

    this.elBtnMyFilterAll.classList.toggle('active', type === 'all');
    this.elBtnMyFilterOffers.classList.toggle('active', type === 'offer');
    this.elBtnMyFilterRequests.classList.toggle('active', type === 'request');

    this.renderMyMarketTable();
  }

  private renderMyMarketKpis(): void {
    const offersCount = this.myOffers.length;
    const requestsCount = this.myRequests.length;

    // Calcula valor total em Vendas ($ e 💎)
    const offersTotalDollars = this.myOffers
      .filter((o) => o.currency === 'dollars')
      .reduce((acc, o) => acc + (o.price || o.unitPrice * o.amount), 0);
    const offersTotalDiamonds = this.myOffers
      .filter((o) => o.currency === 'diamonds')
      .reduce((acc, o) => acc + (o.price || o.unitPrice * o.amount), 0);

    // Calcula capital alocado em Compras ($ e 💎)
    const requestsTotalDollars = this.myRequests
      .filter((r) => r.currency === 'dollars')
      .reduce((acc, r) => acc + (r.price || r.unitPrice * r.amount), 0);
    const requestsTotalDiamonds = this.myRequests
      .filter((r) => r.currency === 'diamonds')
      .reduce((acc, r) => acc + (r.price || r.unitPrice * r.amount), 0);

    this.elMyKpiOffersCount.textContent = String(offersCount);
    const offersMeta = document.getElementById('kpi-my-offers-meta');
    if (offersMeta) {
      const totalUnits = this.myOffers.reduce((acc, o) => acc + o.amount, 0);
      offersMeta.textContent = `${totalUnits.toLocaleString('pt-BR')} unidades à venda`;
    }

    // Valor consolidado de Vendas
    let offersValText = `$ ${offersTotalDollars.toLocaleString('pt-BR')}`;
    if (offersTotalDiamonds > 0) {
      offersValText += ` + ${offersTotalDiamonds.toLocaleString('pt-BR')} 💎`;
    }
    this.elMyKpiOffersValue.textContent = offersValText;

    // Pedidos de Compra
    this.elMyKpiRequestsCount.textContent = String(requestsCount);
    const requestsMeta = document.getElementById('kpi-my-requests-meta');
    if (requestsMeta) {
      const totalUnitsReq = this.myRequests.reduce((acc, r) => acc + r.amount, 0);
      requestsMeta.textContent = `${totalUnitsReq.toLocaleString('pt-BR')} unidades solicitadas`;
    }

    // Valor consolidado de Compras
    let requestsValText = `$ ${requestsTotalDollars.toLocaleString('pt-BR')}`;
    if (requestsTotalDiamonds > 0) {
      requestsValText += ` + ${requestsTotalDiamonds.toLocaleString('pt-BR')} 💎`;
    }
    this.elMyKpiRequestsValue.textContent = requestsValText;
  }

  private renderMyMarketTable(): void {
    let combined: MyMarketOrder[] = [];

    if (this.myMarketFilterType === 'all') {
      combined = [...this.myOffers, ...this.myRequests];
    } else if (this.myMarketFilterType === 'offer') {
      combined = [...this.myOffers];
    } else {
      combined = [...this.myRequests];
    }

    // Filtro por Moeda
    if (this.myMarketCurrencyFilter !== 'all') {
      combined = combined.filter((item) => item.currency === this.myMarketCurrencyFilter);
    }

    // Filtro por Texto de Busca
    if (this.myMarketSearchQuery) {
      const q = this.myMarketSearchQuery;
      combined = combined.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const refMatch = item.refId !== undefined && String(item.refId).includes(q);
        const idMatch = String(item.id).toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        return nameMatch || refMatch || idMatch || catMatch;
      });
    }

    if (this.elMyOrdersCounter) {
      this.elMyOrdersCounter.textContent = `${combined.length} ordens`;
    }

    if (combined.length === 0) {
      this.elMyTableBody.innerHTML = '';
      this.elMyEmptyState.style.display = 'flex';

      const emptyTitle = document.getElementById('my-market-empty-title');
      const emptyDesc = document.getElementById('my-market-empty-desc');
      const accName = this.getAccountName(this.activeAccountId);

      if (emptyTitle) {
        emptyTitle.textContent = this.myMarketSearchQuery
          ? 'Nenhuma ordem encontrada para os filtros aplicados'
          : `Nenhuma ordem ativa na ${accName}`;
      }
      if (emptyDesc) {
        emptyDesc.innerHTML = this.myMarketSearchQuery
          ? 'Tente ajustar os filtros de busca ou moeda.'
          : `A <strong>${accName}</strong> não possui anúncios de venda (<code class="code-tag">myOffers</code>) ou pedidos de compra (<code class="code-tag">myRequests</code>) ativos no Poke Idle World.`;
      }
      return;
    }

    this.elMyEmptyState.style.display = 'none';

    // Ordena do mais recente para o mais antigo
    combined.sort((a, b) => b.createdAt - a.createdAt);

    this.elMyTableBody.innerHTML = combined
      .map((order) => {
        const isOffer = order.type === 'offer';
        const typeBadge = isOffer
          ? `<span class="order-badge badge-my-offer">🏷️ Venda (myOffers)</span>`
          : `<span class="order-badge badge-my-request">📥 Compra (myRequests)</span>`;

        // Ícone temático
        let itemIcon = '📦';
        if (order.refId === 44417 || order.name.toLowerCase().includes('pheromone')) {
          itemIcon = '🧪';
        } else if (order.name.toLowerCase().includes('diamond') || order.category === 'Diamonds') {
          itemIcon = '💎';
        } else if (order.name.toLowerCase().includes('ball')) {
          itemIcon = '⚪';
        } else if (order.name.toLowerCase().includes('stone')) {
          itemIcon = '⚡';
        }

        const dateObj = new Date(order.createdAt);
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        const currencySymbol = order.currency === 'diamonds' ? '💎' : '$';
        const unitPriceStr = this.formatPrice(order.unitPrice, order.currency);
        const totalPrice = order.price || order.unitPrice * order.amount;
        const totalPriceStr = this.formatPrice(totalPrice, order.currency);

        return `
          <tr class="order-row my-order-row ${isOffer ? 'row-my-offer' : 'row-my-request'}">
            <td>${typeBadge}</td>
            <td>
              <div class="item-name-cell">
                <span class="item-icon">${itemIcon}</span>
                <div class="item-info-col">
                  <span class="item-title">${order.name}</span>
                  ${order.refId ? `<span class="item-ref-id">#${order.refId}</span>` : ''}
                </div>
              </div>
            </td>
            <td><span class="cat-pill">${order.category}</span></td>
            <td class="col-qty"><strong>${order.amount.toLocaleString('pt-BR')}</strong></td>
            <td class="col-price-unit"><span class="price-val">${unitPriceStr}</span></td>
            <td class="col-price-total"><strong>${totalPriceStr}</strong></td>
            <td class="col-currency"><span class="currency-tag">${order.currency.toUpperCase()}</span></td>
            <td class="col-time" title="${dateObj.toLocaleString('pt-BR')}">${dateStr} ${timeStr}</td>
            <td class="col-status">
              <span class="status-pill status-active">
                <span class="live-dot-green"></span>
                <span>Ativa</span>
              </span>
            </td>
            <td class="col-actions">
              <button class="btn-order-copy" data-order-id="${order.id}" title="Copiar ID da Ordem: ${order.id}">
                📋
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Eventos nos botões de copiar ID da ordem
    this.elMyTableBody.querySelectorAll('.btn-order-copy').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        if (orderId) {
          navigator.clipboard.writeText(orderId).then(() => {
            this.onToast?.(`ID da ordem copiado: ${orderId}`, 'info', 2000);
          });
        }
      });
    });
  }
}
