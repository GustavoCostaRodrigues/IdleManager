import type { CaptureRecord } from '../shared/captureTypes.js';
import { AccountManager } from './components/accountManager.js';
import { CapturesDashboardComponent } from './components/capturesDashboard.js';
import { HuntDashboardComponent } from './components/huntDashboard.js';
import { SettingsComponent } from './components/settingsComponent.js';
import { TitleBarComponent } from './components/titleBar.js';
import { ToastManager } from './components/toast.js';
import { AlertSettingsService } from './services/alertSettingsService.js';
import { CaptureStore } from './services/captureStore.js';

class PokeIdleApp {
  private accountManager!: AccountManager;
  private titleBar!: TitleBarComponent;
  private huntDashboard!: HuntDashboardComponent;
  private capturesDashboard!: CapturesDashboardComponent;
  private settingsComponent!: SettingsComponent;
  private toastManager = new ToastManager();

  private accountsViewport!: HTMLElement;
  private huntViewport!: HTMLElement;
  private capturesViewport!: HTMLElement;
  private settingsViewport!: HTMLElement;
  private navAccountsBtn!: HTMLElement;
  private navLogsBtn!: HTMLElement;
  private navCapturesBtn!: HTMLElement;
  private navSettingsBtn!: HTMLElement;

  private currentView: 'accounts' | 'hunt' | 'captures' | 'settings' = 'accounts';
  private lastAlertedCaptureId: string | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    const container = document.getElementById('accounts-container');
    if (!container) throw new Error('Container #accounts-container não encontrado.');

    this.accountsViewport = document.getElementById('accounts-viewport') as HTMLElement;
    this.huntViewport = document.getElementById('hunt-viewport') as HTMLElement;
    this.capturesViewport = document.getElementById('captures-viewport') as HTMLElement;
    this.settingsViewport = document.getElementById('settings-viewport') as HTMLElement;

    // Inicializa a barra de título
    this.titleBar = new TitleBarComponent(
      (mode) => {
        this.switchView('accounts');
        this.accountManager.setLayout(mode);
      },
      () => this.handleEmergencyStop(),
    );

    // Inicializa o gerenciador de contas
    this.accountManager = new AccountManager(container, (mode) => {
      this.titleBar?.updateLayoutActiveState(mode);
    });

    this.titleBar.updateLayoutActiveState(this.accountManager.getLayout());

    // Inicializa o Dashboard da Hunt (Painel Financeiro)
    this.huntDashboard = new HuntDashboardComponent(
      (accountId) => this.navigateToAccount(accountId),
      (msg, type) => this.toastManager.show(msg, type),
    );
    this.huntViewport.appendChild(this.huntDashboard.element);

    // Inicializa o Dashboard de Capturas & Qualidade
    this.capturesDashboard = new CapturesDashboardComponent(
      (accountId) => this.navigateToAccount(accountId),
      (msg, type) => this.toastManager.show(msg, type),
    );
    this.capturesViewport.appendChild(this.capturesDashboard.element);

    // Inicializa a Tela de Ajustes & Alertas de Notificação
    this.settingsComponent = new SettingsComponent(
      (interval) => {
        this.accountManager.setAllIntervals(interval);
        this.toastManager.show(`Intervalo de auto-click atualizado para ${interval}ms`, 'success');
      },
      () => {
        this.triggerPulsingAlertSimulation();
      },
      (msg, type) => this.toastManager.show(msg, type),
    );
    this.settingsViewport.appendChild(this.settingsComponent.element);

