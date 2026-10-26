import {
  TradeArbitrageEngine,
  type CostBreakdownResult,
  type GlobalMarketContext,
  type PurchaseCurrency,
  type PurchaseTransactionInput,
  type SaleSimulationInput,
  type SaleSimulationResult,
} from '../services/tradeArbitrageEngine.js';
import { MarketService } from '../services/marketService.js';
import type { AccountOption } from './familyDepotComponent.js';

const STORAGE_KEY_V_DIA = 'poke_idle_trade_v_dia';
const STORAGE_KEY_TAXA = 'poke_idle_trade_taxa_pct';
const STORAGE_KEY_LAST_ITEM = 'poke_idle_trade_last_item';
const STORAGE_KEY_OFFLINE_MODE = 'poke_idle_trade_offline_mode';

export class TradeArbitrageComponent {
  public readonly element: HTMLElement;
  private readonly marketService: MarketService;

  // Estado da Conta e Presença
  private activeAccountId = 'account_01';
  private isOfflineMode = false;
  private isAccountInMarket = false;

  // Estado dos Inputs Globais
  private vDia = 4_500_000;
  private taxaPct = 5.0; // 5%

  // Estado da Transação de Compra
  private selectedItem = 'Strange Pheromones';
  private customItemName = '';
  private moedaCompra: PurchaseCurrency = 'dolar';
  private qtdPaga = 3_800_000;
  private qtdAdquirida = 1;

  // Estado do Simulador de Venda Cruzada
  private precoAnunciadoDolar = 4_200_000;
  private precoAnunciadoDiamante = 1.05;

  // Resultados em Cache
  private lastCostResult: CostBreakdownResult | null = null;
  private lastSimulationResult: SaleSimulationResult | null = null;

  // Referências DOM - Presença e Status
  private elPresenceBadge!: HTMLElement;
  private elPresenceDesc!: HTMLElement;
  private elOfflineToggle!: HTMLInputElement;
  private elSafeBanner!: HTMLElement;

  // Referências DOM - Inputs Globais
  private elInputVDia!: HTMLInputElement;
  private elInputTaxa!: HTMLInputElement;
  private elBtnSyncDiamondPrice!: HTMLButtonElement;

  // Referências DOM - Formulário de Compra
  private elSelectItem!: HTMLSelectElement;
  private elInputCustomItemRow!: HTMLElement;
  private elInputCustomItem!: HTMLInputElement;
  private elRadioDolar!: HTMLInputElement;
  private elRadioDiamante!: HTMLInputElement;
  private elInputQtdPaga!: HTMLInputElement;
  private elInputQtdAdquirida!: HTMLInputElement;
  private elCurrencySymbolPaga!: HTMLElement;

  // Referências DOM - Cards de Resultados
  private elResCustoUnitarioDolar!: HTMLElement;
  private elResPrecoMinimoDolar!: HTMLElement;
  private elResPrecoMinimoDiamante!: HTMLElement;
  private elResMargem10Dolar!: HTMLElement;
  private elResMargem10Diamante!: HTMLElement;
  private elResMargem15Dolar!: HTMLElement;
  private elResMargem15Diamante!: HTMLElement;
  private elBtnApplyMargem10!: HTMLButtonElement;
  private elBtnApplyMargem15!: HTMLButtonElement;
  private elBtnApplyBreakEven!: HTMLButtonElement;

  // Referências DOM - Simulador de Venda Cruzada
  private elCardVendaDolar!: HTMLElement;
  private elCardVendaDiamante!: HTMLElement;
  private elInputPrecoDolar!: HTMLInputElement;
  private elInputPrecoDiamante!: HTMLInputElement;
  private elSimBrutoDolar!: HTMLElement;
  private elSimRetornoDolar!: HTMLElement;
  private elSimLucroDolar!: HTMLElement;
  private elSimMargemDolar!: HTMLElement;

  private elSimBrutoDiamanteEquiv!: HTMLElement;
  private elSimRetornoDiamanteEquiv!: HTMLElement;
  private elSimLucroDiamante!: HTMLElement;
  private elSimMargemDiamante!: HTMLElement;

  // Referências DOM - Destaque e Decisão
  private elDecisionBanner!: HTMLElement;
  private elDecisionBadge!: HTMLElement;
  private elDecisionTitle!: HTMLElement;
  private elDecisionSubtitle!: HTMLElement;
  private elDecisionDifference!: HTMLElement;
  private elLossAlertBanner!: HTMLElement;
  private elLossAlertText!: HTMLElement;

  constructor(
    private readonly getAccountOptions: () => AccountOption[],
    private readonly onToast?: (message: string, type?: 'info' | 'success' | 'danger') => void,
  ) {
    this.marketService = MarketService.getInstance();
    this.activeAccountId = this.marketService.getActiveAccountId() || 'account_01';
    this.loadPersistedState();

    this.element = document.createElement('div');
    this.element.className = 'trade-arbitrage-container';
    this.element.id = 'trade-arbitrage-module';

    this.render();
    this.bindDom();
    this.initEvents();
    this.checkMarketPresence();
    this.recalculateAll();
  }

