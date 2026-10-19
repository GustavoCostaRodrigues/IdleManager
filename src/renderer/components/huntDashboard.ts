import type {
  AccountHuntMetrics,
  DroppedItem,
  HuntAggregatedSummary,
} from '../../shared/huntTypes.js';
import { HuntStore } from '../services/huntStore.js';

export class HuntDashboardComponent {
  public readonly element: HTMLElement;
  private readonly store: HuntStore;
  private unsubscribe?: () => void;

  // Elementos do Topo (KPI Cards)
  private elTotalPotionsCount!: HTMLElement;
  private elTotalPotionsCost!: HTMLElement;
  private elTotalLootGold!: HTMLElement;
  private elTotalLootItemsCount!: HTMLElement;
  private elTotalCatchesCount!: HTMLElement;
  private elTotalCatchesRate!: HTMLElement;
  private elNetProfitGold!: HTMLElement;
  private elNetProfitRate!: HTMLElement;
  private elSessionDuration!: HTMLElement;

  // Elementos da Tabela
  private tableBody!: HTMLElement;

  constructor(
    private readonly onNavigateToAccount?: (accountId: string) => void,
    private readonly onShowToast?: (message: string, type: 'info' | 'success' | 'danger') => void,
  ) {
    this.store = HuntStore.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'hunt-dashboard-container';
    this.element.id = 'hunt-dashboard';

    this.renderInitialStructure();
    this.bindDomReferences();
    this.initEvents();
    this.subscribeToStore();
  }

