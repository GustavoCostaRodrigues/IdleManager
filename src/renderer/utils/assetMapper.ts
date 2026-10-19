import type { BallInventoryType, PotionInventoryType } from '../../shared/telemetryTypes.js';

const DEFAULT_FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none"><circle cx="8" cy="8" r="6.8" fill="#1C1E24" stroke="#FFE066" stroke-width="1.2"/><line x1="1.2" y1="8" x2="14.8" y2="8" stroke="#0F1117" stroke-width="1.4"/><circle cx="8" cy="8" r="2.2" fill="#FFFFFF" stroke="#0F1117" stroke-width="1"/></svg>'
);

/**
 * Base relativa para carregamento de assets estáticos no processo Renderer do Electron.
 * Como o index.html está em dist/renderer/ (ou src/renderer/), 'assets/...' aponta diretamente
 * para os arquivos copiados durante o build / empacotamento.
 */
export const ASSETS_BASE_DIR = 'assets';

/**
 * Dicionário unificado de arquivos de itens locais organizados em assets/items/, assets/stones/ e assets/types/
 */
export const LOCAL_ASSET_REGISTRY: Record<string, string> = {
  // --- POKÉBOLAS ---
  ultraball: 'assets/items/ultraball.png',
  'ultraball.png': 'assets/items/ultraball.png',
  'ultra ball': 'assets/items/ultraball.png',
  'ultra-ball': 'assets/items/ultraball.png',

  greatball: 'assets/items/greatball.png',
  'greatball.png': 'assets/items/greatball.png',
  'great ball': 'assets/items/greatball.png',
  'great-ball': 'assets/items/greatball.png',

  superball: 'assets/items/superball.png',
  'superball.png': 'assets/items/superball.png',
  'super ball': 'assets/items/superball.png',
  'super-ball': 'assets/items/superball.png',

  pokeball: 'assets/items/pokeball.png',
  'pokeball.png': 'assets/items/pokeball.png',
  'poke ball': 'assets/items/pokeball.png',
  'poké ball': 'assets/items/pokeball.png',
  'poke-ball': 'assets/items/pokeball.png',

  rubber_ball: 'assets/items/rubber_ball.png',
  'rubber_ball.png': 'assets/items/rubber_ball.png',
  'rubber ball': 'assets/items/rubber_ball.png',
  'rubber-ball': 'assets/items/rubber_ball.png',

  earth_ball: 'assets/items/earth_ball.png',
  'earth_ball.png': 'assets/items/earth_ball.png',
  'earth ball': 'assets/items/earth_ball.png',
  'earth-ball': 'assets/items/earth_ball.png',

  idleball: 'assets/items/idleball.png',
  'idleball.png': 'assets/items/idleball.png',
  'idle ball': 'assets/items/idleball.png',
  'idle-ball': 'assets/items/idleball.png',

  golden_idleball: 'assets/items/idleball_gold.png',
  idleball_gold: 'assets/items/idleball_gold.png',
  'idleball_gold.png': 'assets/items/idleball_gold.png',
  'golden idle ball': 'assets/items/idleball_gold.png',
  'golden-idle-ball': 'assets/items/idleball_gold.png',

  masterball: 'assets/items/ultraball.png', // Fallback inteligente para masterball

  // --- POÇÕES ---
  small: 'assets/items/small_potion.png',
  potion: 'assets/items/small_potion.png',
  small_potion: 'assets/items/small_potion.png',
  'small_potion.png': 'assets/items/small_potion.png',
  'small potion': 'assets/items/small_potion.png',
  'poção': 'assets/items/small_potion.png',
  'poção pequena': 'assets/items/small_potion.png',

  great: 'assets/items/great_potion.png',
  great_potion: 'assets/items/great_potion.png',
  'great_potion.png': 'assets/items/great_potion.png',
  'great potion': 'assets/items/great_potion.png',
  'super potion': 'assets/items/great_potion.png',

  ultra: 'assets/items/ultra_potion.png',
  ultra_potion: 'assets/items/ultra_potion.png',
  'ultra_potion.png': 'assets/items/ultra_potion.png',
  'ultra potion': 'assets/items/ultra_potion.png',

  hyper: 'assets/items/hyper_potion.png',
  hyper_potion: 'assets/items/hyper_potion.png',
  'hyper_potion.png': 'assets/items/hyper_potion.png',
  'hyper potion': 'assets/items/hyper_potion.png',

  ultimate: 'assets/items/ultimate_potion.png',
  ultimate_potion: 'assets/items/ultimate_potion.png',
  'ultimate_potion.png': 'assets/items/ultimate_potion.png',
  'ultimate potion': 'assets/items/ultimate_potion.png',

  // --- PEDRAS / STONES ---
  ancient_stone: 'assets/stones/ancient_stone.gif',
  'ancient_stone.gif': 'assets/stones/ancient_stone.gif',
  darkness_stone: 'assets/items/darkness_stone.gif',
  'darkness_stone.gif': 'assets/items/darkness_stone.gif',
  earth_stone: 'assets/items/earth_stone.gif',
  'earth_stone.gif': 'assets/items/earth_stone.gif',
  enigma_stone: 'assets/items/enigma_stone.gif',
  'enigma_stone.gif': 'assets/items/enigma_stone.gif',
  fire_stone: 'assets/items/fire_stone.gif',
  'fire_stone.gif': 'assets/items/fire_stone.gif',
  heart_stone: 'assets/items/heart_stone.gif',
  'heart_stone.gif': 'assets/items/heart_stone.gif',
  ice_stone: 'assets/items/ice_stone.gif',
  'ice_stone.gif': 'assets/items/ice_stone.gif',
  rock_stone: 'assets/items/rock_stone.gif',
  'rock_stone.gif': 'assets/items/rock_stone.gif',
  thunder_stone: 'assets/items/thunder_stone.gif',
  'thunder_stone.gif': 'assets/items/thunder_stone.gif',

  // --- ITENS E DROPS DA HUNT ---
  band_aid: 'assets/items/band_aid.png',
  'band_aid.png': 'assets/items/band_aid.png',
  bitten_apple: 'assets/items/bitten_apple.png',
  'bitten_apple.png': 'assets/items/bitten_apple.png',
  electric_box: 'assets/items/electric_box.png',
  'electric_box.png': 'assets/items/electric_box.png',
  enchanted_gem: 'assets/items/enchanted_gem.png',
  'enchanted_gem.png': 'assets/items/enchanted_gem.png',
  essence_of_fire: 'assets/items/essence_of_fire.png',
  'essence_of_fire.png': 'assets/items/essence_of_fire.png',
  feather: 'assets/items/feather.png',
  'feather.png': 'assets/items/feather.png',
  fur: 'assets/items/fur.png',
  'fur.png': 'assets/items/fur.png',
  future_orb: 'assets/items/future_orb.png',
  'future_orb.png': 'assets/items/future_orb.png',
  ice_bra: 'assets/items/ice_bra.png',
  'ice_bra.png': 'assets/items/ice_bra.png',
  ice_orb: 'assets/items/ice_orb.png',
  'ice_orb.png': 'assets/items/ice_orb.png',
  lizard_tail: 'assets/items/lizard_tail.png',
  'lizard_tail.png': 'assets/items/lizard_tail.png',
  martial_arts_scroll: 'assets/items/martial_arts_scroll.png',
  'martial_arts_scroll.png': 'assets/items/martial_arts_scroll.png',
  pot_of_lava: 'assets/items/pot_of_lava.png',
  'pot_of_lava.png': 'assets/items/pot_of_lava.png',
  punch_machine: 'assets/items/punch_machine.png',
  'punch_machine.png': 'assets/items/punch_machine.png',
  rat_tail: 'assets/items/rat_tail.png',
  'rat_tail.png': 'assets/items/rat_tail.png',
  sandbag: 'assets/items/sandbag.png',
  'sandbag.png': 'assets/items/sandbag.png',
  screw: 'assets/items/screw.png',
  'screw.png': 'assets/items/screw.png',
  sheep_wool: 'assets/items/sheep_wool.png',
  'sheep_wool.png': 'assets/items/sheep_wool.png',
  ski_poles: 'assets/items/ski_poles.png',
  'ski_poles.png': 'assets/items/ski_poles.png',
  small_stone: 'assets/items/small_stone.png',
  'small_stone.png': 'assets/items/small_stone.png',
  snow_skis: 'assets/items/snow_skis.png',
  'snow_skis.png': 'assets/items/snow_skis.png',
  snowball: 'assets/items/snowball.png',
  'snowball.png': 'assets/items/snowball.png',
  spin_machine: 'assets/items/spin_machine.png',
  'spin_machine.png': 'assets/items/spin_machine.png',
  stone_orb: 'assets/items/stone_orb.png',
  'stone_orb.png': 'assets/items/stone_orb.png',
  straw: 'assets/items/straw.png',
  'straw.png': 'assets/items/straw.png',
  tusk: 'assets/items/tusk.png',
  'tusk.png': 'assets/items/tusk.png',
};

