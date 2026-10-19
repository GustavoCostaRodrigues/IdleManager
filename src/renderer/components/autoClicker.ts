import { AUTO_CLICK_CONFIG } from '../../shared/constants.js';
import type {
  IVStats,
  PokeballType,
  PokemonQuality,
} from '../../shared/captureTypes.js';
import type { PokemonCaptureTelemetry } from '../../shared/telemetryTypes.js';
import { CaptureStore } from '../services/captureStore.js';
import { HuntStore } from '../services/huntStore.js';

export interface ExtractedCaptureData {
  pokemonName: string;
  pokemonDexNumber?: number;
  level?: number;
  isShiny?: boolean;
  pokeball?: PokeballType;
  quality?: PokemonQuality;
  ivPoints?: number;
  ivPercentage?: number;
}

export interface AutoClickResult {
  success: boolean;
  selector?: string;
  error?: string;
  reason?: string;
  extracted?: ExtractedCaptureData;
}

/**
 * Script de injeção JS executado pontualmente no momento do tick do auto-clicker.
 * Procura o botão de captura/lançamento, executa o clique nativo e inspeciona se há
 * dados REAIS do Pokémon no DOM do Poke Idle World.
 */
export const INJECTION_SCRIPT = `
(() => {
  try {
    const selectors = ${JSON.stringify(AUTO_CLICK_CONFIG.TARGET_SELECTORS)};
    let targetButton = null;

    // 1. Busca por seletores prioritários de lançamento / captura
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled && btn.offsetParent !== null) {
        targetButton = btn;
        break;
      }
    }

    // 2. Fallback heurístico: busca por botões com textos de captura
    if (!targetButton) {
      const buttons = Array.from(document.querySelectorAll('button, a.btn, div[role="button"]'));
      targetButton = buttons.find((el) => {
        if (el.disabled || el.offsetParent === null) return false;
        const text = (el.textContent || '').trim().toLowerCase();
        return (
          text.includes('capturar') ||
          text.includes('lançar') ||
          text.includes('lancar') ||
          text.includes('catch') ||
          text.includes('pokébola') ||
          text.includes('pokebola')
        );
      }) || null;
    }

    // 3. Inspeção e extração estrita de dados REAIS do Pokémon no DOM do jogo
    let extracted = null;

    try {
      const nameEl = document.querySelector('.enemy-name, .pokemon-name, .wild-pokemon-name, #enemy-name, .target-name, .pokemon-info .name, .pokemon-card strong');
      const levelEl = document.querySelector('.enemy-level, .pokemon-level, .level-badge, .wild-level, .pokemon-info .level');
      const shinyEl = document.querySelector('.shiny-star, .is-shiny, .badge-shiny, .shiny-icon, [data-shiny="true"]');
      const ballEl = document.querySelector('.active-pokeball, .selected-ball, .ball-slot.active, [data-selected-ball]');
      const ivEl = document.querySelector('.pokemon-iv, .iv-percentage, .iv-val, [data-iv]');

      let rawName = nameEl ? (nameEl.textContent || '').trim() : '';
      let level = 1;

      // Fallback: busca diretamente no painel de captura adjacente ao botão Lançar
      if (!rawName && targetButton) {
        const captureBox = targetButton.closest('div, section, [class*="captur"]') || targetButton.parentElement;
        if (captureBox) {
          const cText = captureBox.textContent || '';
          const match = cText.match(/([A-Za-z0-9À-ÿ\\s\\-]+?)(?:\\s+Lv\\.?\\s*(\\d+))/i);
          if (match) {
            const clean = match[1].replace(/CAPTURA|selvagem|Loja|Lançar|lancar/gi, '').trim();
            if (clean.length >= 2 && clean.length <= 25) {
              rawName = clean;
              if (match[2]) level = parseInt(match[2], 10) || 1;
            }
          }
        }
      }

      if (rawName.length > 0) {
        const cleanName = rawName.replace(/^Lv\\.?\\s*\\d+\\s*/i, '').replace(/^Nv\\.?\\s*\\d+\\s*/i, '').replace(/^\\[\\d+\\]\\s*/i, '').replace(/\\s*\\(Shiny\\)/i, '').trim();

        if (levelEl) {
          const num = parseInt((levelEl.textContent || '').replace(/\\D/g, ''), 10);
          if (!isNaN(num) && num > 0) level = num;
        }

        const isShiny = !!shinyEl || rawName.toLowerCase().includes('shiny') || rawName.includes('✨');

        let pokeball = 'pokeball';
        if (ballEl) {
          const ballClass = (ballEl.className + ' ' + (ballEl.getAttribute('data-ball') || '') + ' ' + (ballEl.textContent || '')).toLowerCase();
          if (ballClass.includes('master')) pokeball = 'masterball';
          else if (ballClass.includes('ultra')) pokeball = 'ultraball';
          else if (ballClass.includes('great')) pokeball = 'greatball';
        }

        let ivPercentage = undefined;
        if (ivEl) {
          const ivMatches = (ivEl.textContent || '').match(/(\\d+(\\.\\d+)?)/);
          if (ivMatches && ivMatches[1]) {
            ivPercentage = parseFloat(ivMatches[1]);
          }
        }

        let quality = 'comum';
        const cardContainer = (nameEl.closest('.pokemon-card, .enemy-box, .enemy-card, .battle-container') || nameEl.parentElement);
        if (cardContainer) {
          const containerClasses = (cardContainer.className + ' ' + (cardContainer.getAttribute('data-quality') || '') + ' ' + (cardContainer.getAttribute('data-rarity') || '')).toLowerCase();
          if (containerClasses.includes('divina') || containerClasses.includes('divine')) {
            quality = 'divina';
          } else if (containerClasses.includes('ancia') || containerClasses.includes('anciã') || containerClasses.includes('ancient')) {
            quality = 'ancia';
          } else if (containerClasses.includes('mitica') || containerClasses.includes('mítica') || containerClasses.includes('mythic')) {
            quality = 'mitica';
          } else if (containerClasses.includes('lendaria') || containerClasses.includes('lendária') || containerClasses.includes('legendary')) {
            quality = 'lendaria';
          } else if (containerClasses.includes('epica') || containerClasses.includes('épica') || containerClasses.includes('epic')) {
            quality = 'epica';
          } else if (containerClasses.includes('rara') || containerClasses.includes('rare')) {
            quality = 'rara';
          } else if (containerClasses.includes('incomum') || containerClasses.includes('uncommon')) {
            quality = 'incomum';
          } else if (containerClasses.includes('fraca') || containerClasses.includes('weak') || containerClasses.includes('poor')) {
            quality = 'fraca';
          } else if (containerClasses.includes('comum') || containerClasses.includes('common')) {
            quality = 'comum';
          }
        }

        extracted = {
          pokemonName: cleanName,
          level,
          isShiny,
          pokeball,
          quality,
          ivPercentage,
        };
      }
    } catch (e) {}

    if (targetButton) {
      targetButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      targetButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      targetButton.click();

      return {
        success: true,
        selector: targetButton.className || targetButton.tagName,
        extracted: extracted || undefined,
      };
    }

    return { success: false, reason: 'Target button not found or inactive' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
})();
`;