  private renderInitialStructure(): void {
    this.element.innerHTML = `
      <!-- CABEÇALHO DO DASHBOARD DA HUNT -->
      <header class="hunt-header">
        <div class="hunt-header-title-group">
          <div class="hunt-badge-live">
            <span class="live-dot"></span>
            <span>TELEMETRIA EM TEMPO REAL</span>
          </div>
          <h1 class="hunt-title">Dashboard da Hunt</h1>
          <p class="hunt-subtitle">Monitoramento financeiro, balanço de recursos e rendimento das 4 contas conectadas.</p>
        </div>

        <div class="hunt-header-actions">
          <button id="btn-reset-hunt-session" class="btn-hunt-action btn-danger-action" title="Zera todas as métricas acumuladas da sessão">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Resetar Sessão</span>
          </button>
        </div>
      </header>

      <!-- 1. CARDS DE RESUMO NO TOPO (KPIS CONSOLIDADOS) -->
      <section class="hunt-summary-grid">
        <!-- CARD 1: Gasto com Poções -->
        <div class="kpi-card kpi-potions">
          <div class="kpi-icon-wrapper potions-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Poções & Recursos Gastos</span>
            <div class="kpi-value-row">
              <span id="kpi-total-potions" class="kpi-main-value">0 un</span>
              <span id="kpi-total-potions-cost" class="kpi-sub-badge danger">-0 G</span>
            </div>
            <span class="kpi-hint">Custo médio: 300 G por poção</span>
          </div>
        </div>

        <!-- CARD 2: Valor Estimado de Drops / Loot -->
        <div class="kpi-card kpi-loot">
          <div class="kpi-icon-wrapper loot-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="5"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Valor de Loot & Drops</span>
            <div class="kpi-value-row">
              <span id="kpi-total-loot-gold" class="kpi-main-value gold">+0 G</span>
              <span id="kpi-total-loot-items" class="kpi-sub-badge gold">0 itens</span>
            </div>
            <span class="kpi-hint">Valoração de venda estimada no mercado</span>
          </div>
        </div>

        <!-- CARD 3: Total de Pokémons Capturados -->
        <div class="kpi-card kpi-catches">
          <div class="kpi-icon-wrapper catches-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M2 12h7m6 0h7"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Capturas Realizadas</span>
            <div class="kpi-value-row">
              <span id="kpi-total-catches" class="kpi-main-value success">0</span>
              <span id="kpi-catches-rate" class="kpi-sub-badge success">0% taxa</span>
            </div>
            <span class="kpi-hint">Somatório de todas as 4 contas</span>
          </div>
        </div>

        <!-- CARD 4: Lucro Líquido Estimado (Net Profit) -->
        <div class="kpi-card kpi-profit">
          <div class="kpi-icon-wrapper profit-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-header-with-timer">
              <span class="kpi-label">Lucro Líquido Geral</span>
              <span id="kpi-session-duration" class="session-timer-badge">00m 00s</span>
            </div>
            <div class="kpi-value-row">
              <span id="kpi-net-profit-gold" class="kpi-main-value highlight">+0 G</span>
              <span id="kpi-profit-rate" class="kpi-sub-badge rate">0 G/h</span>
            </div>
            <span class="kpi-hint">Saldo líquido: Drops Totais - Recursos Gastos</span>
          </div>
        </div>
      </section>

      <!-- 2. TABELA DE RELATÓRIO POR CONTA -->
      <section class="hunt-table-section">
        <div class="table-card">
          <div class="table-card-header">
            <div class="table-header-left">
              <h2 class="table-title">Desempenho Individual por Conta</h2>
              <span class="table-subtitle">Detalhamento de gastos, inventário dropado e lucro por slot</span>
            </div>
            <div class="table-header-right">
              <span class="table-badge-accounts">4 Contas Monitoradas</span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="hunt-table">
              <thead>
                <tr>
                  <th style="width: 20%;">Conta / Instância</th>
                  <th style="width: 15%;">Poções Gastas</th>
                  <th style="width: 33%;">Itens Dropados</th>
                  <th style="width: 14%;">Capturas</th>
                  <th style="width: 18%; text-align: right;">Lucro Líquido</th>
                </tr>
              </thead>
              <tbody id="hunt-table-body">
                <!-- Linhas populadas dinamicamente via TypeScript -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  private bindDomReferences(): void {
    this.elTotalPotionsCount = this.element.querySelector('#kpi-total-potions') as HTMLElement;
    this.elTotalPotionsCost = this.element.querySelector('#kpi-total-potions-cost') as HTMLElement;
    this.elTotalLootGold = this.element.querySelector('#kpi-total-loot-gold') as HTMLElement;
    this.elTotalLootItemsCount = this.element.querySelector('#kpi-total-loot-items') as HTMLElement;
    this.elTotalCatchesCount = this.element.querySelector('#kpi-total-catches') as HTMLElement;
    this.elTotalCatchesRate = this.element.querySelector('#kpi-catches-rate') as HTMLElement;
    this.elNetProfitGold = this.element.querySelector('#kpi-net-profit-gold') as HTMLElement;
    this.elNetProfitRate = this.element.querySelector('#kpi-profit-rate') as HTMLElement;
    this.elSessionDuration = this.element.querySelector('#kpi-session-duration') as HTMLElement;
    this.tableBody = this.element.querySelector('#hunt-table-body') as HTMLElement;
  }

  private initEvents(): void {
    const btnReset = this.element.querySelector('#btn-reset-hunt-session');
    btnReset?.addEventListener('click', () => {
      this.store.resetAll();
      this.onShowToast?.('Sessão da hunt resetada com sucesso.', 'info');
    });
  }

  private subscribeToStore(): void {
    this.unsubscribe = this.store.subscribe((accounts, summary) => {
      this.updateTopKpis(summary);
      this.updateTable(accounts);
    });
  }

  private updateTopKpis(summary: HuntAggregatedSummary): void {
    // 1. Poções
    this.elTotalPotionsCount.textContent = `${summary.totalPotionsUsed.toLocaleString('pt-BR')} un`;
    this.elTotalPotionsCost.textContent = `-${summary.totalPotionsCostGold.toLocaleString('pt-BR')} G`;

    // 2. Loot
    this.elTotalLootGold.textContent = `+${summary.totalLootValueGold.toLocaleString('pt-BR')} G`;
    const totalItems = summary.totalCatches + summary.totalPotionsUsed;
    this.elTotalLootItemsCount.textContent = `${totalItems} registros`;

    // 3. Capturas
    this.elTotalCatchesCount.textContent = summary.totalCatches.toLocaleString('pt-BR');
    const rate =
      summary.totalCatchesAttempted > 0
        ? Math.round((summary.totalCatches / summary.totalCatchesAttempted) * 100)
        : 0;
    this.elTotalCatchesRate.textContent = `${rate}% taxa`;

    // 4. Lucro Líquido
    const isPositive = summary.totalNetProfitGold >= 0;
    this.elNetProfitGold.textContent = `${isPositive ? '+' : ''}${summary.totalNetProfitGold.toLocaleString('pt-BR')} G`;
    this.elNetProfitGold.className = `kpi-main-value ${isPositive ? 'highlight' : 'negative'}`;

    this.elNetProfitRate.textContent = `${summary.profitPerHourGold.toLocaleString('pt-BR')} G/h`;
    this.elSessionDuration.textContent = summary.sessionDurationFormatted;
  }

  private updateTable(accounts: Map<string, AccountHuntMetrics>): void {
    this.tableBody.innerHTML = '';

    for (const acc of accounts.values()) {
      const row = document.createElement('tr');
      row.className = 'hunt-table-row';

      const isProfitPositive = acc.netProfitGold >= 0;
      const statusLabel = acc.activeStatus === 'hunting' ? 'Caçando' : 'Ociosa';
      const statusClass = acc.activeStatus === 'hunting' ? 'status-hunting' : 'status-idle';

      // Itens Dropados formatados como chips horizontais
      const itemsHtml =
        acc.droppedItems.length > 0
          ? acc.droppedItems
              .slice(-4)
              .map(
                (item) => `
                <span class="loot-chip rarity-${item.rarity}" title="${item.name}: ${item.count} un (${item.totalValueGold.toLocaleString('pt-BR')} G)">
                  <span class="loot-name">${item.name}</span>
                  <span class="loot-qty">x${item.count}</span>
                </span>
              `,
              )
              .join('')
          : '<span class="empty-drops-hint">Nenhum drop registrado ainda</span>';

      row.innerHTML = `
        <!-- Conta / Nome -->
        <td class="col-account">
          <div class="account-cell">
            <div class="account-avatar-wrapper">
              <svg viewBox="0 0 24 24" class="account-avatar-icon" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
              <span class="table-status-indicator ${statusClass}"></span>
            </div>
            <div class="account-meta">
              <strong class="account-title">${acc.accountName}</strong>
              <div class="account-submeta">
                <span class="status-text ${statusClass}">${statusLabel}</span>
                <span class="meta-partition">${acc.accountId}</span>
              </div>
            </div>
          </div>
        </td>

        <!-- Poções Gastas -->
        <td class="col-potions">
          <div class="potions-cell">
            <span class="badge-potions-count">${acc.potionsUsed} un</span>
            <span class="cost-potions-gold">-${acc.potionsCostGold.toLocaleString('pt-BR')} G</span>
          </div>
        </td>

        <!-- Itens Dropados -->
        <td class="col-loot">
          <div class="loot-chips-container">
            ${itemsHtml}
            ${
              acc.droppedItems.length > 4
                ? `<span class="loot-more-badge">+${acc.droppedItems.length - 4}</span>`
                : ''
            }
          </div>
        </td>

        <!-- Capturas Realizadas -->
        <td class="col-catches">
          <div class="catches-cell">
            <span class="badge-catches-success">${acc.pokemonCatches}</span>
            <span class="catches-attempts-label">de ${acc.catchesAttempted} tentativas</span>
          </div>
        </td>

        <!-- Lucro Líquido (Gold) -->
        <td class="col-profit">
          <div class="profit-cell">
            <span class="profit-main-badge ${isProfitPositive ? 'profit-positive' : 'profit-negative'}">
              ${isProfitPositive ? '+' : ''}${acc.netProfitGold.toLocaleString('pt-BR')} G
            </span>
            <span class="profit-sub-label">Bruto: ${acc.totalLootValueGold.toLocaleString('pt-BR')} G</span>
          </div>
        </td>
      `;

      // Clicar na conta pode levar ao foco dela
      row.addEventListener('click', () => {
        this.onNavigateToAccount?.(acc.accountId);
      });

      this.tableBody.appendChild(row);
    }
  }

  public destroy(): void {
    this.unsubscribe?.();
  }
}
