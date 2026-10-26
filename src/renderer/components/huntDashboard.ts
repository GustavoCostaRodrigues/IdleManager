import { DEFAULT_ACCOUNTS } from '../../shared/constants.js';
import {
  HuntClientService,
  type AccountHuntCardState,
  type HuntLootItem,
} from '../services/huntClientService.js';
import { MarketService } from '../services/marketService.js';

export class HuntDashboardComponent {
  public readonly element: HTMLElement;
  private readonly service: HuntClientService;
  private unsubscribe?: () => void;
  private btnRefreshAll!: HTMLButtonElement;
  private cardsContainer!: HTMLElement;
  private isRefreshingAll = false;

  constructor(
    private readonly onNavigateToAccount?: (accountId: string) => void,
    private readonly onShowToast?: (message: string, type: 'info' | 'success' | 'danger') => void,
    private readonly getAccountOptions?: () => Array<{
      id: string;
      name: string;
      webview: Electron.WebviewTag;
    }>,
  ) {
    this.service = HuntClientService.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'hunt-dashboard-container';
    this.element.id = 'hunt-dashboard';

    this.renderInitialStructure();
    this.bindDomReferences();
    this.initEvents();
    this.tryAutoDetectMissingTokens();
    this.subscribeToService();
  }

  private renderInitialStructure(): void {
    this.element.innerHTML = `
      <!-- CABEÇALHO GLOBAL DO DASHBOARD DE HUNTS -->
      <header class="hunt-header">
        <div class="hunt-header-title-group">
          <div class="hunt-badge-live">
            <span class="live-dot"></span>
            <span>CLIENT-SIDE COM JITTER SEGURO</span>
          </div>
          <h1 class="hunt-title">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Dashboard de Hunts</span>
          </h1>
          <p class="hunt-subtitle">
            <span>Visão em Grid 2x2 das 4 contas. Consumo direto client-side com desincronização.</span>
            <span class="hunt-jitter-badge" title="Intervalo randômico entre checagens para proteção anti-bot">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Jitter: 25s – 45s
            </span>
          </p>
        </div>

        <div class="hunt-header-actions">
          <button id="btn-refresh-all-hunts" class="btn-hunt-refresh-all" title="Dispara uma requisição manual sob demanda para todas as 4 contas instantaneamente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            <span>Atualizar Tudo</span>
          </button>
        </div>
      </header>

      <!-- GRID 2x2: OS 4 CARDS DE HUNTS -->
      <section class="hunt-grid-2x2" id="hunt-cards-grid">
        <!-- Renderizado dinamicamente via TypeScript -->
      </section>
    `;
  }

  private bindDomReferences(): void {
    this.btnRefreshAll = this.element.querySelector('#btn-refresh-all-hunts') as HTMLButtonElement;
    this.cardsContainer = this.element.querySelector('#hunt-cards-grid') as HTMLElement;
  }

  private initEvents(): void {
    this.btnRefreshAll?.addEventListener('click', async () => {
      if (!this.service.isScreenRequestsEnabled()) {
        this.onShowToast?.(
          'Requisições do Dashboard da Hunt estão desativadas. Habilite na tela de Ajustes para fazer requisições.',
          'info',
        );
        return;
      }

      if (this.isRefreshingAll) return;
      this.isRefreshingAll = true;
      this.btnRefreshAll.classList.add('syncing');
      this.btnRefreshAll.disabled = true;

      this.onShowToast?.('Disparando requisições manuais para as 4 contas...', 'info');

      try {
        await this.service.refreshAll();
      } finally {
        setTimeout(() => {
          this.isRefreshingAll = false;
          this.btnRefreshAll.classList.remove('syncing');
          this.btnRefreshAll.disabled = false;
        }, 1200);
      }
    });
  }

