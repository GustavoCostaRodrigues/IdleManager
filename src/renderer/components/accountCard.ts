import type { AccountConfig } from '../../shared/types.js';
import type { IVStats, PokeballType, PokemonQuality } from '../../shared/captureTypes.js';
import type {
  BallInventoryType,
  PotionInventoryType,
  TelemetryPayload,
} from '../../shared/telemetryTypes.js';
import { AutoClickTask, type AutoClickResult } from './autoClicker.js';
import { getItemSpriteHtml, getItemSpriteUrl } from './supplyIcons.js';
import { GAME_BRIDGE_INJECTION_SCRIPT } from '../services/gameBridgeScript.js';
import { CaptureStore } from '../services/captureStore.js';
import { HuntStore } from '../services/huntStore.js';

/**
 * Script de Injeção e Varredura Ativa do DOM executado no WebView via executeJavaScript.
 * 1. Guarda de Login: detecta se a conta está na tela inicial/login. Se deslogada, retorna loggedIn: false.
 * 2. Quando logada: localiza o painel "CAPTURA" e extrai:
 *    - A URL real da tag <img> da Pokébola ativa diretamente do DOM do Poke Idle World.
 *    - O número REAL de Pokébolas ativas (ex: 128 ou qualquer valor exibido no jogo).
 *    - A URL real da tag <img> da poção no inventário/grid e sua quantidade numérica real.
 * 3. Zero dados fictícios: sem nenhum valor hardcoded.
 */
