import {
  POKEMON_DATABASE,
  POKEMON_PLACEHOLDER_ICON,
  getPokemonByName,
  getPokemonLocalSpriteUrl,
  getPokemonSpriteUrl,
} from '../data/pokemonBaseStats.js';
import type { PokemonQuality } from '../../shared/captureTypes.js';

export interface DepotPokemonItem {
  id: string;
  name: string;
  level: number;
  qualityMultiplier: number;
  ivTotal: number;
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  speed: number;
  totalStats: number;
  qualityTier: PokemonQuality;
  qualityDisplayName: string;
  qualityColor: string;
  spriteUrl?: string;
  isShiny?: boolean;
  dex?: number;
}

export interface AccountOption {
  id: string;
  name: string;
  webview: Electron.WebviewTag;
}

export const QUALITY_CONFIG: Record<
  PokemonQuality,
  { label: string; color: string; bg: string; minQ: number }
> = {
  divina: { label: 'Divina', color: '#FFFFFF', bg: 'rgba(255, 255, 255, 0.2)', minQ: 4.0 },
  ancia: { label: 'Anciã', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.2)', minQ: 3.0 },
  mitica: { label: 'Mítica', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.2)', minQ: 2.0 },
  lendaria: { label: 'Lendária', color: '#F97316', bg: 'rgba(249, 115, 22, 0.2)', minQ: 1.7 },
  epica: { label: 'Épica', color: '#FACC15', bg: 'rgba(250, 204, 21, 0.2)', minQ: 1.5 },
  rara: { label: 'Rara', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.2)', minQ: 1.3 },
  incomum: { label: 'Incomum', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.2)', minQ: 1.1 },
  comum: { label: 'Comum', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.2)', minQ: 1.0 },
  fraca: { label: 'Fraca', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.2)', minQ: 0.0 },
};

export function getQualityFromMultiplier(q: number): {
  tier: PokemonQuality;
  label: string;
  color: string;
} {
  const n = Number(q);
  if (isNaN(n)) return { tier: 'comum', label: 'Comum', color: '#4ADE80' };
  if (n >= 4.0) return { tier: 'divina', label: 'Divina', color: '#FFFFFF' };
  if (n >= 3.0) return { tier: 'ancia', label: 'Anciã', color: '#EAB308' };
  if (n >= 2.0) return { tier: 'mitica', label: 'Mítica', color: '#A855F7' };
  if (n >= 1.7) return { tier: 'lendaria', label: 'Lendária', color: '#F97316' };
  if (n >= 1.5) return { tier: 'epica', label: 'Épica', color: '#FACC15' };
  if (n >= 1.3) return { tier: 'rara', label: 'Rara', color: '#C084FC' };
  if (n >= 1.1) return { tier: 'incomum', label: 'Incomum', color: '#38BDF8' };
  if (n >= 1.0) return { tier: 'comum', label: 'Comum', color: '#4ADE80' };
  return { tier: 'fraca', label: 'Fraca', color: '#9CA3AF' };
}

/**
 * Gera a string no formato exato TSV especificado para a planilha Google Sheets:
 * Nome [TAB] Multiplicador [TAB] IV [TAB] HP [TAB] Atk [TAB] Def [TAB] SpA [TAB] SpD [TAB] Speed
 */
export function formatDepotPokemonsToTsv(pokemons: DepotPokemonItem[]): string {
  return pokemons
    .map((p) =>
      [
        p.name,
        Number(p.qualityMultiplier).toFixed(2),
        p.ivTotal,
        p.hp,
        p.atk,
        p.def,
        p.spa,
        p.spd,
        p.speed,
      ].join('\t'),
    )
    .join('\n');
}

/**
 * Script de Injeção no DOM do Webview:
 * Localiza especificamente a seção "DEPÓSITO DA FAMÍLIA" e extrai os Pokémons listados.
 */
