import { DEFAULT_ACCOUNTS } from '../../shared/constants.js';
import type {
  CaptureAlertSettings,
  PokemonQuality,
} from '../../shared/captureTypes.js';
import { AlertSettingsService } from '../services/alertSettingsService.js';
import { MarketService } from '../services/marketService.js';
import { HuntClientService } from '../services/huntClientService.js';

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
  private readonly marketService: MarketService;
  private readonly huntService: HuntClientService;

  // DOM Elements - Cabeçalho & Ações
  private btnSaveTop!: HTMLButtonElement;
  private btnSaveBottom!: HTMLButtonElement;
  private btnResetDefaults!: HTMLButtonElement;
  private btnTestAlert!: HTMLButtonElement;
  private btnDetectAllTokens!: HTMLButtonElement;

  // DOM Elements - Controle de Telas
  private toggleScreenHunt!: HTMLInputElement;
  private statusScreenHunt!: HTMLElement;
  private toggleScreenMarket!: HTMLInputElement;
  private statusScreenMarket!: HTMLElement;

  // DOM Elements - Sessão
  private inputClickInterval!: HTMLInputElement;
  private inputGameUrl!: HTMLInputElement;

  // Cleanup de listeners
  private unsubscribeTokenChange: (() => void) | null = null;
  private unsubscribeMarketRequests: (() => void) | null = null;

  constructor(
    private readonly onApplyInterval?: (intervalMs: number) => void,
    private readonly onTestAlert?: () => void,
    private readonly onShowToast?: (message: string, type: 'info' | 'success' | 'danger') => void,
    private readonly getAccountsWebviews?: () => Array<{ id: string; name: string; webview: Electron.WebviewTag }>,
  ) {
    this.alertService = AlertSettingsService.getInstance();
    this.marketService = MarketService.getInstance();
    this.huntService = HuntClientService.getInstance();

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
            <span>CENTRAL DE AJUSTES & GOVERNANÇA</span>
          </div>
          <h1 class="settings-title">Ajustes, Governança de Requisições & Tokens</h1>
          <p class="settings-subtitle">Controle centralizado: gerencie quais telas e contas disparam requisições de rede, configure os tokens JWT e defina critérios de alerta para capturas.</p>
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

        <!-- ======================================================== -->
        <!-- CARD 1: CONTROLE DE REQUISIÇÕES POR TELA (HTTP)         -->
        <!-- ======================================================== -->
        <section class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-header-info">
              <div class="settings-card-icon network-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div>
                <h2 class="settings-card-title">Controle de Requisições por Tela (HTTP & Background)</h2>
                <p class="settings-card-desc">Ative ou pause as requisições de rede feitas pela aplicação. Ao pausar uma tela, nenhuma chamada HTTP será disparada em direção à API oficial do jogo.</p>
              </div>
            </div>
          </div>

          <div class="settings-screens-grid">
            <!-- 1. DASHBOARD DA HUNT -->
            <div class="settings-screen-card" id="card-screen-hunt">
              <div class="screen-card-header">
                <div class="screen-card-info">
                  <div class="screen-icon hunt-screen-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="screen-name">Dashboard da Hunt</h3>
                    <span class="screen-route">Rota: <code>/api/game/depot</code></span>
                  </div>
                </div>
                <label class="switch-toggle" title="Ativar ou pausar requisições em background do Dashboard da Hunt">
                  <input type="checkbox" id="toggle-screen-hunt" checked />
                  <span class="switch-slider"></span>
                </label>
              </div>
              <p class="screen-desc">
                Sincroniza inventário e depósito oficial de itens com intervalos randômicos e desincronizados (jitter de 60 a 90s) para contabilizar lucros e drops em dólares.
              </p>
              <div class="screen-status-row">
                <span class="screen-status-badge status-active" id="status-screen-hunt">
                  <span class="status-dot green"></span>
                  <span>Requisições Ativas</span>
                </span>
              </div>
            </div>

            <!-- 2. MONITOR DE MERCADO -->
            <div class="settings-screen-card" id="card-screen-market">
              <div class="screen-card-header">
                <div class="screen-card-info">
                  <div class="screen-icon market-screen-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="screen-name">Monitor de Mercado</h3>
                    <span class="screen-route">Rota: <code>/api/game/market</code></span>
                  </div>
                </div>
                <label class="switch-toggle" title="Ativar ou pausar requisições do Monitor de Mercado">
                  <input type="checkbox" id="toggle-screen-market" checked />
                  <span class="switch-slider"></span>
                </label>
              </div>
              <p class="screen-desc">
                Consulta cotações e ofertas ativas de Diamonds e Itens no mercado global do jogo, além de verificar os anúncios e pedidos da conta selecionada.
              </p>
              <div class="screen-status-row">
                <span class="screen-status-badge status-active" id="status-screen-market">
                  <span class="status-dot green"></span>
                  <span>Requisições Ativas</span>
                </span>
              </div>
            </div>

            <!-- 3. DASHBOARD DE CAPTURAS -->
            <div class="settings-screen-card screen-card-safe" id="card-screen-captures">
              <div class="screen-card-header">
                <div class="screen-card-info">
                  <div class="screen-icon capture-screen-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="screen-name">Dashboard de Capturas</h3>
                    <span class="screen-route">Modo: <code>WebSocket Nativo (Passivo)</code></span>
                  </div>
                </div>
                <div class="screen-badge-locked" title="Esta tela é 100% blindada e passiva. Não gera requisições HTTP na API.">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>100% Blindado</span>
                </div>
              </div>
              <p class="screen-desc">
                Operação 100% segura contra anti-cheat. Os dados de captura são lidos diretamente do WebSocket nativo que o jogo já envia à tela. Zero requisições HTTP adicionais.
              </p>
              <div class="screen-status-row">
                <span class="screen-status-badge status-safe">
                  <span class="status-dot blue"></span>
                  <span>Passivo & Invisível (Sem Requisições HTTP)</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- CARD 2: GESTÃO CENTRAL DE CONTAS & TOKENS JWT           -->
        <!-- ======================================================== -->
        <section class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-header-info">
              <div class="settings-card-icon jwt-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <h2 class="settings-card-title">Gerenciamento de Contas & Tokens JWT</h2>
                <p class="settings-card-desc">Controle individual de autenticação das 4 contas. Defina quais JWTs ficam ativos, habilite/pause requisições individuais e insira, altere ou remova tokens.</p>
              </div>
            </div>

            <button id="btn-detect-all-tokens" class="btn-settings-action btn-detect-all" title="Varre os WebViews ativos no Grid e detecta automaticamente os tokens de login">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Auto-Detectar dos WebViews</span>
            </button>
          </div>

          <!-- GRID DAS 4 CONTAS -->
          <div class="settings-accounts-jwt-grid" id="accounts-jwt-grid">
            ${this.renderAccountJwtCardsHtml()}
          </div>
        </section>

        <!-- ======================================================== -->
        <!-- CARD 3: NOTIFICAÇÃO PULSANTE DO DASHBOARD DE CAPTURAS   -->
        <!-- ======================================================== -->
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

        <!-- ======================================================== -->
        <!-- CARD 4: PARÂMETROS GERAIS DO JOGO E SESSÃO               -->
        <!-- ======================================================== -->
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
          <span>As configurações de requisições, tokens JWT e regras de alerta são salvas localmente e sincronizadas em tempo real.</span>
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

  /**
   * Renderiza os 4 cards de contas para gerenciamento individual de JWT e requisições
   */
  private renderAccountJwtCardsHtml(): string {
    return DEFAULT_ACCOUNTS.map((acc) => {
      return `
        <div class="account-jwt-card" id="account-jwt-card-${acc.id}" data-account-id="${acc.id}">
          <!-- Cabeçalho do Card da Conta -->
          <div class="account-jwt-header">
            <div class="account-jwt-title-group">
              <div class="account-jwt-avatar">
                <span>${acc.name}</span>
              </div>
              <div class="account-jwt-name-col">
                <strong class="account-jwt-name">Conta ${acc.name}</strong>
                <span class="account-jwt-sub">${acc.id} • ${acc.partition}</span>
              </div>
            </div>
            <div class="account-jwt-badge-wrapper" id="badge-wrapper-${acc.id}">
              <!-- Inserido dinamicamente por updateAccountVisualState -->
              <span class="account-jwt-badge badge-missing">Carregando...</span>
            </div>
          </div>

          <!-- Switches de Governança da Conta -->
          <div class="account-jwt-switches">
            <!-- Switch 1: JWT Ativo -->
            <div class="account-jwt-switch-item" title="Ativa ou inativa o uso do token JWT desta conta para autenticar requisições">
              <div class="switch-label-col">
                <span class="switch-title">JWT Ativo</span>
                <span class="switch-hint">Usar token em requisições</span>
              </div>
              <label class="switch-toggle">
                <input type="checkbox" id="toggle-jwt-active-${acc.id}" class="toggle-jwt-active" data-account-id="${acc.id}" checked />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Switch 2: Requisições da Conta -->
            <div class="account-jwt-switch-item" title="Ativa ou pausa as requisições em background específicas desta conta (ex: sincronização na Hunt)">
              <div class="switch-label-col">
                <span class="switch-title">Requisições da Conta</span>
                <span class="switch-hint">Permitir chamadas de rede</span>
              </div>
              <label class="switch-toggle">
                <input type="checkbox" id="toggle-acc-reqs-${acc.id}" class="toggle-acc-reqs" data-account-id="${acc.id}" checked />
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- Campo de Input do Token JWT -->
          <div class="account-jwt-input-section">
            <div class="jwt-input-header">
              <label for="input-token-${acc.id}" class="jwt-input-label">Token de Autenticação JWT</label>
              <span class="jwt-length-indicator" id="token-len-${acc.id}">Vazio</span>
            </div>
            <div class="jwt-input-wrapper">
              <input 
                type="password" 
                id="input-token-${acc.id}" 
                class="account-jwt-input" 
                placeholder="eyJh... (Cole o token JWT aqui ou capture do WebView)" 
                spellcheck="false"
                autocomplete="off"
              />
              <button type="button" class="btn-toggle-jwt-vis" id="btn-toggle-vis-${acc.id}" title="Mostrar ou ocultar caracteres do token">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Ações Rápidas do Token da Conta -->
          <div class="account-jwt-actions">
            <button type="button" class="btn-jwt-action btn-jwt-save" id="btn-save-token-${acc.id}" title="Salva o token digitado ou colado para esta conta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Salvar Token</span>
            </button>

            <button type="button" class="btn-jwt-action btn-jwt-detect" id="btn-detect-token-${acc.id}" title="Extrai automaticamente o token da sessão ativa do WebView desta conta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Capturar WebView</span>
            </button>

            <button type="button" class="btn-jwt-action btn-jwt-remove" id="btn-remove-token-${acc.id}" title="Remove e limpa o token JWT desta conta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Remover</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
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
    this.btnDetectAllTokens = this.element.querySelector('#btn-detect-all-tokens') as HTMLButtonElement;

    this.toggleScreenHunt = this.element.querySelector('#toggle-screen-hunt') as HTMLInputElement;
    this.statusScreenHunt = this.element.querySelector('#status-screen-hunt') as HTMLElement;
    this.toggleScreenMarket = this.element.querySelector('#toggle-screen-market') as HTMLInputElement;
    this.statusScreenMarket = this.element.querySelector('#status-screen-market') as HTMLElement;

    this.inputClickInterval = this.element.querySelector('#input-click-interval') as HTMLInputElement;
    this.inputGameUrl = this.element.querySelector('#input-game-url') as HTMLInputElement;
  }

  /**
   * Carrega todas as configurações e preenche os campos na tela
   */
  public loadCurrentSettings(): void {
    // 1. Carrega regras de qualidades e IVs
    const settings = this.alertService.getSettings();
    for (const q of QUALITIES_CONFIG) {
      const rule = settings[q.key] || { enabled: q.defaultEnabled, minIv: q.defaultMinIv };
      const toggle = this.element.querySelector(`#toggle-${q.key}`) as HTMLInputElement;
      const ivInput = this.element.querySelector(`#iv-${q.key}`) as HTMLInputElement;

      if (toggle) toggle.checked = rule.enabled;
      if (ivInput) ivInput.value = String(rule.minIv);

      this.updateRowVisualState(q.key, rule.enabled, rule.minIv);
    }

    // 2. Carrega switches das telas
    if (this.toggleScreenHunt) {
      this.toggleScreenHunt.checked = this.huntService.isScreenRequestsEnabled();
    }
    if (this.toggleScreenMarket) {
      this.toggleScreenMarket.checked = this.marketService.isRequestsEnabled();
    }
    this.updateScreenVisualState();

    // 3. Carrega estados das 4 contas
    for (const acc of DEFAULT_ACCOUNTS) {
      this.updateAccountVisualState(acc.id);
    }
  }

  /**
   * Atualiza a exibição visual das telas habilitadas/desabilitadas
   */
  private updateScreenVisualState(): void {
    const isHuntEnabled = this.huntService.isScreenRequestsEnabled();
    if (this.statusScreenHunt) {
      if (isHuntEnabled) {
        this.statusScreenHunt.className = 'screen-status-badge status-active';
        this.statusScreenHunt.innerHTML = `<span class="status-dot green"></span><span>Requisições Ativas</span>`;
      } else {
        this.statusScreenHunt.className = 'screen-status-badge status-paused';
        this.statusScreenHunt.innerHTML = `<span class="status-dot red"></span><span>Requisições Pausadas</span>`;
      }
    }

    const isMarketEnabled = this.marketService.isRequestsEnabled();
    if (this.statusScreenMarket) {
      if (isMarketEnabled) {
        this.statusScreenMarket.className = 'screen-status-badge status-active';
        this.statusScreenMarket.innerHTML = `<span class="status-dot green"></span><span>Requisições Ativas</span>`;
      } else {
        this.statusScreenMarket.className = 'screen-status-badge status-paused';
        this.statusScreenMarket.innerHTML = `<span class="status-dot red"></span><span>Requisições Pausadas</span>`;
      }
    }
  }

  /**
   * Atualiza os campos, status e indicadores de uma conta específica
   */
  private updateAccountVisualState(accountId: string): void {
    const token = this.marketService.getAccountToken(accountId);
    const isJwtActive = this.marketService.isAccountJwtActive(accountId);
    const isReqEnabled = this.huntService.isAccountRequestsEnabled(accountId);

    const input = this.element.querySelector(`#input-token-${accountId}`) as HTMLInputElement;
    const lenIndicator = this.element.querySelector(`#token-len-${accountId}`) as HTMLElement;
    const toggleJwt = this.element.querySelector(`#toggle-jwt-active-${accountId}`) as HTMLInputElement;
    const toggleReq = this.element.querySelector(`#toggle-acc-reqs-${accountId}`) as HTMLInputElement;
    const badgeWrapper = this.element.querySelector(`#badge-wrapper-${accountId}`) as HTMLElement;
    const card = this.element.querySelector(`#account-jwt-card-${accountId}`) as HTMLElement;

    if (input && document.activeElement !== input) {
      input.value = token || '';
    }

    if (lenIndicator) {
      if (token && token.length > 0) {
        lenIndicator.textContent = `${token.length} chars`;
        lenIndicator.className = 'jwt-length-indicator has-token';
      } else {
        lenIndicator.textContent = 'Vazio';
        lenIndicator.className = 'jwt-length-indicator';
      }
    }

    if (toggleJwt) toggleJwt.checked = isJwtActive;
    if (toggleReq) toggleReq.checked = isReqEnabled;

    if (badgeWrapper) {
      if (!token) {
        badgeWrapper.innerHTML = `
          <span class="account-jwt-badge badge-missing" title="Esta conta não possui token JWT cadastrado">
            <span class="badge-dot red"></span>
            <span>Sem Token</span>
          </span>
        `;
      } else if (!isJwtActive) {
        badgeWrapper.innerHTML = `
          <span class="account-jwt-badge badge-disabled" title="Token salvo, porém desativado para requisições">
            <span class="badge-dot yellow"></span>
            <span>JWT Desativado</span>
          </span>
        `;
      } else {
        badgeWrapper.innerHTML = `
          <span class="account-jwt-badge badge-active" title="Token JWT ativo e pronto para requisições autenticadas">
            <span class="badge-dot green"></span>
            <span>JWT Ativo & OK</span>
          </span>
        `;
      }
    }

    if (card) {
      card.classList.toggle('jwt-disabled', !isJwtActive || !token);
      card.classList.toggle('reqs-disabled', !isReqEnabled);
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
    // -------------------------------------------------------------
    // 1. EVENTOS DOS CONTROLES DE TELAS
    // -------------------------------------------------------------
    this.toggleScreenHunt?.addEventListener('change', () => {
      const enabled = this.toggleScreenHunt.checked;
      this.huntService.setScreenRequestsEnabled(enabled);
      this.updateScreenVisualState();
      this.onShowToast?.(
        enabled ? 'Requisições do Dashboard da Hunt ativadas!' : 'Requisições do Dashboard da Hunt pausadas!',
        enabled ? 'success' : 'info',
      );
    });

    this.toggleScreenMarket?.addEventListener('change', () => {
      const enabled = this.toggleScreenMarket.checked;
      this.marketService.setRequestsEnabled(enabled);
      this.updateScreenVisualState();
      this.onShowToast?.(
        enabled ? 'Requisições do Monitor de Mercado ativadas!' : 'Requisições do Monitor de Mercado pausadas!',
        enabled ? 'success' : 'info',
      );
    });

    // -------------------------------------------------------------
    // 2. EVENTOS DAS 4 CONTAS & TOKENS JWT
    // -------------------------------------------------------------
    for (const acc of DEFAULT_ACCOUNTS) {
      const input = this.element.querySelector(`#input-token-${acc.id}`) as HTMLInputElement;
      const lenIndicator = this.element.querySelector(`#token-len-${acc.id}`) as HTMLElement;
      const btnToggleVis = this.element.querySelector(`#btn-toggle-vis-${acc.id}`) as HTMLButtonElement;
      const btnSave = this.element.querySelector(`#btn-save-token-${acc.id}`) as HTMLButtonElement;
      const btnDetect = this.element.querySelector(`#btn-detect-token-${acc.id}`) as HTMLButtonElement;
      const btnRemove = this.element.querySelector(`#btn-remove-token-${acc.id}`) as HTMLButtonElement;
      const toggleJwt = this.element.querySelector(`#toggle-jwt-active-${acc.id}`) as HTMLInputElement;
      const toggleReq = this.element.querySelector(`#toggle-acc-reqs-${acc.id}`) as HTMLInputElement;

      // Atualiza contador de caracteres enquanto digita
      input?.addEventListener('input', () => {
        const len = input.value.trim().length;
        if (lenIndicator) {
          lenIndicator.textContent = len > 0 ? `${len} chars` : 'Vazio';
          lenIndicator.className = len > 0 ? 'jwt-length-indicator has-token' : 'jwt-length-indicator';
        }
      });

      // Alternar visualização (password / text)
      btnToggleVis?.addEventListener('click', () => {
        if (!input) return;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btnToggleVis.title = isPass ? 'Ocultar caracteres do token' : 'Mostrar caracteres do token';
        btnToggleVis.innerHTML = isPass
          ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
          : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });

      // Salvar / Alterar Token
      btnSave?.addEventListener('click', () => {
        const val = (input?.value || '').trim();
        if (!val) {
          this.onShowToast?.(`Digite ou cole o token JWT da ${acc.name} antes de salvar.`, 'info');
          return;
        }
        this.marketService.setAccountToken(acc.id, val);
        this.updateAccountVisualState(acc.id);
        this.onShowToast?.(`Token JWT da Conta ${acc.name} salvo com sucesso!`, 'success');
      });

      // Capturar do WebView correspondente
      btnDetect?.addEventListener('click', async () => {
        btnDetect.disabled = true;
        try {
          const webviews = this.getAccountsWebviews?.() || [];
          const target = webviews.find((w) => w.id === acc.id);
          if (!target || !target.webview) {
            this.onShowToast?.(`WebView da Conta ${acc.name} não encontrado ou inativo.`, 'danger');
            return;
          }

          const detected = await this.marketService.autoDetectTokenForAccount(acc.id, target.webview);
          if (detected) {
            this.updateAccountVisualState(acc.id);
            this.onShowToast?.(`Token da Conta ${acc.name} capturado com sucesso do WebView!`, 'success');
          } else {
            this.onShowToast?.(`Nenhum token encontrado na Conta ${acc.name}. Faça login no Grid primeiro.`, 'info');
          }
        } catch (err: any) {
          this.onShowToast?.(`Erro ao capturar token: ${err.message || err}`, 'danger');
        } finally {
          btnDetect.disabled = false;
        }
      });

      // Remover Token
      btnRemove?.addEventListener('click', () => {
        this.marketService.removeAccountToken(acc.id);
        if (input) input.value = '';
        this.updateAccountVisualState(acc.id);
        this.onShowToast?.(`Token da Conta ${acc.name} removido com sucesso.`, 'info');
      });

      // Switch JWT Ativo
      toggleJwt?.addEventListener('change', () => {
        const isChecked = toggleJwt.checked;
        this.marketService.setAccountJwtActive(acc.id, isChecked);
        this.updateAccountVisualState(acc.id);
        this.onShowToast?.(
          isChecked ? `JWT da Conta ${acc.name} ativado!` : `JWT da Conta ${acc.name} desativado!`,
          isChecked ? 'success' : 'info',
        );
      });

      // Switch Requisições da Conta
      toggleReq?.addEventListener('change', () => {
        const isChecked = toggleReq.checked;
        this.huntService.setAccountRequestsEnabled(acc.id, isChecked);
        this.updateAccountVisualState(acc.id);
        this.onShowToast?.(
          isChecked ? `Requisições da Conta ${acc.name} ativadas!` : `Requisições da Conta ${acc.name} pausadas!`,
          isChecked ? 'success' : 'info',
        );
      });
    }

    // Botão Superior: Auto-Detectar Todos os Tokens dos WebViews
    this.btnDetectAllTokens?.addEventListener('click', async () => {
      this.btnDetectAllTokens.disabled = true;
      try {
        const webviews = this.getAccountsWebviews?.() || [];
        if (webviews.length === 0) {
          this.onShowToast?.('Nenhum WebView conectado para varredura.', 'info');
          return;
        }

        let detectedCount = 0;
        for (const item of webviews) {
          if (item.webview) {
            const token = await this.marketService.autoDetectTokenForAccount(item.id, item.webview);
            if (token) {
              detectedCount++;
              this.updateAccountVisualState(item.id);
            }
          }
        }

        if (detectedCount > 0) {
          this.onShowToast?.(`Tokens atualizados com sucesso para ${detectedCount} conta(s)!`, 'success');
        } else {
          this.onShowToast?.('Nenhum novo token detectado. Certifique-se de que as contas estão logadas.', 'info');
        }
      } catch (err: any) {
        this.onShowToast?.(`Erro na varredura de tokens: ${err.message || err}`, 'danger');
      } finally {
        this.btnDetectAllTokens.disabled = false;
      }
    });

    // -------------------------------------------------------------
    // 3. EVENTOS DA TABELA DE ALERTAS DE CAPTURA
    // -------------------------------------------------------------
    for (const q of QUALITIES_CONFIG) {
      const toggle = this.element.querySelector(`#toggle-${q.key}`) as HTMLInputElement;
      const ivInput = this.element.querySelector(`#iv-${q.key}`) as HTMLInputElement;

      toggle?.addEventListener('change', () => {
        const minIv = this.getSanitizedIv(ivInput?.value);
        this.updateRowVisualState(q.key, toggle.checked, minIv);
        this.collectAndSaveSettings(false);
      });

      ivInput?.addEventListener('input', () => {
        const val = this.getSanitizedIv(ivInput.value);
        this.updateRowVisualState(q.key, toggle ? toggle.checked : false, val);
        this.collectAndSaveSettings(false);
      });

      ivInput?.addEventListener('blur', () => {
        const val = this.getSanitizedIv(ivInput.value);
        ivInput.value = String(val);
      });
    }

    // Botões Principais de Salvar
    const handleSave = () => {
      this.collectAndSaveSettings(true);
      const interval = parseInt(this.inputClickInterval.value, 10);
      if (!isNaN(interval) && interval >= 500 && interval <= 10000) {
        this.onApplyInterval?.(interval);
      }
    };

    this.btnSaveTop?.addEventListener('click', handleSave);
    this.btnSaveBottom?.addEventListener('click', handleSave);

    // Botão de Restaurar Padrões de Alerta
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

    // Predefinições Rápidas de Alerta
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

    // Escuta sincronizações automáticas externas de token (ex: login no WebView detectado pelo bridge)
    this.unsubscribeTokenChange = this.marketService.onTokenChange((accountId) => {
      this.updateAccountVisualState(accountId);
    });

    this.unsubscribeMarketRequests = this.marketService.onRequestsEnabledChange(() => {
      if (this.toggleScreenMarket) {
        this.toggleScreenMarket.checked = this.marketService.isRequestsEnabled();
      }
      this.updateScreenVisualState();
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
      this.onShowToast?.('Todos os ajustes e regras de governança foram salvos!', 'success');
    }
  }

  public destroy(): void {
    this.unsubscribeTokenChange?.();
    this.unsubscribeMarketRequests?.();
  }
}
