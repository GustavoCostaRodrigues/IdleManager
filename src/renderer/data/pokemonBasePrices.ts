import { getPokemonByName } from './pokemonBaseStats.js';

/**
 * Tabela de precificação base fixa em dólares ($) para cada espécie de Pokémon.
 * Regra: Atributos complexos (IV, level, gênero) são desconsiderados na valoração da hunt,
 * mapeando estritamente o nome do Pokémon para seu valor base fixo em dólares do jogo.
 */
export const POKEMON_BASE_PRICES: Record<string, number> = {
  // --- GERAÇÃO 1 ---
  bulbasaur: 1000,
  ivysaur: 2500,
  venusaur: 6000,
  charmander: 1000,
  charmeleon: 2500,
  charizard: 6000,
  squirtle: 1000,
  wartortle: 2500,
  blastoise: 6000,
  caterpie: 50,
  metapod: 100,
  butterfree: 450,
  weedle: 50,
  kakuna: 100,
  beedrill: 450,
  pidgey: 80,
  pidgeotto: 300,
  pidgeot: 800,
  rattata: 60,
  raticate: 250,
  spearow: 90,
  fearow: 350,
  ekans: 120,
  arbok: 400,
  pikachu: 1500,
  raichu: 3500,
  sandshrew: 150,
  sandslash: 500,
  'nidoran♀': 120,
  'nidoran female': 120,
  nidorina: 350,
  nidoqueen: 1200,
  'nidoran♂': 120,
  'nidoran male': 120,
  nidorino: 350,
  nidoking: 1200,
  clefairy: 600,
  clefable: 1800,
  vulpix: 400,
  ninetales: 1500,
  jigglypuff: 300,
  wigglytuff: 1000,
  zubat: 70,
  golbat: 350,
  oddish: 100,
  gloom: 300,
  vileplume: 1100,
  paras: 110,
  parasect: 400,
  venonat: 130,
  venomoth: 450,
  diglett: 120,
  dugtrio: 500,
  meowth: 150,
  persian: 550,
  psyduck: 180,
  golduck: 650,
  mankey: 200,
  primeape: 700,
  growlithe: 600,
  arcanine: 2200,
  poliwag: 130,
  poliwhirl: 450,
  poliwrath: 1400,
  abra: 400,
  kadabra: 1200,
  alakazam: 3500,
  machop: 250,
  machoke: 800,
  machamp: 2500,
  bellsprout: 100,
  weepinbell: 350,
  victreebel: 1200,
  tentacool: 120,
  tentacruel: 600,
  geodude: 150,
  graveler: 500,
  golem: 1800,
  ponyta: 300,
  rapidash: 1000,
  slowpoke: 200,
  slowbro: 900,
  magnemite: 250,
  magneton: 850,
  "farfetch'd": 500,
  farfetchd: 500,
  doduo: 180,
  dodrio: 650,
  seel: 250,
  dewgong: 900,
  grimer: 220,
  muk: 800,
  shellder: 200,
  cloyster: 1000,
  gastly: 400,
  haunter: 1200,
  gengar: 3500,
  onix: 600,
  drowzee: 200,
  hypno: 750,
  krabby: 150,
  kingler: 600,
  voltorb: 180,
  electrode: 650,
  exeggcute: 250,
  exeggutor: 1100,
  cubone: 300,
  marowak: 950,
  hitmonlee: 1500,
  hitmonchan: 1500,
  lickitung: 800,
  koffing: 180,
  weezing: 700,
  rhyhorn: 350,
  rhydon: 1200,
  chansey: 2500,
  tangela: 400,
  kangaskhan: 2000,
  horsea: 180,
  seadra: 650,
  goldeen: 120,
  seaking: 450,
  staryu: 180,
  starmie: 850,
  'mr. mime': 1200,
  'mr mime': 1200,
  mrmime: 1200,
  scyther: 2000,
  jynx: 1400,
  electabuzz: 2000,
  magmar: 2000,
  pinsir: 1800,
  tauros: 1200,
  magikarp: 20,
  gyarados: 3500,
  lapras: 3000,
  ditto: 1500,
  eevee: 1500,
  vaporeon: 3500,
  jolteon: 3500,
  flareon: 3500,
  porygon: 2000,
  omanyte: 1000,
  omastar: 3000,
  kabuto: 1000,
  kabutops: 3000,
  aerodactyl: 3500,
  snorlax: 4000,
  articuno: 25000,
  zapdos: 25000,
  moltres: 25000,
  dratini: 2500,
  dragonair: 6000,
  dragonite: 15000,
  mewtwo: 50000,
  mew: 50000,

  // --- POPULARES GEN 2 & DEMAIS ---
  espeon: 4000,
  umbreon: 4000,
  scizor: 5000,
  tyranitar: 15000,
  lugia: 30000,
  'ho-oh': 30000,
  hooh: 30000,
  sceptile: 7000,
  blaziken: 7000,
  swampert: 7000,
  gardevoir: 5500,
  salamence: 15000,
  metagross: 15000,
  kyogre: 35000,
  groudon: 35000,
  rayquaza: 40000,
  infernape: 7000,
  lucario: 6000,
  garchomp: 15000,
  togekiss: 5000,
  dialga: 40000,
  palkia: 40000,
  giratina: 40000,
  darkrai: 35000,
  arceus: 50000,
};

/**
 * Retorna o valor fixo em dólares do Pokémon a partir de seu nome.
 */
export function getPokemonBaseDollarPrice(pokemonName: string): number {
  if (!pokemonName) return 100;

  const clean = pokemonName
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim();

  // 1. Procura na tabela direta
  if (POKEMON_BASE_PRICES[clean] !== undefined) {
    return POKEMON_BASE_PRICES[clean];
  }

  // 2. Tenta chave sem hífens ou espaços
  const simplified = clean.replace(/[\s-_]/g, '');
  for (const [key, val] of Object.entries(POKEMON_BASE_PRICES)) {
    if (key.replace(/[\s-_]/g, '') === simplified) {
      return val;
    }
  }

  // 3. Fallback inteligente baseado nos baseStats da espécie
  const species = getPokemonByName(pokemonName);
  if (species && species.baseStats) {
    const total =
      species.baseStats.hp +
      species.baseStats.attack +
      species.baseStats.defense +
      species.baseStats.specialAttack +
      species.baseStats.specialDefense +
      species.baseStats.speed;
    return Math.max(100, Math.round(total * 1.5));
  }

  // 4. Fallback padrão seguro
  return 200;
}
