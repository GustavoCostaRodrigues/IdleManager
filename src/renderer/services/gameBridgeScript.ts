/**
 * Script de Injeção e Bridge de Telemetria do Poke Idle World.
 * Executado dentro de cada Webview Tag via executeJavaScript.
 *
 * Funcionalidades:
 * 1. Lê diretamente da tela ativa de caça o painel "🎯 CAPTURA" (canto inferior direito):
 *    - Quantidade e tipo da Pokébola em uso (ex: 128 Ultra Balls).
 *    - Intercepta cliques no botão "Lançar" para atualizar contadores locais.
 * 2. Monitora o combate ativo nos cards centrais e consumo de poções.
 * 3. Sincroniza dados consolidados do modal "HUNT ANALYZER" (quando aberto ou no DOM).
 * 4. Captura tokens JWT de autenticação das contas no storage para governança de APIs.
 * 5. ZERO WEBSOCKET PASSIVO: O app não escuta frames de WebSocket ou telemetria em segundo plano
 *    dedicada às capturas. O Dashboard de Capturas opera exclusivamente sob demanda via requisições HTTP manuais.
 */

export const GAME_BRIDGE_INJECTION_SCRIPT = `
(() => {
  try {
    // Flag de idempotência
    if (window.__POKE_BRIDGE_INITIALIZED__) {
      if (typeof window.__POKE_BRIDGE_SCAN__ === 'function') {
        window.__POKE_BRIDGE_SCAN__();
      }
      return { initialized: true, reattached: true };
    }
    window.__POKE_BRIDGE_INITIALIZED__ = true;

    // Cache temporal para deduplicação de assinaturas
    const recentSignatures = new Set();
    function shouldEmit(sig, ttlMs = 1500) {
      if (recentSignatures.has(sig)) return false;
      recentSignatures.add(sig);
      setTimeout(() => recentSignatures.delete(sig), ttlMs);
      return true;
    }

    // Emissão segura e unificada para o Renderer
    function emitTelemetry(payload) {
      if (!payload || !payload.type) return;
      payload.timestamp = payload.timestamp || Date.now();
      const raw = JSON.stringify(payload);

      // Canal 1: console-message estruturado (nativamente interceptado pelo webview)
      console.log('POKE_BRIDGE_TELEMETRY:' + raw);

      // Canal 2: sendToHost via ipcRenderer se disponível
      try {
        if (typeof window.ipcRenderer !== 'undefined' && typeof window.ipcRenderer.sendToHost === 'function') {
          window.ipcRenderer.sendToHost('poke-telemetry', payload);
        }
      } catch (e) {}

      // Canal 3: CustomEvent interno
      try {
        window.dispatchEvent(new CustomEvent('poke-telemetry-event', { detail: payload }));
      } catch (e) {}
    }

    // Monitoramento contínuo de Tokens JWT na sessão/storage
    function checkAndEmitToken() {
      try {
        let token = null;
        const raw = sessionStorage.getItem('pokeweb:tokens') || localStorage.getItem('pokeweb:tokens');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            token = parsed && parsed.accessToken ? parsed.accessToken : (typeof parsed === 'string' && parsed.startsWith('ey') ? parsed : null);
          } catch (_) {}
        }
        if (!token) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.toLowerCase().includes('token')) {
              const val = localStorage.getItem(k);
              if (val && val.startsWith('ey')) { token = val; break; }
              try {
                const p = JSON.parse(val);
                if (p && p.accessToken) { token = p.accessToken; break; }
              } catch (_) {}
            }
          }
        }
        if (token && typeof token === 'string' && token.startsWith('ey')) {
          if (shouldEmit('TOKEN:' + token.substring(0, 30), 10000)) {
            emitTelemetry({
              type: 'TOKEN_DETECTED',
              token: token,
              timestamp: Date.now(),
            });
          }
        }
      } catch (_) {}
    }

    // Intercepta alterações no localStorage/sessionStorage para detecção imediata no momento do login
    try {
      ['localStorage', 'sessionStorage'].forEach((storageName) => {
        const storage = window[storageName];
        if (storage && !storage.__pokeHooked) {
          storage.__pokeHooked = true;
          const origSet = storage.setItem;
          storage.setItem = function(key, val) {
            origSet.apply(this, arguments);
            try {
              if (typeof key === 'string' && (key.includes('token') || key === 'pokeweb:tokens')) {
                checkAndEmitToken();
              }
            } catch (_) {}
          };
        }
      });
    } catch (_) {}

    // Interceptação passiva de tráfego de rede para detecção de presença no Mercado (Zero polling, Zero OCR)
    try {
      if (typeof window.fetch === 'function' && !window.fetch.__pokeMarketHooked) {
        const origFetch = window.fetch;
        const wrappedFetch = function(resource, init) {
          try {
            const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
            if (url && (url.includes('/api/game/market') || url.includes('api/game/market'))) {
              if (shouldEmit('MARKET_REQ', 5000)) {
                emitTelemetry({
                  type: 'MARKET_PRESENCE_DETECTED',
                  url: url,
                  timestamp: Date.now(),
                });
              }
            }
          } catch (_) {}
          return origFetch.apply(this, arguments);
        };
        wrappedFetch.__pokeMarketHooked = true;
        window.fetch = wrappedFetch;
      }

      if (typeof window.XMLHttpRequest !== 'undefined' && !window.XMLHttpRequest.prototype.__pokeMarketHooked) {
        const origOpen = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(method, url) {
          try {
            if (typeof url === 'string' && (url.includes('/api/game/market') || url.includes('api/game/market'))) {
              if (shouldEmit('MARKET_REQ_XHR', 5000)) {
                emitTelemetry({
                  type: 'MARKET_PRESENCE_DETECTED',
                  url: url,
                  timestamp: Date.now(),
                });
              }
            }
          } catch (_) {}
          return origOpen.apply(this, arguments);
        };
        window.XMLHttpRequest.prototype.__pokeMarketHooked = true;
      }
    } catch (_) {}

    // Normalizador oficial das 9 qualidades do Poke Idle World
    function normalizeQuality(rawText) {
      const str = (rawText || '').toLowerCase().trim();
      if (str.includes('divina') || str.includes('divine')) return 'divina';
      if (str.includes('ancia') || str.includes('anciã') || str.includes('ancient')) return 'ancia';
      if (str.includes('mitica') || str.includes('mítica') || str.includes('mythic')) return 'mitica';
      if (str.includes('lendaria') || str.includes('lendária') || str.includes('legendary')) return 'lendaria';
      if (str.includes('epica') || str.includes('épica') || str.includes('epic')) return 'epica';
      if (str.includes('rara') || str.includes('rare')) return 'rara';
      if (str.includes('incomum') || str.includes('uncommon')) return 'incomum';
      if (str.includes('fraca') || str.includes('poor') || str.includes('weak')) return 'fraca';
      return 'comum';
    }

    // Converte multiplicador numérico oficial (ex: 1.35) ou string para a qualidade oficial
    function qualityFromNumberOrString(q) {
      if (typeof q === 'string') return normalizeQuality(q);
      const n = Number(q);
      if (isNaN(n)) return 'comum';
      if (n >= 4.0) return 'divina';
      if (n >= 3.0) return 'ancia';
      if (n >= 2.0) return 'mitica';
      if (n >= 1.7) return 'lendaria';
      if (n >= 1.5) return 'epica';
      if (n >= 1.3) return 'rara';
      if (n >= 1.1) return 'incomum';
      if (n >= 1.0) return 'comum';
      return 'fraca';
    }

    // Extrai o nome do arquivo limpo de uma URL
    function getCleanFileName(url) {
      if (!url) return '';
      try {
        const clean = String(url).split('?')[0].split('#')[0];
        const parts = clean.split('/');
        return (parts[parts.length - 1] || '').toLowerCase();
      } catch (_) {
        return '';
      }
    }

    // Normalizador de Pokébola (100% blindado contra domínios como poke.idleworld.online)
    function normalizePokeball(rawText, imgUrl) {
      const fileName = getCleanFileName(imgUrl || (typeof rawText === 'string' && rawText.includes('/') ? rawText : ''));
      const str = (rawText || '').toLowerCase().trim();

      if (fileName) {
        if (fileName.includes('rubber')) return 'rubber_ball';
        if (fileName.includes('earth')) return 'earth_ball';
        if (fileName.includes('gold')) return 'golden_idleball';
        if (fileName.includes('idleball') || fileName.includes('idle_ball')) return 'idleball';
        if (fileName.includes('ultra')) return 'ultraball';
        if (fileName.includes('master')) return 'masterball';
        if (fileName.includes('super')) return 'superball';
        if (fileName.includes('great')) return 'greatball';
        if (fileName.includes('poke')) return 'pokeball';
      }

      if (str.includes('rubber')) return 'rubber_ball';
      if (str.includes('earth')) return 'earth_ball';
      if (str.includes('golden idle') || str.includes('gold idle') || str.includes('idleball_gold')) return 'golden_idleball';
      if (str.includes('idleball') || str.includes('idle_ball') || str.includes('idle ball')) return 'idleball';
      if (str.includes('ultra')) return 'ultraball';
      if (str.includes('master')) return 'masterball';
      if (str.includes('great')) return 'greatball';
      if (str.includes('super')) return 'superball';
      if (str.includes('poke') || str.includes('poké')) return 'pokeball';
      return 'pokeball';
    }

    // Normalizador de Poções (checa Small Potion e nome de arquivo primeiro)
    function normalizePotion(rawText, imgUrl) {
      const fileName = getCleanFileName(imgUrl || (typeof rawText === 'string' && rawText.includes('/') ? rawText : ''));
      const str = (rawText || '').toLowerCase().trim();

      if (fileName) {
        if (fileName.includes('small')) return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
        if (fileName.includes('ultimate')) return { type: 'ultimate', name: 'Ultimate Potion', fileName: 'ultimate_potion.png' };
        if (fileName.includes('hyper')) return { type: 'hyper', name: 'Hyper Potion', fileName: 'hyper_potion.png' };
        if (fileName.includes('ultra')) return { type: 'ultra', name: 'Ultra Potion', fileName: 'ultra_potion.png' };
        if (fileName.includes('great') || fileName.includes('super')) return { type: 'great', name: 'Great Potion', fileName: 'great_potion.png' };
      }

      if (str.includes('small') || str.includes('pequena')) return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
      if (str.includes('ultimate') || str.includes('suprema') || str.includes('definitiva')) return { type: 'ultimate', name: 'Ultimate Potion', fileName: 'ultimate_potion.png' };
      if (str.includes('hyper') || str.includes('hiper')) return { type: 'hyper', name: 'Hyper Potion', fileName: 'hyper_potion.png' };
      if (str.includes('ultra potion') || str.includes('ultra poção') || str.includes('ultra_potion') || str.includes('ultra-potion')) {
        return { type: 'ultra', name: 'Ultra Potion', fileName: 'ultra_potion.png' };
      }
      if (str.includes('great') || str.includes('super')) return { type: 'great', name: 'Great Potion', fileName: 'great_potion.png' };
      return { type: 'small', name: 'Small Potion', fileName: 'small_potion.png' };
    }

    // Extrai número limpo de strings como "$1.482", "×30", "-$10.400", "128"
    function parseNumeric(valStr) {
      if (!valStr) return 0;
      const clean = String(valStr).replace(/[^0-9\\-]/g, '');
      const parsed = parseInt(clean, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    // Estado local mantido na página (nulo até que a conta esteja logada)
    let lastKnownBall = null;
    let lastKnownPotion = null;
    let lastTargetPokemon = { name: '', level: 1 };

    // -------------------------------------------------------------
    // Função auxiliar para buscar em todos os documentos (incluindo iframes)
    function getBridgeDocs() {
      const docs = [document];
      try {
        const frames = document.querySelectorAll('iframe');
        for (let i = 0; i < frames.length; i++) {
          try {
            const fDoc = frames[i].contentDocument || (frames[i].contentWindow && frames[i].contentWindow.document);
            if (fDoc) docs.push(fDoc);
          } catch (_) {}
        }
      } catch (_) {}
      return docs;
    }

    function extractElementImgUrl(el) {
      if (!el) return null;
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img && img.src && (img.src.indexOf('http') === 0 || img.src.indexOf('data:') === 0 || img.src.indexOf('blob:') === 0)) {
        return img.src;
      }
      const bgEl = (el.style && el.style.backgroundImage) ? el : el.querySelector('[style*="background-image"]');
      if (bgEl && bgEl.style && bgEl.style.backgroundImage) {
        const m = bgEl.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
        if (m && m[1]) return m[1];
      }
      return null;
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

    // -------------------------------------------------------------
    // Função auxiliar para detecção inequívoca de página deslogada / landing
    function isGamePageLoggedIn(docs) {
      try {
        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          if (!doc || !doc.body) continue;

          // Se encontrar elementos ativos de caça ou combate, está 100% logado
          const allButtons = Array.from(doc.querySelectorAll('button, a, [role="button"], [class*="btn"], [class*="button"], [class*="catch"], [class*="lancar"]'));
          const hasInGameControls = allButtons.some((b) => {
            const t = (b.textContent || '').trim().toLowerCase();
            return t === 'lançar' || t === 'lancar' || t === '1 selvagem' || t.includes('captura');
          });
          if (hasInGameControls) return true;

          // Só considera deslogado se houver campo de senha visível na tela
          const pwd = doc.querySelector('input[type="password"]');
          if (pwd && (pwd.offsetWidth > 0 || pwd.offsetHeight > 0)) return false;

          // Ou botão principal de login/landing ativo na tela
          const ctaEls = Array.from(doc.querySelectorAll('button, a, [role="button"], [class*="btn"], [class*="button"]'));
          const hasLoginCta = ctaEls.some((el) => {
            if (el.offsetWidth <= 0 && el.offsetHeight <= 0) return false;
            const t = (el.textContent || '').trim().toLowerCase();
            return t === 'jogar agora' || t === 'criar conta' || t === '> entrar' || t === 'entrar no jogo';
          });
          if (hasLoginCta) return false;
        }
        return true;
      } catch (_) {
        return true;
      }
    }

    // -------------------------------------------------------------
    // 1. LEITURA DIRETA DO PAINEL "🎯 CAPTURA" DA TELA ATIVA (CANTO INFERIOR DIREITO)
    // -------------------------------------------------------------
    function scanActiveCapturePanel() {
      try {
        const docs = getBridgeDocs();
        if (!isGamePageLoggedIn(docs)) return;

        for (const doc of docs) {
          // Localiza o botão "Lançar"
          const allButtons = Array.from(doc.querySelectorAll('button, a, [role="button"], [class*="btn"], [class*="button"], [class*="catch"], [class*="lancar"]'));
          const launchBtn = allButtons.find((b) => {
            const t = (b.textContent || '').trim().toLowerCase();
            return t === 'lançar' || t === 'lancar' || t === 'catch';
          });

          let captureContainer = null;
          if (launchBtn) {
            let p = launchBtn.parentElement;
            while (p && p !== doc.body) {
              const pTxt = p.textContent || '';
              if (pTxt.includes('CAPTURA') || pTxt.includes('Captura') || (p.className && /capture|box|panel/i.test(String(p.className)))) {
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
            const candidateBoxes = doc.querySelectorAll('[class*="capture"], [class*="captur"], [class*="panel"], [class*="box"]');
            for (let i = 0; i < candidateBoxes.length; i++) {
              const box = candidateBoxes[i];
              const t = (box.textContent || '').trim();
              if (
                (t.includes('CAPTURA') || t.includes('Captura')) &&
                (t.includes('selvagem') || t.includes('Loja') || t.includes('Lançar') || t.includes('lancar')) &&
                box.children.length >= 2
              ) {
                captureContainer = box;
                break;
              }
            }
          }

          if (captureContainer) {
            // A) Extrai o contador da Pokébola ativa e a imagem real da bola
            let detectedCount = null;
            let ballContext = '';
            let ballSpriteUrl = extractElementImgUrl(captureContainer.querySelector('img[src*="ball"], img[src*="item"], button img, img'));

            // Tentativa 1: Seletores diretos (.capture-box .counter, .pokeball-count, etc)
            const specificEl = captureContainer.querySelector('.capture-box .counter, .pokeball-count, .ball-count, .counter, .badge-count, .ball-quantity, [class*="pokeball"] [class*="count"], [class*="ball"] [class*="count"]');
            if (specificEl && /^[0-9.,]+$/.test((specificEl.textContent || '').trim())) {
              detectedCount = parseNumeric(specificEl.textContent);
              ballContext = ((captureContainer.className || '') + ' ' + (specificEl.parentElement ? specificEl.parentElement.className + ' ' + specificEl.parentElement.innerHTML : '')).toLowerCase();
              if (!ballSpriteUrl && specificEl.parentElement) {
                ballSpriteUrl = extractElementImgUrl(specificEl.parentElement);
              }
            }

            // Tentativa 2: Varredura de números isolados no container (ex: 128)
            if (detectedCount === null) {
              const numNodes = Array.from(captureContainer.querySelectorAll('div, span, p, strong, b, [class*="count"]')).filter((el) => {
                if (el === launchBtn || el.contains(launchBtn)) return false;
                const text = (el.textContent || '').trim();
                if (!/^[0-9.,]+$/.test(text)) return false;
                const parentTxt = (el.parentElement ? el.parentElement.textContent || '' : '').trim();
                if (parentTxt.includes('selvagem')) return false;
                if (/lv\\.?|level/i.test(parentTxt)) return false;
                return true;
              });

              numNodes.sort((a, b) => a.children.length - b.children.length);

              if (numNodes.length > 0) {
                detectedCount = parseNumeric(numNodes[0].textContent);
                const parentBall = numNodes[0].closest('button, [class*="ball"], div') || numNodes[0].parentElement;
                if (!ballSpriteUrl && parentBall) {
                  ballSpriteUrl = extractElementImgUrl(parentBall);
                }
              }
            }

            if (detectedCount !== null) {
              const ballType = normalizePokeball(ballContext, ballSpriteUrl);
              let ballName = 'Ultra Ball';
              let ballFileName = 'ultraball.png';
              if (ballType === 'rubber_ball') { ballName = 'Rubber Ball'; ballFileName = 'rubber_ball.png'; }
              else if (ballType === 'earth_ball') { ballName = 'Earth Ball'; ballFileName = 'earth_ball.png'; }
              else if (ballType === 'masterball') { ballName = 'Master Ball'; ballFileName = 'ultraball.png'; }
              else if (ballType === 'golden_idleball') { ballName = 'Golden Idle Ball'; ballFileName = 'idleball_gold.png'; }
              else if (ballType === 'idleball') { ballName = 'Idle Ball'; ballFileName = 'idleball.png'; }
              else if (ballType === 'superball') { ballName = 'Super Ball'; ballFileName = 'superball.png'; }
              else if (ballType === 'greatball') { ballName = 'Great Ball'; ballFileName = 'greatball.png'; }
              else if (ballType === 'pokeball') { ballName = 'Poké Ball'; ballFileName = 'pokeball.png'; }

              lastKnownBall = {
                name: ballName,
                type: ballType,
                count: detectedCount,
                countFormatted: detectedCount.toLocaleString('pt-BR'),
                spriteUrl: ballSpriteUrl,
                fileName: ballFileName,
              };

              const sig = 'SUPPLY_BALL:' + ballType + ':' + detectedCount;
              if (shouldEmit(sig, 1200)) {
                emitTelemetry({
                  type: 'SUPPLY_STATUS',
                  ball: lastKnownBall,
                  potion: lastKnownPotion || {
                    name: 'Small Potion',
                    type: 'small',
                    count: 0,
                    countFormatted: '0',
                  },
                  timestamp: Date.now(),
                });
              }
            }

            // B) Extrai o Pokémon alvo atual no painel (ex: "Caterpie Lv 1")
            const containerText = captureContainer.textContent || '';
            const pokeMatch = containerText.match(/([A-Za-z0-9À-ÿ\s\-]+?)(?:\s+Lv\.?\s*(\d+))/i);
            if (pokeMatch) {
              const clean = pokeMatch[1].replace(/CAPTURA|selvagem|Loja/gi, '').trim();
              if (clean.length >= 2 && clean.length <= 25) {
                lastTargetPokemon = {
                  name: clean,
                  level: parseInt(pokeMatch[2], 10) || 1,
                };
              }
            }

            // C) Intercepta o clique no botão "Lançar" para atualizar estoque de Pokébola
            if (launchBtn && !launchBtn.__pokeHooked) {
              launchBtn.__pokeHooked = true;
              launchBtn.addEventListener('click', () => {
                if (lastKnownBall && lastKnownBall.count > 0) {
                  lastKnownBall.count -= 1;
                  lastKnownBall.countFormatted = lastKnownBall.count.toLocaleString('pt-BR');
                  emitTelemetry({
                    type: 'SUPPLY_STATUS',
                    ball: lastKnownBall,
                    potion: lastKnownPotion,
                    timestamp: Date.now(),
                  });
                }
              });
            }

            break;
          }
        }
      } catch (err) {
        console.warn('[PokeBridge] Erro ao ler painel de captura ativo:', err);
      }
    }

    // -------------------------------------------------------------
    // 1.1 VARREDURA DE POÇÕES (INVENTÁRIO OU ATALHOS RÁPIDOS)
    // -------------------------------------------------------------
    function scanActivePotionSupply() {
      try {
        const docs = getBridgeDocs();
        if (!isGamePageLoggedIn(docs)) return;

        let detected = false;

        for (const doc of docs) {
          if (detected) break;

          // A) Slots de inventário
          const slots = Array.from(doc.querySelectorAll('[class*="item-slot"], [class*="inventory-slot"], [class*="inventory-item"], [class*="item-card"], [class*="grid"] > div, div[title*="Potion"], div[title*="Poção"]'));
          for (const slot of slots) {
            const t = (slot.textContent || '').trim();
            const title = (slot.getAttribute('title') || '') + ' ' + (slot.getAttribute('aria-label') || '');
            const combined = (t + ' ' + title + ' ' + (slot.innerHTML || '')).toLowerCase();

            if (combined.includes('potion') || combined.includes('poção') || combined.includes('pocao')) {
              const slotVisible = isElementVisible(slot);
              const m = t.match(/(?:[×x*]\s*)?([0-9.,]+)/) || combined.match(/(?:[×x*]\s*)?([0-9.,]+)/);
              const potCount = m ? parseNumeric(m[1]) : 1;
              const potSprite = extractElementImgUrl(slot);
              const potMeta = normalizePotion(title + ' ' + t, potSprite);

              lastKnownPotion = {
                name: potMeta.name,
                type: potMeta.type,
                count: potCount,
                countFormatted: potCount.toLocaleString('pt-BR'),
                spriteUrl: potSprite,
                fileName: potMeta.fileName,
                fromLiveInventory: slotVisible,
              };
              detected = true;
              break;
            }
          }

          // B) Textos com "Small Potion" / "Poção" em containers relevantes
          if (!detected) {
            const potTexts = Array.from(doc.querySelectorAll('[class*="inventory"] *, [class*="bag"] *, [class*="mochila"] *, [class*="item"] *, [class*="potion"], [class*="pocao"], [class*="heal"], [title*="Potion"], [title*="Poção"]')).filter((el) => {
              const t = (el.textContent || '').trim();
              return (t.includes('Potion') || t.includes('Poção')) && el.children.length <= 3;
            });
            for (const el of potTexts) {
              const txt = el.textContent || '';
              const numMatch = txt.match(/([0-9.,]+)/);
              if (numMatch) {
                const count = parseNumeric(numMatch[1]);
                const potSprite = extractElementImgUrl(el);
                const potMeta = normalizePotion(txt, potSprite);
                lastKnownPotion = {
                  name: potMeta.name,
                  type: potMeta.type,
                  count: count,
                  countFormatted: count.toLocaleString('pt-BR'),
                  spriteUrl: potSprite,
                  fileName: potMeta.fileName,
                  fromLiveInventory: isElementVisible(el),
                };
                detected = true;
                break;
              }
            }
          }

          // C) Barra de atalhos rápidos
          if (!detected) {
            const quickBtn = doc.querySelector('[class*="potion-button"], [class*="quick-potion"], [class*="auto-heal"], button[title*="Potion"], button[title*="Poção"]');
            if (quickBtn) {
              const qVisible = isElementVisible(quickBtn);
              const count = parseNumeric(quickBtn.textContent || '');
              const potSprite = extractElementImgUrl(quickBtn);
              const qComb = ((quickBtn.getAttribute('title') || '') + ' ' + (quickBtn.className || '')).toLowerCase();
              const potMeta = normalizePotion(qComb, potSprite);

              lastKnownPotion = {
                name: potMeta.name,
                type: potMeta.type,
                count: count,
                countFormatted: count.toLocaleString('pt-BR'),
                spriteUrl: potSprite,
                fileName: potMeta.fileName,
                fromLiveInventory: qVisible && count > 0,
              };
              detected = true;
              break;
            }
          }
        }

        if (lastKnownPotion && lastKnownBall) {
          const potSig = 'SUPPLY_POTION:' + lastKnownPotion.type + ':' + lastKnownPotion.count + ':' + (lastKnownPotion.spriteUrl || '');
          if (shouldEmit(potSig, 1500)) {
            emitTelemetry({
              type: 'SUPPLY_STATUS',
              ball: lastKnownBall,
              potion: lastKnownPotion,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn('[PokeBridge] Erro ao escanear poções:', err);
      }
    }

    // -------------------------------------------------------------
    // 2. EXTRATOR DO "HUNT ANALYZER" (QUANDO ABERTO OU NO DOM)
    // -------------------------------------------------------------
    function scanHuntAnalyzer() {
      try {
        const containers = document.querySelectorAll('div[class*="modal"], div[class*="dialog"], div[class*="analyzer"], div[class*="popup"], [role="dialog"], section');
        let container = null;
        for (let i = 0; i < containers.length; i++) {
          const txt = containers[i].textContent || '';
          if (txt.includes('HUNT ANALYZER') || (txt.includes('Supply') && txt.includes('DROPS DA SESSÃO'))) {
            container = containers[i];
            break;
          }
        }

        if (!container) {
          const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="header"]');
          for (let i = 0; i < headers.length; i++) {
            if ((headers[i].textContent || '').includes('HUNT ANALYZER')) {
              container = headers[i].closest('div[class*="modal"], div[class*="dialog"], div[class*="analyzer"], div[class*="popup"]') ||
                          headers[i].parentElement?.parentElement?.parentElement;
              break;
            }
          }
        }

        if (!container) return;

        const containerText = container.textContent || '';
        if (!containerText.includes('Supply') && !containerText.includes('DROPS DA SESSÃO')) return;

        let defeats = 0;
        const defeatsMatch = containerText.match(/(\\d+)\\s*Derrotados/i);
        if (defeatsMatch) defeats = parseInt(defeatsMatch[1], 10);

        let xpGained = 0;
        const xpMatch = containerText.match(/(\\d+)\\s*XP\\s*ganha/i);
        if (xpMatch) xpGained = parseInt(xpMatch[1], 10);

        let catchesCount = 0;
        let catchesValueGold = 0;
        const catchesMatch = containerText.match(/(\\d+)\\s*Capturados\\s*(?:\\(\\+\\$?([0-9\\.,]+)\\))?/i);
        if (catchesMatch) {
          catchesCount = parseInt(catchesMatch[1], 10);
          if (catchesMatch[2]) catchesValueGold = parseNumeric(catchesMatch[2]);
        }

        let lootTotalGold = 0;
        let lootItemsCount = 0;
        const lootMatch = containerText.match(/\\$?([0-9\\.,]+)\\s*Loot\\s*(?:\\((\\d+)\\s*itens\\))?/i);
        if (lootMatch) {
          lootTotalGold = parseNumeric(lootMatch[1]);
          if (lootMatch[2]) lootItemsCount = parseInt(lootMatch[2], 10);
        }

        let supplyCostGold = 0;
        let supplyBallsCount = 0;
        let supplyPotionsCount = 0;
        const supplyMatch = containerText.match(/-\\s*\\$?([0-9\\.,]+)\\s*Supply\\s*(?:\\((\\d+)\\s*bolas\\s*[·•.]\\s*(\\d+)\\s*potions?\\))?/i);
        if (supplyMatch) {
          supplyCostGold = parseNumeric(supplyMatch[1]);
          if (supplyMatch[2]) supplyBallsCount = parseInt(supplyMatch[2], 10);
          if (supplyMatch[3]) supplyPotionsCount = parseInt(supplyMatch[3], 10);
        }

        let netBalanceGold = lootTotalGold - supplyCostGold;
        const balanceMatch = containerText.match(/Saldo[^\\n\\r]*?\\+?\\$?([0-9\\.,\\-]+)/i);
        if (balanceMatch) {
          netBalanceGold = parseNumeric(balanceMatch[1]);
        }

        const drops = [];
        if (containerText.includes('DROPS DA SESSÃO')) {
          const dropsSectionHeader = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6, div, span, p, strong, b')).find((el) => {
            return (el.textContent || '').trim().includes('DROPS DA SESSÃO') && el.children.length <= 2;
          });

          if (dropsSectionHeader) {
            const dropsContainer = dropsSectionHeader.parentElement || container;
            const dropRows = Array.from(dropsContainer.querySelectorAll('div, li, tr')).filter((el) => {
              const t = el.textContent || '';
              return t.includes('×') || t.includes('$') || t.includes('x');
            });

            for (const row of dropRows) {
              const rowText = (row.textContent || '').trim();
              const itemMatch = rowText.match(/^([A-Za-z0-9À-ÿ\\s\\-_]+?)\\s*[×x](\\d+)\\s*\\$?([0-9\\.,]+)$/);
              if (itemMatch) {
                const name = itemMatch[1].trim();
                const count = parseInt(itemMatch[2], 10) || 1;
                const valueGold = parseNumeric(itemMatch[3]);

                if (!drops.some((d) => d.name === name)) {
                  let rarity = 'common';
                  if (name.includes('Strange') || name.includes('Orb')) rarity = 'uncommon';
                  if (name.includes('Stone') && count < 10) rarity = 'rare';

                  drops.push({ name, count, valueGold, rarity });
                }
              }
            }
          }
        }

        const sig = 'HUNT_SYNC:' + catchesCount + ':' + lootTotalGold + ':' + supplyCostGold + ':' + supplyPotionsCount + ':' + netBalanceGold + ':' + drops.length;
        if (shouldEmit(sig, 1200)) {
          emitTelemetry({
            type: 'HUNT_SYNC',
            defeats,
            xpGained,
            catchesCount,
            catchesValueGold,
            lootTotalGold,
            lootItemsCount,
            supplyCostGold,
            supplyBallsCount,
            supplyPotionsCount,
            netBalanceGold,
            drops,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.warn('[PokeBridge] Erro ao escanear Hunt Analyzer:', err);
      }
    }

    // -------------------------------------------------------------
    // 3. INTERCEPTAÇÃO DE AÇÕES DE USO DE POÇÃO E CURA EM TEMPO REAL
    // -------------------------------------------------------------
    function hookPotionUsageActions() {
      try {
        const docs = getBridgeDocs();
        for (const d of docs) {
          if (d.__pokePotionHooked) continue;
          d.__pokePotionHooked = true;

          d.addEventListener('click', (e) => {
            try {
              const target = e.target;
              if (!target) return;
              const el = target.closest('button, [role="button"], a, div[class*="btn"], div[class*="button"], [class*="potion"], [class*="heal"], div[title*="Potion"], div[title*="Poção"]');
              if (!el) return;

              const text = (el.textContent || '').toLowerCase();
              const title = (el.getAttribute('title') || '').toLowerCase();
              const cls = (el.className || '').toLowerCase();
              const aria = (el.getAttribute('aria-label') || '').toLowerCase();
              const combined = text + ' ' + title + ' ' + cls + ' ' + aria;

              // Ignora compras em lojas/mercados
              if (combined.includes('comprar') || combined.includes('buy') || combined.includes('loja') || combined.includes('shop') || combined.includes('mercado')) {
                return;
              }

              const hasPotionImg = Boolean(el.querySelector('img[src*="potion"], img[src*="pocao"]') || (el.tagName === 'IMG' && (el.src || '').includes('potion')));
              const isPotionAction = hasPotionImg ||
                combined.includes('potion') ||
                combined.includes('poção') ||
                combined.includes('pocao') ||
                combined.includes('curar') ||
                combined.includes('auto-heal') ||
                combined.includes('auto heal');

              if (isPotionAction) {
                emitTelemetry({
                  type: 'POTION',
                  potionCost: 300,
                  timestamp: Date.now(),
                });
              }
            } catch (_) {}
          }, true);
        }
      } catch (_) {}
    }

    // -------------------------------------------------------------
    // 4. CICLO DE EXECUÇÃO LEVE E CONTROLADO (SEM MUTATION OBSERVER INFINITO)
    // -------------------------------------------------------------
    let isScanning = false;
    function performFullScan() {
      if (isScanning) return;
      isScanning = true;
      try {
        checkAndEmitToken();
        hookPotionUsageActions();
        scanActiveCapturePanel();
        scanActivePotionSupply();
        scanHuntAnalyzer();
      } catch (err) {
        console.warn('[PokeBridge] Erro no scan:', err);
      } finally {
        isScanning = false;
      }
    }
    window.__PokeBridgeScan = performFullScan;
    window.__POKE_BRIDGE_SCAN__ = performFullScan;

    // Emissão inicial imediata dos dados do painel ativo
    performFullScan();

    // Polling a cada 1200ms para manter contadores e capturas sincronizados sem sobrecarregar a CPU
    setInterval(performFullScan, 1200);

    return { initialized: true, success: true };
  } catch (err) {
    return { initialized: false, error: String(err) };
  }
})();
`;
