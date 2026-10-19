import type {
  CaptureAlertSettings,
  PokemonQuality,
} from '../../shared/captureTypes.js';
import { AlertSettingsService } from '../services/alertSettingsService.js';

interface QualityMeta {
  key: PokemonQuality;
  name: string;
  multiplier: string;
  defaultMinIv: number;
  defaultEnabled: boolean;
}

const QUALITIES_CONFIG: QualityMeta[] = [
  { key: 'divina', name: 'Divina', multiplier: '≥ 4.0× Multiplicador', defaultMinIv: 0, defaultEnabled: true },
  { key: 'ancia', name: 'Anciã', multiplier: '≥ 3.0× Multiplicador', defaultMinIv: 0, defaultEnabled: true },
  { key: 'mitica', name: 'Mítica', multiplier: '≥ 2.0× Multiplicador', defaultMinIv: 0, defaultEnabled: true },
  { key: 'lendaria', name: 'Lendária', multiplier: '≥ 1.7× Multiplicador', defaultMinIv: 120, defaultEnabled: true },
  { key: 'epica', name: 'Épica', multiplier: '≥ 1.5× Multiplicador', defaultMinIv: 140, defaultEnabled: false },
  { key: 'rara', name: 'Rara', multiplier: '≥ 1.3× Multiplicador', defaultMinIv: 150, defaultEnabled: false },
  { key: 'incomum', name: 'Incomum', multiplier: '≥ 1.1× Multiplicador', defaultMinIv: 160, defaultEnabled: false },
  { key: 'comum', name: 'Comum', multiplier: '≥ 1.0× Multiplicador', defaultMinIv: 170, defaultEnabled: false },
  { key: 'fraca', name: 'Fraca', multiplier: '< 1.0× Multiplicador', defaultMinIv: 180, defaultEnabled: false },
];

export class SettingsComponent {
  public readonly element: HTMLElement;
  private readonly alertService: AlertSettingsService;

  // DOM Elements
  private btnSaveTop!: HTMLButtonElement;
  private btnSaveBottom!: HTMLButtonElement;
  private btnResetDefaults!: HTMLButtonElement;
  private btnTestAlert!: HTMLButtonElement;
  private inputClickInterval!: HTMLInputElement;
  private inputGameUrl!: HTMLInputElement;

  constructor(
    private readonly onApplyInterval?: (intervalMs: number) => void,
    private readonly onTestAlert?: () => void,
    private readonly onShowToast?: (message: string, type: 'info' | 'success' | 'danger') => void,
  ) {
    this.alertService = AlertSettingsService.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'settings-container';
    this.element.id = 'settings-screen-root';

    this.render();
    this.bindDom();
    this.loadCurrentSettings();
    this.initEvents();
  }

