import { AUTO_CLICK_CONFIG } from '../../shared/constants.js';
import type {
  IVStats,
  PokeballType,
  PokemonQuality,
} from '../../shared/captureTypes.js';
import type { PokemonCaptureTelemetry } from '../../shared/telemetryTypes.js';
import { HuntStore } from '../services/huntStore.js';
import { HuntClientService } from '../services/huntClientService.js';

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
    function getAllGameDocuments() {
      var docs = [document];
      try {
        var frames = document.querySelectorAll('iframe');
        for (var i = 0; i < frames.length; i++) {
          try {
            var fDoc = frames[i].contentDocument || (frames[i].contentWindow && frames[i].contentWindow.document);
            if (fDoc) docs.push(fDoc);
          } catch (_) {}
        }
      } catch (_) {}
      return docs;
    }

    var docs = getAllGameDocuments();
    var targetButton = null;

    // 1. Procura primeiro e com máxima prioridade pelo botão "Lançar" dentro do painel CAPTURA ativo
    for (var d = 0; d < docs.length; d++) {
      var doc = docs[d];
      if (!doc || !doc.body) continue;

      var candidateBoxes = doc.querySelectorAll('[class*="capture"], [class*="captur"], [class*="panel"], [class*="box"]');
      for (var bIdx = 0; bIdx < candidateBoxes.length; bIdx++) {
        var box = candidateBoxes[bIdx];
        var bTxt = (box.textContent || '').toLowerCase();
        // O painel de captura oficial sempre contém 'captura' e elementos de caça/lançamento
        if (bTxt.indexOf('captura') !== -1 && (bTxt.indexOf('selvagem') !== -1 || bTxt.indexOf('lançar') !== -1 || bTxt.indexOf('lancar') !== -1 || bTxt.indexOf('lv') !== -1)) {
          var boxButtons = Array.from(box.querySelectorAll('button, div[role="button"], [class*="btn"]'));
          var btnInBox = boxButtons.find(function(b) {
            if (b.disabled || b.offsetParent === null) return false;
            // CRÍTICO: NUNCA clica em links <a> para evitar navegação e recarregamento da página
            if (b.tagName === 'A' || b.hasAttribute('href')) return false;
            var t = (b.textContent || '').trim().toLowerCase();
            return t === 'lançar' || t === 'lancar' || t === 'catch';
          });
          if (btnInBox) {
            targetButton = btnInBox;
            break;
          }
        }
      }
      if (targetButton) break;
    }

    // 2. Fallback de alta precisão: busca por botões com texto estrito "Lançar" ou "Catch" fora do container
    if (!targetButton) {
      for (var d2 = 0; d2 < docs.length; d2++) {
        var doc2 = docs[d2];
        if (!doc2 || !doc2.body) continue;

        var allButtons = Array.from(doc2.querySelectorAll('button, div[role="button"], [class*="catch-btn"], [class*="btn-lancar"]'));
        var foundBtn = allButtons.find(function(b) {
          if (b.disabled || b.offsetParent === null) return false;
          if (b.tagName === 'A' || b.hasAttribute('href')) return false;

          var text = (b.textContent || '').trim().toLowerCase();
          // Comparação ESTRITA para não pegar links do menu, botões de loja ('pokébola') ou abas ('capturar')
          return text === 'lançar' || text === 'lancar' || text === 'catch';
        });

        if (foundBtn) {
          targetButton = foundBtn;
          break;
        }
      }
    }

    // Se NÃO houver botão "Lançar" ativo (ex: entre spawns de Pokémon), NÃO clica em nada!
    if (!targetButton) {
      return { success: false, reason: 'Nenhum Pokémon selvagem para captura ou botão Lançar indisponível' };
    }

    // 3. Inspeção e extração estrita de dados REAIS do Pokémon no DOM do jogo
    var extracted = null;
    try {
      var scopeDoc = targetButton.ownerDocument || document;
      var nameEl = scopeDoc.querySelector('.enemy-name, .pokemon-name, .wild-pokemon-name, #enemy-name, .target-name, .pokemon-info .name, .pokemon-card strong');
      var levelEl = scopeDoc.querySelector('.enemy-level, .pokemon-level, .level-badge, .wild-level, .pokemon-info .level');
      var shinyEl = scopeDoc.querySelector('.shiny-star, .is-shiny, .badge-shiny, .shiny-icon, [data-shiny="true"]');
      var ballEl = scopeDoc.querySelector('.active-pokeball, .selected-ball, .ball-slot.active, [data-selected-ball]');
      var ivEl = scopeDoc.querySelector('.pokemon-iv, .iv-percentage, .iv-val, [data-iv]');

      var rawName = nameEl ? (nameEl.textContent || '').trim() : '';
      var level = 1;

      // Fallback: busca diretamente no painel de captura adjacente ao botão Lançar
      if (!rawName && targetButton) {
        var captureBox = targetButton.closest('div, section, [class*="captur"]') || targetButton.parentElement;
        if (captureBox) {
          var cText = captureBox.textContent || '';
          var match = cText.match(/([A-Za-z0-9À-ÿ\\s\\-]+?)(?:\\s+Lv\\.?\\s*(\\d+))/i);
          if (match) {
            var clean = match[1].replace(/CAPTURA|selvagem|Loja|Lançar|lancar/gi, '').trim();
            if (clean.length >= 2 && clean.length <= 25) {
              rawName = clean;
              if (match[2]) level = parseInt(match[2], 10) || 1;
            }
          }
        }
      }

      if (rawName.length > 0) {
        var cleanName = rawName.replace(/^Lv\\.?\\s*\\d+\\s*/i, '').replace(/^Nv\\.?\\s*\\d+\\s*/i, '').replace(/^\\[\\d+\\]\\s*/i, '').replace(/\\s*\\(Shiny\\)/i, '').trim();

        if (levelEl) {
          var num = parseInt((levelEl.textContent || '').replace(/\\D/g, ''), 10);
          if (!isNaN(num) && num > 0) level = num;
        }

        var isShiny = Boolean(shinyEl || rawName.toLowerCase().indexOf('shiny') !== -1 || rawName.indexOf('✨') !== -1);

        var pokeball = 'pokeball';
        if (ballEl) {
          var ballClass = ((ballEl.className || '') + ' ' + (ballEl.getAttribute('data-ball') || '') + ' ' + (ballEl.textContent || '')).toLowerCase();
          if (ballClass.indexOf('master') !== -1) pokeball = 'masterball';
          else if (ballClass.indexOf('ultra') !== -1) pokeball = 'ultraball';
          else if (ballClass.indexOf('great') !== -1) pokeball = 'greatball';
        }

        var ivPercentage = undefined;
        if (ivEl) {
          var ivMatches = (ivEl.textContent || '').match(/(\\d+(\\.\\d+)?)/);
          if (ivMatches && ivMatches[1]) {
            ivPercentage = parseFloat(ivMatches[1]);
          }
        }

        var quality = 'comum';
        var cardContainer = nameEl ? (nameEl.closest('.pokemon-card, .enemy-box, .enemy-card, .battle-container') || nameEl.parentElement) : null;
        if (cardContainer) {
          var containerClasses = ((cardContainer.className || '') + ' ' + (cardContainer.getAttribute('data-quality') || '') + ' ' + (cardContainer.getAttribute('data-rarity') || '')).toLowerCase();
          if (containerClasses.indexOf('divina') !== -1 || containerClasses.indexOf('divine') !== -1) {
            quality = 'divina';
          } else if (containerClasses.indexOf('ancia') !== -1 || containerClasses.indexOf('anciã') !== -1 || containerClasses.indexOf('ancient') !== -1) {
            quality = 'ancia';
          } else if (containerClasses.indexOf('mitica') !== -1 || containerClasses.indexOf('mítica') !== -1 || containerClasses.indexOf('mythic') !== -1) {
            quality = 'mitica';
          } else if (containerClasses.indexOf('lendaria') !== -1 || containerClasses.indexOf('lendária') !== -1 || containerClasses.indexOf('legendary') !== -1) {
            quality = 'lendaria';
          } else if (containerClasses.indexOf('epica') !== -1 || containerClasses.indexOf('épica') !== -1 || containerClasses.indexOf('epic') !== -1) {
            quality = 'epica';
          } else if (containerClasses.indexOf('rara') !== -1 || containerClasses.indexOf('rare') !== -1) {
            quality = 'rara';
          } else if (containerClasses.indexOf('incomum') !== -1 || containerClasses.indexOf('uncommon') !== -1) {
            quality = 'incomum';
          } else if (containerClasses.indexOf('fraca') !== -1 || containerClasses.indexOf('weak') !== -1 || containerClasses.indexOf('poor') !== -1) {
            quality = 'fraca';
          } else if (containerClasses.indexOf('comum') !== -1 || containerClasses.indexOf('common') !== -1) {
            quality = 'comum';
          }
        }

        extracted = {
          pokemonName: cleanName,
          level: level,
          isShiny: isShiny,
          pokeball: pokeball,
          quality: quality,
          ivPercentage: ivPercentage,
        };
      }
    } catch (_) {}

    // 4. Executa o clique seguro no botão de lançamento
    if (targetButton) {
      if (targetButton.type === 'submit') {
        targetButton.type = 'button';
      }

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
    try {
      HuntClientService.getInstance().setAccountStatus(this.accountId, 'farming');
    } catch (_) {}
    this.scheduleNext(100);
  }

  public stop(): void {
    this.active = false;
    this.isExecuting = false;
    HuntStore.getInstance().setAccountStatus(this.accountId, 'idle');
    try {
      HuntClientService.getInstance().setAccountStatus(this.accountId, 'idle');
    } catch (_) {}
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