  /**
   * Tenta detectar automaticamente tokens JWT de webviews caso alguma conta ainda não possua
   */
  public async tryAutoDetectMissingTokens(): Promise<void> {
    if (!this.getAccountOptions) return;
    try {
      const options = this.getAccountOptions();
      const marketService = MarketService.getInstance();
      for (const opt of options) {
        if (!marketService.getAccountToken(opt.id) && opt.webview) {
          await marketService.autoDetectTokenForAccount(opt.id, opt.webview);
        }
      }
    } catch (_) {}
  }

  public onViewOpened(): void {
    this.tryAutoDetectMissingTokens();
  }

  private subscribeToService(): void {
    this.unsubscribe = this.service.subscribe((states) => {
      this.renderGridCards(states);
    });
  }

  /**
   * Renderiza os 4 cards da estrutura 2x2
   */
  private renderGridCards(states: Map<string, AccountHuntCardState>): void {
    this.cardsContainer.innerHTML = '';

    for (const acc of DEFAULT_ACCOUNTS) {
      const state = states.get(acc.id) || {
        accountId: acc.id,
        accountName: acc.name,
        status: 'idle',
        requestsEnabled: this.service.isAccountRequestsEnabled(acc.id),
        loots: [],
        totalHuntDollar: 0,
        lastSyncTime: null,
        syncError: null,
        isSyncing: false,
        nextCheckSeconds: 0,
      };

      const requestsEnabled = state.requestsEnabled !== false && this.service.isAccountRequestsEnabled(acc.id);
      const card = document.createElement('article');
      card.className = `hunt-card${requestsEnabled ? '' : ' requests-disabled'}`;
      card.id = `hunt-card-${acc.id}`;

      // Status Badge: 🟢 FARMANDO ou ⚪ OCIOSA
      const isFarming = state.status === 'farming';
      const statusBadgeHtml = isFarming
        ? `<span class="hunt-status-badge status-farming">
             <span class="status-dot-pulse"></span>
             <span>🟢 FARMANDO</span>
           </span>`
        : `<span class="hunt-status-badge status-idle">
             <span class="status-dot-idle"></span>
             <span>⚪ OCIOSA</span>
           </span>`;

      // Status do Token JWT da conta (verificado centralizadamente em Ajustes)
      const marketSvc = MarketService.getInstance();
      const rawToken = marketSvc.getAccountToken(acc.id);
      const isJwtActive = marketSvc.isAccountJwtActive(acc.id);
      const isScreenEnabled = this.service.isScreenRequestsEnabled();

      let tokenIndicatorHtml = '';
      if (!rawToken) {
        tokenIndicatorHtml = `<span class="hunt-token-tag hunt-token-missing" title="Sem Token JWT (Configure na tela de Ajustes)">⚠️ Sem JWT</span>`;
      } else if (!isJwtActive) {
        tokenIndicatorHtml = `<span class="hunt-token-tag hunt-token-disabled" title="Token JWT desativado na tela de Ajustes">🔒 JWT Inativo</span>`;
      } else {
        tokenIndicatorHtml = `<span class="hunt-token-tag hunt-token-ok" title="Token JWT Ativo e Autenticado">🔑 JWT OK</span>`;
      }

      // Aviso discreto de sincronização/erro ou contagem de jitter
      let syncBadgeHtml = '';
      if (!isScreenEnabled) {
        syncBadgeHtml = `<span class="hunt-disabled-tag" title="Requisições da tela da Hunt desativadas na tela de Ajustes">⏸️ Tela Pausada</span>`;
      } else if (!requestsEnabled) {
        syncBadgeHtml = `<span class="hunt-disabled-tag" title="Requisições desta conta desativadas na tela de Ajustes">⏸️ Conta Pausada</span>`;
      } else if (state.isSyncing) {
        syncBadgeHtml = `<span class="hunt-sync-spinner" title="Sincronizando inventário e capturas..."></span>`;
      } else if (state.syncError) {
        syncBadgeHtml = `<span class="hunt-error-notice" title="${state.syncError}">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          ${state.syncError}
        </span>`;
      } else if (state.nextCheckSeconds > 0) {
        syncBadgeHtml = `<span class="hunt-jitter-countdown" title="Próxima checagem randômica em ~${state.nextCheckSeconds}s">~${state.nextCheckSeconds}s</span>`;
      }

      // Linhas da Lista de Loots (Scrollável)
      const lootRowsHtml =
        state.loots.length > 0
          ? state.loots
              .map((item) => this.renderLootRowHtml(item))
              .join('')
          : `
            <div class="hunt-empty-loot-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
              <span class="hunt-empty-title">Nenhum loot registrado nesta hunt</span>
              <span class="hunt-empty-hint">Novos itens dropados ou Pokémon capturados aparecerão aqui com valor em dólares.</span>
            </div>
          `;

      card.innerHTML = `
        <!-- 1. CABEÇALHO DO CARD -->
        <header class="hunt-card-header">
          <div class="hunt-card-account-group">
            <div class="hunt-account-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="hunt-card-title-text">
              <strong class="hunt-card-account-name">${acc.name}</strong>
              <span class="hunt-card-slot-tag">${acc.id.toUpperCase()}</span>
            </div>
            ${statusBadgeHtml}
          </div>

          <div class="hunt-card-header-right">
            ${tokenIndicatorHtml}
            ${syncBadgeHtml}
          </div>
        </header>

        <!-- 2. LISTA DE LOOTS (SCROLLÁVEL) -->
        <div class="hunt-card-body" id="loot-list-${acc.id}">
          ${lootRowsHtml}
        </div>

        <!-- 3. RODAPÉ DO CARD -->
        <footer class="hunt-card-footer">
          <div class="hunt-total-group">
            <span class="hunt-total-label">Total da Hunt</span>
            <span class="hunt-total-value">$ ${state.totalHuntDollar.toLocaleString('pt-BR')}</span>
          </div>

          <button class="btn-zero-hunt" id="btn-zero-${acc.id}" title="Zera os contadores desta conta e reinicia a contagem de loots da hunt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Zerar Hunt</span>
          </button>
        </footer>
      `;

      // Evento do botão "Zerar Hunt"
      const btnZero = card.querySelector(`#btn-zero-${acc.id}`);
      btnZero?.addEventListener('click', async (e) => {
        e.stopPropagation();
        (btnZero as HTMLButtonElement).disabled = true;
        try {
          await this.service.resetAccountHunt(acc.id);
          this.onShowToast?.(`Hunt da ${acc.name} zerada com sucesso!`, 'info');
        } finally {
          setTimeout(() => {
            (btnZero as HTMLButtonElement).disabled = false;
          }, 600);
        }
      });

      // Clique no cabeçalho permite focar na respectiva conta
      card.querySelector('.hunt-card-header')?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.hunt-card-switch-wrapper') || target.closest('input') || target.closest('label')) return;
        this.onNavigateToAccount?.(acc.id);
      });

      this.cardsContainer.appendChild(card);
    }
  }

  /**
   * Renderiza a linha de loot no formato exato requerido:
   * [Quantidade]x [Nome do Item/Pokémon] alinhado à esquerda | Valor total em dólar alinhado à direita (emerald-400)
   */
  private renderLootRowHtml(item: HuntLootItem): string {
    const isPokemon = item.kind === 'pokemon';
    const tagClass = isPokemon ? 'kind-pokemon' : 'kind-item';
    const tagLabel = isPokemon ? 'POKÉ' : 'ITEM';

    return `
      <div class="hunt-loot-row" title="${item.name}: ${item.count} un. ($ ${item.unitValueDollar.toLocaleString('pt-BR')} cada)">
        <div class="hunt-loot-left">
          <span class="loot-kind-tag ${tagClass}">${tagLabel}</span>
          <span class="loot-qty-prefix">${item.count}x</span>
          <span class="loot-name-text">${this.escapeHtml(item.name)}</span>
        </div>
        <div class="hunt-loot-right">
          <span class="loot-dollar-value">$ ${item.totalValueDollar.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    `;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  public destroy(): void {
    this.unsubscribe?.();
    this.service.destroy();
  }
}
