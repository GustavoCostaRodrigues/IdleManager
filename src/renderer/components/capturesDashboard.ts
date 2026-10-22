import {
  QUALITY_DEFAULT_MULTIPLIERS,
  type CaptureFilterState,
  type CaptureRecord,
  type PokeballType,
  type PokemonQuality,
} from '../../shared/captureTypes.js';
import { CaptureStore } from '../services/captureStore.js';

const QUALITY_DISPLAY_NAMES: Record<PokemonQuality, string> = {
  fraca: 'Fraca',
  comum: 'Comum',
  incomum: 'Incomum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
  mitica: 'Mítica',
  ancia: 'Anciã',
  divina: 'Divina',
};

export class CapturesDashboardComponent {
  public readonly element: HTMLElement;
  private readonly store: CaptureStore;
  private unsubscribe?: () => void;

  // Referências DOM
  private elTotalBadge!: HTMLElement;
  private elTableBody!: HTMLElement;
  private elEmptyState!: HTMLElement;
  private elPillsContainer!: HTMLElement;
  private elSearchInput!: HTMLInputElement;
  private elAccountSelect!: HTMLSelectElement;
  private elIvSelect!: HTMLSelectElement;
  private elBtnResetFilters!: HTMLButtonElement;
  private elTableCounterBadge!: HTMLElement;

  private latestRenderedIds = new Set<string>();

  constructor(
    private readonly onNavigateToAccount?: (accountId: string) => void,
    private readonly onShowToast?: (message: string, type: 'info' | 'success' | 'danger') => void,
  ) {
    this.store = CaptureStore.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'captures-dashboard-container';
    this.element.id = 'captures-dashboard';

    this.renderInitialStructure();
    this.bindDomReferences();
    this.initEvents();
    this.subscribeToStore();
  }