export const INJECTION_DEPOT_SCAN_SCRIPT = `
(() => {
  try {
    const statRegex = /Nv\\.?\\s*(\\d+)[\\s\\-\\–\\|]+IV\\s*(\\d+)[\\s\\-\\–\\|]+Q\\s*([\\d\\.,]+)/i;
    const looseRegex = /IV\\s*(\\d+).*?Q\\s*([\\d\\.,]+)/i;
    
    // 1. Procura especificamente o cabeçalho 'DEPÓSITO DA FAMÍLIA'
    const allEls = Array.from(document.querySelectorAll('*'));
    let familyHeader = allEls.find(el => {
      const t = (el.textContent || '').trim().toUpperCase();
      return (t === 'DEPÓSITO DA FAMÍLIA' || t === 'DEPOSITO DA FAMILIA') && el.children.length === 0;
    });

    if (!familyHeader) {
      familyHeader = allEls.find(el => {
        const t = (el.innerText || el.textContent || '').toUpperCase();
        return (t.includes('DEPÓSITO DA FAMÍLIA') || t.includes('DEPOSITO DA FAMILIA')) && el.children.length <= 2;
      });
    }

    // 2. Busca o container com scroll associado à coluna da família
    let familyContainer = null;
    if (familyHeader) {
      let p = familyHeader.parentElement;
      for (let i = 0; i < 4 && p; i++) {
        const scrollable = Array.from(p.querySelectorAll('div, ul, section')).find(c => {
          return c !== familyHeader && (c.scrollHeight > c.clientHeight || c.children.length > 2);
        });
        if (scrollable) {
          familyContainer = scrollable;
          break;
        }
        p = p.parentElement;
      }
    }

    // 3. Varre nós candidatos a cards de Pokémon
    const candidates = Array.from(document.querySelectorAll('div, li, [class*="item"], [class*="card"], [class*="row"]'));
    const extracted = [];
    const seen = new Set();

    for (const node of candidates) {
      if (node.children.length > 10) continue;
      const text = node.innerText || node.textContent || '';
      if (!text.includes('IV') || !/Q\s*:?\s*[\d\.,]+/i.test(text)) continue;

      // Diferenciação crítica:
      // O Depósito da Família tem o botão '◀' (sacar para a caixa)
      // A "Sua Caixa" tem o botão '▶' (depositar na família)
      const hasLeftArrow = text.includes('◀') || !!node.querySelector('button, [role="button"]')?.textContent?.includes('◀');
      const hasRightArrow = text.includes('▶') || !!node.querySelector('button, [role="button"]')?.textContent?.includes('▶');

      let isFamilyItem = false;
      if (hasLeftArrow && !hasRightArrow) {
        isFamilyItem = true;
      } else if (familyContainer && familyContainer.contains(node)) {
        isFamilyItem = true;
      } else if (familyHeader) {
        const rect = node.getBoundingClientRect();
        const headerRect = familyHeader.getBoundingClientRect();
        if (Math.abs(rect.left - headerRect.left) < 180 || rect.left >= headerRect.left - 40) {
          isFamilyItem = true;
        }
      }

      if (!isFamilyItem && hasRightArrow) {
        continue; // Ignora Pokémons da "Sua Caixa"
      }

      // Extrai Nome Limpo
      const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
      let name = '';
      for (const line of lines) {
        if (line.includes('◀') || line.includes('▶')) continue;
        if (statRegex.test(line)) continue;
        const clean = line.replace(/[^a-zA-Z0-9\\s\\u00C0-\\u00FF]/g, '').trim();
        if (clean && !clean.startsWith('Nv') && !clean.startsWith('IV') && clean.length > 1 && clean.length < 25) {
          name = clean;
          break;
        }
      }

      if (!name) {
        const beforeNv = text.split(/Nv\\.?/i)[0] || '';
        name = beforeNv.replace(/[◀▶\\n\\r\\t]/g, '').trim();
      }

      const lvlMatch = text.match(/(?:Nv|Lv|Lvl|Nível|Level)\.?\s*:?\s*(\d+)/i);
      const ivMatch = text.match(/IV\s*:?\s*(\d+)/i);
      const qMatch = text.match(/(?:Q|Qualidade|Multiplier|Mult)\.?\s*:?\s*([\d]+(?:[\.,]\d+)?)/i);

      if (!ivMatch || !qMatch) continue;

      const level = lvlMatch ? parseInt(lvlMatch[1], 10) : 1;
      const iv = parseInt(ivMatch[1], 10);
      const q = parseFloat(qMatch[1].replace(',', '.'));

      const sig = name + '_' + level + '_' + iv + '_' + q;
      if (seen.has(sig)) continue;
      seen.add(sig);

      // Sprite e Shiny
      const img = node.querySelector('img');
      const spriteUrl = img ? img.src : '';
      const isShiny = text.includes('✨') || !!node.querySelector('[class*="shiny"]');

      extracted.push({
        name,
        level,
        iv,
        qualityMultiplier: q,
        spriteUrl,
        isShiny
      });
    }

    return {
      success: true,
      depotDetected: !!familyHeader || extracted.length > 0,
      count: extracted.length,
      items: extracted
    };
  } catch (err) {
    return {
      success: false,
      error: String(err)
    };
  }
})();
`;

/**
 * Script de Varredura Completa com Auto-Scroll no Depósito da Família:
 * Rola a lista programaticamente dentro do jogo, acumulando todos os Pokémons até o final!
 */
