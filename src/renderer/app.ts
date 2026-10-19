import { AccountManager } from './components/accountManager.js';
import { CapturesDashboardComponent } from './components/capturesDashboard.js';
import { HuntDashboardComponent } from './components/huntDashboard.js';
import { TitleBarComponent } from './components/titleBar.js';
import { ToastManager } from './components/toast.js';

class PokeIdleApp {
  private accountManager!: AccountManager;
  private titleBar!: TitleBarComponent;
  private huntDashboard!: HuntDashboardComponent;
  private capturesDashboard!: CapturesDashboardComponent;
  private toastManager = new ToastManager();

  private accountsViewport!: HTMLElement;
  private huntViewport!: HTMLElement;
  private capturesViewport!: HTMLElement;
  private navAccountsBtn!: HTMLElement;
  private navLogsBtn!: HTMLElement;
  private navCapturesBtn!: HTMLElement;

  constructor() {
    this.init();
  }

  private init(): void {
    const container = document.getElementById('accounts-container');
    if (!container) throw new Error('Container #accounts-container não encontrado.');

    this.accountsViewport = document.getElementById('accounts-viewport') as HTMLElement;
    this.huntViewport = document.getElementById('hunt-viewport') as HTMLElement;
    this.capturesViewport = document.getElementById('captures-viewport') as HTMLElement;

    // Inicializa a barra de título
    this.titleBar = new TitleBarComponent(
      (mode) => this.accountManager.setLayout(mode),
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

    this.setupDrawer();
    this.setupSettingsModal();
    this.setupEmergencyListeners();
  }

  private setupDrawer(): void {
    this.navAccountsBtn = document.getElementById('nav-accounts') as HTMLElement;
    this.navLogsBtn = document.getElementById('nav-logs') as HTMLElement;
    this.navCapturesBtn = document.getElementById('nav-captures') as HTMLElement;
    const navMarket = document.getElementById('nav-market');
    const navSettings = document.getElementById('nav-settings');
    const modalSettings = document.getElementById('modal-settings');

    this.navAccountsBtn?.addEventListener('click', () => {
      this.switchView('accounts');
    });

    this.navLogsBtn?.addEventListener('click', () => {
      this.switchView('hunt');
    });

    this.navCapturesBtn?.addEventListener('click', () => {
      this.switchView('captures');
    });

    navMarket?.addEventListener('click', () => {
      this.toastManager.show('Módulo de Mercado & Anúncios em desenvolvimento.', 'info');
    });

    navSettings?.addEventListener('click', () => {
      modalSettings?.classList.add('open');
    });
  }

  private switchView(view: 'accounts' | 'hunt' | 'captures'): void {
    // Remove classe ativa de todos os botões de navegação
    this.navAccountsBtn.classList.remove('active');
    this.navLogsBtn.classList.remove('active');
    this.navCapturesBtn.classList.remove('active');

    // Oculta todos os viewports
    this.accountsViewport.style.display = 'none';
    this.huntViewport.classList.remove('active');
    this.capturesViewport.classList.remove('active');

    if (view === 'accounts') {
      this.navAccountsBtn.classList.add('active');
      this.accountsViewport.style.display = 'block';
    } else if (view === 'hunt') {
      this.navLogsBtn.classList.add('active');
      this.huntViewport.classList.add('active');
    } else if (view === 'captures') {
      this.navCapturesBtn.classList.add('active');
      this.capturesViewport.classList.add('active');
    }
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

  private setupSettingsModal(): void {
    const modal = document.getElementById('modal-settings');
    const btnClose = document.getElementById('btn-close-settings');
    const btnCancel = document.getElementById('btn-cancel-settings');
    const btnSave = document.getElementById('btn-save-settings');
    const inputInterval = document.getElementById('setting-click-interval') as HTMLInputElement;

    const closeModal = () => modal?.classList.remove('open');

    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    btnSave?.addEventListener('click', () => {
      const interval = parseInt(inputInterval.value, 10);
      if (!isNaN(interval) && interval >= 500 && interval <= 10000) {
        this.accountManager.setAllIntervals(interval);
        this.toastManager.show(`Intervalo de auto-click atualizado para ${interval}ms`, 'success');
        closeModal();
      } else {
        this.toastManager.show('Por favor, informe um intervalo válido entre 500ms e 10000ms', 'danger');
      }
    });
  }

  private setupEmergencyListeners(): void {
    // 1. Recebe sinal de emergência do processo principal (atalho global Cmd+C / Ctrl+C ou IPC)
    if (window.electronAPI?.onEmergencyStop) {
      window.electronAPI.onEmergencyStop(() => {
        this.handleEmergencyStop();
      });
    }

    // 2. Escuta eventos no Renderer caso a janela principal esteja em foco
    window.addEventListener(
      'keydown',
      (e) => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        if (modifier && e.key.toLowerCase() === 'c') {
          // Não impede cópia apenas se o usuário estiver selecionando texto em um campo de formulário
          const activeTag = (document.activeElement?.tagName || '').toLowerCase();
          const hasSelection = (window.getSelection()?.toString() || '').length > 0;
          if (activeTag === 'input' && hasSelection) {
            return;
          }

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
