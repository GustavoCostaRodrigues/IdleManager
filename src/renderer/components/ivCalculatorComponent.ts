import {
  POKEMON_DATABASE,
  POKEMON_PLACEHOLDER_ICON,
  getPokemonByName,
  getPokemonFallbackOutfitUrl,
  getPokemonLocalSpriteUrl,
  getPokemonSpriteUrl,
  searchPokemon,
  type PokemonSpeciesData,
} from '../data/pokemonBaseStats.js';
import {
  PiwCalculatorEngine,
  STAT_DEFINITIONS,
  type StatDefinition,
  type IvCalculationResult,
  type IvInputParameters,
  type ProjectedStatsResult,
  type StatKey,
} from '../services/piwCalculatorEngine.js';

export class IvCalculatorComponent {
  public readonly element: HTMLElement;

  private currentSpecies: PokemonSpeciesData | null = null;
  private currentLevel = 1;
  private currentMultiplier = 1.8; // Padrão Lendária 1.80
  private currentStats: Record<StatKey, number> = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
  private projectedLevel = 300;

  // Elementos do DOM
  private elSearchInput!: HTMLInputElement;
  private elSearchResults!: HTMLElement;
  private elAvatarPlaceholder!: SVGElement;
  private elSelectedAvatarImg!: HTMLImageElement;
  private elSelectedName!: HTMLElement;
  private elSelectedDex!: HTMLElement;

  private elLevelInput!: HTMLInputElement;
  private elMultiplierInput!: HTMLInputElement;

  private elStatInputs: Record<StatKey, HTMLInputElement> = {} as any;
  private elStatBaseTags: Record<StatKey, HTMLElement> = {} as any;
  private elStatIvScores: Record<StatKey, HTMLElement> = {} as any;
  private elStatProgressBars: Record<StatKey, HTMLElement> = {} as any;
  private elStatTierBadges: Record<StatKey, HTMLElement> = {} as any;
  private elStatPercentages: Record<StatKey, HTMLElement> = {} as any;

  // Faixa Estimada de IV Total
  private elTotalScore!: HTMLElement;
  private elTotalPercentage!: HTMLElement;
  private elTotalTierBadge!: HTMLElement;
  private elRangeMin!: HTMLElement;
  private elRangeEst!: HTMLElement;
  private elRangeMax!: HTMLElement;
  private elConsistencyBadge!: HTMLElement;
  private elConsistencyIcon!: SVGElement;
  private elConsistencyText!: HTMLElement;

  // Simulador de Nível & Power
  private elProjectedLevelInput!: HTMLInputElement;
  private elProjectedGrid!: HTMLElement;
  private elProjectedPower!: HTMLElement;
  private elProjectedDelta!: HTMLElement;

  private elBtnCopyCard!: HTMLButtonElement;

  constructor(
    private readonly onNavigateToView?: (view: 'accounts' | 'hunt' | 'captures' | 'settings') => void,
    private readonly onToast?: (message: string, type?: 'info' | 'success' | 'danger') => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'piw-calc-container';
    this.render();
    this.setupEvents();
    this.recalculate();
  }