export const INJECTION_DEPOT_DEEP_SCROLL_SCRIPT = `
(async () => {
  try {
    const statRegex = /Nv\\.?\\s*(\\d+)[\\s\\-\\–\\|]+IV\\s*(\\d+)[\\s\\-\\–\\|]+Q\\s*([\\d\\.,]+)/i;
    const looseRegex = /IV\\s*(\\d+).*?Q\\s*([\\d\\.,]+)/i;

    // Localiza o cabeçalho 'DEPÓSITO DA FAMÍLIA'
    const allEls = Array.from(document.querySelectorAll('*'));
    let familyHeader = allEls.find(el => {
      const t = (el.textContent || '').trim().toUpperCase();
      return (t === 'DEPÓSITO DA FAMÍLIA' || t === 'DEPOSITO DA FAMILIA') && el.children.length === 0;
    });

    if (!familyHeader) {
      familyHeader = allEls.find(el => {
        const t = (el.innerText || el.textContent || '').toUpperCase();
        return (t.includes('DEPÓSITO DA FAMÍLIA') || t.includes('DEPOSITO DA FAMILIA')) && el.children.length <= 2;
      });
    }

    // Localiza o contêiner com rolagem
    let scrollEl = null;
    if (familyHeader) {
      let p = familyHeader.parentElement;
      for (let i = 0; i < 4 && p; i++) {
        const scrollable = Array.from(p.querySelectorAll('div, ul, section')).find(c => {
          return c !== familyHeader && (c.scrollHeight > c.clientHeight || c.children.length > 2);
        });
        if (scrollable) {
          scrollEl = scrollable;
          break;
        }
        p = p.parentElement;
      }
    }

    if (!scrollEl) {
      // Procura qualquer div scrollável que contenha itens com seta '◀'
      const divs = Array.from(document.querySelectorAll('div, section, ul'));
      scrollEl = divs.find(d => d.scrollHeight > d.clientHeight && d.innerText.includes('◀'));
    }

    const collected = [];
    const seen = new Set();

    function harvest() {
      const candidates = Array.from((scrollEl || document).querySelectorAll('div, li, [class*="item"], [class*="card"], [class*="row"]'));
      for (const node of candidates) {
        if (node.children.length > 10) continue;
        const text = node.innerText || node.textContent || '';
        if (!text.includes('IV') || !/Q\s*:?\s*[\d\.,]+/i.test(text)) continue;

        const hasLeftArrow = text.includes('◀') || !!node.querySelector('button, [role="button"]')?.textContent?.includes('◀');
        const hasRightArrow = text.includes('▶') || !!node.querySelector('button, [role="button"]')?.textContent?.includes('▶');

        let isFamily = false;
        if (hasLeftArrow && !hasRightArrow) {
          isFamily = true;
        } else if (scrollEl && scrollEl.contains(node)) {
          isFamily = true;
        } else if (familyHeader) {
          const rect = node.getBoundingClientRect();
          const headerRect = familyHeader.getBoundingClientRect();
          if (Math.abs(rect.left - headerRect.left) < 180 || rect.left >= headerRect.left - 40) {
            isFamily = true;
          }
        }

        if (!isFamily && hasRightArrow) continue;

        const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
        let name = '';
        for (const line of lines) {
          if (line.includes('◀') || line.includes('▶')) continue;
          if (statRegex.test(line)) continue;
          const clean = line.replace(/[^a-zA-Z0-9\\s\\u00C0-\\u00FF]/g, '').trim();
          if (clean && !clean.startsWith('Nv') && !clean.startsWith('IV') && clean.length > 1 && clean.length < 25) {
            name = clean;
            break;
          }
        }

        if (!name) {
          const beforeNv = text.split(/Nv\\.?/i)[0] || '';
          name = beforeNv.replace(/[◀▶\\n\\r\\t]/g, '').trim();
        }

        const lvlMatch = text.match(/(?:Nv|Lv|Lvl|Nível|Level)\.?\s*:?\s*(\d+)/i);
        const ivMatch = text.match(/IV\s*:?\s*(\d+)/i);
        const qMatch = text.match(/(?:Q|Qualidade|Multiplier|Mult)\.?\s*:?\s*([\d]+(?:[\.,]\d+)?)/i);

        if (!ivMatch || !qMatch) continue;

        const level = lvlMatch ? parseInt(lvlMatch[1], 10) : 1;
        const iv = parseInt(ivMatch[1], 10);
        const q = parseFloat(qMatch[1].replace(',', '.'));

        const sig = name + '_' + level + '_' + iv + '_' + q;
        if (seen.has(sig)) continue;
        seen.add(sig);

        const img = node.querySelector('img');
        const spriteUrl = img ? img.src : '';
        const isShiny = text.includes('✨') || !!node.querySelector('[class*="shiny"]');

        collected.push({
          name,
          level,
          iv,
          qualityMultiplier: q,
          spriteUrl,
          isShiny
        });
      }
    }

    // Coleta inicial
    harvest();

    // Se o contêiner tiver scroll, executa a descida automatizada suave
    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
      const originalScrollTop = scrollEl.scrollTop;
      const step = Math.max(120, Math.floor(scrollEl.clientHeight * 0.7));
      let lastScroll = -1;

      for (let s = 0; s < 40; s++) {
        scrollEl.scrollTop += step;
        await new Promise(r => setTimeout(r, 120));
        harvest();
        if (scrollEl.scrollTop === lastScroll || scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 5) {
          break;
        }
        lastScroll = scrollEl.scrollTop;
      }

      // Restaura o topo
      scrollEl.scrollTop = originalScrollTop;
    }

    return {
      success: true,
      depotDetected: !!familyHeader || collected.length > 0,
      count: collected.length,
      items: collected
    };
  } catch (err) {
    return {
      success: false,
      error: String(err)
    };
  }
})();
`;

export class FamilyDepotComponent {
  public readonly element: HTMLElement;
  private pokemons: DepotPokemonItem[] = [];
  private filteredPokemons: DepotPokemonItem[] = [];

  // Filtros locais da tabela
  private searchQuery = '';
  private qualityFilter = 'all';
  private sortOrder: 'default' | 'name' | 'iv_desc' | 'q_desc' | 'level_desc' | 'stats_desc' =
    'default';