/**
 * Extrai o nome do arquivo limpo de uma URL (ex: 'https://poke.idleworld.online/assets/items/rubber_ball.png?v=1' -> 'rubber_ball.png')
 */
export function extractFileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const qSplit = url.split('?')[0] ?? '';
    const cleanUrl = qSplit.split('#')[0] ?? '';
    const parts = cleanUrl.split('/');
    const last = parts[parts.length - 1];
    return last && last.includes('.') ? last.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Normaliza qualquer string para busca no dicionário de assets
 */
export function sanitizeAssetKey(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/[×x*]/g, '')
    .replace(/[^a-z0-9_.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Retorna o caminho do asset local correspondente a uma Pokébola ativa
 */
export function getBallAssetPath(ballTypeOrName: BallInventoryType | string, domUrlOrFileName?: string | null): string {
  // 1. Tenta pelo nome do arquivo extraído da URL do jogo
  const fileName = extractFileNameFromUrl(domUrlOrFileName);
  if (fileName && LOCAL_ASSET_REGISTRY[fileName]) {
    return LOCAL_ASSET_REGISTRY[fileName]!;
  }

  // 2. Tenta pela chave normalizada
  const key = sanitizeAssetKey(ballTypeOrName);
  if (LOCAL_ASSET_REGISTRY[key]) {
    return LOCAL_ASSET_REGISTRY[key]!;
  }

  // 3. Checagens específicas por substring (com rigor para não capturar o domínio poke.idleworld.online)
  const lower = (ballTypeOrName || '').toLowerCase();
  if (lower.includes('rubber')) return LOCAL_ASSET_REGISTRY['rubber_ball'] ?? 'assets/items/rubber_ball.png';
  if (lower.includes('earth')) return LOCAL_ASSET_REGISTRY['earth_ball'] ?? 'assets/items/earth_ball.png';
  if (lower.includes('gold')) return LOCAL_ASSET_REGISTRY['idleball_gold'] ?? 'assets/items/idleball_gold.png';
  // Exige correspondência explícita com 'idleball' ou 'idle_ball', nunca apenas a palavra solta 'idle'
  if (lower.includes('idleball') || lower.includes('idle_ball') || lower.includes('idle ball')) {
    return LOCAL_ASSET_REGISTRY['idleball'] ?? 'assets/items/idleball.png';
  }
  if (lower.includes('ultra')) return LOCAL_ASSET_REGISTRY['ultraball'] ?? 'assets/items/ultraball.png';
  if (lower.includes('great')) return LOCAL_ASSET_REGISTRY['greatball'] ?? 'assets/items/greatball.png';
  if (lower.includes('super')) return LOCAL_ASSET_REGISTRY['superball'] ?? 'assets/items/superball.png';
  if (lower.includes('poke')) return LOCAL_ASSET_REGISTRY['pokeball'] ?? 'assets/items/pokeball.png';

  // 4. Fallback padrão para Ultra Ball local
  return LOCAL_ASSET_REGISTRY['ultraball'] ?? 'assets/items/ultraball.png';
}

/**
 * Retorna o caminho do asset local correspondente a uma Poção ativa
 */
export function getPotionAssetPath(potionTypeOrName: PotionInventoryType | string, domUrlOrFileName?: string | null): string {
  // 1. Tenta pelo nome do arquivo extraído da URL do jogo
  const fileName = extractFileNameFromUrl(domUrlOrFileName);
  if (fileName && LOCAL_ASSET_REGISTRY[fileName]) {
    return LOCAL_ASSET_REGISTRY[fileName]!;
  }

  // 2. Tenta pela chave normalizada
  const key = sanitizeAssetKey(potionTypeOrName);
  if (LOCAL_ASSET_REGISTRY[key]) {
    return LOCAL_ASSET_REGISTRY[key]!;
  }

  // 3. Checagens por substring
  const lower = (potionTypeOrName || '').toLowerCase();
  if (lower.includes('small') || lower.includes('pequena') || lower.includes('pocao') || lower.includes('poção')) {
    return LOCAL_ASSET_REGISTRY['small_potion'] ?? 'assets/items/small_potion.png';
  }
  if (lower.includes('ultimate') || lower.includes('suprema') || lower.includes('definitiva')) {
    return LOCAL_ASSET_REGISTRY['ultimate_potion'] ?? 'assets/items/ultimate_potion.png';
  }
  if (lower.includes('hyper') || lower.includes('hiper')) {
    return LOCAL_ASSET_REGISTRY['hyper_potion'] ?? 'assets/items/hyper_potion.png';
  }
  // Exige que não seja uma ultraball e que contenha ultra
  if (lower.includes('ultra') && !lower.includes('ball')) {
    return LOCAL_ASSET_REGISTRY['ultra_potion'] ?? 'assets/items/ultra_potion.png';
  }
  if (lower.includes('great') || lower.includes('super')) {
    return LOCAL_ASSET_REGISTRY['great_potion'] ?? 'assets/items/great_potion.png';
  }

  // 4. Fallback padrão para Small Potion local
  return LOCAL_ASSET_REGISTRY['small_potion'] ?? 'assets/items/small_potion.png';
}

/**
 * Retorna o asset local de qualquer item ou drop
 */
export function getItemAssetPath(itemKeyOrName: string, domUrlOrFileName?: string | null): string | null {
  const fileName = extractFileNameFromUrl(domUrlOrFileName);
  if (fileName && LOCAL_ASSET_REGISTRY[fileName]) {
    return LOCAL_ASSET_REGISTRY[fileName]!;
  }

  const key = sanitizeAssetKey(itemKeyOrName);
  if (LOCAL_ASSET_REGISTRY[key]) {
    return LOCAL_ASSET_REGISTRY[key]!;
  }

  return null;
}

/**
 * Retorna o asset local do ícone de Tipo elemental (assets/types/<type>.png)
 */
export function getTypeAssetPath(type: string): string {
  const clean = (type || '').toLowerCase().trim();
  return `assets/types/${clean}.png`;
}

/**
 * Gera a tag <img> HTML completa com o asset local do item e fallback seguro via SVG Data URI
 */
export function renderAssetImgHtml(
  typeOrKey: string,
  category: 'ball' | 'potion' | 'item' | 'type',
  domUrl?: string | null,
  altText?: string,
  cssClass: string = 'item-sprite'
): string {
  let localPath: string;
  let fallbackDataUri: string;

  if (category === 'ball') {
    localPath = getBallAssetPath(typeOrKey, domUrl);
    fallbackDataUri = DEFAULT_FALLBACK_SVG;
  } else if (category === 'potion') {
    localPath = getPotionAssetPath(typeOrKey, domUrl);
    fallbackDataUri = DEFAULT_FALLBACK_SVG;
  } else if (category === 'type') {
    localPath = getTypeAssetPath(typeOrKey);
    fallbackDataUri = DEFAULT_FALLBACK_SVG;
  } else {
    localPath = getItemAssetPath(typeOrKey, domUrl) || 'assets/items/small_stone.png';
    fallbackDataUri = DEFAULT_FALLBACK_SVG;
  }

  const alt = altText || typeOrKey;
  return `<img src="${localPath}" class="${cssClass}" alt="${alt}" onerror="this.onerror=null; this.src='${fallbackDataUri}'" />`;
}