  private render(): void {
    this.element.innerHTML = `
      <!-- CABEÇALHO DA TELA DE AJUSTES -->
      <header class="settings-header">
        <div class="settings-header-left">
          <div class="settings-badge-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>PAINEL DE AJUSTES</span>
          </div>
          <h1 class="settings-title">Ajustes & Alertas de Notificação</h1>
          <p class="settings-subtitle">Defina quais qualidades e IVs disparam a notificação pulsante no botão de Capturas do menu lateral.</p>
        </div>

        <div class="settings-header-actions">
          <button id="btn-test-alert" class="btn-settings-action btn-test" title="Dispara uma simulação do alerta pulsante no menu lateral">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Testar Alerta Pulsante</span>
          </button>

          <button id="btn-reset-defaults" class="btn-settings-action btn-reset" title="Restaura os valores padrões de alerta recomendados">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Restaurar Padrões</span>
          </button>

          <button id="btn-save-settings-top" class="btn-settings-action btn-save-primary" title="Salva todas as alterações imediatamente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Salvar Ajustes</span>
          </button>
        </div>
      </header>

      <!-- CONTEÚDO PRINCIPAL DOS AJUSTES -->
      <div class="settings-content-body">

        <!-- CARD 1: NOTIFICAÇÃO PULSANTE DO DASHBOARD DE CAPTURAS -->
        <section class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-header-info">
              <div class="settings-card-icon pulse-preview-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span class="preview-ping-dot"></span>
              </div>
              <div>
                <h2 class="settings-card-title">Critérios de Notificação Pulsante (Menu Lateral)</h2>
                <p class="settings-card-desc">Quando qualquer uma das contas capturar um Pokémon que atenda a estes requisitos de qualidade e IV, o botão de Capturas no menu lateral começará a pulsar.</p>
              </div>
            </div>

            <!-- PRESETS RÁPIDOS -->
            <div class="settings-presets-group">
              <span class="presets-label">Predefinições Rápidas:</span>
              <button class="preset-btn" id="preset-default" title="Lendária 120+ e Mítica/Anciã/Divina ativadas">Lendários & Sup. (Padrão)</button>
              <button class="preset-btn" id="preset-iv150" title="Ativa todas as qualidades exigindo IV 150+">Qualquer IV 150+</button>
              <button class="preset-btn" id="preset-all" title="Ativa todas as qualidades para alertar qualquer captura">Todas as Capturas</button>
            </div>
          </div>

          <!-- TABELA RESPONSIVA DE QUALIDADES E IVS -->
          <div class="settings-qualities-table-wrapper">
            <table class="settings-qualities-table">
              <thead>
                <tr>
                  <th style="width: 130px;">Notificação</th>
                  <th style="width: 170px;">Qualidade</th>
                  <th style="width: 220px;">Classificação do Jogo</th>
                  <th style="width: 220px;">IV Mínimo para Alerta</th>
                  <th>Comportamento do Alerta</th>
                </tr>
              </thead>
              <tbody id="settings-qualities-tbody">
                ${this.renderQualityRows()}
              </tbody>
            </table>
          </div>
        </section>

        <!-- CARD 2: PARÂMETROS GERAIS DO JOGO E SESSÃO -->
        <section class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-header-info">
              <div class="settings-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div>
                <h2 class="settings-card-title">Parâmetros de Sessão & Automação</h2>
                <p class="settings-card-desc">Configurações globais de conexão e intervalos das contas isoladas.</p>
              </div>
            </div>
          </div>

          <div class="settings-form-grid">
            <div class="settings-form-field">
              <label class="settings-field-label" for="input-game-url">URL Padrão do Poke Idle World</label>
              <input type="text" id="input-game-url" class="settings-field-input" value="https://poke.idleworld.online/">
              <span class="settings-field-help">Endereço acessado pelos webviews particionados das 4 contas.</span>
            </div>

            <div class="settings-form-field">
              <label class="settings-field-label" for="input-click-interval">Intervalo do Auto-Click (milissegundos)</label>
              <div class="settings-input-group">
                <input type="number" id="input-click-interval" class="settings-field-input" min="500" max="10000" step="100" value="1500">
                <span class="settings-input-suffix">ms</span>
              </div>
              <span class="settings-field-help">Frequência da varredura de auto-click por conta (Padrão: 1500ms).</span>
            </div>
          </div>

          <!-- PARTIÇÕES ISOLADAS -->
          <div class="settings-partition-info">
            <div class="partition-pill"><span>Conta 01:</span> <code>persist:account_01</code></div>
            <div class="partition-pill"><span>Conta 02:</span> <code>persist:account_02</code></div>
            <div class="partition-pill"><span>Conta 03:</span> <code>persist:account_03</code></div>
            <div class="partition-pill"><span>Conta 04:</span> <code>persist:account_04</code></div>
          </div>
        </section>

      </div>

      <!-- BARRA FLUTUANTE INFERIOR DE SALVAMENTO -->
      <footer class="settings-footer-bar">
        <div class="footer-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>As regras de notificação são salvas localmente e monitoradas automaticamente em tempo real.</span>
        </div>
        <div class="footer-buttons">
          <button id="btn-save-settings-bottom" class="btn-settings-action btn-save-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Salvar Ajustes</span>
          </button>
        </div>
      </footer>
    `;
  }

