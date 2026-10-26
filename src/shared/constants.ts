import type { AccountConfig } from './types.js';

export const DEFAULT_GAME_URL = 'https://poke.idleworld.online/';

export const DEFAULT_ACCOUNTS: AccountConfig[] = [
  {
    id: 'account_01',
    name: '01',
    partition: 'persist:account_01',
    url: DEFAULT_GAME_URL,
  },
  {
    id: 'account_02',
    name: '02',
    partition: 'persist:account_02',
    url: DEFAULT_GAME_URL,
  },
  {
    id: 'account_03',
    name: '03',
    partition: 'persist:account_03',
    url: DEFAULT_GAME_URL,
  },
  {
    id: 'account_04',
    name: '04',
    partition: 'persist:account_04',
    url: DEFAULT_GAME_URL,
  },
];

export const IPC_CHANNELS = {
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  WINDOW_STATE_CHANGE: 'window:state-change',
  SYSTEM_GET_INFO: 'system:get-info',
  SYSTEM_GET_METRICS: 'system:get-metrics',
  EMERGENCY_STOP: 'emergency:stop',
} as const;

export const AUTO_CLICK_CONFIG = {
  DEFAULT_INTERVAL_MS: 1500,
  MIN_INTERVAL_MS: 500,
  MAX_INTERVAL_MS: 10000,
  /**
   * Seletores CSS testados e heurísticos para encontrar botões de ação/captura/lançamento no jogo:
   */
  TARGET_SELECTORS: [
    'button.catch-btn',
    '.btn-lancar',
    'button.btn-lancar',
    'button#catch-btn',
    'button.catch-pokemon',
    '[data-action="catch"]',
    '[data-action="lancar"]',
    'button.action-btn.catch',
    '.battle-action-catch',
  ],
} as const;