  // Referências DOM
  private elAccountSelect!: HTMLSelectElement;
  private elBtnQuickScan!: HTMLButtonElement;
  private elBtnDeepScan!: HTMLButtonElement;
  private elBtnCopyTsv!: HTMLButtonElement;
  private elBtnDownloadTxt!: HTMLButtonElement;
  private elBtnClear!: HTMLButtonElement;
  private elKpiTotal!: HTMLElement;
  private elKpiAvgIv!: HTMLElement;
  private elKpiHighQuality!: HTMLElement;
  private elKpiStatusBadge!: HTMLElement;
  private elSearchInput!: HTMLInputElement;
  private elQualitySelect!: HTMLSelectElement;
  private elSortSelect!: HTMLSelectElement;
  private elTableBody!: HTMLElement;
  private elEmptyState!: HTMLElement;
  private elTsvPreviewContainer!: HTMLElement;
  private elTsvTextarea!: HTMLTextAreaElement;
  private elBtnToggleTsv!: HTMLButtonElement;
  private elBtnCopyRawTsv!: HTMLButtonElement;
  private isTsvVisible = false;

  constructor(
    private readonly getAccountOptions: () => AccountOption[],
    private readonly onToast?: (message: string, type?: 'info' | 'success' | 'danger') => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'family-depot-container';
    this.element.id = 'family-depot-view';

    this.render();
    this.bindDom();
    this.initEvents();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="family-depot-wrapper">
        <!-- CABEÇALHO DO DEPÓSITO DA FAMÍLIA -->
        <header class="depot-header">
          <div class="depot-header-left">
            <div class="depot-badge-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>DEPÓSITO DA FAMÍLIA</span>
            </div>
            <h1 class="depot-title">
              Leitor do Depósito & Exportador para Planilha
              <span id="depot-counter-badge" class="depot-title-counter">0 pokémons</span>
            </h1>
            <p class="depot-subtitle">
              Extrai automaticamente todos os Pokémons do cofre da família no jogo e formata em <strong>1 clique</strong> para colar direto na aba <code>Importar</code> do seu Google Sheets.
            </p>
          </div>

          <!-- AÇÕES PRINCIPAIS DE SCAN & EXPORTAÇÃO -->
          <div class="depot-header-actions">
            <!-- Seletor de Conta -->
            <div class="account-selector-box">
              <label for="depot-account-select" class="selector-label">Conta Ativa:</label>
              <select id="depot-account-select" class="depot-select account-dropdown">
                <!-- Populado dinamicamente -->
              </select>
            </div>

            <!-- Botões de Ação -->
            <button id="btn-depot-quick-scan" class="btn-depot btn-scan-quick" title="Lê instantaneamente os Pokémons visíveis do Depósito da Família">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span>Escanear Depot</span>
            </button>

            <button id="btn-depot-deep-scan" class="btn-depot btn-scan-deep" title="Executa rolagem automática para capturar até 150 Pokémons da lista">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <polyline points="8 12 12 16 16 12"/>
              </svg>
              <span>Auto-Scroll Completo</span>
            </button>

            <button id="btn-depot-copy-tsv" class="btn-depot btn-copy-sheets" title="Copia o formato TSV ideal para colar em A2 na aba Importar do Google Sheets">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>Copiar para Planilha (Ctrl+V)</span>
            </button>

            <button id="btn-depot-download-txt" class="btn-depot btn-download-file" title="Baixa arquivo .txt pronto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Baixar .txt</span>
            </button>

            <button id="btn-depot-clear" class="btn-depot btn-clear-list" title="Limpar lista capturada">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- BANNER DE INSTRUÇÕES RÁPIDAS (PRO TIP) -->
        <div class="depot-instructions-card">
          <div class="instructions-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="instructions-text">
            <strong>Como usar com a sua planilha do Google Sheets:</strong>
            Abra a janela <code>DEPÓSITO</code> no jogo na aba <code>Família: Pokémon</code>. Clique em <strong>Escanear Depot</strong> (ou <strong>Auto-Scroll Completo</strong> se houver muitos Pokémons). Em seguida, clique em <strong>Copiar para Planilha</strong>, vá até a aba <code>Importar</code> da sua planilha, clique na célula <code>A2</code> e pressione <code>Ctrl + V</code>. A <code>Pokédex_Box</code> calculará e colorirá tudo automaticamente!
          </div>
        </div>

        <!-- KPI SUMMARY STRIP -->
        <section class="depot-kpis-grid">
          <div class="depot-kpi-card">
            <span class="kpi-label">Pokémons Identificados</span>
            <span class="kpi-value highlight-cyan" id="kpi-depot-total">0</span>
            <span class="kpi-meta">No Depósito da Família</span>
          </div>

          <div class="depot-kpi-card">
            <span class="kpi-label">Média de IV Total</span>
            <span class="kpi-value highlight-gold" id="kpi-depot-avg-iv">0.0</span>
            <span class="kpi-meta">Escala de 0 a 192</span>
          </div>

          <div class="depot-kpi-card">
            <span class="kpi-label">Qualidade Máxima</span>
            <span class="kpi-value highlight-orange" id="kpi-depot-high-quality">--</span>
            <span class="kpi-meta">Maior raridade no cofre</span>
          </div>

          <div class="depot-kpi-card">
            <span class="kpi-label">Status do Jogo</span>
            <div class="kpi-status-container">
              <span id="kpi-depot-status" class="status-badge status-idle">Aguardando Varredura</span>
            </div>
            <span class="kpi-meta">Detecção do modal Depósito</span>
          </div>
        </section>

        <!-- BARRA DE FILTROS & BUSCA LOCAL -->
        <section class="depot-filters-card">
          <div class="depot-filters-row">
            <!-- Busca por nome -->
            <div class="filter-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="depot-filter-search" class="depot-search-input" placeholder="Filtrar por nome de Pokémon..." />
            </div>

            <!-- Filtro de Qualidade -->
            <div class="filter-group">
              <label for="depot-filter-quality" class="filter-label">Qualidade:</label>
              <select id="depot-filter-quality" class="depot-select">
                <option value="all">Todas as Qualidades</option>
                <option value="divina">Divina (Q ≥ 4.0)</option>
                <option value="ancia">Anciã (Q ≥ 3.0)</option>
                <option value="mitica">Mítica (Q ≥ 2.0)</option>
                <option value="lendaria">Lendária (Q ≥ 1.7)</option>
                <option value="epica">Épica (Q ≥ 1.5)</option>
                <option value="rara">Rara (Q ≥ 1.3)</option>
                <option value="incomum">Incomum (Q ≥ 1.1)</option>
                <option value="comum">Comum (Q ≥ 1.0)</option>
                <option value="fraca">Fraca (Q &lt; 1.0)</option>
              </select>
            </div>

            <!-- Ordenação -->
            <div class="filter-group">
              <label for="depot-filter-sort" class="filter-label">Ordenar por:</label>
              <select id="depot-filter-sort" class="depot-select">
                <option value="default">Ordem do Depósito</option>
                <option value="iv_desc">Maior IV</option>
                <option value="q_desc">Maior Qualidade (Q)</option>
                <option value="stats_desc">Maior Total de Atributos</option>
                <option value="level_desc">Maior Nível</option>
                <option value="name">Nome (A - Z)</option>
              </select>
            </div>

            <!-- Botão de Ver Texto TSV Bruto -->
            <button id="btn-toggle-tsv-view" class="btn-toggle-tsv" title="Exibe o texto exato tabulado que será colado na planilha">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 7 4 4 20 4 20 7"/>
                <line x1="9" y1="20" x2="15" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
              <span>Ver Formato TSV</span>
            </button>
          </div>

          <!-- ÁREA RECOLHÍVEL DO TEXTO TSV PRONTO PARA COPIAR -->
          <div id="depot-tsv-preview-box" class="depot-tsv-container" style="display: none;">
            <div class="tsv-preview-header">
              <span>Texto Tabulado Pronto para Google Sheets (Aba Importar, A2):</span>
              <button id="btn-copy-raw-tsv" class="btn-copy-raw">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar Texto Bruto
              </button>
            </div>
            <textarea id="depot-tsv-textarea" class="tsv-textarea" readonly placeholder="Nenhum Pokémon escaneado ainda..."></textarea>
          </div>
        </section>

        <!-- TABELA DE RESULTADOS DO DEPÓSITO DA FAMÍLIA -->
        <section class="depot-table-section">
          <div class="depot-table-card">
            <div class="table-responsive">
              <table class="depot-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="min-width: 180px;">Pokémon</th>
                    <th style="width: 80px;">Nível</th>
                    <th style="width: 110px;">Multiplicador</th>
                    <th style="width: 110px;">Qualidade</th>
                    <th style="width: 90px;">IV Total</th>
                    <th style="width: 60px;" title="Pontos de Vida Base">HP</th>
                    <th style="width: 60px;" title="Ataque Físico Base">Atk</th>
                    <th style="width: 60px;" title="Defesa Física Base">Def</th>
                    <th style="width: 60px;" title="Ataque Especial Base">SpA</th>
                    <th style="width: 60px;" title="Defesa Especial Base">SpD</th>
                    <th style="width: 60px;" title="Velocidade Base">Speed</th>
                    <th style="width: 100px;" title="Soma dos 6 Atributos">Total Stats</th>
                  </tr>
                </thead>
                <tbody id="depot-table-body">
                  <!-- Linhas renderizadas dinamicamente -->
                </tbody>
              </table>
            </div>

            <!-- ESTADO VAZIO -->
            <div id="depot-empty-state" class="depot-empty-state">
              <div class="empty-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h3>Nenhum Pokémon escaneado ainda</h3>
              <p>Abra o <strong>DEPÓSITO</strong> no jogo na aba <strong>Família: Pokémon</strong> e clique no botão <strong>Escanear Depot</strong> acima.</p>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  private bindDom(): void {
    this.elAccountSelect = this.element.querySelector(
      '#depot-account-select',
    ) as HTMLSelectElement;
    this.elBtnQuickScan = this.element.querySelector(
      '#btn-depot-quick-scan',
    ) as HTMLButtonElement;
    this.elBtnDeepScan = this.element.querySelector(
      '#btn-depot-deep-scan',
    ) as HTMLButtonElement;
    this.elBtnCopyTsv = this.element.querySelector(
      '#btn-depot-copy-tsv',
    ) as HTMLButtonElement;
    this.elBtnDownloadTxt = this.element.querySelector(
      '#btn-depot-download-txt',
    ) as HTMLButtonElement;
    this.elBtnClear = this.element.querySelector(
      '#btn-depot-clear',
    ) as HTMLButtonElement;

    this.elKpiTotal = this.element.querySelector('#kpi-depot-total') as HTMLElement;
    this.elKpiAvgIv = this.element.querySelector('#kpi-depot-avg-iv') as HTMLElement;
    this.elKpiHighQuality = this.element.querySelector(
      '#kpi-depot-high-quality',
    ) as HTMLElement;
    this.elKpiStatusBadge = this.element.querySelector(
      '#kpi-depot-status',
    ) as HTMLElement;

    this.elSearchInput = this.element.querySelector(
      '#depot-filter-search',
    ) as HTMLInputElement;
    this.elQualitySelect = this.element.querySelector(
      '#depot-filter-quality',
    ) as HTMLSelectElement;
    this.elSortSelect = this.element.querySelector(
      '#depot-filter-sort',
    ) as HTMLSelectElement;

    this.elTableBody = this.element.querySelector('#depot-table-body') as HTMLElement;
    this.elEmptyState = this.element.querySelector('#depot-empty-state') as HTMLElement;

    this.elTsvPreviewContainer = this.element.querySelector(
      '#depot-tsv-preview-box',
    ) as HTMLElement;
    this.elTsvTextarea = this.element.querySelector(
      '#depot-tsv-textarea',
    ) as HTMLTextAreaElement;
    this.elBtnToggleTsv = this.element.querySelector(
      '#btn-toggle-tsv-view',
    ) as HTMLButtonElement;
    this.elBtnCopyRawTsv = this.element.querySelector(
      '#btn-copy-raw-tsv',
    ) as HTMLButtonElement;
  }

  private initEvents(): void {
    // Escanear Rápido
    this.elBtnQuickScan.addEventListener('click', () => {
      this.executeScan(false);
    });

    // Escanear Profundo (com Auto-Scroll)
    this.elBtnDeepScan.addEventListener('click', () => {
      this.executeScan(true);
    });

    // Copiar para Planilha
    this.elBtnCopyTsv.addEventListener('click', () => {
      this.copyTsvToClipboard();
    });

    // Baixar Arquivo .txt
    this.elBtnDownloadTxt.addEventListener('click', () => {
      this.downloadTxtFile();
    });

    // Limpar Lista
    this.elBtnClear.addEventListener('click', () => {
      this.pokemons = [];
      this.applyFiltersAndRender();
      this.onToast?.('Lista do Depósito limpa com sucesso.', 'info');
    });

    // Toggle da visualização TSV
    this.elBtnToggleTsv.addEventListener('click', () => {
      this.isTsvVisible = !this.isTsvVisible;
      this.elTsvPreviewContainer.style.display = this.isTsvVisible ? 'block' : 'none';
      this.elBtnToggleTsv.classList.toggle('active', this.isTsvVisible);
    });

    // Copiar Texto Bruto da Textarea
    this.elBtnCopyRawTsv.addEventListener('click', () => {
      this.copyTsvToClipboard();
    });

    // Filtros em tempo real
    this.elSearchInput.addEventListener('input', () => {
      this.searchQuery = this.elSearchInput.value.trim().toLowerCase();
      this.applyFiltersAndRender();
    });

    this.elQualitySelect.addEventListener('change', () => {
      this.qualityFilter = this.elQualitySelect.value;
      this.applyFiltersAndRender();
    });

    this.elSortSelect.addEventListener('change', () => {
      this.sortOrder = this.elSortSelect.value as any;
      this.applyFiltersAndRender();
    });
  }

  /**
   * Atualiza as opções do dropdown de contas
   */
  public refreshAccountOptions(): void {
    const accounts = this.getAccountOptions();
    const currentVal = this.elAccountSelect.value;
    this.elAccountSelect.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'Todas as Contas (Varredura Geral)';
    this.elAccountSelect.appendChild(allOpt);

    accounts.forEach((acc, idx) => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = `${acc.name || `Slot 0${idx + 1}`}`;
      this.elAccountSelect.appendChild(opt);
    });

    if (currentVal && Array.from(this.elAccountSelect.options).some((o) => o.value === currentVal)) {
      this.elAccountSelect.value = currentVal;
    } else if (accounts.length > 0 && accounts[0]) {
      this.elAccountSelect.value = accounts[0].id;
    }
  }