export const ACTIVE_SUPPLY_SCAN_SCRIPT = `
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

    function getCleanFileName(url) {
      if (!url) return '';
      try {
        var clean = String(url).split('?')[0].split('#')[0];
        var parts = clean.split('/');
        return (parts[parts.length - 1] || '').toLowerCase();
      } catch (_) {
        return '';
      }
    }

    function normalizePokeball(fileNameOrUrl, contextText) {
      var fileName = getCleanFileName(fileNameOrUrl);
      var ctx = (contextText || '').toLowerCase();

      // 1. Checagem direta pelo nome do arquivo da imagem (prioridade máxima e 100% infalível)
      if (fileName) {
        if (fileName.indexOf('rubber') !== -1) return { type: 'rubber_ball', name: 'Rubber Ball', fileName: 'rubber_ball.png' };
        if (fileName.indexOf('earth') !== -1) return { type: 'earth_ball', name: 'Earth Ball', fileName: 'earth_ball.png' };
        if (fileName.indexOf('gold') !== -1) return { type: 'golden_idleball', name: 'Golden Idle Ball', fileName: 'idleball_gold.png' };
        if (fileName.indexOf('idleball') !== -1 || fileName.indexOf('idle_ball') !== -1) return { type: 'idleball', name: 'Idle Ball', fileName: 'idleball.png' };
        if (fileName.indexOf('ultra') !== -1) return { type: 'ultraball', name: 'Ultra Ball', fileName: 'ultraball.png' };
        if (fileName.indexOf('master') !== -1) return { type: 'masterball', name: 'Master Ball', fileName: 'ultraball.png' };
        if (fileName.indexOf('super') !== -1) return { type: 'superball', name: 'Super Ball', fileName: 'superball.png' };
        if (fileName.indexOf('great') !== -1) return { type: 'greatball', name: 'Great Ball', fileName: 'greatball.png' };
        if (fileName.indexOf('poke') !== -1) return { type: 'pokeball', name: 'Poké Ball', fileName: 'pokeball.png' };
      }

      // 2. Checagem pelo contexto textual (sem falsos positivos com o domínio poke.idleworld.online)
      if (ctx.indexOf('rubber') !== -1) return { type: 'rubber_ball', name: 'Rubber Ball', fileName: 'rubber_ball.png' };
      if (ctx.indexOf('earth') !== -1) return { type: 'earth_ball', name: 'Earth Ball', fileName: 'earth_ball.png' };
      if (ctx.indexOf('golden idle') !== -1 || ctx.indexOf('gold idle') !== -1 || ctx.indexOf('idleball_gold') !== -1) return { type: 'golden_idleball', name: 'Golden Idle Ball', fileName: 'idleball_gold.png' };
      if (ctx.indexOf('idle ball') !== -1 || ctx.indexOf('idleball') !== -1 || ctx.indexOf('idle_ball') !== -1) return { type: 'idleball', name: 'Idle Ball', fileName: 'idleball.png' };
      if (ctx.indexOf('ultra ball') !== -1 || ctx.indexOf('ultraball') !== -1 || ctx.indexOf('ultra-ball') !== -1 || ctx.indexOf('ultra') !== -1) return { type: 'ultraball', name: 'Ultra Ball', fileName: 'ultraball.png' };
      if (ctx.indexOf('master') !== -1) return { type: 'masterball', name: 'Master Ball', fileName: 'ultraball.png' };
      if (ctx.indexOf('super ball') !== -1 || ctx.indexOf('superball') !== -1 || ctx.indexOf('super') !== -1) return { type: 'superball', name: 'Super Ball', fileName: 'superball.png' };
      if (ctx.indexOf('great ball') !== -1 || ctx.indexOf('greatball') !== -1 || ctx.indexOf('great') !== -1) return { type: 'greatball', name: 'Great Ball', fileName: 'greatball.png' };
      if (ctx.indexOf('poke ball') !== -1 || ctx.indexOf('pokeball') !== -1 || ctx.indexOf('poké ball') !== -1) return { type: 'pokeball', name: 'Poké Ball', fileName: 'pokeball.png' };

      return { type: 'ultraball', name: 'Ultra Ball', fileName: 'ultraball.png' };
    }

    function normalizePotion(fileNameOrUrl, contextText) {
      var fileName = getCleanFileName(fileNameOrUrl);
      var ctx = (contextText || '').toLowerCase();

      // 1. Checagem direta pelo nome do arquivo da imagem
      if (fileName) {
        if (fileName.indexOf('small') !== -1) return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
        if (fileName.indexOf('ultimate') !== -1) return { type: 'ultimate', name: 'Ultimate Potion', fileName: 'ultimate_potion.png' };
        if (fileName.indexOf('hyper') !== -1) return { type: 'hyper', name: 'Hyper Potion', fileName: 'hyper_potion.png' };
        if (fileName.indexOf('ultra') !== -1) return { type: 'ultra', name: 'Ultra Potion', fileName: 'ultra_potion.png' };
        if (fileName.indexOf('great') !== -1 || fileName.indexOf('super') !== -1) return { type: 'great', name: 'Great Potion', fileName: 'great_potion.png' };
        if (fileName.indexOf('potion') !== -1 || fileName.indexOf('pocao') !== -1) return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
      }

      // 2. Checagem contextual explícita (checa Small Potion primeiro)
      if (ctx.indexOf('small') !== -1 || ctx.indexOf('pequena') !== -1 || ctx.indexOf('small potion') !== -1) {
        return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
      }
      if (ctx.indexOf('ultimate') !== -1 || ctx.indexOf('suprema') !== -1 || ctx.indexOf('definitiva') !== -1) {
        return { type: 'ultimate', name: 'Ultimate Potion', fileName: 'ultimate_potion.png' };
      }
      if (ctx.indexOf('hyper') !== -1 || ctx.indexOf('hiper') !== -1) {
        return { type: 'hyper', name: 'Hyper Potion', fileName: 'hyper_potion.png' };
      }
      // 'ultra' só aceito para poção se contiver especificamente 'ultra potion' / 'ultra poção'
      if (ctx.indexOf('ultra potion') !== -1 || ctx.indexOf('ultra poção') !== -1 || ctx.indexOf('ultra_potion') !== -1 || ctx.indexOf('ultra-potion') !== -1) {
        return { type: 'ultra', name: 'Ultra Potion', fileName: 'ultra_potion.png' };
      }
      if (ctx.indexOf('great') !== -1 || ctx.indexOf('super') !== -1) {
        return { type: 'great', name: 'Great Potion', fileName: 'great_potion.png' };
      }

      return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
    }

    function parseNumeric(valStr) {
      if (valStr === undefined || valStr === null) return 0;
      var clean = String(valStr).replace(/[^0-9]/g, '');
      var parsed = parseInt(clean, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    function isElementVisible(el) {
      if (!el) return false;
      try {
        if (el.offsetWidth > 0 || el.offsetHeight > 0) return true;
        if (el.getClientRects && el.getClientRects().length > 0) return true;
        return false;
      } catch (_) {
        return false;
      }
    }

    function extractImageUrl(el) {
      if (!el) return null;
      var img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img && img.src && (img.src.indexOf('http') === 0 || img.src.indexOf('data:') === 0 || img.src.indexOf('blob:') === 0)) {
        return img.src;
      }
      var bgEl = (el.style && el.style.backgroundImage) ? el : el.querySelector('[style*="background-image"]');
      if (bgEl && bgEl.style && bgEl.style.backgroundImage) {
        var m = bgEl.style.backgroundImage.match(/url\\(["']?([^"']+)["']?\\)/);
        if (m && m[1]) return m[1];
      }
      return null;
    }

    // -------------------------------------------------------------
    // GUARDA DE LOGIN: VERIFICA SE ESTÁ NA TELA INICIAL OU DENTRO DO JOGO
    // -------------------------------------------------------------
    var isLandingOrLoginPage = false;
    var hasInGameSignal = false;

    for (var d = 0; d < docs.length; d++) {
      var docEl = docs[d];
      if (!docEl || !docEl.body) continue;

      var allButtons = Array.from(docEl.querySelectorAll('button, a, div[role="button"], span, div'));
      var inGameBtn = allButtons.some(function(b) {
        var t = (b.textContent || '').trim().toLowerCase();
        return t === 'lançar' || t === 'lancar' || t === '1 selvagem' || t.indexOf('captura') !== -1;
      });
      if (inGameBtn) {
        hasInGameSignal = true;
        break;
      }
    }

    if (!hasInGameSignal) {
      for (var d2 = 0; d2 < docs.length; d2++) {
        var dEl = docs[d2];
        if (!dEl || !dEl.body) continue;

        var pwd = dEl.querySelector('input[type="password"]');
        if (pwd && (pwd.offsetWidth > 0 || pwd.offsetHeight > 0)) {
          isLandingOrLoginPage = true;
          break;
        }

        var buttonsList = Array.from(dEl.querySelectorAll('button, a, div[role="button"], [class*="btn"], [class*="button"]'));
        var hasLoginCta = buttonsList.some(function(b) {
          if (b.offsetWidth <= 0 && b.offsetHeight <= 0) return false;
          var t = (b.textContent || '').trim().toLowerCase();
          return t === 'jogar agora' || t === 'criar conta' || t === '> entrar' || t === 'entrar no jogo';
        });
        if (hasLoginCta) {
          isLandingOrLoginPage = true;
          break;
        }
      }
    }

    // -------------------------------------------------------------
    // BUSCA DO PAINEL "CAPTURA" (CANTO INFERIOR DIREITO)
    // -------------------------------------------------------------
    var captureContainer = null;
    var launchBtn = null;

    if (!isLandingOrLoginPage) {
      for (var dIdx = 0; dIdx < docs.length; dIdx++) {
        var dScope = docs[dIdx];
        if (!dScope) continue;
        var buttons = Array.from(dScope.querySelectorAll('button, a, div[role="button"], span, div'));
        launchBtn = buttons.find(function(b) {
          var t = (b.textContent || '').trim().toLowerCase();
          return t === 'lançar' || t === 'lancar' || t === 'catch';
        });

        if (launchBtn) {
          var p = launchBtn.parentElement;
          while (p && p !== dScope.body) {
            var pTxt = p.textContent || '';
            if (pTxt.indexOf('CAPTURA') !== -1 || pTxt.indexOf('Captura') !== -1 || (p.className && /capture|box|panel/i.test(p.className))) {
              captureContainer = p;
              break;
            }
            p = p.parentElement;
          }
          if (!captureContainer) {
            captureContainer = launchBtn.closest('div') || launchBtn.parentElement;
          }
        }

        if (!captureContainer) {
          captureContainer = buttons.find(function(el) {
            var t = (el.textContent || '').trim();
            return (t.indexOf('CAPTURA') !== -1 || t.indexOf('Captura') !== -1) &&
                   (t.indexOf('selvagem') !== -1 || t.indexOf('Loja') !== -1 || t.indexOf('Lançar') !== -1 || t.indexOf('lancar') !== -1) &&
                   el.children.length >= 2;
          });
        }

        if (captureContainer) break;
      }
    }

    var isCaptureVisible = false;
    if (captureContainer) {
      if (captureContainer.offsetWidth > 0 || captureContainer.offsetHeight > 0) {
        isCaptureVisible = true;
      } else if (captureContainer.getClientRects && captureContainer.getClientRects().length > 0) {
        isCaptureVisible = true;
      }
    }

    if (isLandingOrLoginPage || !captureContainer || !isCaptureVisible) {
      return {
        success: true,
        loggedIn: false,
        ball: null,
        potion: null,
        target: null
      };
    }

    // -------------------------------------------------------------
    // EXTRAÇÃO DA POKÉBOLA ATIVA (IMAGEM REAL DO DOM + QUANTIDADE REAL)
    // -------------------------------------------------------------
    var ballSpriteUrl = null;
    var ballCountVal = null;
    var ballContextStr = '';

    // Extração da contagem numérica real
    var specificEl = captureContainer.querySelector('.capture-box .counter, .pokeball-count, .ball-count, .counter, .badge-count, .ball-quantity, [class*="pokeball"] [class*="count"], [class*="ball"] [class*="count"]');
    if (specificEl && /^[0-9.,]+$/.test((specificEl.textContent || '').trim())) {
      ballCountVal = parseNumeric(specificEl.textContent);
      var pEl = specificEl.parentElement;
      ballContextStr = ((captureContainer.className || '') + ' ' + (pEl ? pEl.className + ' ' + pEl.innerHTML : '')).toLowerCase();
      if (pEl) {
        var pillImg = pEl.querySelector('img[src*="ball"], img[src*="ultra"], img[src*="poke"], img[src*="great"], img[src*="super"], img[src*="idle"], img');
        if (pillImg) ballSpriteUrl = extractImageUrl(pillImg);
      }
    }

    if (ballCountVal === null) {
      var candidates = Array.from(captureContainer.querySelectorAll('*')).filter(function(el) {
        if (el === launchBtn || el.contains(launchBtn)) return false;
        var text = (el.textContent || '').trim();
        if (!/^[0-9.,]+$/.test(text)) return false;
        var parentTxt = (el.parentElement ? el.parentElement.textContent || '' : '').trim();
        if (parentTxt.indexOf('selvagem') !== -1) return false;
        if (/lv\\.?|level/i.test(parentTxt)) return false;
        return true;
      });

      candidates.sort(function(a, b) { return a.children.length - b.children.length; });

      if (candidates.length > 0) {
        var elCount = candidates[0];
        ballCountVal = parseNumeric(elCount.textContent);
        var parentBall = elCount.closest('button, [class*="ball"], div') || elCount.parentElement;
        ballContextStr = (
          (parentBall ? (parentBall.className || '') + ' ' + (parentBall.getAttribute('title') || '') + ' ' + (parentBall.getAttribute('data-ball') || '') + ' ' + (parentBall.innerHTML || '') : '')
        ).toLowerCase();
        if (parentBall) {
          var nearImg = parentBall.querySelector('img[src*="ball"], img[src*="ultra"], img[src*="poke"], img[src*="great"], img[src*="super"], img[src*="idle"], img');
          if (nearImg) ballSpriteUrl = extractImageUrl(nearImg);
        }
      }
    }

    if (!ballSpriteUrl) {
      var ballImgCandidate = captureContainer.querySelector('img[src*="ball"], img[src*="ultra"], img[src*="great"], img[src*="poke"], img[src*="super"], img[src*="idle"], button img');
      if (ballImgCandidate) {
        ballSpriteUrl = extractImageUrl(ballImgCandidate);
      }
    }

    if (ballCountVal === null) {
      return {
        success: true,
        loggedIn: hasInGameSignal,
        ball: null,
        potion: null,
        target: null
      };
    }

    var ballMeta = normalizePokeball(ballSpriteUrl, ballContextStr);
    var detectedBall = {
      name: ballMeta.name,
      type: ballMeta.type,
      count: ballCountVal,
      countFormatted: ballCountVal.toLocaleString('pt-BR'),
      spriteUrl: ballSpriteUrl,
      fileName: ballMeta.fileName
    };

    var detectedTarget = null;
    var cText = captureContainer.textContent || '';
    var tMatch = cText.match(/([A-Za-z0-9À-ÿ\\s\\-]+?)(?:\\s+Lv\\.?\\s*(\\d+))/i);
    if (tMatch) {
      var cName = tMatch[1].replace(/CAPTURA|selvagem|Loja/gi, '').trim();
      if (cName.length >= 2 && cName.length <= 25) {
        detectedTarget = {
          name: cName,
          level: parseInt(tMatch[2], 10) || 1
        };
      }
    }

    // -------------------------------------------------------------
    // EXTRAÇÃO DE POÇÕES (IMAGEM REAL DO DOM + QUANTIDADE REAL)
    // -------------------------------------------------------------
    var detectedPotion = null;

    for (var pIdx = 0; pIdx < docs.length; pIdx++) {
      var pDoc = docs[pIdx];
      if (detectedPotion) break;

      var itemSlots = Array.from(pDoc.querySelectorAll('[class*="item-slot"], [class*="inventory-slot"], [class*="inventory-item"], [class*="item-card"], [class*="grid"] > div, div[title*="Potion"], div[title*="Poção"]')).filter(function(el) {
        return el.children.length <= 4;
      });

      for (var s = 0; s < itemSlots.length; s++) {
        var slot = itemSlots[s];
        var slotVisible = isElementVisible(slot);
        var sTxt = (slot.textContent || '').trim();
        var sTitle = (slot.getAttribute('title') || '') + ' ' + (slot.getAttribute('aria-label') || '');
        var sInner = slot.innerHTML || '';
        var combinedSlot = (sTxt + ' ' + sTitle + ' ' + sInner).toLowerCase();

        if (combinedSlot.indexOf('potion') !== -1 || combinedSlot.indexOf('poção') !== -1 || combinedSlot.indexOf('pocao') !== -1) {
          var m = sTxt.match(/(?:[×x*]\s*)?([0-9.,]+)/) || combinedSlot.match(/(?:[×x*]\s*)?([0-9.,]+)/);
          var potCount = m ? parseNumeric(m[1]) : 1;
          var potSprite = extractImageUrl(slot);
          var potMeta = normalizePotion(potSprite, sTitle + ' ' + sTxt);

          detectedPotion = {
            name: potMeta.name,
            type: potMeta.type,
            count: potCount,
            countFormatted: potCount.toLocaleString('pt-BR'),
            spriteUrl: potSprite,
            fileName: potMeta.fileName,
            fromLiveInventory: slotVisible
          };
          break;
        }
      }

      if (!detectedPotion) {
        var quickBtn = pDoc.querySelector('[class*="potion-button"], [class*="quick-potion"], [class*="auto-heal"], button[title*="Potion"], button[title*="Poção"]');
        if (quickBtn) {
          var qVisible = isElementVisible(quickBtn);
          var qCount = parseNumeric(quickBtn.textContent || '');
          var qSprite = extractImageUrl(quickBtn);
          var qMeta = normalizePotion(qSprite, (quickBtn.getAttribute('title') || '') + ' ' + (quickBtn.className || ''));
          detectedPotion = {
            name: qMeta.name,
            type: qMeta.type,
            count: qCount,
            countFormatted: qCount.toLocaleString('pt-BR'),
            spriteUrl: qSprite,
            fileName: qMeta.fileName,
            fromLiveInventory: qVisible && qCount > 0
          };
        }
      }
    }

    if (!detectedPotion) {
      detectedPotion = {
        name: 'Small Potion',
        type: 'small',
        count: 0,
        countFormatted: '0',
        spriteUrl: null,
        fileName: 'small_potion.png',
        fromLiveInventory: false
      };
    }

    return {
      success: true,
      loggedIn: true,
      ball: detectedBall,
      potion: detectedPotion,
      target: detectedTarget
    };
  } catch (err) {
    return {
      success: false,
      loggedIn: false,
      ball: null,
      potion: null,
      error: String(err)
    };
  }
})();
`;

