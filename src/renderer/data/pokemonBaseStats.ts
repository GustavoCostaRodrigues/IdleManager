export interface PokemonSpeciesData {
  dex: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

export const POKEMON_DATABASE: PokemonSpeciesData[] = [
  // Gen 1 Starters & Icons
  {
    dex: 1,
    name: 'Bulbasaur',
    types: ['Grass', 'Poison'],
    baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
  },
  {
    dex: 2,
    name: 'Ivysaur',
    types: ['Grass', 'Poison'],
    baseStats: { hp: 60, attack: 62, defense: 63, specialAttack: 80, specialDefense: 80, speed: 60 },
  },
  {
    dex: 3,
    name: 'Venusaur',
    types: ['Grass', 'Poison'],
    baseStats: { hp: 80, attack: 82, defense: 83, specialAttack: 100, specialDefense: 100, speed: 80 },
  },
  {
    dex: 4,
    name: 'Charmander',
    types: ['Fire'],
    baseStats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65 },
  },
  {
    dex: 5,
    name: 'Charmeleon',
    types: ['Fire'],
    baseStats: { hp: 58, attack: 64, defense: 58, specialAttack: 80, specialDefense: 65, speed: 80 },
  },
  {
    dex: 6,
    name: 'Charizard',
    types: ['Fire', 'Flying'],
    baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
  },
  {
    dex: 7,
    name: 'Squirtle',
    types: ['Water'],
    baseStats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43 },
  },
  {
    dex: 8,
    name: 'Wartortle',
    types: ['Water'],
    baseStats: { hp: 59, attack: 63, defense: 80, specialAttack: 65, specialDefense: 80, speed: 58 },
  },
  {
    dex: 9,
    name: 'Blastoise',
    types: ['Water'],
    baseStats: { hp: 79, attack: 83, defense: 100, specialAttack: 85, specialDefense: 105, speed: 78 },
  },
  {
    dex: 12,
    name: 'Butterfree',
    types: ['Bug', 'Flying'],
    baseStats: { hp: 60, attack: 45, defense: 50, specialAttack: 90, specialDefense: 80, speed: 70 },
  },
  {
    dex: 15,
    name: 'Beedrill',
    types: ['Bug', 'Poison'],
    baseStats: { hp: 65, attack: 90, defense: 40, specialAttack: 45, specialDefense: 80, speed: 75 },
  },
  {
    dex: 18,
    name: 'Pidgeot',
    types: ['Normal', 'Flying'],
    baseStats: { hp: 83, attack: 80, defense: 75, specialAttack: 70, specialDefense: 70, speed: 101 },
  },
  {
    dex: 25,
    name: 'Pikachu',
    types: ['Electric'],
    baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  },
  {
    dex: 26,
    name: 'Raichu',
    types: ['Electric'],
    baseStats: { hp: 60, attack: 90, defense: 55, specialAttack: 90, specialDefense: 80, speed: 110 },
  },
  {
    dex: 38,
    name: 'Ninetales',
    types: ['Fire'],
    baseStats: { hp: 73, attack: 76, defense: 75, specialAttack: 81, specialDefense: 100, speed: 100 },
  },
  {
    dex: 59,
    name: 'Arcanine',
    types: ['Fire'],
    baseStats: { hp: 90, attack: 110, defense: 80, specialAttack: 100, specialDefense: 80, speed: 95 },
  },
  {
    dex: 65,
    name: 'Alakazam',
    types: ['Psychic'],
    baseStats: { hp: 55, attack: 50, defense: 45, specialAttack: 135, specialDefense: 95, speed: 120 },
  },
  {
    dex: 68,
    name: 'Machamp',
    types: ['Fighting'],
    baseStats: { hp: 90, attack: 130, defense: 80, specialAttack: 65, specialDefense: 85, speed: 55 },
  },
  {
    dex: 76,
    name: 'Golem',
    types: ['Rock', 'Ground'],
    baseStats: { hp: 80, attack: 120, defense: 130, specialAttack: 55, specialDefense: 65, speed: 45 },
  },
  // Gengar (destaque pedido no exemplo)
  {
    dex: 94,
    name: 'Gengar',
    types: ['Ghost', 'Poison'],
    baseStats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 },
  },
  {
    dex: 95,
    name: 'Onix',
    types: ['Rock', 'Ground'],
    baseStats: { hp: 35, attack: 45, defense: 160, specialAttack: 30, specialDefense: 45, speed: 70 },
  },
  {
    dex: 130,
    name: 'Gyarados',
    types: ['Water', 'Flying'],
    baseStats: { hp: 95, attack: 125, defense: 79, specialAttack: 60, specialDefense: 100, speed: 81 },
  },
  {
    dex: 131,
    name: 'Lapras',
    types: ['Water', 'Ice'],
    baseStats: { hp: 130, attack: 85, defense: 80, specialAttack: 85, specialDefense: 95, speed: 60 },
  },
  {
    dex: 133,
    name: 'Eevee',
    types: ['Normal'],
    baseStats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55 },
  },
  {
    dex: 134,
    name: 'Vaporeon',
    types: ['Water'],
    baseStats: { hp: 130, attack: 65, defense: 60, specialAttack: 110, specialDefense: 95, speed: 65 },
  },
  {
    dex: 135,
    name: 'Jolteon',
    types: ['Electric'],
    baseStats: { hp: 65, attack: 65, defense: 60, specialAttack: 110, specialDefense: 95, speed: 130 },
  },
  {
    dex: 136,
    name: 'Flareon',
    types: ['Fire'],
    baseStats: { hp: 65, attack: 130, defense: 60, specialAttack: 95, specialDefense: 110, speed: 65 },
  },
  {
    dex: 143,
    name: 'Snorlax',
    types: ['Normal'],
    baseStats: { hp: 160, attack: 110, defense: 65, specialAttack: 65, specialDefense: 110, speed: 30 },
  },
  {
    dex: 144,
    name: 'Articuno',
    types: ['Ice', 'Flying'],
    baseStats: { hp: 90, attack: 85, defense: 100, specialAttack: 95, specialDefense: 125, speed: 85 },
  },
  {
    dex: 145,
    name: 'Zapdos',
    types: ['Electric', 'Flying'],
    baseStats: { hp: 90, attack: 90, defense: 85, specialAttack: 125, specialDefense: 90, speed: 100 },
  },
  {
    dex: 146,
    name: 'Moltres',
    types: ['Fire', 'Flying'],
    baseStats: { hp: 90, attack: 100, defense: 90, specialAttack: 125, specialDefense: 85, speed: 90 },
  },
  {
    dex: 149,
    name: 'Dragonite',
    types: ['Dragon', 'Flying'],
    baseStats: { hp: 91, attack: 134, defense: 95, specialAttack: 100, specialDefense: 100, speed: 80 },
  },
  {
    dex: 150,
    name: 'Mewtwo',
    types: ['Psychic'],
    baseStats: { hp: 106, attack: 110, defense: 90, specialAttack: 154, specialDefense: 90, speed: 130 },
  },
  {
    dex: 151,
    name: 'Mew',
    types: ['Psychic'],
    baseStats: { hp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100 },
  },
  // Gen 2
  {
    dex: 196,
    name: 'Espeon',
    types: ['Psychic'],
    baseStats: { hp: 65, attack: 65, defense: 60, specialAttack: 130, specialDefense: 95, speed: 110 },
  },
  {
    dex: 197,
    name: 'Umbreon',
    types: ['Dark'],
    baseStats: { hp: 95, attack: 65, defense: 110, specialAttack: 60, specialDefense: 130, speed: 65 },
  },
  {
    dex: 212,
    name: 'Scizor',
    types: ['Bug', 'Steel'],
    baseStats: { hp: 70, attack: 130, defense: 100, specialAttack: 55, specialDefense: 80, speed: 65 },
  },
  {
    dex: 248,
    name: 'Tyranitar',
    types: ['Rock', 'Dark'],
    baseStats: { hp: 100, attack: 134, defense: 110, specialAttack: 95, specialDefense: 100, speed: 61 },
  },
  {
    dex: 249,
    name: 'Lugia',
    types: ['Psychic', 'Flying'],
    baseStats: { hp: 106, attack: 90, defense: 130, specialAttack: 90, specialDefense: 154, speed: 110 },
  },
  {
    dex: 250,
    name: 'Ho-Oh',
    types: ['Fire', 'Flying'],
    baseStats: { hp: 106, attack: 130, defense: 90, specialAttack: 110, specialDefense: 154, speed: 90 },
  },
  // Gen 3
  {
    dex: 254,
    name: 'Sceptile',
    types: ['Grass'],
    baseStats: { hp: 70, attack: 85, defense: 65, specialAttack: 105, specialDefense: 85, speed: 120 },
  },
  {
    dex: 257,
    name: 'Blaziken',
    types: ['Fire', 'Fighting'],
    baseStats: { hp: 80, attack: 120, defense: 70, specialAttack: 110, specialDefense: 70, speed: 80 },
  },
  {
    dex: 260,
    name: 'Swampert',
    types: ['Water', 'Ground'],
    baseStats: { hp: 100, attack: 110, defense: 90, specialAttack: 85, specialDefense: 90, speed: 60 },
  },
  {
    dex: 282,
    name: 'Gardevoir',
    types: ['Psychic', 'Fairy'],
    baseStats: { hp: 68, attack: 65, defense: 65, specialAttack: 125, specialDefense: 115, speed: 80 },
  },
  {
    dex: 373,
    name: 'Salamence',
    types: ['Dragon', 'Flying'],
    baseStats: { hp: 95, attack: 135, defense: 80, specialAttack: 110, specialDefense: 80, speed: 100 },
  },
  {
    dex: 376,
    name: 'Metagross',
    types: ['Steel', 'Psychic'],
    baseStats: { hp: 80, attack: 135, defense: 130, specialAttack: 95, specialDefense: 90, speed: 70 },
  },
  {
    dex: 382,
    name: 'Kyogre',
    types: ['Water'],
    baseStats: { hp: 100, attack: 100, defense: 90, specialAttack: 150, specialDefense: 140, speed: 90 },
  },
  {
    dex: 383,
    name: 'Groudon',
    types: ['Ground'],
    baseStats: { hp: 100, attack: 150, defense: 140, specialAttack: 100, specialDefense: 90, speed: 90 },
  },
  {
    dex: 384,
    name: 'Rayquaza',
    types: ['Dragon', 'Flying'],
    baseStats: { hp: 105, attack: 150, defense: 90, specialAttack: 150, specialDefense: 90, speed: 95 },
  },
  // Gen 4
  {
    dex: 392,
    name: 'Infernape',
    types: ['Fire', 'Fighting'],
    baseStats: { hp: 76, attack: 104, defense: 71, specialAttack: 104, specialDefense: 71, speed: 108 },
  },
  {
    dex: 445,
    name: 'Garchomp',
    types: ['Dragon', 'Ground'],
    baseStats: { hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102 },
  },
  {
    dex: 448,
    name: 'Lucario',
    types: ['Fighting', 'Steel'],
    baseStats: { hp: 70, attack: 110, defense: 70, specialAttack: 115, specialDefense: 70, speed: 90 },
  },
  {
    dex: 468,
    name: 'Togekiss',
    types: ['Fairy', 'Flying'],
    baseStats: { hp: 85, attack: 50, defense: 95, specialAttack: 120, specialDefense: 115, speed: 80 },
  },
  {
    dex: 483,
    name: 'Dialga',
    types: ['Steel', 'Dragon'],
    baseStats: { hp: 100, attack: 120, defense: 120, specialAttack: 150, specialDefense: 100, speed: 90 },
  },
  {
    dex: 484,
    name: 'Palkia',
    types: ['Water', 'Dragon'],
    baseStats: { hp: 90, attack: 120, defense: 100, specialAttack: 150, specialDefense: 120, speed: 100 },
  },
  {
    dex: 487,
    name: 'Giratina',
    types: ['Ghost', 'Dragon'],
    baseStats: { hp: 150, attack: 100, defense: 120, specialAttack: 100, specialDefense: 120, speed: 90 },
  },
  {
    dex: 491,
    name: 'Darkrai',
    types: ['Dark'],
    baseStats: { hp: 70, attack: 90, defense: 90, specialAttack: 135, specialDefense: 90, speed: 125 },
  },
  {
    dex: 493,
    name: 'Arceus',
    types: ['Normal'],
    baseStats: { hp: 120, attack: 120, defense: 120, specialAttack: 120, specialDefense: 120, speed: 120 },
  },
];