  private render(): void {
    this.element.innerHTML = `
      <!-- BARRA SUPERIOR SIMPLIFICADA: 1 LINHA DIRETA -->
      <section class="piw-top-bar">
        <!-- 1. Seletor de Pokémon com Avatar -->
        <div class="piw-pokemon-selector">
          <div class="piw-avatar-box" id="piw-avatar-box">
            <svg id="piw-avatar-placeholder" class="piw-avatar-svg" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.8">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M3 12h6m6 0h6"/>
            </svg>
            <img id="piw-selected-img" class="piw-avatar-img" src="" alt="Pokémon" style="display: none;" />
          </div>

          <div class="piw-selector-input-wrap">
            <div class="piw-selector-info">
              <span class="piw-selector-label">Pokémon:</span>
              <strong id="piw-selected-name">Selecione um Pokémon</strong>
              <span id="piw-selected-dex" class="piw-dex-tag">#---</span>
            </div>
            <div class="piw-search-relative">
              <input 
                type="text" 
                id="piw-search-input" 
                class="piw-input piw-search-field" 
                placeholder="Pesquisar por nome ou Dex (ex: Charmander, Gengar, #004)..." 
                autocomplete="off"
              />
              <div id="piw-search-dropdown" class="piw-dropdown hidden"></div>
            </div>
          </div>
        </div>

        <!-- 2. Parâmetros em Linha: Nível e Qualidade Textuais -->
        <div class="piw-top-params">
          <!-- Nível Atual -->
          <div class="piw-param-box">
            <label for="piw-input-level">Nível:</label>
            <div class="piw-input-addon">
              <input 
                type="number" 
                id="piw-input-level" 
                class="piw-input piw-num-input" 
                min="1" 
                max="500" 
                value="${this.currentLevel}" 
              />
              <span>Nv</span>
            </div>
          </div>

          <!-- Qualidade (Apenas campo textual numérico) -->
          <div class="piw-param-box">
            <label for="piw-input-mult">Qualidade (Mult.):</label>
            <div class="piw-input-addon">
              <input 
                type="number" 
                id="piw-input-mult" 
                class="piw-input piw-num-input" 
                step="0.01" 
                min="0.1" 
                max="10.0" 
                value="${this.currentMultiplier.toFixed(2)}" 
              />
              <span>x</span>
            </div>
          </div>
        </div>
      </section>

      <!-- TABELA CENTRAL DOS 6 ATRIBUTOS -->
      <section class="piw-stats-table-card">
        <div class="piw-table-header">
          <span>Atributo & Base</span>
          <span>Valor Atual (No Jogo)</span>
          <span>IV Calculado (/32.0)</span>
          <span>Barra de Eficiência</span>
          <span>Tier</span>
        </div>

        <div class="piw-table-rows">
          ${STAT_DEFINITIONS.map((def: StatDefinition) => `
            <div class="piw-stat-row" style="--accent-color: ${def.color};">
              <div class="piw-col-name">
                <span class="piw-stat-dot"></span>
                <strong class="piw-stat-label">${def.label}</strong>
                <span class="piw-base-badge" id="base-${def.key}">Base: ${this.currentSpecies ? this.currentSpecies.baseStats[def.key] : '-'}</span>
              </div>

              <div class="piw-col-input">
                <input 
                  type="number" 
                  id="stat-input-${def.key}" 
                  class="piw-input piw-stat-field" 
                  min="0" 
                  max="99999" 
                  value="${this.currentStats[def.key] || 0}" 
                />
              </div>

              <div class="piw-col-score">
                <strong id="iv-score-${def.key}" class="piw-score-text">- / 32</strong>
              </div>

              <div class="piw-col-bar">
                <div class="piw-bar-track">
                  <div class="piw-bar-fill" id="bar-fill-${def.key}" style="width: 0%;"></div>
                </div>
                <span class="piw-bar-pct" id="bar-pct-${def.key}">0%</span>
              </div>

              <div class="piw-col-tier">
                <span class="piw-tier-pill tier-c" id="tier-pill-${def.key}">-</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- PAINEL INFERIOR: 2 COLUNAS LIMPAS -->
      <section class="piw-bottom-grid">
        <!-- Coluna Esquerda: Faixa Estimada de IV Total -->
        <div class="piw-card piw-total-card">
          <div class="piw-total-header">
            <div>
              <span class="piw-card-sub">POTENCIAL GERAL</span>
              <h3 class="piw-total-title">Faixa Estimada de IV Total</h3>
            </div>
            <button id="btn-copy-card" class="piw-btn-copy" title="Copiar card formatado para colar em chats ou Discord">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>Copiar Card</span>
            </button>
          </div>

          <div class="piw-hero-score-box">
            <div class="piw-score-left">
              <span class="piw-big-score" id="piw-total-score">-- / 192</span>
              <span class="piw-big-pct" id="piw-total-pct">(0.0%)</span>
            </div>
            <span class="piw-big-tier tier-c" id="piw-total-tier">TIER -</span>
          </div>

          <div class="piw-ranges-row">
            <div class="piw-range-cell">
              <span>Mínimo</span>
              <strong id="piw-range-min">-- / 192</strong>
            </div>
            <div class="piw-range-cell highlighted">
              <span>Mais Provável</span>
              <strong id="piw-range-est">-- / 192</strong>
            </div>
            <div class="piw-range-cell">
              <span>Máximo</span>
              <strong id="piw-range-max">-- / 192</strong>
            </div>
          </div>

          <div class="piw-consistency-row info" id="piw-consistency-box">
            <svg id="piw-consistency-icon" class="piw-status-svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <span id="piw-consistency-text">Pesquise e selecione um Pokémon acima para calcular o IV.</span>
          </div>
        </div>

        <!-- Coluna Direita: Simulador de Evolução e Power -->
        <div class="piw-card piw-simulator-card">
          <div class="piw-sim-header">
            <div>
              <span class="piw-card-sub">CRESCIMENTO & POWER</span>
              <h3 class="piw-total-title">Simulador de Nível</h3>
            </div>
            <div class="piw-sim-header-ctrls">
              <span class="piw-sim-ctrl-label">Nível Alvo:</span>
              <div class="piw-sim-stepper">
                <button type="button" class="piw-step-btn" id="btn-step-minus-10" title="Diminuir 10 níveis">-10</button>
                <div class="piw-input-addon">
                  <input 
                    type="number" 
                    id="piw-input-proj-level" 
                    class="piw-input piw-num-input piw-proj-lvl-input" 
                    min="1" 
                    max="500" 
                    value="${this.projectedLevel}" 
                  />
                  <span>Nv</span>
                </div>
                <button type="button" class="piw-step-btn" id="btn-step-plus-10" title="Aumentar 10 níveis">+10</button>
              </div>
              <div class="piw-sim-presets">
                <button type="button" class="piw-chip piw-step-preset" data-lvl="100">Nv 100</button>
                <button type="button" class="piw-chip piw-step-preset" data-lvl="300">Nv 300</button>
                <button type="button" class="piw-chip piw-step-preset" data-lvl="500">Nv 500</button>
              </div>
            </div>
          </div>

          <div class="piw-projected-pills" id="piw-projected-pills">
            <!-- Renderizado dinamicamente -->
          </div>

          <div class="piw-power-banner">
            <div class="piw-power-left">
              <span class="piw-power-tag">⚡ POWER TOTAL PROJETADO</span>
              <div class="piw-power-vals">
                <strong id="piw-power-val" class="piw-power-number">--</strong>
                <span id="piw-power-delta" class="piw-power-diff">(--)</span>
              </div>
            </div>
            <span class="piw-power-note">Nível <strong id="piw-power-target-lvl">${this.projectedLevel}</strong></span>
          </div>
        </div>
      </section>
    `;

    // Cacheia elementos do DOM
    this.elSearchInput = this.element.querySelector('#piw-search-input') as HTMLInputElement;
    this.elSearchResults = this.element.querySelector('#piw-search-dropdown') as HTMLElement;
    this.elAvatarPlaceholder = this.element.querySelector('#piw-avatar-placeholder') as unknown as SVGElement;
    this.elSelectedAvatarImg = this.element.querySelector('#piw-selected-img') as HTMLImageElement;
    this.elSelectedName = this.element.querySelector('#piw-selected-name') as HTMLElement;
    this.elSelectedDex = this.element.querySelector('#piw-selected-dex') as HTMLElement;

    this.elLevelInput = this.element.querySelector('#piw-input-level') as HTMLInputElement;
    this.elMultiplierInput = this.element.querySelector('#piw-input-mult') as HTMLInputElement;

    for (const def of STAT_DEFINITIONS) {
      this.elStatInputs[def.key] = this.element.querySelector(`#stat-input-${def.key}`) as HTMLInputElement;
      this.elStatBaseTags[def.key] = this.element.querySelector(`#base-${def.key}`) as HTMLElement;
      this.elStatIvScores[def.key] = this.element.querySelector(`#iv-score-${def.key}`) as HTMLElement;
      this.elStatProgressBars[def.key] = this.element.querySelector(`#bar-fill-${def.key}`) as HTMLElement;
      this.elStatTierBadges[def.key] = this.element.querySelector(`#tier-pill-${def.key}`) as HTMLElement;
      this.elStatPercentages[def.key] = this.element.querySelector(`#bar-pct-${def.key}`) as HTMLElement;
    }

