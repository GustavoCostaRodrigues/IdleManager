export type LayoutMode = 'grid-2x2' | 'layout-1x3' | 'maximized';

export interface AccountConfig {
  id: string; // ex: 'account_01'
  name: string; // ex: '01'
  partition: string; // ex: 'persist:account_01'
  url: string;
}

export interface AutoClickStatus {
  accountId: string;
  enabled: boolean;
  intervalMs: number;
  clickCount: number;
  lastClickTime: number | null;
  lastSuccess: boolean;
  statusMessage: string;
}

export interface WindowMetrics {
  cpuUsage: number;
  memoryUsageMb: number;
}

export interface SystemInfo {
  platform: 'darwin' | 'win32' | 'linux';
  version: string;
}

export interface IElectronAPI {
  // Controle da Janela
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // Informações do Sistema
  getSystemInfo: () => Promise<SystemInfo>;
  getMetrics: () => Promise<WindowMetrics>;

  // Atalho de Emergência e Notificações IPC
  onEmergencyStop: (callback: () => void) => () => void;
  triggerEmergencyStop: () => Promise<void>;

  // Evento de janela
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