  /**
   * Executa a varredura ativa do Depósito da Família no webview
   */
  public async executeScan(deepScroll = false): Promise<void> {
    const accounts = this.getAccountOptions();
    if (accounts.length === 0) {
      this.onToast?.('Nenhuma conta ativa encontrada.', 'danger');
      return;
    }

    const selectedAccountId = this.elAccountSelect.value;
    const targetAccounts =
      selectedAccountId === 'all'
        ? accounts
        : accounts.filter((a) => a.id === selectedAccountId);

    if (targetAccounts.length === 0) {
      this.onToast?.('Conta selecionada inválida.', 'danger');
      return;
    }

    const script = deepScroll ? INJECTION_DEPOT_DEEP_SCROLL_SCRIPT : INJECTION_DEPOT_SCAN_SCRIPT;
    const actionLabel = deepScroll ? 'Varredura Completa com Auto-Scroll' : 'Varredura Rápida';

    this.setScanningState(true, actionLabel);

    const gatheredRaw: Array<{
      name: string;
      level: number;
      iv: number;
      qualityMultiplier: number;
      spriteUrl?: string;
      isShiny?: boolean;
    }> = [];

    let detectedAnyDepot = false;

    for (const acc of targetAccounts) {
      try {
        if (!acc.webview || !acc.webview.isConnected) continue;
        const res = (await acc.webview.executeJavaScript(script, true)) as any;
        if (res && res.success) {
          if (res.depotDetected) detectedAnyDepot = true;
          if (Array.isArray(res.items)) {
            gatheredRaw.push(...res.items);
          }
        }
      } catch (err) {
        console.error(`Erro ao escanear conta ${acc.id}:`, err);
      }
    }

    this.setScanningState(false);

    if (!detectedAnyDepot && gatheredRaw.length === 0) {
      this.updateStatusBadge(false);
      this.onToast?.(
        'Depósito da Família não encontrado. Certifique-se de que a janela DEPÓSITO está aberta na aba "Família: Pokémon".',
        'danger',
      );
      return;
    }

    this.updateStatusBadge(true);

    // Mapeia e enriquece os Pokémons brutos com a base de dados oficial de baseStats
    const enrichedList: DepotPokemonItem[] = gatheredRaw.map((raw, idx) => {
      const qInfo = getQualityFromMultiplier(raw.qualityMultiplier);
      const species = getPokemonByName(raw.name);

      const hp = species ? species.baseStats.hp : 40;
      const atk = species ? species.baseStats.attack : 40;
      const def = species ? species.baseStats.defense : 40;
      const spa = species ? species.baseStats.specialAttack : 40;
      const spd = species ? species.baseStats.specialDefense : 40;
      const speed = species ? species.baseStats.speed : 40;
      const totalStats = hp + atk + def + spa + spd + speed;

      let sprite = raw.spriteUrl;
      if (!sprite && species) {
        sprite = getPokemonLocalSpriteUrl(species.dex);
      }

      return {
        id: `depot-${raw.name}-${raw.level}-${raw.iv}-${raw.qualityMultiplier}-${idx}`,
        name: raw.name || (species ? species.name : 'Desconhecido'),
        level: raw.level || 1,
        qualityMultiplier: Number(raw.qualityMultiplier) || 1.0,
        ivTotal: raw.iv || 0,
        hp,
        atk,
        def,
        spa,
        spd,
        speed,
        totalStats,
        qualityTier: qInfo.tier,
        qualityDisplayName: qInfo.label,
        qualityColor: qInfo.color,
        spriteUrl: sprite,
        isShiny: raw.isShiny,
        dex: species ? species.dex : undefined,
      };
    });

    this.pokemons = enrichedList;
    this.applyFiltersAndRender();

    this.onToast?.(
      `✔ ${enrichedList.length} Pokémons identificados no Depósito da Família!`,
      'success',
    );
  }