export class AutoClickTask {
  private active = false;
  private isExecuting = false;
  private timer: number | null = null;
  private clickCount = 0;

  constructor(
    public readonly accountId: string,
    public readonly accountName: string,
    private readonly getWebview: () => Electron.WebviewTag | null,
    private intervalMs: number = AUTO_CLICK_CONFIG.DEFAULT_INTERVAL_MS,
    private onTick?: (count: number, lastResult: AutoClickResult) => void,
  ) {}

  public setInterval(intervalMs: number): void {
    this.intervalMs = Math.max(
      AUTO_CLICK_CONFIG.MIN_INTERVAL_MS,
      Math.min(AUTO_CLICK_CONFIG.MAX_INTERVAL_MS, intervalMs),
    );
  }

  public isActive(): boolean {
    return this.active;
  }

  public getClickCount(): number {
    return this.clickCount;
  }

  public start(): void {
    if (this.active) return;
    this.active = true;
    HuntStore.getInstance().setAccountStatus(this.accountId, 'hunting');
    this.scheduleNext(100);
  }

  public stop(): void {
    this.active = false;
    this.isExecuting = false;
    HuntStore.getInstance().setAccountStatus(this.accountId, 'idle');
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(delay: number = this.intervalMs): void {
    if (!this.active) return;
    this.timer = window.setTimeout(async () => {
      await this.executeTick();
      if (this.active) {
        this.scheduleNext(this.intervalMs);
      }
    }, delay);
  }

  private async executeTick(): Promise<void> {
    if (!this.active || this.isExecuting) return;
    const webview = this.getWebview();
    if (!webview || webview.isLoading()) {
      return;
    }

    this.isExecuting = true;
    try {
      // Injeta via executeJavaScript no contexto isolado do Webview
      const result = (await webview.executeJavaScript(INJECTION_SCRIPT, true)) as AutoClickResult;

      if (result && result.success) {
        this.clickCount++;
      }
      this.onTick?.(this.clickCount, result);
    } catch (err) {
      this.onTick?.(this.clickCount, { success: false, error: String(err) });
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Mantido para compatibilidade de tipagem, mas não insere capturas sintéticas.
   * Todas as capturas autênticas vêm exclusivamente da confirmação oficial do jogo.
   */
  public processCaptureEvent(_extracted?: ExtractedCaptureData): void {
    // Vazio propositalmente: nenhuma captura é registrada por mero clique em botão!
  }
}