export class AccountCardComponent {
  public readonly element: HTMLElement;
  public readonly webview: Electron.WebviewTag;
  private readonly autoClickTask: AutoClickTask;

  private statusDot: HTMLElement;
  private autoClickBtn: HTMLButtonElement;
  private clickCountSpan: HTMLElement;
  private loadingOverlay: HTMLElement;
  private maximizeBtn: HTMLButtonElement;

  // Badges centrais de Pokébola e Poção ativas
  private ballIconBox: HTMLElement;
  private ballCountSpan: HTMLElement;
  private potionIconBox: HTMLElement;
  private potionCountSpan: HTMLElement;
  private ballPill: HTMLElement;
  private potionPill: HTMLElement;
  private currentBallType: BallInventoryType = 'ultraball';
  private currentPotionType: PotionInventoryType = 'small';

  // Cache e retenção anti-flicker para estabilidade de exibição em tempo real
  private consecutiveUnloggedCount = 0;
  private lastKnownBallData: { name: string; type: BallInventoryType; count: number; countFormatted: string; spriteUrl?: string; fileName?: string } | null = null;
  private lastKnownPotionData: { name: string; type: PotionInventoryType; count: number; countFormatted: string; spriteUrl?: string; fileName?: string; fromLiveInventory?: boolean } | null = null;