  private renderQualityRows(): string {
    return QUALITIES_CONFIG.map((q) => {
      return `
        <tr class="settings-quality-row" id="row-${q.key}" data-quality="${q.key}">
          <!-- 1. Switch de Ativação -->
          <td class="cell-toggle">
            <label class="switch-toggle" title="Ativar ou desativar notificação para a qualidade ${q.name}">
              <input type="checkbox" class="quality-toggle-input" data-quality="${q.key}" id="toggle-${q.key}">
              <span class="switch-slider"></span>
            </label>
          </td>

          <!-- 2. Badge da Qualidade com Cor Oficial -->
          <td class="cell-quality">
            <span class="quality-badge quality-${q.key}">${q.name}</span>
          </td>

          <!-- 3. Multiplicador Oficial do Jogo -->
          <td class="cell-multiplier">
            <span class="multiplier-text">${q.multiplier}</span>
          </td>

          <!-- 4. Campo de IV Mínimo (0 a 192) -->
          <td class="cell-iv">
            <div class="iv-input-wrapper">
              <input 
                type="number" 
                class="quality-iv-input" 
                id="iv-${q.key}" 
                data-quality="${q.key}"
                min="0" 
                max="192" 
                step="1"
                placeholder="0"
              />
              <span class="iv-suffix">/ 192 IV</span>
            </div>
          </td>

          <!-- 5. Status / Resumo Dinâmico -->
          <td class="cell-status">
            <div class="status-summary" id="status-desc-${q.key}">
              <span class="status-dot"></span>
              <span class="status-text">Aguardando configuração...</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  private bindDom(): void {
    this.btnSaveTop = this.element.querySelector('#btn-save-settings-top') as HTMLButtonElement;
    this.btnSaveBottom = this.element.querySelector('#btn-save-settings-bottom') as HTMLButtonElement;
    this.btnResetDefaults = this.element.querySelector('#btn-reset-defaults') as HTMLButtonElement;
    this.btnTestAlert = this.element.querySelector('#btn-test-alert') as HTMLButtonElement;
    this.inputClickInterval = this.element.querySelector('#input-click-interval') as HTMLInputElement;
    this.inputGameUrl = this.element.querySelector('#input-game-url') as HTMLInputElement;
  }

  private loadCurrentSettings(): void {
    const settings = this.alertService.getSettings();

    for (const q of QUALITIES_CONFIG) {
      const rule = settings[q.key] || { enabled: q.defaultEnabled, minIv: q.defaultMinIv };
      const toggle = this.element.querySelector(`#toggle-${q.key}`) as HTMLInputElement;
      const ivInput = this.element.querySelector(`#iv-${q.key}`) as HTMLInputElement;
      const row = this.element.querySelector(`#row-${q.key}`) as HTMLElement;

      if (toggle) toggle.checked = rule.enabled;
      if (ivInput) ivInput.value = String(rule.minIv);

      this.updateRowVisualState(q.key, rule.enabled, rule.minIv);
    }
  }

  private updateRowVisualState(quality: PokemonQuality, enabled: boolean, minIv: number): void {
    const row = this.element.querySelector(`#row-${quality}`) as HTMLElement;
    const ivInput = this.element.querySelector(`#iv-${quality}`) as HTMLInputElement;
    const statusDesc = this.element.querySelector(`#status-desc-${quality}`) as HTMLElement;

    if (!row || !statusDesc) return;

    if (enabled) {
      row.classList.remove('row-disabled');
      if (ivInput) ivInput.disabled = false;
      const qMeta = QUALITIES_CONFIG.find((x) => x.key === quality);
      const name = qMeta?.name || quality;

      const pct = Math.round((minIv / 192) * 100);
      statusDesc.className = 'status-summary active';
      statusDesc.innerHTML = `
        <span class="status-dot green"></span>
        <span class="status-text"><strong>Pulsará</strong> com qualquer <strong>${name}</strong> tendo <strong>${minIv}/192 IV</strong> (${pct}%) ou mais.</span>
      `;
    } else {
      row.classList.add('row-disabled');
      if (ivInput) ivInput.disabled = true;
      statusDesc.className = 'status-summary inactive';
      statusDesc.innerHTML = `
        <span class="status-dot gray"></span>
        <span class="status-text">Desativado (capturas desta qualidade não acionam o pulsante).</span>
      `;
    }
  }

  private initEvents(): void {
    // Escuta mudanças nos checkboxes e inputs de IV
    for (const q of QUALITIES_CONFIG) {
      const toggle = this.element.querySelector(`#toggle-${q.key}`) as HTMLInputElement;
      const ivInput = this.element.querySelector(`#iv-${q.key}`) as HTMLInputElement;

      toggle?.addEventListener('change', () => {
        const minIv = this.getSanitizedIv(ivInput?.value);
        this.updateRowVisualState(q.key, toggle.checked, minIv);
        // Auto-persiste em background
        this.collectAndSaveSettings(false);
      });

      ivInput?.addEventListener('input', () => {
        const val = this.getSanitizedIv(ivInput.value);
        this.updateRowVisualState(q.key, toggle ? toggle.checked : false, val);
        // Auto-persiste em background
        this.collectAndSaveSettings(false);
      });

      ivInput?.addEventListener('blur', () => {
        // Formata para número válido no blur
        const val = this.getSanitizedIv(ivInput.value);
        ivInput.value = String(val);
      });
    }

    // Botões de Salvar
    const handleSave = () => {
      this.collectAndSaveSettings(true);
      // Aplica intervalo de auto-click se válido
      const interval = parseInt(this.inputClickInterval.value, 10);
      if (!isNaN(interval) && interval >= 500 && interval <= 10000) {
        this.onApplyInterval?.(interval);
      }
    };

    this.btnSaveTop?.addEventListener('click', handleSave);
    this.btnSaveBottom?.addEventListener('click', handleSave);

    // Botão de Restaurar Padrões
    this.btnResetDefaults?.addEventListener('click', () => {
      this.alertService.resetToDefaults();
      this.loadCurrentSettings();
      this.onShowToast?.('Valores padrões de alerta restaurados!', 'info');
    });

    // Botão de Testar Alerta
    this.btnTestAlert?.addEventListener('click', () => {
      this.onTestAlert?.();
      this.onShowToast?.('⚡ Alerta pulsante simulado no botão do menu lateral!', 'success');
    });

    // Predefinições Rápidas
    this.element.querySelector('#preset-default')?.addEventListener('click', () => {
      this.alertService.resetToDefaults();
      this.loadCurrentSettings();
      this.onShowToast?.('Predefinição aplicada: Lendários e superiores!', 'info');
    });

    this.element.querySelector('#preset-iv150')?.addEventListener('click', () => {
      const newSettings: CaptureAlertSettings = {} as CaptureAlertSettings;
      for (const q of QUALITIES_CONFIG) {
        newSettings[q.key] = { enabled: true, minIv: 150 };
      }
      this.alertService.saveSettings(newSettings);
      this.loadCurrentSettings();
      this.onShowToast?.('Predefinição aplicada: Qualquer Pokémon com IV 150+!', 'info');
    });

    this.element.querySelector('#preset-all')?.addEventListener('click', () => {
      const newSettings: CaptureAlertSettings = {} as CaptureAlertSettings;
      for (const q of QUALITIES_CONFIG) {
        newSettings[q.key] = { enabled: true, minIv: 0 };
      }
      this.alertService.saveSettings(newSettings);
      this.loadCurrentSettings();
      this.onShowToast?.('Predefinição aplicada: Todas as capturas ativadas!', 'info');
    });
  }

  private getSanitizedIv(val: string | undefined): number {
    const parsed = parseInt(val || '0', 10);
    if (isNaN(parsed)) return 0;
    return Math.max(0, Math.min(192, parsed));
  }

  private collectAndSaveSettings(showToast = false): void {
    const newSettings: CaptureAlertSettings = {} as CaptureAlertSettings;

    for (const q of QUALITIES_CONFIG) {
      const toggle = this.element.querySelector(`#toggle-${q.key}`) as HTMLInputElement;
      const ivInput = this.element.querySelector(`#iv-${q.key}`) as HTMLInputElement;

      const enabled = toggle ? toggle.checked : false;
      const minIv = this.getSanitizedIv(ivInput?.value);

      newSettings[q.key] = { enabled, minIv };
    }

    this.alertService.saveSettings(newSettings);

    if (showToast) {
      this.onShowToast?.('Ajustes e regras de notificação salvos com sucesso!', 'success');
    }
  }
}
