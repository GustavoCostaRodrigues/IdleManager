import type { BallInventoryType, PotionInventoryType } from '../../shared/telemetryTypes.js';
import { getBallAssetPath, getPotionAssetPath } from '../utils/assetMapper.js';

export function getBallIconSvg(type: BallInventoryType = 'ultraball'): string {
  switch (type) {
    case 'ultraball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-ultra">
          <circle cx="8" cy="8" r="6.8" fill="#1C1E24" stroke="#FFE066" stroke-width="1.2"/>
          <path d="M4 3.5 L6.5 8 M12 3.5 L9.5 8" stroke="#FFE066" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#FFE066"/>
        </svg>
      `;
    case 'greatball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-great">
          <circle cx="8" cy="8" r="6.8" fill="#F0F6FC" stroke="#38BDF8" stroke-width="1.2"/>
          <path d="M1.2 8 A6.8 6.8 0 0 1 14.8 8" fill="#38BDF8"/>
          <path d="M3.5 5.5 L5.5 8 M12.5 5.5 L10.5 8" stroke="#F43F5E" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#38BDF8"/>
        </svg>
      `;
    case 'superball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-super">
          <circle cx="8" cy="8" r="6.8" fill="#F0F6FC" stroke="#0284C7" stroke-width="1.2"/>
          <path d="M1.2 8 A6.8 6.8 0 0 1 14.8 8" fill="#0284C7"/>
          <circle cx="8" cy="4.5" r="2" fill="#FACC15"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#FACC15"/>
        </svg>
      `;
    case 'idleball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-idle">
          <circle cx="8" cy="8" r="6.8" fill="#0F172A" stroke="#38BDF8" stroke-width="1.2"/>
          <path d="M2 5 L5 2 M14 5 L11 2" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="5.5" y="5.5" width="5" height="5" rx="1" fill="#38BDF8"/>
          <circle cx="8" cy="8" r="1.2" fill="#FFFFFF"/>
        </svg>
      `;
    case 'golden_idleball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-golden">
          <circle cx="8" cy="8" r="6.8" fill="#1C1917" stroke="#FACC15" stroke-width="1.2"/>
          <path d="M2 5 L5 2 M14 5 L11 2" stroke="#FDE047" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M8 2 L9.5 5.5 L13 6 L10.5 8.5 L11 12 L8 10.5 L5 12 L5.5 8.5 L3 6 L6.5 5.5 Z" fill="#FACC15" opacity="0.65"/>
          <circle cx="8" cy="8" r="2" fill="#FEF08A"/>
        </svg>
      `;
    case 'masterball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-master">
          <circle cx="8" cy="8" r="6.8" fill="#1E1B4B" stroke="#A855F7" stroke-width="1.2"/>
          <path d="M1.2 8 A6.8 6.8 0 0 1 14.8 8" fill="#7E22CE"/>
          <circle cx="5" cy="5.5" r="1.4" fill="#F43F5E"/>
          <circle cx="11" cy="5.5" r="1.4" fill="#F43F5E"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#A855F7"/>
        </svg>
      `;
    case 'rubber_ball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-rubber">
          <circle cx="8" cy="8" r="6.8" fill="#78350F" stroke="#D97706" stroke-width="1.2"/>
          <path d="M1.2 8 A6.8 6.8 0 0 1 14.8 8" fill="#D97706"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#D97706"/>
        </svg>
      `;
    case 'earth_ball':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-earth">
          <circle cx="8" cy="8" r="6.8" fill="#15803D" stroke="#A16207" stroke-width="1.2"/>
          <path d="M1.2 8 A6.8 6.8 0 0 1 14.8 8" fill="#A16207"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#15803D"/>
        </svg>
      `;
    case 'pokeball':
    default:
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg ball-poke">
          <circle cx="8" cy="8" r="6.8" fill="#F0F6FC" stroke="#F43F5E" stroke-width="1.2"/>
          <path d="M1.2 8 A6.8 6.8 0 0 1 14.8 8" fill="#F43F5E"/>
          <line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/>
          <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/>
          <circle cx="8" cy="8" r="0.8" fill="#F43F5E"/>
        </svg>
      `;
  }
}

export function getPotionIconSvg(type: PotionInventoryType = 'small'): string {
  let liquidColor = '#FACC15'; // Frasco amarelo oficial da Small Potion do Poke Idle World
  let glowColor = 'transparent';

  switch (type) {
    case 'small':
    case 'potion':
      liquidColor = '#FACC15'; // amarelo
      break;
    case 'great':
      liquidColor = '#22C55E'; // verde
      break;
    case 'ultra':
      liquidColor = '#38BDF8'; // azul
      break;
    case 'hyper':
      liquidColor = '#F43F5E'; // rosa/vermelho
      break;
    case 'ultimate':
      liquidColor = '#0F172A';
      glowColor = '#10B981'; // verde neon
      break;
    default:
      liquidColor = '#FACC15';
      break;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" class="supply-svg potion-svg potion-${type}">
      <!-- Bico spray aplicador superior branco -->
      <path d="M6 1.8 H9.5 V3.8 H8.8 V4.8 H6.8 V3.8 H6 Z" fill="#E2E8F0"/>
      <path d="M8.8 1.8 L11.8 2.5 L11.2 3.8 L8.8 3.3 Z" fill="#CBD5E1"/>
      <!-- Corpo retangular da garrafa -->
      <rect x="4.8" y="4.8" width="6.4" height="9.4" rx="1.6" fill="${liquidColor}" stroke="#1E293B" stroke-width="0.8"/>
      ${glowColor !== 'transparent' ? `<rect x="5.4" y="5.4" width="5.2" height="8.2" rx="1" stroke="${glowColor}" stroke-width="0.8" fill="none" opacity="0.8"/>` : ''}
      <!-- Reflexo de vidro -->
      <path d="M5.8 6.5 H6.8 V12.5 H5.8 Z" fill="#FFFFFF" opacity="0.35"/>
    </svg>
  `;
}

/**
 * Converte um SVG de Pokébola em uma Data URI infalível que funciona offline
 * e não depende de requisições de rede.
 */
export function getBallDataUri(type: BallInventoryType = 'ultraball'): string {
  const svg = getBallIconSvg(type).trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Converte um SVG de Poção em uma Data URI infalível que funciona offline
 * e não depende de requisições de rede.
 */
export function getPotionDataUri(type: PotionInventoryType = 'small'): string {
  const svg = getPotionIconSvg(type).trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Retorna a Data URI local SVG infalível para qualquer item (Pokébolas e Poções)
 */
export function getSupplyFallbackDataUri(type: string): string {
  const t = (type || '').toLowerCase();
  if (
    t.includes('ball') ||
    t === 'pokeball' ||
    t === 'greatball' ||
    t === 'superball' ||
    t === 'ultraball' ||
    t === 'masterball' ||
    t === 'idleball' ||
    t === 'golden_idleball' ||
    t === 'rubber_ball' ||
    t === 'earth_ball'
  ) {
    return getBallDataUri(t as BallInventoryType);
  }
  return getPotionDataUri(t as PotionInventoryType);
}

/**
 * Mapeamento de URLs públicas de sprites de itens (PokeAPI).
 */
export const ITEM_SPRITE_FALLBACKS: Record<string, string> = {
  pokeball: 'assets/items/pokeball.png',
  greatball: 'assets/items/greatball.png',
  superball: 'assets/items/superball.png',
  ultraball: 'assets/items/ultraball.png',
  rubber_ball: 'assets/items/rubber_ball.png',
  earth_ball: 'assets/items/earth_ball.png',
  masterball: 'assets/items/ultraball.png',
  idleball: 'assets/items/idleball.png',
  golden_idleball: 'assets/items/idleball_gold.png',

  small: 'assets/items/small_potion.png',
  potion: 'assets/items/small_potion.png',
  great: 'assets/items/great_potion.png',
  ultra: 'assets/items/ultra_potion.png',
  hyper: 'assets/items/hyper_potion.png',
  ultimate: 'assets/items/ultimate_potion.png',
};

/**
 * Retorna o caminho do asset local oficial correspondente (ex: 'assets/items/rubber_ball.png')
 */
export function getItemSpriteUrl(type: string, domUrl?: string | null): string {
  const t = (type || '').toLowerCase();
  if (
    t.includes('ball') ||
    t === 'pokeball' ||
    t === 'greatball' ||
    t === 'superball' ||
    t === 'ultraball' ||
    t === 'masterball' ||
    t === 'idleball' ||
    t === 'golden_idleball' ||
    t === 'rubber_ball' ||
    t === 'earth_ball'
  ) {
    return getBallAssetPath(type as BallInventoryType, domUrl);
  }
  return getPotionAssetPath(type as PotionInventoryType, domUrl);
}

/**
 * Retorna a tag <img> com tamanho 16x16px carregando diretamente os arquivos locais
 * dos assets reais do jogo (assets/items/...) com fallback instantâneo via SVG Data URI.
 */
export function getItemSpriteHtml(type: string, domUrl?: string | null, altText?: string): string {
  const localUrl = getItemSpriteUrl(type, domUrl);
  const fallbackUri = getSupplyFallbackDataUri(type);

  return `<img src="${localUrl}" class="item-sprite" alt="${altText || type}" onerror="this.onerror=null; this.src='${fallbackUri}'" />`;
}
