import type { LayoutMode, SystemInfo } from '../../shared/types.js';

export class TitleBarComponent {
  private btnGrid: HTMLButtonElement;
  private btn1x3: HTMLButtonElement;
  private btnEmergency: HTMLButtonElement;
  private shortcutBadge: HTMLElement;
  private metricCpu: HTMLElement;
  private metricRam: HTMLElement;

  private btnMinimize: HTMLButtonElement | null;
  private btnMaximize: HTMLButtonElement | null;
  private btnClose: HTMLButtonElement | null;

  constructor(
    private readonly onLayoutSelect: (mode: LayoutMode) => void,
    private readonly onEmergencyStop: () => void,
  ) {
    this.btnGrid = document.getElementById('btn-layout-grid') as HTMLButtonElement;
    this.btn1x3 = document.getElementById('btn-layout-1x3') as HTMLButtonElement;
    this.btnEmergency = document.getElementById('btn-emergency-stop') as HTMLButtonElement;
    this.shortcutBadge = document.getElementById('emergency-shortcut-badge') as HTMLElement;
    this.metricCpu = document.getElementById('metric-cpu') as HTMLElement;
    this.metricRam = document.getElementById('metric-ram') as HTMLElement;

    this.btnMinimize = document.getElementById('btn-window-minimize') as HTMLButtonElement | null;
    this.btnMaximize = document.getElementById('btn-window-maximize') as HTMLButtonElement | null;
    this.btnClose = document.getElementById('btn-window-close') as HTMLButtonElement | null;

    this.initEvents();
    this.initPlatformStyle();
    this.startMetricsPolling();
  }

  private initEvents(): void {
    this.btnGrid.addEventListener('click', () => {
      this.onLayoutSelect('grid-2x2');
    });

    this.btn1x3.addEventListener('click', () => {
      this.onLayoutSelect('layout-1x3');
    });

    this.btnEmergency.addEventListener('click', () => {
      this.onEmergencyStop();
    });

    // Controles de Janela
    this.btnMinimize?.addEventListener('click', () => {
      window.electronAPI?.minimizeWindow();
    });

    this.btnMaximize?.addEventListener('click', () => {
      window.electronAPI?.maximizeWindow();
    });

    this.btnClose?.addEventListener('click', () => {
      window.electronAPI?.closeWindow();
    });
  }

  private async initPlatformStyle(): Promise<void> {
    try {
      const info: SystemInfo = await window.electronAPI?.getSystemInfo();
      if (info?.platform === 'darwin') {
        document.body.classList.add('platform-darwin');
        this.shortcutBadge.textContent = 'Opt+C';
      } else {
        document.body.classList.add('platform-windows');
        this.shortcutBadge.textContent = 'Alt+C';
      }
    } catch {
      // Fallback para navigator
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      this.shortcutBadge.textContent = isMac ? 'Opt+C' : 'Alt+C';
    }
  }

  public updateLayoutActiveState(mode: LayoutMode): void {
    if (mode === 'grid-2x2') {
      this.btnGrid.classList.add('active');
      this.btnGrid.setAttribute('aria-checked', 'true');
      this.btn1x3.classList.remove('active');
      this.btn1x3.setAttribute('aria-checked', 'false');
    } else if (mode === 'layout-1x3') {
      this.btn1x3.classList.add('active');
      this.btn1x3.setAttribute('aria-checked', 'true');
      this.btnGrid.classList.remove('active');
      this.btnGrid.setAttribute('aria-checked', 'false');
    } else {
      this.btnGrid.classList.remove('active');
      this.btn1x3.classList.remove('active');
    }
  }

  private startMetricsPolling(): void {
    const update = async () => {
      try {
        const metrics = await window.electronAPI?.getMetrics();
        if (metrics) {
          this.metricCpu.textContent = `${metrics.cpuUsage}%`;
          this.metricRam.textContent = `${metrics.memoryUsageMb} MB`;
        }
      } catch {
        // Ignora silenciosamente se o renderer for descarregado
      }
    };

    update();
    setInterval(update, 2500);
  }
}