export const POKEMON_PLACEHOLDER_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2394A3B8" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M3 12h6m6 0h6"/></svg>`;

export function getPokemonLocalSpriteUrl(dex: number): string {
  return `./assets/pokemon/${dex}.png`;
}

export function getPokemonSpriteUrl(dex: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;
}

export function getPokemonFallbackOutfitUrl(dex: number): string {
  return `https://poke.idleworld.online/assets/pokemon/outfit_${dex}_.png`;
}

export function searchPokemon(query: string): PokemonSpeciesData[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return POKEMON_DATABASE.slice(0, 10);

  const num = parseInt(clean.replace('#', ''), 10);
  if (!isNaN(num) && num > 0) {
    const matchDex = POKEMON_DATABASE.filter((p) => p.dex === num);
    if (matchDex.length > 0) return matchDex;
  }

  return POKEMON_DATABASE.filter(
    (p) =>
      p.name.toLowerCase().includes(clean) ||
      p.types.some((t) => t.toLowerCase().includes(clean)) ||
      String(p.dex).includes(clean),
  );
}

export function getPokemonByName(name: string): PokemonSpeciesData | undefined {
  const clean = name.trim().toLowerCase();
  return POKEMON_DATABASE.find((p) => p.name.toLowerCase() === clean);
}
