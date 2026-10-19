import { app, BrowserWindow, ipcMain, globalShortcut, Menu } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from '../shared/constants.js';

// No formato CJS empacotado para o Electron, __dirname é fornecido pelo runtime Node.js:
declare const __dirname: string;


let mainWindow: BrowserWindow | null = null;
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();

function getCpuPercent(): number {
  const currentCpuTime = Date.now();
  const currentCpuUsage = process.cpuUsage(lastCpuUsage);

  const timeDiff = (currentCpuTime - lastCpuTime) * 1000; // microsegundos
  lastCpuTime = currentCpuTime;
  lastCpuUsage = process.cpuUsage();

  if (timeDiff <= 0) return 0;
  const totalUsage = (currentCpuUsage.user + currentCpuUsage.system) / timeDiff;
  return Math.min(100, Math.max(0, Math.round(totalUsage * 100)));
}

function broadcastEmergencyStop(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.EMERGENCY_STOP);
  }
}

function registerEmergencyShortcuts(): void {
  // Atalho de emergência global CommandOrControl+C
  try {
    const registered = globalShortcut.register('CommandOrControl+C', () => {
      broadcastEmergencyStop();
    });

    if (!registered) {
      console.warn('Não foi possível registrar o atalho global CommandOrControl+C.');
    }
  } catch (err) {
    console.error('Erro ao registrar atalho global:', err);
  }
}

function unregisterEmergencyShortcuts(): void {
  try {
    globalShortcut.unregister('CommandOrControl+C');
  } catch (err) {
    console.error('Erro ao desregistrar atalho global:', err);
  }
}

function setupWebviewSecurity(): void {
  // Intercepta e protege novas instâncias de webview e popups
  app.on('web-contents-created', (_event, contents) => {
    // Intercepta atalhos de emergência também nos webcontents filhos (ex: webviews)
    contents.on('before-input-event', (event, input) => {
      const isCmdOrCtrl = process.platform === 'darwin' ? input.meta : input.control;
      if (isCmdOrCtrl && input.key.toLowerCase() === 'c' && input.type === 'keyDown') {
        broadcastEmergencyStop();
      }
    });

    // Bloqueia abertura de novas janelas popups não autorizadas
    contents.setWindowOpenHandler(({ url }) => {
      // Bloqueia popups suspeitos, mantendo o usuário seguro dentro do contexto do jogo
      console.log(`[Security] Tentativa de abertura de popup prevenida: ${url}`);
      return { action: 'deny' };
    });
  });
}

// Flags de otimização de aceleração por hardware e GPU do Chromium
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#0F1117',
    frame: false, // Sem bordas nativas conforme requisito
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 18, y: 16 },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Essencial para particionamento de sessões com <webview>
      sandbox: false,
      backgroundThrottling: false, // CRÍTICO: Evita travamentos e quedas bruscas de FPS ao mover o mouse entre webviews
    },
  });

  // Oculta a barra de menu padrão (File, Edit, etc) no Windows/Linux
  Menu.setApplicationMenu(null);

  const htmlPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Notifica o renderer sobre mudanças no estado da janela (maximizado / restaurado)
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_STATE_CHANGE, true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_STATE_CHANGE, false);
  });

  // Escuta tecla Cmd+C / Ctrl+C no foco da janela principal
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isCmdOrCtrl = process.platform === 'darwin' ? input.meta : input.control;
    if (isCmdOrCtrl && input.key.toLowerCase() === 'c' && input.type === 'keyDown') {
      broadcastEmergencyStop();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIpcHandlers(): void {
  // Controle de janela
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Informações do sistema
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, () => {
    return {
      platform: process.platform as 'darwin' | 'win32' | 'linux',
      version: app.getVersion(),
    };
  });

  // Métricas de uso de CPU e Memória
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_METRICS, async () => {
    const cpu = getCpuPercent();
    let memMb = 0;
    try {
      const memoryInfo = await process.getProcessMemoryInfo();
      memMb = Math.round(memoryInfo.private / 1024);
    } catch {
      const memUsage = process.memoryUsage();
      memMb = Math.round(memUsage.rss / (1024 * 1024));
    }

    return {
      cpuUsage: cpu,
      memoryUsageMb: memMb,
    };
  });

  // Acionamento de parada de emergência
  ipcMain.handle(IPC_CHANNELS.EMERGENCY_STOP, () => {
    broadcastEmergencyStop();
  });
}

// Configuração de ciclo de vida da aplicação
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });

  app.whenReady().then(() => {
    setupWebviewSecurity();
    setupIpcHandlers();
    createMainWindow();
    registerEmergencyShortcuts();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('will-quit', () => {
    unregisterEmergencyShortcuts();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