    this.elTotalScore = this.element.querySelector('#piw-total-score') as HTMLElement;
    this.elTotalPercentage = this.element.querySelector('#piw-total-pct') as HTMLElement;
    this.elTotalTierBadge = this.element.querySelector('#piw-total-tier') as HTMLElement;
    this.elRangeMin = this.element.querySelector('#piw-range-min') as HTMLElement;
    this.elRangeEst = this.element.querySelector('#piw-range-est') as HTMLElement;
    this.elRangeMax = this.element.querySelector('#piw-range-max') as HTMLElement;
    this.elConsistencyBadge = this.element.querySelector('#piw-consistency-box') as HTMLElement;
    this.elConsistencyIcon = this.element.querySelector('#piw-consistency-icon') as unknown as SVGElement;
    this.elConsistencyText = this.element.querySelector('#piw-consistency-text') as HTMLElement;

    this.elProjectedLevelInput = this.element.querySelector('#piw-input-proj-level') as HTMLInputElement;
    this.elProjectedGrid = this.element.querySelector('#piw-projected-pills') as HTMLElement;
    this.elProjectedPower = this.element.querySelector('#piw-power-val') as HTMLElement;
    this.elProjectedDelta = this.element.querySelector('#piw-power-delta') as HTMLElement;

    this.elBtnCopyCard = this.element.querySelector('#btn-copy-card') as HTMLButtonElement;
  }

  private setupEvents(): void {
    // 1. Busca textual de Pokémon
    this.elSearchInput.addEventListener('input', () => this.handleSearchInput());
    this.elSearchInput.addEventListener('focus', () => this.handleSearchInput());

    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node)) {
        this.elSearchResults.classList.add('hidden');
      }
    });

    // 2. Mudança de Nível
    this.elLevelInput.addEventListener('input', () => {
      const val = parseInt(this.elLevelInput.value, 10);
      if (!isNaN(val) && val > 0) {
        this.currentLevel = val;
        this.recalculate();
      }
    });

    // 3. Mudança de Multiplicador / Qualidade (Entrada textual simples)
    this.elMultiplierInput.addEventListener('input', () => {
      const val = parseFloat(this.elMultiplierInput.value);
      if (!isNaN(val) && val > 0) {
        this.currentMultiplier = val;
        this.recalculate();
      }
    });

    // 5. Mudança nos 6 Atributos
    for (const def of STAT_DEFINITIONS) {
      const inputEl = this.elStatInputs[def.key];
      if (inputEl) {
        inputEl.addEventListener('input', () => {
          const val = parseInt(inputEl.value, 10);
          this.currentStats[def.key] = isNaN(val) ? 0 : val;
          this.recalculate();
        });
      }
    }

    // 6. Controles de Nível Projetado
    this.elProjectedLevelInput.addEventListener('input', () => {
      const val = parseInt(this.elProjectedLevelInput.value, 10);
      if (!isNaN(val) && val > 0) {
        this.projectedLevel = val;
        this.recalculate();
      }
    });

    this.element.querySelector('#btn-step-minus-10')?.addEventListener('click', () => {
      this.setProjectedLevel(Math.max(1, this.projectedLevel - 10));
    });
    this.element.querySelector('#btn-step-plus-10')?.addEventListener('click', () => {
      this.setProjectedLevel(Math.min(500, this.projectedLevel + 10));
    });
    this.element.querySelectorAll('.piw-step-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.getAttribute('data-lvl') || '300', 10);
        this.setProjectedLevel(lvl);
      });
    });

    // 7. Copiar Card
    this.elBtnCopyCard.addEventListener('click', () => this.copyDiscordCard());
  }

  private handleSearchInput(): void {
    const query = this.elSearchInput.value.trim();
    const results = searchPokemon(query);

    if (results.length === 0) {
      this.elSearchResults.innerHTML = `<div class="piw-empty-search">Nenhum pokémon encontrado</div>`;
      this.elSearchResults.classList.remove('hidden');
      return;
    }

    this.elSearchResults.innerHTML = results.slice(0, 8).map((p) => `
      <div class="piw-search-row" data-dex="${p.dex}">
        <img 
          src="${getPokemonSpriteUrl(p.dex)}" 
          alt="${p.name}" 
          class="piw-search-sprite" 
          onerror="this.onerror=null; this.src='${getPokemonFallbackOutfitUrl(p.dex)}';" 
        />
        <div class="piw-search-meta">
          <strong>${p.name}</strong>
          <span class="piw-search-dex">#${String(p.dex).padStart(3, '0')}</span>
        </div>
      </div>
    `).join('');

    this.elSearchResults.classList.remove('hidden');

    this.elSearchResults.querySelectorAll('.piw-search-row').forEach((row) => {
      row.addEventListener('click', () => {
        const dex = parseInt(row.getAttribute('data-dex') || '1', 10);
        const match = POKEMON_DATABASE.find((p) => p.dex === dex);
        if (match) {
          this.selectSpecies(match);
          this.elSearchResults.classList.add('hidden');
          this.elSearchInput.value = '';
        }
      });
    });
  }

  private updateAvatarImage(dex: number | null): void {
    if (dex === null) {
      if (this.elAvatarPlaceholder) (this.elAvatarPlaceholder as any).style.display = 'block';
      if (this.elSelectedAvatarImg) {
        this.elSelectedAvatarImg.onerror = null;
        this.elSelectedAvatarImg.style.display = 'none';
        this.elSelectedAvatarImg.src = '';
      }
      return;
    }

    if (this.elAvatarPlaceholder) (this.elAvatarPlaceholder as any).style.display = 'none';
    if (this.elSelectedAvatarImg) {
      this.elSelectedAvatarImg.style.display = 'block';
      this.elSelectedAvatarImg.onerror = () => {
        this.elSelectedAvatarImg.onerror = () => {
          this.elSelectedAvatarImg.onerror = () => {
            this.elSelectedAvatarImg.style.display = 'none';
            if (this.elAvatarPlaceholder) (this.elAvatarPlaceholder as any).style.display = 'block';
          };
          this.elSelectedAvatarImg.src = getPokemonLocalSpriteUrl(dex);
        };
        this.elSelectedAvatarImg.src = getPokemonFallbackOutfitUrl(dex);
      };
      this.elSelectedAvatarImg.src = getPokemonSpriteUrl(dex);
    }
  }

  public selectSpecies(species: PokemonSpeciesData): void {
    this.currentSpecies = species;
    this.currentLevel = 1;
    this.elLevelInput.value = '1';
    this.elSelectedName.textContent = species.name;
    this.elSelectedDex.textContent = `#${String(species.dex).padStart(3, '0')}`;
    this.updateAvatarImage(species.dex);

    // Atualiza tags de base stat
    for (const def of STAT_DEFINITIONS) {
      const base = species.baseStats[def.key] || 0;
      const baseTag = this.elStatBaseTags[def.key];
      if (baseTag) baseTag.textContent = `Base: ${base}`;
    }

    // Gera stats realistas para o novo pokémon no nível 1
    this.currentStats = PiwCalculatorEngine.generateRealisticStats(
      species,
      1,
      this.currentMultiplier,
      24.0,
    );

    for (const def of STAT_DEFINITIONS) {
      const inputEl = this.elStatInputs[def.key];
      if (inputEl) inputEl.value = String(this.currentStats[def.key] ?? 0);
    }

    this.recalculate();
  }

  private setProjectedLevel(lvl: number): void {
    this.projectedLevel = lvl;
    this.elProjectedLevelInput.value = String(lvl);
    const targetSpan = this.element.querySelector('#piw-power-target-lvl');
    if (targetSpan) targetSpan.textContent = String(lvl);
    this.recalculate();
  }

  public recalculate(): void {
    if (!this.currentSpecies) {
      for (const def of STAT_DEFINITIONS) {
        const scoreEl = this.elStatIvScores[def.key];
        if (scoreEl) scoreEl.textContent = `- / 32`;
        const barEl = this.elStatProgressBars[def.key];
        if (barEl) barEl.style.width = `0%`;
        const pctEl = this.elStatPercentages[def.key];
        if (pctEl) pctEl.textContent = `0%`;
        const pill = this.elStatTierBadges[def.key];
        if (pill) {
          pill.textContent = `-`;
          pill.className = `piw-tier-pill tier-c`;
        }
      }

      this.elTotalScore.textContent = `-- / 192`;
      this.elTotalPercentage.textContent = `(0.0%)`;
      this.elTotalTierBadge.textContent = `TIER -`;
      this.elTotalTierBadge.className = `piw-big-tier tier-c`;

      this.elRangeMin.textContent = `-- / 192`;
      this.elRangeEst.textContent = `-- / 192`;
      this.elRangeMax.textContent = `-- / 192`;

      this.elConsistencyText.textContent = 'Pesquise e selecione um Pokémon acima para calcular o IV.';
      this.elConsistencyBadge.className = 'piw-consistency-row info';
      if (this.elConsistencyIcon) {
        this.elConsistencyIcon.innerHTML = '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>';
      }

      this.elProjectedGrid.innerHTML = STAT_DEFINITIONS.map((def: StatDefinition) => `
        <div class="piw-proj-pill">
          <span class="piw-proj-pill-name">${def.shortLabel}:</span>
          <strong class="piw-proj-pill-val">-</strong>
          <span class="piw-proj-pill-delta">(-)</span>
        </div>
      `).join('');

      this.elProjectedPower.textContent = '--';
      this.elProjectedDelta.textContent = '(--)';
      return;
    }

    const input: IvInputParameters = {
      species: this.currentSpecies,
      level: this.currentLevel,
      qualityMultiplier: this.currentMultiplier,
      stats: this.currentStats,
    };

    const calc = PiwCalculatorEngine.calculate(input);
    const proj = PiwCalculatorEngine.projectStats(input, calc, this.projectedLevel);

    // 1. Atualiza os 6 stats individuais
    for (const def of STAT_DEFINITIONS) {
      const statData = calc.stats[def.key];
      const scoreEl = this.elStatIvScores[def.key];
      if (scoreEl) scoreEl.textContent = `${statData.ivEstimate.toFixed(1)} / 32`;
      const barEl = this.elStatProgressBars[def.key];
      if (barEl) barEl.style.width = `${Math.min(100, statData.percentage)}%`;
      const pctEl = this.elStatPercentages[def.key];
      if (pctEl) pctEl.textContent = `${statData.percentage.toFixed(1)}%`;

      const pill = this.elStatTierBadges[def.key];
      if (pill) {
        pill.textContent = `Tier ${statData.tier}`;
        pill.className = `piw-tier-pill tier-${statData.tier.toLowerCase()}`;
      }
    }

    // 2. Atualiza Resumo de IV Total
    this.elTotalScore.textContent = `${calc.totalEstimate.toFixed(1)} / 192`;
    this.elTotalPercentage.textContent = `(${calc.overallPercentage.toFixed(1)}%)`;
    this.elTotalTierBadge.textContent = `TIER ${calc.tier}`;
    this.elTotalTierBadge.className = `piw-big-tier tier-${calc.tier.toLowerCase()}`;

    this.elRangeMin.textContent = `${calc.totalMin.toFixed(1)} / 192`;
    this.elRangeEst.textContent = `${calc.totalEstimate.toFixed(1)} / 192`;
    this.elRangeMax.textContent = `${calc.totalMax.toFixed(1)} / 192`;

    // 3. Consistência Matemática
    this.elConsistencyText.textContent = calc.consistencyMessage;
    if (calc.isConsistent) {
      this.elConsistencyBadge.className = 'piw-consistency-row consistent';
      if (this.elConsistencyIcon) {
        this.elConsistencyIcon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>';
      }
    } else {
      this.elConsistencyBadge.className = 'piw-consistency-row warning';
      if (this.elConsistencyIcon) {
        this.elConsistencyIcon.innerHTML = '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';
      }
    }

    // 4. Projeção de Stats & Power
    this.elProjectedGrid.innerHTML = STAT_DEFINITIONS.map((def: StatDefinition) => {
      const val = proj.stats[def.key];
      const delta = proj.deltas[def.key];
      const sign = delta >= 0 ? `+${delta}` : `${delta}`;
      return `
        <div class="piw-proj-pill">
          <span class="piw-proj-pill-name">${def.shortLabel}:</span>
          <strong class="piw-proj-pill-val">${val}</strong>
          <span class="piw-proj-pill-delta ${delta >= 0 ? 'pos' : 'neg'}">(${sign})</span>
        </div>
      `;
    }).join('');

    this.elProjectedPower.textContent = proj.totalPower.toLocaleString('pt-BR');
    this.elProjectedDelta.textContent = proj.powerDelta >= 0
      ? `(+${proj.powerDelta.toLocaleString('pt-BR')})`
      : `(${proj.powerDelta.toLocaleString('pt-BR')})`;
  }

  private copyDiscordCard(): void {
    if (!this.currentSpecies) {
      this.onToast?.('Selecione um Pokémon antes de copiar o card.', 'info');
      return;
    }

    const input: IvInputParameters = {
      species: this.currentSpecies,
      level: this.currentLevel,
      qualityMultiplier: this.currentMultiplier,
      stats: this.currentStats,
    };
    const calc = PiwCalculatorEngine.calculate(input);
    const proj = PiwCalculatorEngine.projectStats(input, calc, this.projectedLevel);

    const card = PiwCalculatorEngine.formatDiscordCard(
      this.currentSpecies,
      this.currentLevel,
      this.currentMultiplier,
      calc,
      proj,
    );

    navigator.clipboard.writeText(card).then(() => {
      this.onToast?.(`Card de ${this.currentSpecies?.name} copiado com sucesso!`, 'success');
    }).catch(() => {
      this.onToast?.('Erro ao copiar card.', 'danger');
    });
  }
}