  private loadPersistedState(): void {
    try {
      const savedVDia = localStorage.getItem(STORAGE_KEY_V_DIA);
      if (savedVDia) {
        const parsed = parseFloat(savedVDia);
        if (!isNaN(parsed) && parsed > 0) this.vDia = parsed;
      }

      const savedTaxa = localStorage.getItem(STORAGE_KEY_TAXA);
      if (savedTaxa) {
        const parsed = parseFloat(savedTaxa);
        if (!isNaN(parsed) && parsed >= 0) this.taxaPct = parsed;
      }

      const savedItem = localStorage.getItem(STORAGE_KEY_LAST_ITEM);
      if (savedItem) this.selectedItem = savedItem;

      const savedOffline = localStorage.getItem(STORAGE_KEY_OFFLINE_MODE);
      if (savedOffline !== null) this.isOfflineMode = savedOffline === 'true';
    } catch (_) {}
  }

  private savePersistedState(): void {
    try {
      localStorage.setItem(STORAGE_KEY_V_DIA, String(this.vDia));
      localStorage.setItem(STORAGE_KEY_TAXA, String(this.taxaPct));
      localStorage.setItem(STORAGE_KEY_LAST_ITEM, this.selectedItem);
      localStorage.setItem(STORAGE_KEY_OFFLINE_MODE, String(this.isOfflineMode));
    } catch (_) {}
  }

  public setActiveAccount(accountId: string): void {
    this.activeAccountId = accountId;
    this.checkMarketPresence();
    this.updatePresenceUi();
  }

  public checkMarketPresence(): void {
    this.isAccountInMarket = this.marketService.isAccountInMarket(this.activeAccountId);
    this.updatePresenceUi();
  }

  private updatePresenceUi(): void {
    if (!this.elPresenceBadge) return;

    const isAuthorized = this.isAccountInMarket || this.isOfflineMode;

    if (this.isAccountInMarket) {
      this.elPresenceBadge.className = 'trade-presence-badge status-online';
      this.elPresenceBadge.innerHTML = `<span class="presence-pulse-dot"></span><span>Boneco no Mercado Oficial</span>`;
      this.elPresenceDesc.textContent = `Acesso seguro ativado via requisição legítima do jogo na ${this.getAccountName(this.activeAccountId)}.`;
      this.elSafeBanner.style.display = 'none';
    } else if (this.isOfflineMode) {
      this.elPresenceBadge.className = 'trade-presence-badge status-offline-mode';
      this.elPresenceBadge.innerHTML = `<span>🛠️ Modo Simulação Manual Ativo</span>`;
      this.elPresenceDesc.textContent = `Operações liberadas localmente. Nenhuma requisição enviada ao servidor.`;
      this.elSafeBanner.style.display = 'none';
    } else {
      this.elPresenceBadge.className = 'trade-presence-badge status-locked';
      this.elPresenceBadge.innerHTML = `<span>🔒 Personagem fora do Mercado</span>`;
      this.elPresenceDesc.textContent = `Abra a tela oficial do Mercado no jogo para sincronizar cotações e simular vendas com segurança.`;
      this.elSafeBanner.style.display = 'flex';
    }
  }

