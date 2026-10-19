import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants.js';
import type { IElectronAPI, SystemInfo, WindowMetrics } from '../shared/types.js';

const api: IElectronAPI = {
  minimizeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE);
  },

  maximizeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE);
  },

  closeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE);
  },

  isMaximized: async (): Promise<boolean> => {
    return (await ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED)) as boolean;
  },

  getSystemInfo: async (): Promise<SystemInfo> => {
    return (await ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_INFO)) as SystemInfo;
  },

  getMetrics: async (): Promise<WindowMetrics> => {
    return (await ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_METRICS)) as WindowMetrics;
  },

  onEmergencyStop: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on(IPC_CHANNELS.EMERGENCY_STOP, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EMERGENCY_STOP, handler);
    };
  },

  triggerEmergencyStop: async (): Promise<void> => {
    await ipcRenderer.invoke(IPC_CHANNELS.EMERGENCY_STOP);
  },

  onWindowStateChange: (callback: (isMaximized: boolean) => void): (() => void) => {
    const handler = (_event: unknown, isMax: boolean) => {
      callback(isMax);
    };
    ipcRenderer.on(IPC_CHANNELS.WINDOW_STATE_CHANGE, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_STATE_CHANGE, handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