    this.setupDrawer();
    this.setupEmergencyListeners();
    this.setupCaptureAlertWatcher();
  }

  private setupDrawer(): void {
    this.navAccountsBtn = document.getElementById('nav-accounts') as HTMLElement;
    this.navLogsBtn = document.getElementById('nav-logs') as HTMLElement;
    this.navCapturesBtn = document.getElementById('nav-captures') as HTMLElement;
    this.navSettingsBtn = document.getElementById('nav-settings') as HTMLElement;
    const navMarket = document.getElementById('nav-market');

    this.navAccountsBtn?.addEventListener('click', () => {
      this.switchView('accounts');
    });

    this.navLogsBtn?.addEventListener('click', () => {
      this.switchView('hunt');
    });

    this.navCapturesBtn?.addEventListener('click', () => {
      this.clearPulsingAlert();
      this.switchView('captures');
    });

    navMarket?.addEventListener('click', () => {
      this.toastManager.show('Módulo de Mercado & Anúncios em desenvolvimento.', 'info');
    });

    // Botão de engrenagem no drawer leva diretamente para a Tela de Ajustes
    this.navSettingsBtn?.addEventListener('click', () => {
      this.switchView('settings');
    });
  }

  private switchView(view: 'accounts' | 'hunt' | 'captures' | 'settings'): void {
    this.currentView = view;

    // Atualiza estados dos botões de navegação no drawer lateral
    this.navAccountsBtn?.classList.remove('active');
    this.navLogsBtn?.classList.remove('active');
    this.navCapturesBtn?.classList.remove('active');
    this.navSettingsBtn?.classList.remove('active');

    // Oculta todos os viewports
    this.accountsViewport.style.display = 'none';
    this.huntViewport.classList.remove('active');
    this.capturesViewport.classList.remove('active');
    this.settingsViewport.classList.remove('active');

    if (view === 'accounts') {
      this.navAccountsBtn?.classList.add('active');
      this.accountsViewport.style.display = 'block';
    } else if (view === 'hunt') {
      this.navLogsBtn?.classList.add('active');
      this.huntViewport.classList.add('active');
    } else if (view === 'captures') {
      this.clearPulsingAlert();
      this.navCapturesBtn?.classList.add('active');
      this.capturesViewport.classList.add('active');
    } else if (view === 'settings') {
      this.navSettingsBtn?.classList.add('active');
      this.settingsViewport.classList.add('active');
    }
  }

  /**
   * Monitora em tempo real novas capturas emitidas pelo CaptureStore.
   * Utiliza as regras de qualidade e IV configuradas na tela de ajustes pelo usuário!
   */
  private setupCaptureAlertWatcher(): void {
    const store = CaptureStore.getInstance();
    const alertService = AlertSettingsService.getInstance();
    let initialSyncDone = false;

    store.subscribe((captures) => {
      if (!captures || captures.length === 0) return;

      // Na primeira carga, grava o ID do topo para não alertar registros prévios do histórico
      if (!initialSyncDone) {
        initialSyncDone = true;
        this.lastAlertedCaptureId = captures[0]?.id || null;
        return;
      }

      const top = captures[0];
      if (!top || top.id === this.lastAlertedCaptureId) return;

      // Avalia se a captura atende aos critérios de qualidade e IV mínimo definidos pelo usuário
      if (alertService.shouldTriggerAlert(top)) {
        this.lastAlertedCaptureId = top.id;

        // Se o usuário não estiver com a tela de capturas aberta, ativa o indicador pulsante no drawer!
        if (this.currentView !== 'captures') {
          this.triggerPulsingAlert(top);
        }
      }
    });
  }

  private triggerPulsingAlert(record: CaptureRecord): void {
    if (!this.navCapturesBtn) return;
    this.navCapturesBtn.classList.add('pulse-legendary');

    let badge = this.navCapturesBtn.querySelector('.nav-legendary-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-legendary-badge';
      this.navCapturesBtn.appendChild(badge);
    }

    const qualityLabel = (record.quality || 'pokemon').toUpperCase();
    this.toastManager.show(
      `⭐ ALERTA DE CAPTURA! ${record.pokemonName} [${qualityLabel}] (${record.iv.total}/192 IV) na Conta ${record.accountName}!`,
      'success',
      8000,
    );
  }

  private triggerPulsingAlertSimulation(): void {
    if (!this.navCapturesBtn) return;
    this.navCapturesBtn.classList.add('pulse-legendary');

    let badge = this.navCapturesBtn.querySelector('.nav-legendary-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-legendary-badge';
      this.navCapturesBtn.appendChild(badge);
    }
  }

  private clearPulsingAlert(): void {
    if (!this.navCapturesBtn) return;
    this.navCapturesBtn.classList.remove('pulse-legendary');
    const badge = this.navCapturesBtn.querySelector('.nav-legendary-badge');
    if (badge) badge.remove();
  }

  private navigateToAccount(accountId: string): void {
    this.switchView('accounts');
    const card = this.accountManager.getCards().find((c) => c.config.id === accountId);
    if (card) {
      if (this.accountManager.getLayout() === 'layout-1x3') {
        this.accountManager.setFeaturedCard(card);
      }
      this.toastManager.show(`Foco alterado para ${card.config.name}`, 'info', 2000);
    }
  }

  private setupEmergencyListeners(): void {
    // 1. Recebe sinal de emergência do processo principal (atalho global Alt+C ou IPC)
    if (window.electronAPI?.onEmergencyStop) {
      window.electronAPI.onEmergencyStop(() => {
        this.handleEmergencyStop();
      });
    }

    // 2. Escuta eventos no Renderer caso a janela principal esteja em foco (Alt+C)
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.altKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          this.handleEmergencyStop();
        }
      },
      true,
    );
  }

  private handleEmergencyStop(): void {
    const stoppedCount = this.accountManager.emergencyStopAll();
    this.toastManager.show(
      stoppedCount > 0
        ? `PARADA DE EMERGÊNCIA: ${stoppedCount} auto-click(s) cancelados imediatamente.`
        : 'PARADA DE EMERGÊNCIA ACIONADA: Nenhuma automação ativa.',
      'danger',
      4500,
    );
  }
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new PokeIdleApp();
});