  private renderInitialStructure(): void {
    this.element.innerHTML = `
      <!-- CABEÇALHO DO DASHBOARD DE CAPTURAS -->
      <header class="captures-header">
        <div class="captures-header-left">
          <div class="captures-badge-live">
            <span class="captures-pulse-dot"></span>
            <span>FEED EM TEMPO REAL</span>
          </div>
          <h1 class="captures-title">
            Dashboard de Capturas & Qualidade
            <span id="captures-header-total" class="captures-title-counter">0 capturas</span>
          </h1>
          <p class="captures-subtitle">Histórico de capturas unificado das 4 contas com classificação e filtros oficiais do Poke Idle World.</p>
        </div>

        <div class="captures-header-actions">
          <button id="btn-clear-captures" class="btn-capture-action btn-clear-history" title="Limpa todo o histórico de capturas salvo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span>Limpar Histórico</span>
          </button>
        </div>
      </header>

      <!-- 1. FILTROS AVANÇADOS NO TOPO (CORES E QUALIDADES OFICIAIS DO POKE IDLE WORLD) -->
      <section class="captures-filters-card">
        <!-- Linha 1: Seletor Rápido de Qualidade Oficial -->
        <div class="rarity-pills-row" id="rarity-pills-container">
          <span class="rarity-filter-label">Qualidade:</span>
          
          <button class="rarity-pill pill-all active" data-quality="all" title="Exibe todas as capturas">
            <span>Todos</span>
            <span class="pill-count" id="count-all">0</span>
          </button>

          <button class="rarity-pill pill-fraca" data-quality="fraca" title="Qualidade Fraca">
            <span>Fraca</span>
            <span class="pill-count" id="count-fraca">0</span>
          </button>

          <button class="rarity-pill pill-comum" data-quality="comum" title="Qualidade Comum">
            <span>Comum</span>
            <span class="pill-count" id="count-comum">0</span>
          </button>

          <button class="rarity-pill pill-incomum" data-quality="incomum" title="Qualidade Incomum">
            <span>Incomum</span>
            <span class="pill-count" id="count-incomum">0</span>
          </button>

          <button class="rarity-pill pill-rara" data-quality="rara" title="Qualidade Rara">
            <span>Rara</span>
            <span class="pill-count" id="count-rara">0</span>
          </button>

          <button class="rarity-pill pill-epica" data-quality="epica" title="Qualidade Épica">
            <span>Épica</span>
            <span class="pill-count" id="count-epica">0</span>
          </button>

          <button class="rarity-pill pill-lendaria" data-quality="lendaria" title="Qualidade Lendária">
            <span>Lendária</span>
            <span class="pill-count" id="count-lendaria">0</span>
          </button>

          <button class="rarity-pill pill-mitica" data-quality="mitica" title="Qualidade Mítica">
            <span>Mítica</span>
            <span class="pill-count" id="count-mitica">0</span>
          </button>

          <button class="rarity-pill pill-ancia" data-quality="ancia" title="Qualidade Anciã">
            <span>Anciã</span>
            <span class="pill-count" id="count-ancia">0</span>
          </button>

          <button class="rarity-pill pill-divina" data-quality="divina" title="Qualidade Divina">
            <span>Divina</span>
            <span class="pill-count" id="count-divina">0</span>
          </button>
        </div>

        <!-- Linha 2: Controles Complementares (Busca Textual, Conta, IV Mínimo) -->
        <div class="filters-controls-row">
          <!-- Campo de Busca por Nome / Dex -->
          <div class="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              id="filter-search-pokemon"
              class="search-pokemon-input"
              placeholder="Buscar por nome do Pokémon ou número da Dex..."
              autocomplete="off"
              spellcheck="false"
            />
          </div>

          <!-- Filtro por Conta -->
          <div class="filter-select-group">
            <label class="filter-select-label" for="filter-select-account">Conta:</label>
            <select id="filter-select-account" class="filter-select">
              <option value="all">Todas as Contas</option>
              <option value="account_01">01 (Slot 1)</option>
              <option value="account_02">02 (Slot 2)</option>
              <option value="account_03">03 (Slot 3)</option>
              <option value="account_04">04 (Slot 4)</option>
            </select>
          </div>

          <!-- Filtro por IV Mínimo -->
          <div class="filter-select-group">
            <label class="filter-select-label" for="filter-select-iv">IV Mínimo:</label>
            <select id="filter-select-iv" class="filter-select">
              <option value="0">Qualquer IV (0%+)</option>
              <option value="50">IV ≥ 50% (Tier B+)</option>
              <option value="75">IV ≥ 75% (Tier A+)</option>
              <option value="90">IV ≥ 90% (Tier S+)</option>
              <option value="100">IV 100% (Perfeito)</option>
            </select>
          </div>

          <!-- Botão Resetar Filtros -->
          <button id="btn-reset-filters" class="btn-reset-filters" title="Restaura todos os filtros de busca para o padrão">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Limpar Filtros</span>
          </button>
        </div>
      </section>

      <!-- 2. TABELA DE HISTÓRICO DE CAPTURAS -->
      <section class="captures-table-section">
        <div class="captures-table-card">
          <div class="captures-table-header">
            <div class="captures-table-title-group">
              <h2 class="captures-table-title">Registros Recentes</h2>
              <span id="captures-filtered-badge" class="captures-table-count-badge">0 exibidos</span>
            </div>
            <div class="captures-table-hints" style="font-size: 11px; color: var(--text-muted);">
              Clique na linha de uma conta para focalizar seu quadrante
            </div>
          </div>

          <div class="table-responsive-captures">
            <table class="captures-table">
              <thead>
                <tr>
                  <th style="width: 15%;">Conta (Slot)</th>
                  <th style="width: 25%;">Pokémon</th>
                  <th style="width: 16%;">Pokébola Usada</th>
                  <th style="width: 15%;">Qualidade</th>
                  <th style="width: 14%;">IV do Pokémon</th>
                  <th style="width: 15%; text-align: right;">Data / Hora</th>
                </tr>
              </thead>
              <tbody id="captures-table-body">
                <!-- Linhas populadas dinamicamente via TypeScript -->
              </tbody>
            </table>

            <!-- Empty State quando nenhuma captura foi realizada ainda -->
            <div id="captures-empty-state" class="captures-empty-state" style="display: none;">
              <svg class="captures-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="2" y1="12" x2="9" y2="12"/>
                <line x1="15" y1="12" x2="22" y2="12"/>
              </svg>
              <h3 class="captures-empty-title">Nenhuma captura registrada ainda</h3>
              <p class="captures-empty-desc">Aguardando capturas reais das contas conectadas. Assim que um Pokémon for capturado no Poke Idle World em qualquer instância ativa, o registro com dados autênticos aparecerá aqui instantaneamente.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private bindDomReferences(): void {
    this.elTotalBadge = this.element.querySelector('#captures-header-total') as HTMLElement;
    this.elTableBody = this.element.querySelector('#captures-table-body') as HTMLElement;
    this.elEmptyState = this.element.querySelector('#captures-empty-state') as HTMLElement;
    this.elPillsContainer = this.element.querySelector('#rarity-pills-container') as HTMLElement;
    this.elSearchInput = this.element.querySelector('#filter-search-pokemon') as HTMLInputElement;
    this.elAccountSelect = this.element.querySelector('#filter-select-account') as HTMLSelectElement;
    this.elIvSelect = this.element.querySelector('#filter-select-iv') as HTMLSelectElement;
    this.elBtnResetFilters = this.element.querySelector('#btn-reset-filters') as HTMLButtonElement;
    this.elTableCounterBadge = this.element.querySelector('#captures-filtered-badge') as HTMLElement;
  }

  private initEvents(): void {
    // 1. Filtro rápido de Qualidade Oficial (Pill Buttons)
    const pills = this.elPillsContainer.querySelectorAll<HTMLButtonElement>('.rarity-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const quality = pill.dataset.quality as PokemonQuality | 'all';
        this.store.setFilter({ quality });
      });
    });

    // 2. Busca com debounce suave
    let searchTimeout: number | null = null;
    this.elSearchInput.addEventListener('input', () => {
      if (searchTimeout) window.clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        this.store.setFilter({ searchQuery: this.elSearchInput.value });
      }, 150);
    });

    // 3. Select de Conta
    this.elAccountSelect.addEventListener('change', () => {
      this.store.setFilter({ accountId: this.elAccountSelect.value });
    });

    // 4. Select de IV Mínimo
    this.elIvSelect.addEventListener('change', () => {
      this.store.setFilter({ minIv: Number(this.elIvSelect.value) || 0 });
    });

    // 5. Botão Resetar Filtros
    this.elBtnResetFilters.addEventListener('click', () => {
      this.store.resetFilter();
      this.elSearchInput.value = '';
      this.elAccountSelect.value = 'all';
      this.elIvSelect.value = '0';
      this.onShowToast?.('Filtros de busca restaurados.', 'info');
    });

    // 6. Botão Limpar Histórico
    const btnClear = this.element.querySelector('#btn-clear-captures');
    btnClear?.addEventListener('click', () => {
      if (confirm('Tem certeza de que deseja limpar todo o histórico de capturas registradas?')) {
        this.store.clearHistory();
        this.onShowToast?.('Histórico de capturas limpo.', 'info');
      }
    });
  }

  private subscribeToStore(): void {
    this.unsubscribe = this.store.subscribe((captures, filter, counts) => {
      this.updatePills(filter.quality, counts);
      this.updateFormFields(filter);
      this.renderTableRows(captures);
    });
  }

  private updatePills(activeQuality: PokemonQuality | 'all', counts: Record<PokemonQuality | 'all', number>): void {
    // Atualiza contadores numéricos para todas as 9 qualidades reais + total
    const updateCount = (id: string, value: number) => {
      const el = this.element.querySelector(id);
      if (el) el.textContent = String(value);
    };

    updateCount('#count-all', counts.all);
    updateCount('#count-fraca', counts.fraca);
    updateCount('#count-comum', counts.comum);
    updateCount('#count-incomum', counts.incomum);
    updateCount('#count-rara', counts.rara);
    updateCount('#count-epica', counts.epica);
    updateCount('#count-lendaria', counts.lendaria);
    updateCount('#count-mitica', counts.mitica);
    updateCount('#count-ancia', counts.ancia);
    updateCount('#count-divina', counts.divina);

    this.elTotalBadge.textContent = `${counts.all.toLocaleString('pt-BR')} capturas`;

    // Atualiza estado ativo
    const pills = this.elPillsContainer.querySelectorAll<HTMLButtonElement>('.rarity-pill');
    pills.forEach((pill) => {
      const pillQuality = pill.dataset.quality;
      if (pillQuality === activeQuality) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  private updateFormFields(filter: CaptureFilterState): void {
    if (this.elAccountSelect.value !== filter.accountId) {
      this.elAccountSelect.value = filter.accountId;
    }
    if (Number(this.elIvSelect.value) !== filter.minIv) {
      this.elIvSelect.value = String(filter.minIv);
    }
    if (this.elSearchInput.value !== filter.searchQuery && document.activeElement !== this.elSearchInput) {
      this.elSearchInput.value = filter.searchQuery;
    }
  }

  private renderTableRows(captures: CaptureRecord[]): void {
    this.elTableCounterBadge.textContent = `${captures.length} exibidos`;

    if (captures.length === 0) {
      this.elTableBody.innerHTML = '';
      this.elEmptyState.style.display = 'flex';
      return;
    }

    this.elEmptyState.style.display = 'none';
    this.elTableBody.innerHTML = '';

    const newRenderedIds = new Set<string>();

    for (const record of captures) {
      newRenderedIds.add(record.id);
      const isNew = !this.latestRenderedIds.has(record.id);

      const row = document.createElement('tr');
      row.className = `capture-row ${isNew ? 'capture-row-enter' : ''}`;

      // 1. Data e Hora
      const timeFormatted = this.formatTimestamp(record.timestamp);

      // 2. Conta (Slot)
      const slotNumber = record.accountId.replace('account_0', '').replace('account_', '');

      // 3. Nome e Sprite Real do Pokémon
      const rawName = record.pokemonName.trim();
      const cleanName = rawName.replace(/.*(?:Captura|selvagem|Loja|\d)+/gi, '').trim() || rawName;
      const dexNum = record.pokemonDexNumber;
      const spriteUrl = dexNum
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${record.isShiny ? 'shiny/' : ''}${dexNum}.png`
        : '';
      const fallbackOutfitUrl = dexNum
        ? `https://poke.idleworld.online/assets/pokemon/outfit_${dexNum}_.png`
        : '';

      // 4. Qualidade Oficial do Poke Idle World
      const qualityClass = `quality-${record.quality.toLowerCase()}`;
      const qualityDisplayName = QUALITY_DISPLAY_NAMES[record.quality] || record.quality;
      const multiplierVal =
        typeof record.qualityMultiplier === 'number' && !isNaN(record.qualityMultiplier) && record.qualityMultiplier > 0
          ? record.qualityMultiplier
          : (QUALITY_DEFAULT_MULTIPLIERS[record.quality] ?? 1.0);
      const multiplierText = `x${multiplierVal.toFixed(2)}`;

      // 5. Pokébola com SVG nítido
      const pokeballHtml = this.getPokeballMarkup(record.pokeball);

      // 6. IV do Pokémon em x/192
      const ivPoints = record.iv.total;
      const isPerfect = record.iv.percentage >= 100 || ivPoints >= 192;
      const tierClass = `tier-${record.iv.tier.toLowerCase()}${isPerfect ? ' perfect' : ''}`;
      const fillClass = `fill-${record.iv.tier.toLowerCase()}${isPerfect ? ' fill-perfect' : ''}`;
      const tierLabel = isPerfect ? 'PERFEITO' : `TIER ${record.iv.tier}`;

      row.innerHTML = `
        <!-- 1. CONTA (SLOT) -->
        <td class="col-account">
          <div class="account-slot-cell" title="Conta: ${record.accountName} (${record.accountId})">
            <span class="account-badge-slot">0${slotNumber}</span>
            <div class="account-name-meta">
              <span class="account-slot-name">${record.accountName}</span>
              <span class="account-slot-partition">${record.accountId}</span>
            </div>
          </div>
        </td>

        <!-- 2. POKÉMON COM SPRITE REAL À ESQUERDA -->
        <td class="col-pokemon">
          <div class="pokemon-cell">
            <div class="pokemon-avatar-box">
              ${spriteUrl ? `
                <img 
                  src="${spriteUrl}" 
                  alt="${cleanName}" 
                  class="pokemon-sprite-img" 
                  loading="lazy"
                  onerror="this.onerror=null; ${fallbackOutfitUrl ? `this.src='${fallbackOutfitUrl}';` : `this.style.display='none';`}"
                />
              ` : `
                <svg viewBox="0 0 24 24" class="pokemon-dex-svg" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="9"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M3 12h6m6 0h6"/>
                </svg>
              `}
            </div>
            <div class="pokemon-meta-info">
              <div class="pokemon-name-row">
                <strong class="pokemon-title">${cleanName}</strong>
                ${record.isShiny ? '<span class="pokemon-shiny-star" title="Pokémon Shiny!">✨</span>' : ''}
              </div>
              <div class="pokemon-sub-info">
                ${record.pokemonDexNumber ? `<span class="pokemon-dex-tag">#${String(record.pokemonDexNumber).padStart(3, '0')}</span>` : ''}
                <span class="pokemon-level-tag">Nv. ${record.level}</span>
              </div>
            </div>
          </div>
        </td>

        <!-- 3. POKÉBOLA USADA -->
        <td class="col-pokeball">
          <div class="pokeball-cell">
            ${pokeballHtml}
          </div>
        </td>

        <!-- 4. QUALIDADE DO POKÉMON (OFICIAL DO POKE IDLE WORLD) -->
        <td class="col-quality">
          <span class="quality-badge ${qualityClass}">
            ${record.isShiny ? '<span style="font-size: 11px; margin-right: 4px;">✨</span>' : ''}
            <span>${qualityDisplayName} ${multiplierText}</span>
          </span>
        </td>

        <!-- 5. IV DO POKÉMON EM x/192 -->
        <td class="col-iv">
          <div class="iv-cell" title="IV Total: ${ivPoints}/192 pontos (${record.iv.percentage}%)">
            <div class="iv-header-row">
              <span class="iv-value-text">${ivPoints}/192</span>
              <span class="iv-tier-badge ${tierClass}">${tierLabel}</span>
            </div>
            <div class="iv-progress-track">
              <div class="iv-progress-fill ${fillClass}" style="width: ${Math.min(100, record.iv.percentage)}%;"></div>
            </div>
          </div>
        </td>

        <!-- 6. DATA / HORA (ÚLTIMO ITEM MAIS À DIREITA) -->
        <td class="col-time">
          <div class="time-cell">
            <span class="time-exact">${timeFormatted.exact}</span>
            <span class="time-relative">${timeFormatted.relative}</span>
          </div>
        </td>
      `;

      // Clicar na linha leva ao foco da conta
      row.addEventListener('click', () => {
        this.onNavigateToAccount?.(record.accountId);
      });

      this.elTableBody.appendChild(row);
    }

    this.latestRenderedIds = newRenderedIds;
  }

  private formatTimestamp(timestamp: number): { exact: string; relative: string } {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const exact = `${hours}:${minutes}:${seconds}`;

    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    let relative = `${day}/${month}`;
    if (diffSeconds < 60) {
      relative = 'agora há pouco';
    } else if (diffSeconds < 3600) {
      relative = `há ${Math.floor(diffSeconds / 60)}m`;
    } else if (diffSeconds < 86400) {
      relative = `há ${Math.floor(diffSeconds / 3600)}h`;
    }

    return { exact, relative };
  }

  private getPokeballMarkup(type: PokeballType): string {
    switch (type) {
      case 'masterball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#161B22" stroke="#30363D" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#A371F7"/>
            <circle cx="6.5" cy="8.5" r="2" fill="#FF7E98"/>
            <circle cx="17.5" cy="8.5" r="2" fill="#FF7E98"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#A371F7"/>
          </svg>
          <span class="pokeball-label">Master Ball</span>
        `;
      case 'golden_idleball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#161B22" stroke="#F0C040" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#F0C040"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#F0C040"/>
          </svg>
          <span class="pokeball-label" style="color: #F0C040; font-weight: 600;">Golden Idle Ball</span>
        `;
      case 'idleball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#161B22" stroke="#58A6FF" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#8B949E"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#58A6FF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#FFFFFF"/>
          </svg>
          <span class="pokeball-label">Idle Ball</span>
        `;
      case 'rubber_ball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#161B22" stroke="#3FB950" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#3FB950"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#3FB950"/>
          </svg>
          <span class="pokeball-label">Rubber Ball</span>
        `;
      case 'earth_ball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#161B22" stroke="#D29922" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#238636"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#D29922" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#FFFFFF"/>
          </svg>
          <span class="pokeball-label">Earth Ball</span>
        `;
      case 'ultraball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#161B22" stroke="#30363D" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#21262D"/>
            <path d="M6 3 L9 12 M18 3 L15 12" stroke="#FFE066" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#FFE066"/>
          </svg>
          <span class="pokeball-label">Ultra Ball</span>
        `;
      case 'greatball':
      case 'superball':
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#F0F6FC" stroke="#30363D" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#58A6FF"/>
            <path d="M5 8 L8 12 M19 8 L16 12" stroke="#F85149" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#58A6FF"/>
          </svg>
          <span class="pokeball-label">${type === 'superball' ? 'Super Ball' : 'Great Ball'}</span>
        `;
      case 'pokeball':
      default:
        return `
          <svg class="pokeball-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#F0F6FC" stroke="#30363D" stroke-width="1.5"/>
            <path d="M2 12 A10 10 0 0 1 22 12" fill="#F85149"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0F1117" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="1.3" fill="#F85149"/>
          </svg>
          <span class="pokeball-label">Poké Ball</span>
        `;
    }
  }

  public destroy(): void {
    this.unsubscribe?.();
  }
}