  private getAccountName(id: string): string {
    const accs = this.getAccountOptions();
    const found = accs.find((a) => a.id === id);
    return found ? found.name : id.replace('_', ' ').toUpperCase();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="trade-arbitrage-wrapper">

        <!-- 1. BARRA SUPERIOR: GATEKEEPER DE SEGURANÇA & PRESENÇA NO MERCADO -->
        <header class="trade-security-header">
          <div class="security-header-left">
            <div class="security-title-row">
              <span class="security-icon">⚖️</span>
              <h2 class="trade-main-title">Arbitragem Comercial & Rentabilidade Cruzada</h2>
              <div id="trade-presence-badge" class="trade-presence-badge status-locked">
                <span>🔒 Verificando Mercado...</span>
              </div>
            </div>
            <p id="trade-presence-desc" class="trade-presence-sub">
              Calculadora de custos unitários em Dólar, preços de equilíbrio (Break-even com taxa) e comparador de retorno cruzado (Dólar vs Diamante).
            </p>
          </div>

          <div class="security-header-actions">
            <label class="offline-toggle-container" title="Permite realizar simulações matemáticas sem exigir que a tela do mercado esteja aberta no jogo">
              <input type="checkbox" id="toggle-trade-offline-mode" ${this.isOfflineMode ? 'checked' : ''} />
              <span class="toggle-slider"></span>
              <span class="toggle-label-text">Simulação Livre / Offline</span>
            </label>
          </div>
        </header>

        <!-- BANNER DE PROTEÇÃO QUANDO FORA DO MERCADO -->
        <div id="trade-safe-guard-banner" class="trade-guard-banner" style="display: none;">
          <div class="guard-banner-icon">🛡️</div>
          <div class="guard-banner-content">
            <h4>Proteção Anti-Detecção Ativa: Personagem Fora do Mercado</h4>
            <p>
              Para assegurar que nenhuma ação fora de contexto seja inferida nos registros do servidor, este módulo recomenda abrir o Mercado oficial no slot do jogo. Você também pode ativar o <strong>Modo Simulação Livre</strong> acima para calcular cenários livremente.
            </p>
          </div>
          <button id="btn-unlock-offline-simulation" class="btn-guard-unlock">
            Desbloquear Simulação
          </button>
        </div>

        <!-- 2. SEÇÃO A: PAINEL DE COTAÇÃO GLOBAL DE MERCADO -->
        <section class="trade-card-section trade-global-quote-card">
          <div class="section-card-header">
            <div class="header-label-wrap">
              <span class="section-icon">💎</span>
              <div>
                <h3 class="section-title">Contexto de Mercado Atual (Inputs Globais)</h3>
                <span class="section-desc">Cotação base do Diamante em Dólares e comissão cobrada pelo mercado do jogo.</span>
              </div>
            </div>
            <button id="btn-sync-diamond-price" class="btn-trade-secondary" title="Importar menor preço ou média recente de Diamonds do Monitor de Mercado">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Importar Cotação Atual</span>
            </button>
          </div>

          <div class="trade-grid-two-cols">
            <div class="trade-input-group">
              <label for="input-trade-v-dia" class="trade-field-label">
                <span>Preço do Diamante em Dólares (V_dia)</span>
                <span class="field-hint">Valor médio de 1 💎</span>
              </label>
              <div class="trade-input-affix">
                <span class="affix-symbol">$</span>
                <input type="text" id="input-trade-v-dia" class="trade-number-input" value="${this.vDia.toLocaleString('pt-BR')}" placeholder="4.500.000" />
              </div>
            </div>

            <div class="trade-input-group">
              <label for="input-trade-taxa" class="trade-field-label">
                <span>Taxa de Comissão do Mercado (T)</span>
                <span class="field-hint">Taxa deduzida na venda</span>
              </label>
              <div class="trade-input-affix">
                <input type="number" id="input-trade-taxa" class="trade-number-input" value="${this.taxaPct}" min="0" max="99" step="0.5" placeholder="5" />
                <span class="affix-symbol">%</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. SEÇÃO B: FORMULÁRIO DE NOVA COMPRA / CÁLCULO DE CUSTO -->
        <section class="trade-card-section trade-purchase-card">
          <div class="section-card-header">
            <div class="header-label-wrap">
              <span class="section-icon">🛒</span>
              <div>
                <h3 class="section-title">Registro de Compra / Custo de Aquisição</h3>
                <span class="section-desc">Defina o item adquirido, a moeda paga e a quantidade recebida para apurar o custo base.</span>
              </div>
            </div>
          </div>

          <div class="purchase-form-grid">
            <!-- Item Selecionado -->
            <div class="trade-input-group">
              <label for="select-trade-item" class="trade-field-label">Item Transacionado</label>
              <select id="select-trade-item" class="trade-select-input">
                <option value="Strange Pheromones" ${this.selectedItem === 'Strange Pheromones' ? 'selected' : ''}>🧪 Strange Pheromones (#44417)</option>
                <option value="Diamonds" ${this.selectedItem === 'Diamonds' ? 'selected' : ''}>💎 Diamonds</option>
                <option value="Boss Tokens" ${this.selectedItem === 'Boss Tokens' ? 'selected' : ''}>🎟️ Boss Tokens</option>
                <option value="Outro" ${this.selectedItem === 'Outro' ? 'selected' : ''}>✏️ Outro (Digitar Nome...)</option>
              </select>
            </div>

            <!-- Moeda de Compra (Toggle) -->
            <div class="trade-input-group">
              <label class="trade-field-label">Moeda Paga na Compra</label>
              <div class="currency-toggle-segmented">
                <label class="segment-option">
                  <input type="radio" name="trade-currency-buy" value="dolar" ${this.moedaCompra === 'dolar' ? 'checked' : ''} id="radio-buy-dolar" />
                  <span class="segment-btn">💵 Dólar ($)</span>
                </label>
                <label class="segment-option">
                  <input type="radio" name="trade-currency-buy" value="diamante" ${this.moedaCompra === 'diamante' ? 'checked' : ''} id="radio-buy-diamante" />
                  <span class="segment-btn">💎 Diamante</span>
                </label>
              </div>
            </div>

            <!-- Quantidade Paga -->
            <div class="trade-input-group">
              <label for="input-trade-qtd-paga" class="trade-field-label">
                <span>Quantidade Paga</span>
                <span class="field-hint">Valor desembolsado</span>
              </label>
              <div class="trade-input-affix">
                <span class="affix-symbol" id="symbol-qtd-paga">${this.moedaCompra === 'dolar' ? '$' : '💎'}</span>
                <input type="text" id="input-trade-qtd-paga" class="trade-number-input" value="${this.qtdPaga.toLocaleString('pt-BR')}" placeholder="3.800.000" />
              </div>
            </div>

            <!-- Quantidade de Itens Recebidos -->
            <div class="trade-input-group">
              <label for="input-trade-qtd-adquirida" class="trade-field-label">
                <span>Quantidade Recebida</span>
                <span class="field-hint">Unidades obtidas</span>
              </label>
              <div class="trade-input-affix">
                <input type="number" id="input-trade-qtd-adquirida" class="trade-number-input" value="${this.qtdAdquirida}" min="1" step="1" placeholder="1" />
                <span class="affix-symbol">un</span>
              </div>
            </div>
          </div>

          <!-- Linha Opcional para Item Customizado -->
          <div class="custom-item-row" id="custom-item-row" style="display: ${this.selectedItem === 'Outro' ? 'block' : 'none'};">
            <label for="input-custom-item-name" class="trade-field-label">Nome do Item Personalizado</label>
            <input type="text" id="input-custom-item-name" class="trade-text-input" placeholder="Ex: Mega Stone, Potion Pack, etc." value="${this.customItemName}" />
          </div>
        </section>

        <!-- 4. SEÇÃO C: RESULTADOS E ALERTAS (CARD DE RESUMO DINÂMICO) -->
        <section class="trade-results-overview">
          <div class="overview-cards-grid">

            <!-- Card 1: Custo Unitário Equivalente em Dólar -->
            <div class="overview-kpi-card card-cost">
              <div class="kpi-card-header">
                <span class="kpi-label">CUSTO UNITÁRIO EQUIVALENTE</span>
                <span class="kpi-icon">💰</span>
              </div>
              <div class="kpi-primary-val" id="res-custo-unitario-dolar">$ 0</div>
              <div class="kpi-sub-meta">Base pura de aquisição por unidade em Dólares</div>
            </div>

            <!-- Card 2: Preço Mínimo de Venda (Break-even) -->
            <div class="overview-kpi-card card-breakeven">
              <div class="kpi-card-header">
                <span class="kpi-label">BREAK-EVEN (PREÇO MÍNIMO)</span>
                <span class="kpi-icon">🎯</span>
              </div>
              <div class="kpi-primary-val" id="res-preco-minimo-dolar">$ 0</div>
              <div class="kpi-sub-meta" id="res-preco-minimo-diamante">0 💎 no mercado</div>
              <button id="btn-apply-breakeven" class="btn-kpi-apply" title="Preencher o Break-even no Simulador abaixo">
                Usar Preço de Equilíbrio
              </button>
            </div>

            <!-- Card 3: Margem Sugerida (+10% e +15%) -->
            <div class="overview-kpi-card card-margin">
              <div class="kpi-card-header">
                <span class="kpi-label">MARGEM DE SEGURANÇA RECOMENDADA</span>
                <span class="kpi-icon">🛡️</span>
              </div>
              <div class="margin-presets-row">
                <div class="margin-preset-col">
                  <span class="preset-tag">+10%</span>
                  <span class="preset-dolar" id="res-margem10-dolar">$ 0</span>
                  <span class="preset-dia" id="res-margem10-dia">0 💎</span>
                  <button id="btn-apply-margem10" class="btn-preset-apply">Aplicar +10%</button>
                </div>
                <div class="margin-preset-col highlight">
                  <span class="preset-tag tag-green">+15% (Ideal)</span>
                  <span class="preset-dolar" id="res-margem15-dolar">$ 0</span>
                  <span class="preset-dia" id="res-margem15-dia">0 💎</span>
                  <button id="btn-apply-margem15" class="btn-preset-apply btn-green">Aplicar +15%</button>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- 5. SEÇÃO D: SIMULADOR DE VENDA CRUZADA (DÓLAR VS DIAMANTE) -->
        <section class="trade-cross-simulation-section">
          <div class="section-card-header">
            <div class="header-label-wrap">
              <span class="section-icon">⚖️</span>
              <div>
                <h3 class="section-title">Simulador de Venda Cruzada (Comparativo Lado a Lado)</h3>
                <span class="section-desc">Simule o anúncio de 1 unidade nas duas pontas e descubra instantaneamente qual gera maior retorno líquido real.</span>
              </div>
            </div>
          </div>

          <div class="cross-cards-grid">

            <!-- CARD ESQUERDA: VENDA EM DÓLARES -->
            <div class="cross-sim-card card-dolar-side" id="card-venda-dolar">
              <div class="sim-card-top">
                <div class="currency-side-badge badge-dolar">
                  <span>💵</span>
                  <span>OPÇÃO A: VENDER EM DÓLARES</span>
                </div>
              </div>

              <div class="trade-input-group mt-12">
                <label for="input-preco-dolar" class="trade-field-label">Preço Pretendido de Anúncio ($)</label>
                <div class="trade-input-affix">
                  <span class="affix-symbol">$</span>
                  <input type="text" id="input-preco-dolar" class="trade-number-input highlight-dolar" value="${this.precoAnunciadoDolar.toLocaleString('pt-BR')}" placeholder="4.200.000" />
                </div>
              </div>

              <div class="sim-metrics-box">
                <div class="metric-line">
                  <span class="m-label">Valor Bruto Anunciado:</span>
                  <span class="m-val" id="sim-bruto-dolar">$ 0</span>
                </div>
                <div class="metric-line">
                  <span class="m-label">Retorno Líquido (-${this.taxaPct}% taxa):</span>
                  <span class="m-val val-cyan" id="sim-retorno-dolar">$ 0</span>
                </div>
                <div class="metric-divider"></div>
                <div class="metric-line main-profit-line">
                  <span class="m-label">Lucro Líquido Estimado:</span>
                  <span class="m-val val-profit" id="sim-lucro-dolar">$ 0</span>
                </div>
                <div class="metric-line">
                  <span class="m-label">Margem sobre Custo:</span>
                  <span class="m-badge-percent" id="sim-margem-dolar">0%</span>
                </div>
              </div>
            </div>

            <!-- CARD DIREITA: VENDA EM DIAMANTES -->
            <div class="cross-sim-card card-diamante-side" id="card-venda-diamante">
              <div class="sim-card-top">
                <div class="currency-side-badge badge-diamante">
                  <span>💎</span>
                  <span>OPÇÃO B: VENDER EM DIAMANTES</span>
                </div>
              </div>

              <div class="trade-input-group mt-12">
                <label for="input-preco-diamante" class="trade-field-label">Preço Pretendido de Anúncio (💎)</label>
                <div class="trade-input-affix">
                  <input type="number" id="input-preco-diamante" class="trade-number-input highlight-diamante" value="${this.precoAnunciadoDiamante}" min="0.01" step="0.05" placeholder="1.05" />
                  <span class="affix-symbol">💎</span>
                </div>
              </div>

              <div class="sim-metrics-box">
                <div class="metric-line">
                  <span class="m-label">Valor Bruto Equivalente em $:</span>
                  <span class="m-val" id="sim-bruto-dia-equiv">$ 0</span>
                </div>
                <div class="metric-line">
                  <span class="m-label">Retorno Líquido (-${this.taxaPct}% taxa):</span>
                  <span class="m-val val-purple" id="sim-retorno-dia-equiv">$ 0</span>
                </div>
                <div class="metric-divider"></div>
                <div class="metric-line main-profit-line">
                  <span class="m-label">Lucro Líquido Equivalente:</span>
                  <span class="m-val val-profit" id="sim-lucro-dia">$ 0</span>
                </div>
                <div class="metric-line">
                  <span class="m-label">Margem sobre Custo:</span>
                  <span class="m-badge-percent" id="sim-margem-dia">0%</span>
                </div>
              </div>
            </div>

          </div>

          <!-- BANNER DE RECOMENDAÇÃO E DECISÃO FINAL -->
          <div class="trade-decision-banner" id="trade-decision-banner">
            <div class="decision-left-col">
              <span class="decision-status-badge badge-neutral" id="trade-decision-badge">Análise Comparativa</span>
              <h3 class="decision-title" id="trade-decision-title">Calculando melhor opção...</h3>
              <p class="decision-sub" id="trade-decision-sub">Compare as duas pontas para identificar a melhor margem de lucro.</p>
            </div>
            <div class="decision-diff-box" id="trade-decision-diff">
              --
            </div>
          </div>

          <!-- ALERTA DE PREJUÍZO (SE APLICÁVEL) -->
          <div class="trade-loss-alert" id="trade-loss-alert" style="display: none;">
            <span class="loss-alert-icon">⚠️</span>
            <span class="loss-alert-text" id="trade-loss-text">Aviso de Break-even</span>
          </div>

        </section>

      </div>
    `;
  }

  private bindDom(): void {
    this.elPresenceBadge = this.element.querySelector('#trade-presence-badge') as HTMLElement;
    this.elPresenceDesc = this.element.querySelector('#trade-presence-desc') as HTMLElement;
    this.elOfflineToggle = this.element.querySelector('#toggle-trade-offline-mode') as HTMLInputElement;
    this.elSafeBanner = this.element.querySelector('#trade-safe-guard-banner') as HTMLElement;

    this.elInputVDia = this.element.querySelector('#input-trade-v-dia') as HTMLInputElement;
    this.elInputTaxa = this.element.querySelector('#input-trade-taxa') as HTMLInputElement;
    this.elBtnSyncDiamondPrice = this.element.querySelector('#btn-sync-diamond-price') as HTMLButtonElement;

    this.elSelectItem = this.element.querySelector('#select-trade-item') as HTMLSelectElement;
    this.elInputCustomItemRow = this.element.querySelector('#custom-item-row') as HTMLElement;
    this.elInputCustomItem = this.element.querySelector('#input-custom-item-name') as HTMLInputElement;
    this.elRadioDolar = this.element.querySelector('#radio-buy-dolar') as HTMLInputElement;
    this.elRadioDiamante = this.element.querySelector('#radio-buy-diamante') as HTMLInputElement;
    this.elInputQtdPaga = this.element.querySelector('#input-trade-qtd-paga') as HTMLInputElement;
    this.elInputQtdAdquirida = this.element.querySelector('#input-trade-qtd-adquirida') as HTMLInputElement;
    this.elCurrencySymbolPaga = this.element.querySelector('#symbol-qtd-paga') as HTMLElement;

    this.elResCustoUnitarioDolar = this.element.querySelector('#res-custo-unitario-dolar') as HTMLElement;
    this.elResPrecoMinimoDolar = this.element.querySelector('#res-preco-minimo-dolar') as HTMLElement;
    this.elResPrecoMinimoDiamante = this.element.querySelector('#res-preco-minimo-diamante') as HTMLElement;
    this.elResMargem10Dolar = this.element.querySelector('#res-margem10-dolar') as HTMLElement;
    this.elResMargem10Diamante = this.element.querySelector('#res-margem10-dia') as HTMLElement;
    this.elResMargem15Dolar = this.element.querySelector('#res-margem15-dolar') as HTMLElement;
    this.elResMargem15Diamante = this.element.querySelector('#res-margem15-dia') as HTMLElement;
    this.elBtnApplyMargem10 = this.element.querySelector('#btn-apply-margem10') as HTMLButtonElement;
    this.elBtnApplyMargem15 = this.element.querySelector('#btn-apply-margem15') as HTMLButtonElement;
    this.elBtnApplyBreakEven = this.element.querySelector('#btn-apply-breakeven') as HTMLButtonElement;

    this.elCardVendaDolar = this.element.querySelector('#card-venda-dolar') as HTMLElement;
    this.elCardVendaDiamante = this.element.querySelector('#card-venda-diamante') as HTMLElement;
    this.elInputPrecoDolar = this.element.querySelector('#input-preco-dolar') as HTMLInputElement;
    this.elInputPrecoDiamante = this.element.querySelector('#input-preco-diamante') as HTMLInputElement;

    this.elSimBrutoDolar = this.element.querySelector('#sim-bruto-dolar') as HTMLElement;
    this.elSimRetornoDolar = this.element.querySelector('#sim-retorno-dolar') as HTMLElement;
    this.elSimLucroDolar = this.element.querySelector('#sim-lucro-dolar') as HTMLElement;
    this.elSimMargemDolar = this.element.querySelector('#sim-margem-dolar') as HTMLElement;

    this.elSimBrutoDiamanteEquiv = this.element.querySelector('#sim-bruto-dia-equiv') as HTMLElement;
    this.elSimRetornoDiamanteEquiv = this.element.querySelector('#sim-retorno-dia-equiv') as HTMLElement;
    this.elSimLucroDiamante = this.element.querySelector('#sim-lucro-dia') as HTMLElement;
    this.elSimMargemDiamante = this.element.querySelector('#sim-margem-dia') as HTMLElement;

    this.elDecisionBanner = this.element.querySelector('#trade-decision-banner') as HTMLElement;
    this.elDecisionBadge = this.element.querySelector('#trade-decision-badge') as HTMLElement;
    this.elDecisionTitle = this.element.querySelector('#trade-decision-title') as HTMLElement;
    this.elDecisionSubtitle = this.element.querySelector('#trade-decision-sub') as HTMLElement;
    this.elDecisionDifference = this.element.querySelector('#trade-decision-diff') as HTMLElement;
    this.elLossAlertBanner = this.element.querySelector('#trade-loss-alert') as HTMLElement;
    this.elLossAlertText = this.element.querySelector('#trade-loss-text') as HTMLElement;
  }

  private initEvents(): void {
    // 1. Toggle Modo Offline
    this.elOfflineToggle.addEventListener('change', () => {
      this.isOfflineMode = this.elOfflineToggle.checked;
      this.savePersistedState();
      this.updatePresenceUi();
      if (this.onToast) {
        this.onToast(
          this.isOfflineMode
            ? 'Modo Simulação Livre ativado: você pode testar cenários sem restrições de rede.'
            : 'Modo Seguro restabelecido com checagem de presença.',
          'info',
        );
      }
    });

    const btnUnlock = this.element.querySelector('#btn-unlock-offline-simulation');
    btnUnlock?.addEventListener('click', () => {
      this.isOfflineMode = true;
      this.elOfflineToggle.checked = true;
      this.savePersistedState();
      this.updatePresenceUi();
    });

    // 2. Sincronizar Cotação de Diamante
    this.elBtnSyncDiamondPrice.addEventListener('click', () => {
      const price = this.marketService.getLatestDiamondPrice();
      if (price && price > 0) {
        this.vDia = price;
        this.elInputVDia.value = price.toLocaleString('pt-BR');
        this.savePersistedState();
        this.recalculateAll();
        if (this.onToast) {
          this.onToast(`Cotação de Diamonds sincronizada: $ ${price.toLocaleString('pt-BR')}`, 'success');
        }
      } else {
        if (this.onToast) {
          this.onToast('Abra o Mercado Geral para consultar cotações recentes de Diamonds.', 'info');
        }
      }
    });

    // 3. Inputs Globais
    this.elInputVDia.addEventListener('input', () => {
      this.vDia = this.parseNumericClean(this.elInputVDia.value) || 4_500_000;
      this.savePersistedState();
      this.recalculateAll();
    });

    this.elInputTaxa.addEventListener('input', () => {
      this.taxaPct = Math.max(0, Math.min(99, parseFloat(this.elInputTaxa.value) || 0));
      this.savePersistedState();
      this.recalculateAll();
    });

    // 4. Seleção de Item
    this.elSelectItem.addEventListener('change', () => {
      this.selectedItem = this.elSelectItem.value;
      this.elInputCustomItemRow.style.display = this.selectedItem === 'Outro' ? 'block' : 'none';
      this.savePersistedState();
      this.recalculateAll();
    });

    this.elInputCustomItem.addEventListener('input', () => {
      this.customItemName = this.elInputCustomItem.value.trim();
    });

    // 5. Moeda de Compra
    this.elRadioDolar.addEventListener('change', () => {
      if (this.elRadioDolar.checked) {
        this.moedaCompra = 'dolar';
        this.elCurrencySymbolPaga.textContent = '$';
        this.recalculateAll();
      }
    });

    this.elRadioDiamante.addEventListener('change', () => {
      if (this.elRadioDiamante.checked) {
        this.moedaCompra = 'diamante';
        this.elCurrencySymbolPaga.textContent = '💎';
        this.recalculateAll();
      }
    });

    // 6. Quantidades de Compra
    this.elInputQtdPaga.addEventListener('input', () => {
      this.qtdPaga = this.parseNumericClean(this.elInputQtdPaga.value);
      this.recalculateAll();
    });

    this.elInputQtdAdquirida.addEventListener('input', () => {
      this.qtdAdquirida = Math.max(1, parseInt(this.elInputQtdAdquirida.value, 10) || 1);
      this.recalculateAll();
    });

    // 7. Botões de Aplicação Rápida de Margem
    this.elBtnApplyBreakEven.addEventListener('click', () => {
      if (!this.lastCostResult) return;
      this.precoAnunciadoDolar = this.lastCostResult.precoMinimoVendaDolar;
      this.precoAnunciadoDiamante = this.lastCostResult.precoMinimoVendaDiamante;
      this.elInputPrecoDolar.value = this.precoAnunciadoDolar.toLocaleString('pt-BR');
      this.elInputPrecoDiamante.value = String(this.precoAnunciadoDiamante);
      this.recalculateSimulation();
      if (this.onToast) this.onToast('Preço de Break-even aplicado ao simulador.', 'info');
    });

    this.elBtnApplyMargem10.addEventListener('click', () => {
      if (!this.lastCostResult) return;
      this.precoAnunciadoDolar = this.lastCostResult.margemSeguranca10Dolar;
      this.precoAnunciadoDiamante = this.lastCostResult.margemSeguranca10Diamante;
      this.elInputPrecoDolar.value = this.precoAnunciadoDolar.toLocaleString('pt-BR');
      this.elInputPrecoDiamante.value = String(this.precoAnunciadoDiamante);
      this.recalculateSimulation();
      if (this.onToast) this.onToast('Margem de +10% aplicada ao simulador.', 'info');
    });

    this.elBtnApplyMargem15.addEventListener('click', () => {
      if (!this.lastCostResult) return;
      this.precoAnunciadoDolar = this.lastCostResult.margemSeguranca15Dolar;
      this.precoAnunciadoDiamante = this.lastCostResult.margemSeguranca15Diamante;
      this.elInputPrecoDolar.value = this.precoAnunciadoDolar.toLocaleString('pt-BR');
      this.elInputPrecoDiamante.value = String(this.precoAnunciadoDiamante);
      this.recalculateSimulation();
      if (this.onToast) this.onToast('Margem ideal de +15% aplicada ao simulador.', 'success');
    });

    // 8. Inputs do Simulador de Venda Cruzada
    this.elInputPrecoDolar.addEventListener('input', () => {
      this.precoAnunciadoDolar = this.parseNumericClean(this.elInputPrecoDolar.value);
      this.recalculateSimulation();
    });

    this.elInputPrecoDiamante.addEventListener('input', () => {
      this.precoAnunciadoDiamante = Math.max(0, parseFloat(this.elInputPrecoDiamante.value) || 0);
      this.recalculateSimulation();
    });

    // Escuta mudanças de presença no Mercado do Jogo via MarketService
    this.marketService.onMarketPresenceChange((accId, inMarket) => {
      if (accId === this.activeAccountId) {
        this.isAccountInMarket = inMarket;
        this.updatePresenceUi();
      }
    });
  }

  private parseNumericClean(val: string): number {
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  }

  public recalculateAll(): void {
    const context: GlobalMarketContext = {
      vDia: this.vDia,
      taxaComissao: this.taxaPct / 100,
    };

    const purchaseInput: PurchaseTransactionInput = {
      item: this.selectedItem === 'Outro' && this.customItemName ? this.customItemName : this.selectedItem,
      moedaCompra: this.moedaCompra,
      qtdPaga: this.qtdPaga,
      qtdAdquirida: this.qtdAdquirida,
    };

    this.lastCostResult = TradeArbitrageEngine.calculateCosts(purchaseInput, context);
    this.updateCostBreakdownUi(this.lastCostResult);
    this.recalculateSimulation();
  }

  private updateCostBreakdownUi(costs: CostBreakdownResult): void {
    this.elResCustoUnitarioDolar.textContent = TradeArbitrageEngine.formatDolar(costs.custoUnitarioDolar);
    this.elResPrecoMinimoDolar.textContent = TradeArbitrageEngine.formatDolar(costs.precoMinimoVendaDolar);
    this.elResPrecoMinimoDiamante.textContent = `Equivalente: ${TradeArbitrageEngine.formatDiamante(costs.precoMinimoVendaDiamante)}`;

    this.elResMargem10Dolar.textContent = TradeArbitrageEngine.formatDolar(costs.margemSeguranca10Dolar);
    this.elResMargem10Diamante.textContent = TradeArbitrageEngine.formatDiamante(costs.margemSeguranca10Diamante);

    this.elResMargem15Dolar.textContent = TradeArbitrageEngine.formatDolar(costs.margemSeguranca15Dolar);
    this.elResMargem15Diamante.textContent = TradeArbitrageEngine.formatDiamante(costs.margemSeguranca15Diamante);
  }

  private recalculateSimulation(): void {
    if (!this.lastCostResult) return;

    const context: GlobalMarketContext = {
      vDia: this.vDia,
      taxaComissao: this.taxaPct / 100,
    };

    const simInput: SaleSimulationInput = {
      precoAnunciadoDolar: this.precoAnunciadoDolar,
      precoAnunciadoDiamante: this.precoAnunciadoDiamante,
    };

    this.lastSimulationResult = TradeArbitrageEngine.simulateSale(simInput, this.lastCostResult, context);
    this.updateSimulationUi(this.lastSimulationResult);
  }

  private updateSimulationUi(result: SaleSimulationResult): void {
    const { vendaDolar, vendaDiamante, recomendacao } = result;

    // --- Card Dólares ---
    this.elSimBrutoDolar.textContent = TradeArbitrageEngine.formatDolar(vendaDolar.valorBrutoDolar);
    this.elSimRetornoDolar.textContent = TradeArbitrageEngine.formatDolar(vendaDolar.retornoLiquidoDolar);
    this.elSimLucroDolar.textContent = `${vendaDolar.lucroDolar >= 0 ? '+' : ''}${TradeArbitrageEngine.formatDolar(vendaDolar.lucroDolar)}`;
    this.elSimLucroDolar.className = `m-val val-profit ${vendaDolar.lucroDolar < 0 ? 'text-danger' : 'text-success'}`;

    this.elSimMargemDolar.textContent = TradeArbitrageEngine.formatPercent(vendaDolar.margemLucroPercent);
    this.elSimMargemDolar.className = `m-badge-percent ${vendaDolar.margemLucroPercent < 0 ? 'badge-danger' : 'badge-success'}`;

    // --- Card Diamantes ---
    this.elSimBrutoDiamanteEquiv.textContent = TradeArbitrageEngine.formatDolar(vendaDiamante.valorBrutoDolar);
    this.elSimRetornoDiamanteEquiv.textContent = TradeArbitrageEngine.formatDolar(vendaDiamante.retornoLiquidoDolar);
    this.elSimLucroDiamante.textContent = `${vendaDiamante.lucroDolar >= 0 ? '+' : ''}${TradeArbitrageEngine.formatDolar(vendaDiamante.lucroDolar)}`;
    this.elSimLucroDiamante.className = `m-val val-profit ${vendaDiamante.lucroDolar < 0 ? 'text-danger' : 'text-success'}`;

    this.elSimMargemDiamante.textContent = TradeArbitrageEngine.formatPercent(vendaDiamante.margemLucroPercent);
    this.elSimMargemDiamante.className = `m-badge-percent ${vendaDiamante.margemLucroPercent < 0 ? 'badge-danger' : 'badge-success'}`;

    // Destaque visual nos cards (Card vencedor ganha borda verde/brilhante)
    this.elCardVendaDolar.classList.remove('winner-card', 'loser-card');
    this.elCardVendaDiamante.classList.remove('winner-card', 'loser-card');

    if (recomendacao.melhorOpcao === 'diamante') {
      this.elCardVendaDiamante.classList.add('winner-card');
      this.elCardVendaDolar.classList.add('loser-card');
    } else if (recomendacao.melhorOpcao === 'dolar') {
      this.elCardVendaDolar.classList.add('winner-card');
      this.elCardVendaDiamante.classList.add('loser-card');
    }

    // --- Banner de Decisão e Recomendação ---
    this.elDecisionBadge.textContent = recomendacao.badgeTexto;
    this.elDecisionBadge.className = `decision-status-badge badge-${recomendacao.badgeTipo}`;

    if (recomendacao.melhorOpcao === 'diamante') {
      this.elDecisionTitle.textContent = 'Recomendado: Anunciar em Diamantes (💎)';
      this.elDecisionSubtitle.textContent = `A venda em Diamantes supera o Dólar em retorno líquido real com base na cotação atual de $ ${this.vDia.toLocaleString('pt-BR')}.`;
      this.elDecisionDifference.innerHTML = `
        <span class="diff-tag">LUCRO EXTRA:</span>
        <span class="diff-val text-success">+${TradeArbitrageEngine.formatDolar(recomendacao.diferencaLucroDolar)}</span>
      `;
    } else if (recomendacao.melhorOpcao === 'dolar') {
      this.elDecisionTitle.textContent = 'Recomendado: Anunciar em Dólares (💵)';
      this.elDecisionSubtitle.textContent = `A venda direta em Dólares garante maior retorno líquido final em comparação à cotação equivalente do Diamante.`;
      this.elDecisionDifference.innerHTML = `
        <span class="diff-tag">LUCRO EXTRA:</span>
        <span class="diff-val text-success">+${TradeArbitrageEngine.formatDolar(recomendacao.diferencaLucroDolar)}</span>
      `;
    } else if (recomendacao.melhorOpcao === 'empate') {
      this.elDecisionTitle.textContent = 'Retornos Equivalentes em Ambas as Pontas';
      this.elDecisionSubtitle.textContent = 'O lucro líquido estimado é idêntico em Dólar ou Diamante na configuração atual.';
      this.elDecisionDifference.textContent = '0% Dif.';
    } else {
      this.elDecisionTitle.textContent = 'Aguardando Valores Válidos';
      this.elDecisionSubtitle.textContent = 'Insira os preços pretendidos de venda nos cards acima para comparar.';
      this.elDecisionDifference.textContent = '--';
    }

    // Alerta de Prejuízo
    if (recomendacao.alertaPrejuizo) {
      this.elLossAlertBanner.style.display = 'flex';
      this.elLossAlertText.textContent = recomendacao.alertaPrejuizo;
    } else {
      this.elLossAlertBanner.style.display = 'none';
    }
  }
}