  private setScanningState(isScanning: boolean, label = ''): void {
    if (isScanning) {
      this.elBtnQuickScan.disabled = true;
      this.elBtnDeepScan.disabled = true;
      this.elBtnQuickScan.classList.add('loading');
      this.elBtnDeepScan.classList.add('loading');
      this.elKpiStatusBadge.className = 'status-badge status-scanning';
      this.elKpiStatusBadge.textContent = label || 'Escaneando...';
    } else {
      this.elBtnQuickScan.disabled = false;
      this.elBtnDeepScan.disabled = false;
      this.elBtnQuickScan.classList.remove('loading');
      this.elBtnDeepScan.classList.remove('loading');
    }
  }

  private updateStatusBadge(found: boolean): void {
    if (found) {
      this.elKpiStatusBadge.className = 'status-badge status-active';
      this.elKpiStatusBadge.textContent = 'Depósito Conectado';
    } else {
      this.elKpiStatusBadge.className = 'status-badge status-warning';
      this.elKpiStatusBadge.textContent = 'Depósito Não Detectado';
    }
  }

  private applyFiltersAndRender(): void {
    let list = [...this.pokemons];

    // Filtro por nome
    if (this.searchQuery) {
      list = list.filter((p) => p.name.toLowerCase().includes(this.searchQuery));
    }

    // Filtro por qualidade
    if (this.qualityFilter !== 'all') {
      list = list.filter((p) => p.qualityTier === this.qualityFilter);
    }

    // Ordenação
    if (this.sortOrder === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOrder === 'iv_desc') {
      list.sort((a, b) => b.ivTotal - a.ivTotal);
    } else if (this.sortOrder === 'q_desc') {
      list.sort((a, b) => b.qualityMultiplier - a.qualityMultiplier);
    } else if (this.sortOrder === 'level_desc') {
      list.sort((a, b) => b.level - a.level);
    } else if (this.sortOrder === 'stats_desc') {
      list.sort((a, b) => b.totalStats - a.totalStats);
    }

    this.filteredPokemons = list;
    this.updateKpis();
    this.renderTable();
    this.updateTsvPreview();
  }