  // Dedução e calibração inteligente de poções em tempo real
  private baseInventoryPotionCount: number | null = null;
  private huntPotionsAtInventoryScan = 0;
  private localPotionsConsumedSinceScan = 0;
  private lastKnownHuntPotionsCount = 0;

  private isMaximized = false;
  private bridgeKeepAliveTimer: number | null = null;
  private supplyPollTimer: number | null = null;

  constructor(
    public readonly config: AccountConfig,
    private readonly onFocusRequested?: (card: AccountCardComponent) => void,
    private readonly onToggleMaximize?: (card: AccountCardComponent, isMaximized: boolean) => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'account-card';
    this.element.id = `card-${config.id}`;
    this.element.setAttribute('data-account-id', config.id);

    // Monta a estrutura interna com o espaço central de badges usando sprites de itens reais
    this.element.innerHTML = `
      <header class="card-header">
        <div class="card-header-left">
          <span class="status-dot idle" title="Carregando..."></span>
          <span class="account-name">${config.name}</span>
          <span class="card-badge-switch" title="Clique para focar na tela principal">FOCAR</span>
        </div>
        <div class="card-header-center">
          <div class="supply-pills-wrapper">
            <div class="supply-pill pill-ball" title="Pokébola ativa em uso">
              <span class="supply-icon-box ball-icon-box">${getItemSpriteHtml('ultraball', null, 'Ultra Ball')}</span>
              <span class="supply-value ball-count-val">--</span>
            </div>
            <div class="supply-pill pill-potion" title="Poção de cura ativa em uso">
              <span class="supply-icon-box potion-icon-box">${getItemSpriteHtml('small', null, 'Small Potion')}</span>
              <span class="supply-value potion-count-val">--</span>
            </div>
          </div>
        </div>
        <div class="card-header-right">
          <button class="btn-autoclick" title="Ativar/Desativar Auto-Click individual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Auto</span>
            <span class="click-counter">0</span>
          </button>
          <button class="card-action-btn btn-reload" title="Recarregar instância">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
          <button class="card-action-btn btn-maximize-card" title="Maximizar quadrante">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>
      </header>
      <div class="webview-container">
        <div class="webview-loading-overlay">
          <div class="loading-spinner"></div>
          <span>Iniciando sessão isolada (${config.id})...</span>
        </div>
      </div>
    `;

    // Seletores de elementos internos
    this.statusDot = this.element.querySelector('.status-dot') as HTMLElement;
    this.autoClickBtn = this.element.querySelector('.btn-autoclick') as HTMLButtonElement;
    this.clickCountSpan = this.element.querySelector('.click-counter') as HTMLElement;
    this.loadingOverlay = this.element.querySelector('.webview-loading-overlay') as HTMLElement;
    this.maximizeBtn = this.element.querySelector('.btn-maximize-card') as HTMLButtonElement;
    const reloadBtn = this.element.querySelector('.btn-reload') as HTMLButtonElement;

    // Elementos dos Badges centrais de Pokébola e Poção
    this.ballIconBox = this.element.querySelector('.ball-icon-box') as HTMLElement;
    this.ballCountSpan = this.element.querySelector('.ball-count-val') as HTMLElement;
    this.potionIconBox = this.element.querySelector('.potion-icon-box') as HTMLElement;
    this.potionCountSpan = this.element.querySelector('.potion-count-val') as HTMLElement;
    this.ballPill = this.element.querySelector('.pill-ball') as HTMLElement;
    this.potionPill = this.element.querySelector('.pill-potion') as HTMLElement;

    // Criação do elemento <webview> com partição persistente nativa do Electron e isolamento de processo
    const container = this.element.querySelector('.webview-container') as HTMLElement;
    this.webview = document.createElement('webview') as Electron.WebviewTag;
    this.webview.className = 'account-webview';
    this.webview.setAttribute('partition', config.partition);
    this.webview.setAttribute('src', config.url);
    this.webview.setAttribute('webpreferences', 'backgroundThrottling=no, contextIsolation=yes');
    this.webview.setAttribute('allowpopups', 'false');
    container.appendChild(this.webview);

    // Inicializa a tarefa de auto-click
    this.autoClickTask = new AutoClickTask(
      config.id,
      config.name,
      () => this.webview,
      1500,
      (count, result) => this.handleAutoClickTick(count, result),
    );

    // Configura eventos do Webview e ponte de telemetria
    this.setupWebviewEvents();
    this.startBridgeKeepAlive();
    this.startSupplyPolling();

    // Eventos de Ação do Header
    this.autoClickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleAutoClick();
    });

    reloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.reloadInstance();
    });

    this.maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize();
    });

    // Clique no card para focar quando estiver na lateral (Modo 1x3)
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      this.onFocusRequested?.(this);
    });
  }

  private setupWebviewEvents(): void {
    this.webview.addEventListener('did-start-loading', () => {
      this.loadingOverlay.classList.remove('hidden');
      this.setStatus('idle', 'Carregando jogo...');
    });

    this.webview.addEventListener('dom-ready', () => {
      this.injectGameBridge();
      this.pollActiveGameSupplies();
    });

    this.webview.addEventListener('did-stop-loading', () => {
      this.loadingOverlay.classList.add('hidden');
      this.injectGameBridge();
      this.pollActiveGameSupplies();
      if (this.autoClickTask.isActive()) {
        this.setStatus('clicking', 'Auto-click ativo');
      } else {
        this.setStatus('ready', 'Conectado');
      }
    });

    this.webview.addEventListener('did-fail-load', () => {
      this.loadingOverlay.classList.add('hidden');
      this.setStatus('error', 'Falha ao carregar');
    });

    // 1. Escuta telemetria via console-message estruturado (nativa, síncrona e confiável)
    this.webview.addEventListener('console-message', (e: any) => {
      const msg = typeof e.message === 'string' ? e.message : '';
      if (msg.startsWith('POKE_BRIDGE_TELEMETRY:')) {
        try {
          const rawJson = msg.substring('POKE_BRIDGE_TELEMETRY:'.length);
          const payload = JSON.parse(rawJson) as TelemetryPayload;
          this.handleTelemetryPayload(payload);
        } catch (err) {
          console.warn(`[AccountCard:${this.config.id}] Falha ao processar telemetria:`, err);
        }
      }
    });

    // 2. Escuta telemetria via IPC sendToHost
    this.webview.addEventListener('ipc-message', (e: any) => {
      if (e.channel === 'poke-telemetry' && e.args && e.args[0]) {
        this.handleTelemetryPayload(e.args[0] as TelemetryPayload);
      }
    });

    // Previne novos popups externos
    this.webview.addEventListener('new-window', (e: any) => {
      e.preventDefault();
      if (e.url) {
        this.webview.loadURL(e.url);
      }
    });
  }

  /**
   * Injeta o script de monitoramento ativo do DOM no contexto do Webview
   */
  public async injectGameBridge(): Promise<void> {
    try {
      if (!this.webview || !this.webview.isConnected || this.webview.isLoading()) return;
      await this.webview.executeJavaScript(GAME_BRIDGE_INJECTION_SCRIPT, true).catch(() => null);
    } catch {
      // Ignora erros momentâneos de transição
    }
  }

  /**
   * Garante que o watcher do DOM permaneça ativo mesmo após navegações em SPA do jogo
   */
  private startBridgeKeepAlive(): void {
    this.bridgeKeepAliveTimer = window.setInterval(() => {
      this.injectGameBridge();
    }, 4000);
  }

  /**
   * Executa a varredura ativa do DOM via executeJavaScript e atualiza imediatamente os badges de suprimento
   */
  public async pollActiveGameSupplies(): Promise<void> {
    try {
      if (!this.webview || !this.webview.isConnected || this.webview.isLoading()) return;
      const result = await this.webview.executeJavaScript(ACTIVE_SUPPLY_SCAN_SCRIPT, true).catch(() => null);

      if (!result || !result.loggedIn || !result.ball) {
        this.consecutiveUnloggedCount++;
        // Se temos um estado logado recente, mantemos por até 5 ciclos (6 segundos) para evitar
        // que animações de arremesso, transições ou re-renderizações momentâneas pisquem para '--'
        if (this.lastKnownBallData !== null && this.consecutiveUnloggedCount < 5) {
          return;
        }
        if (this.consecutiveUnloggedCount >= 5) {
          this.lastKnownBallData = null;
          this.lastKnownPotionData = null;
          this.resetSuppliesToUnlogged();
        }
        return;
      }

      this.consecutiveUnloggedCount = 0;
      this.lastKnownBallData = result.ball;

      // Se a varredura atual achou uma quantidade válida de poção
      if (result.potion && result.potion.count > 0) {
        if (result.potion.fromLiveInventory) {
          // Recalibra o estoque base direto do inventário aberto
          this.baseInventoryPotionCount = result.potion.count;
          this.huntPotionsAtInventoryScan = this.lastKnownHuntPotionsCount;
          this.localPotionsConsumedSinceScan = 0;
          this.lastKnownPotionData = result.potion;
        } else if (this.baseInventoryPotionCount === null) {
          this.baseInventoryPotionCount = result.potion.count;
          this.huntPotionsAtInventoryScan = this.lastKnownHuntPotionsCount;
          this.localPotionsConsumedSinceScan = 0;
          this.lastKnownPotionData = result.potion;
        }
      }

      // Usa a poção atual calibrada/deduzida ou o fallback
      const effectivePotion = this.lastKnownPotionData || result.potion;

      this.updateSupplyBadges(result.ball, effectivePotion);
    } catch {
      // Ignora erros momentâneos de transição
    }
  }

  /**
   * Reseta os badges para estado deslogado / aguardando login ('--')
   */
  public resetSuppliesToUnlogged(): void {
    this.lastKnownBallData = null;
    this.lastKnownPotionData = null;
    this.baseInventoryPotionCount = null;
    this.huntPotionsAtInventoryScan = 0;
    this.localPotionsConsumedSinceScan = 0;
    this.lastKnownHuntPotionsCount = 0;
    if (this.ballCountSpan.textContent !== '--') {
      this.ballCountSpan.textContent = '--';
    }
    if (this.potionCountSpan.textContent !== '--') {
      this.potionCountSpan.textContent = '--';
    }
    this.ballPill.title = 'Aguardando login na conta...';
    this.potionPill.title = 'Aguardando login na conta...';
  }

  /**
   * Mantém o polling contínuo para garantir que os valores nunca fiquem desatualizados
   */
  private startSupplyPolling(): void {
    if (this.supplyPollTimer !== null) return;
    this.pollActiveGameSupplies();
    this.supplyPollTimer = window.setInterval(() => {
      this.pollActiveGameSupplies();
    }, 1200);
  }

  /**
   * Atualiza com máxima fluidez e zero repaints desnecessários os badges de suprimento (Pokébola e Poção)
   * renderizando imagens reais (sprites) e valores reais do DOM
   */
  public updateSupplyBadges(
    ball: { name: string; type: BallInventoryType; count: number; countFormatted: string; spriteUrl?: string; fileName?: string },
    potion: { name: string; type: PotionInventoryType; count: number; countFormatted: string; spriteUrl?: string; fileName?: string },
  ): void {
    // 1. Atualização do Sprite Real e Contagem da Pokébola
    const ballImg = this.ballIconBox.querySelector('img');
    const targetBallUrl = getItemSpriteUrl(ball.type, ball.spriteUrl || ball.fileName);
    if (!ballImg || ballImg.getAttribute('src') !== targetBallUrl) {
      this.ballIconBox.innerHTML = getItemSpriteHtml(ball.type, ball.spriteUrl || ball.fileName, ball.name);
    }
    if (this.ballCountSpan.textContent !== ball.countFormatted) {
      this.ballCountSpan.textContent = ball.countFormatted;
    }
    this.ballPill.title = `${ball.name}: ${ball.countFormatted} em estoque`;

    // 2. Atualização do Sprite Real e Contagem da Poção
    const potImg = this.potionIconBox.querySelector('img');
    const targetPotUrl = getItemSpriteUrl(potion.type, potion.spriteUrl || potion.fileName);
    if (!potImg || potImg.getAttribute('src') !== targetPotUrl) {
      this.potionIconBox.innerHTML = getItemSpriteHtml(potion.type, potion.spriteUrl || potion.fileName, potion.name);
    }
    if (this.potionCountSpan.textContent !== potion.countFormatted) {
      this.potionCountSpan.textContent = potion.countFormatted;
    }
    this.potionPill.title = `${potion.name}: ${potion.countFormatted} em estoque`;
  }

  /**
   * Deduz poções consumidas do estoque conhecido em tempo real
   */
  public deductPotion(amount = 1): void {
    if (!this.lastKnownPotionData) return;

    this.localPotionsConsumedSinceScan += amount;

    if (this.baseInventoryPotionCount !== null) {
      const huntDelta = Math.max(0, this.lastKnownHuntPotionsCount - this.huntPotionsAtInventoryScan);
      const totalUsedSinceScan = Math.max(this.localPotionsConsumedSinceScan, huntDelta);
      const newCount = Math.max(0, this.baseInventoryPotionCount - totalUsedSinceScan);

      this.lastKnownPotionData.count = newCount;
      this.lastKnownPotionData.countFormatted = newCount.toLocaleString('pt-BR');
    } else if (this.lastKnownPotionData.count > 0) {
      this.baseInventoryPotionCount = this.lastKnownPotionData.count;
      this.lastKnownPotionData.count = Math.max(0, this.lastKnownPotionData.count - amount);
      this.lastKnownPotionData.countFormatted = this.lastKnownPotionData.count.toLocaleString('pt-BR');
    }

    if (this.lastKnownBallData) {
      this.updateSupplyBadges(this.lastKnownBallData, this.lastKnownPotionData);
    }
  }

  /**
   * Roteador de telemetria recebida do jogo para os stores reativos
   */
  public handleTelemetryPayload(payload: TelemetryPayload): void {
    if (!payload || !payload.type) return;

    switch (payload.type) {
      case 'SUPPLY_STATUS': {
        this.consecutiveUnloggedCount = 0;
        if (payload.ball) this.lastKnownBallData = payload.ball;

        if (payload.potion && payload.potion.count > 0) {
          if (payload.potion.fromLiveInventory) {
            // Recalibra o estoque base direto do inventário aberto
            this.baseInventoryPotionCount = payload.potion.count;
            this.huntPotionsAtInventoryScan = this.lastKnownHuntPotionsCount;
            this.localPotionsConsumedSinceScan = 0;
            this.lastKnownPotionData = payload.potion;
          } else if (this.baseInventoryPotionCount === null) {
            this.baseInventoryPotionCount = payload.potion.count;
            this.huntPotionsAtInventoryScan = this.lastKnownHuntPotionsCount;
            this.localPotionsConsumedSinceScan = 0;
            this.lastKnownPotionData = payload.potion;
          }
        }

        const effectivePotion = this.lastKnownPotionData || payload.potion;
        if (payload.ball && effectivePotion) {
          this.updateSupplyBadges(payload.ball, effectivePotion);
        }
        break;
      }

      case 'CAPTURE': {
        if (!payload.pokemonName || payload.pokemonName.trim().length === 0) return;

        const rawName = payload.pokemonName.trim();
        const pokemonName = rawName.replace(/.*(?:Captura|selvagem|Loja|\d)+/gi, '').trim() || rawName;
        if (pokemonName.toLowerCase().includes('captura') || pokemonName.toLowerCase().includes('selvagem')) return;
        const level = payload.level && payload.level > 0 ? payload.level : 1;
        const isShiny = Boolean(payload.isShiny);
        const pokeball: PokeballType = payload.pokeball || 'pokeball';
        const quality: PokemonQuality = payload.quality || 'comum';

        let iv: IVStats;
        if (typeof payload.ivPoints === 'number' && payload.ivPoints > 0) {
          iv = CaptureStore.calculateIVStats(payload.ivPoints, payload.ivMaxPoints || 192);
        } else if (typeof payload.ivPercentage === 'number') {
          iv = CaptureStore.createIVFromPercentage(payload.ivPercentage);
        } else {
          iv = CaptureStore.createIVFromPercentage(0);
        }

        // 1. Registra no CaptureStore (atualiza instantaneamente o feed com cores reais)
        CaptureStore.getInstance().addCapture({
          accountId: this.config.id,
          accountName: this.config.name,
          pokemonName,
          pokemonDexNumber: payload.pokemonDexNumber,
          quality,
          pokeball,
          iv,
          level,
          isShiny,
          timestamp: payload.timestamp ?? Date.now(),
        });

        // 2. Registra na Hunt da Conta e métricas globais
        HuntStore.getInstance().recordPokemonCatch(this.config.id, true, pokemonName);
        break;
      }

      case 'BATCH_CAPTURES': {
        if (!Array.isArray(payload.captures) || payload.captures.length === 0) return;
        CaptureStore.getInstance().syncCapturesBatch(
          this.config.id,
          this.config.name,
          payload.captures,
        );
        break;
      }

      case 'HUNT_SYNC': {
        HuntStore.getInstance().syncHuntSession(this.config.id, {
          catchesCount: payload.catchesCount,
          supplyCostGold: payload.supplyCostGold,
          potionsUsed: payload.supplyPotionsCount,
          lootTotalGold: payload.lootTotalGold,
          netBalanceGold: payload.netBalanceGold,
          drops: payload.drops || [],
        });

        // Dedução automática de poções baseada no contador cumulativo do Hunt Analyzer
        if (typeof payload.supplyPotionsCount === 'number') {
          const newHuntPotions = payload.supplyPotionsCount;
          this.lastKnownHuntPotionsCount = newHuntPotions;

          if (this.baseInventoryPotionCount !== null && this.lastKnownPotionData) {
            const huntDelta = Math.max(0, newHuntPotions - this.huntPotionsAtInventoryScan);
            const totalUsedSinceScan = Math.max(this.localPotionsConsumedSinceScan, huntDelta);
            const newCount = Math.max(0, this.baseInventoryPotionCount - totalUsedSinceScan);

            if (this.lastKnownPotionData.count !== newCount) {
              this.lastKnownPotionData.count = newCount;
              this.lastKnownPotionData.countFormatted = newCount.toLocaleString('pt-BR');
              if (this.lastKnownBallData) {
                this.updateSupplyBadges(this.lastKnownBallData, this.lastKnownPotionData);
              }
            }
          }
        }
        break;
      }

      case 'POTION': {
        const cost = payload.potionCost ?? 300;
        HuntStore.getInstance().recordPotionUsed(this.config.id, cost);
        this.deductPotion(1);
        break;
      }

      case 'ITEM_DROP': {
        if (!payload.itemName) return;
        const count = payload.itemCount ?? 1;
        const unitVal = payload.itemValue ?? 250;
        const rarity = payload.rarity ?? 'common';
        HuntStore.getInstance().recordItemDrop(
          this.config.id,
          payload.itemName,
          unitVal,
          count,
          rarity,
        );
        break;
      }

      case 'STATUS': {
        HuntStore.getInstance().setAccountStatus(this.config.id, payload.status);
        break;
      }
    }
  }

  public setStatus(state: 'idle' | 'ready' | 'clicking' | 'error', tooltip: string): void {
    this.statusDot.className = `status-dot ${state}`;
    this.statusDot.title = tooltip;
  }

  public toggleAutoClick(): boolean {
    if (this.autoClickTask.isActive()) {
      this.stopAutoClick();
      return false;
    } else {
      this.startAutoClick();
      return true;
    }
  }

  public startAutoClick(): void {
    this.autoClickTask.start();
    this.autoClickBtn.classList.add('active');
    this.setStatus('clicking', 'Auto-click ativo');
  }

  public stopAutoClick(): void {
    this.autoClickTask.stop();
    this.autoClickBtn.classList.remove('active');
    this.setStatus('ready', 'Conectado');
  }

  public isAutoClickActive(): boolean {
    return this.autoClickTask.isActive();
  }

  public setAutoClickInterval(intervalMs: number): void {
    this.autoClickTask.setInterval(intervalMs);
  }

  private handleAutoClickTick(count: number, result: AutoClickResult): void {
    this.clickCountSpan.textContent = String(count);
    if (result.success) {
      this.statusDot.classList.add('clicking');
    }
  }

  public reloadInstance(): void {
    this.loadingOverlay.classList.remove('hidden');
    this.webview.reload();
  }

  public toggleMaximize(): void {
    this.isMaximized = !this.isMaximized;
    this.element.classList.toggle('is-maximized', this.isMaximized);
    this.onToggleMaximize?.(this, this.isMaximized);
    this.updateMaximizeIcon();
  }

  public setMaximized(max: boolean): void {
    this.isMaximized = max;
    this.element.classList.toggle('is-maximized', max);
    this.updateMaximizeIcon();
  }

  private updateMaximizeIcon(): void {
    if (this.isMaximized) {
      this.maximizeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>
        </svg>
      `;
      this.maximizeBtn.title = 'Restaurar layout';
    } else {
      this.maximizeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      `;
      this.maximizeBtn.title = 'Maximizar quadrante';
    }
  }

  public destroy(): void {
    if (this.supplyPollTimer !== null) {
      clearInterval(this.supplyPollTimer);
      this.supplyPollTimer = null;
    }
    if (this.bridgeKeepAliveTimer !== null) {
      clearInterval(this.bridgeKeepAliveTimer);
      this.bridgeKeepAliveTimer = null;
    }
    this.autoClickTask.stop();
  }
}