  private updateKpis(): void {
    const count = this.filteredPokemons.length;
    this.elKpiTotal.textContent = String(count);

    const counterBadge = this.element.querySelector('#depot-counter-badge');
    if (counterBadge) {
      counterBadge.textContent = `${count} pokémons`;
    }

    if (count === 0) {
      this.elKpiAvgIv.textContent = '0.0';
      this.elKpiHighQuality.textContent = '--';
      return;
    }

    const sumIv = this.filteredPokemons.reduce((acc, p) => acc + p.ivTotal, 0);
    this.elKpiAvgIv.textContent = (sumIv / count).toFixed(1);

    // Maior qualidade
    const highestQ = Math.max(...this.filteredPokemons.map((p) => p.qualityMultiplier));
    const highestInfo = getQualityFromMultiplier(highestQ);
    this.elKpiHighQuality.textContent = `${highestInfo.label} (${highestQ.toFixed(2)})`;
    this.elKpiHighQuality.style.color = highestInfo.color;
  }

  private updateTsvPreview(): void {
    const tsvText = formatDepotPokemonsToTsv(this.filteredPokemons);
    this.elTsvTextarea.value = tsvText;
  }

  private renderTable(): void {
    if (this.filteredPokemons.length === 0) {
      this.elTableBody.innerHTML = '';
      this.elEmptyState.style.display = 'flex';
      return;
    }

    this.elEmptyState.style.display = 'none';

    this.elTableBody.innerHTML = this.filteredPokemons
      .map((p, index) => {
        const fallbackUrl = p.dex ? getPokemonSpriteUrl(p.dex) : '';
        const spriteSrc = p.spriteUrl || fallbackUrl;
        const spriteHtml = spriteSrc
          ? `<img src="${spriteSrc}" alt="${p.name}" class="pokemon-table-sprite" onerror="this.style.opacity='0.4'" loading="lazy" />`
          : `<span class="pokemon-sprite-placeholder">🎮</span>`;

        const shinyBadge = p.isShiny ? `<span class="table-shiny-badge" title="Shiny">✨</span>` : '';

        return `
          <tr class="depot-row quality-row-${p.qualityTier}">
            <td class="col-index">${index + 1}</td>
            <td class="col-pokemon">
              <div class="pokemon-cell">
                <div class="sprite-box">${spriteHtml}</div>
                <div class="pokemon-meta-text">
                  <span class="pokemon-name">${p.name} ${shinyBadge}</span>
                  ${p.dex ? `<span class="pokemon-dex">#${String(p.dex).padStart(3, '0')}</span>` : ''}
                </div>
              </div>
            </td>
            <td class="col-level"><span class="level-badge">Nv.${p.level}</span></td>
            <td class="col-multiplier"><strong>${p.qualityMultiplier.toFixed(2)}</strong></td>
            <td class="col-quality">
              <span class="quality-badge" style="color: ${p.qualityColor}; border-color: ${p.qualityColor}40; background-color: ${p.qualityColor}15;">
                ${p.qualityDisplayName}
              </span>
            </td>
            <td class="col-iv"><span class="iv-value">${p.ivTotal}</span></td>
            <td class="col-stat stat-hp">${p.hp}</td>
            <td class="col-stat stat-atk">${p.atk}</td>
            <td class="col-stat stat-def">${p.def}</td>
            <td class="col-stat stat-spa">${p.spa}</td>
            <td class="col-stat stat-spd">${p.spd}</td>
            <td class="col-stat stat-speed">${p.speed}</td>
            <td class="col-stat-total"><strong>${p.totalStats}</strong></td>
          </tr>
        `;
      })
      .join('');
  }

  /**
   * Copia o texto TSV gerado para o clipboard do Windows/Mac
   */
  public async copyTsvToClipboard(): Promise<void> {
    if (this.filteredPokemons.length === 0) {
      this.onToast?.('Nenhum Pokémon na lista para copiar.', 'info');
      return;
    }

    const tsvText = formatDepotPokemonsToTsv(this.filteredPokemons);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tsvText);
      } else {
        // Fallback seguro via textarea
        const temp = document.createElement('textarea');
        temp.value = tsvText;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.focus();
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }

      this.onToast?.(
        '✔ Texto copiado! Vá na aba Importar do Sheets, clique em A2 e aperte Ctrl + V.',
        'success',
      );
    } catch (err) {
      console.error('Falha ao copiar:', err);
      this.onToast?.('Não foi possível copiar automaticamente para a área de transferência.', 'danger');
    }
  }

  /**
   * Realiza o download direto de arquivo .txt no formato TSV
   */
  public downloadTxtFile(): void {
    if (this.filteredPokemons.length === 0) {
      this.onToast?.('Nenhum Pokémon na lista para baixar.', 'info');
      return;
    }

    const tsvText = formatDepotPokemonsToTsv(this.filteredPokemons);
    const blob = new Blob([tsvText], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `deposito_familia_${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.onToast?.(`✔ Arquivo deposito_familia_${dateStr}.txt salvo com sucesso!`, 'success');
  }
}
