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
  // Gen 1 (Completo 1 - 151)
  { dex: 1, name: 'Bulbasaur', types: ['Grass', 'Poison'], baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 } },
  { dex: 2, name: 'Ivysaur', types: ['Grass', 'Poison'], baseStats: { hp: 60, attack: 62, defense: 63, specialAttack: 80, specialDefense: 80, speed: 60 } },
  { dex: 3, name: 'Venusaur', types: ['Grass', 'Poison'], baseStats: { hp: 80, attack: 82, defense: 83, specialAttack: 100, specialDefense: 100, speed: 80 } },
  { dex: 4, name: 'Charmander', types: ['Fire'], baseStats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65 } },
  { dex: 5, name: 'Charmeleon', types: ['Fire'], baseStats: { hp: 58, attack: 64, defense: 58, specialAttack: 80, specialDefense: 65, speed: 80 } },
  { dex: 6, name: 'Charizard', types: ['Fire', 'Flying'], baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 } },
  { dex: 7, name: 'Squirtle', types: ['Water'], baseStats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43 } },
  { dex: 8, name: 'Wartortle', types: ['Water'], baseStats: { hp: 59, attack: 63, defense: 80, specialAttack: 65, specialDefense: 80, speed: 58 } },
  { dex: 9, name: 'Blastoise', types: ['Water'], baseStats: { hp: 79, attack: 83, defense: 100, specialAttack: 85, specialDefense: 105, speed: 78 } },
  { dex: 10, name: 'Caterpie', types: ['Bug'], baseStats: { hp: 45, attack: 30, defense: 35, specialAttack: 20, specialDefense: 20, speed: 45 } },
  { dex: 11, name: 'Metapod', types: ['Bug'], baseStats: { hp: 50, attack: 20, defense: 55, specialAttack: 25, specialDefense: 25, speed: 30 } },
  { dex: 12, name: 'Butterfree', types: ['Bug', 'Flying'], baseStats: { hp: 60, attack: 45, defense: 50, specialAttack: 90, specialDefense: 80, speed: 70 } },
  { dex: 13, name: 'Weedle', types: ['Bug', 'Poison'], baseStats: { hp: 40, attack: 35, defense: 30, specialAttack: 20, specialDefense: 20, speed: 50 } },
  { dex: 14, name: 'Kakuna', types: ['Bug', 'Poison'], baseStats: { hp: 45, attack: 25, defense: 50, specialAttack: 25, specialDefense: 25, speed: 35 } },
  { dex: 15, name: 'Beedrill', types: ['Bug', 'Poison'], baseStats: { hp: 65, attack: 90, defense: 40, specialAttack: 45, specialDefense: 80, speed: 75 } },
  { dex: 16, name: 'Pidgey', types: ['Normal', 'Flying'], baseStats: { hp: 40, attack: 45, defense: 40, specialAttack: 35, specialDefense: 35, speed: 56 } },
  { dex: 17, name: 'Pidgeotto', types: ['Normal', 'Flying'], baseStats: { hp: 63, attack: 60, defense: 55, specialAttack: 50, specialDefense: 50, speed: 71 } },
  { dex: 18, name: 'Pidgeot', types: ['Normal', 'Flying'], baseStats: { hp: 83, attack: 80, defense: 75, specialAttack: 70, specialDefense: 70, speed: 101 } },
  { dex: 19, name: 'Rattata', types: ['Normal'], baseStats: { hp: 30, attack: 56, defense: 35, specialAttack: 25, specialDefense: 35, speed: 72 } },
  { dex: 20, name: 'Raticate', types: ['Normal'], baseStats: { hp: 55, attack: 81, defense: 60, specialAttack: 50, specialDefense: 70, speed: 97 } },
  { dex: 21, name: 'Spearow', types: ['Normal', 'Flying'], baseStats: { hp: 40, attack: 60, defense: 30, specialAttack: 31, specialDefense: 31, speed: 70 } },
  { dex: 22, name: 'Fearow', types: ['Normal', 'Flying'], baseStats: { hp: 65, attack: 90, defense: 65, specialAttack: 61, specialDefense: 61, speed: 100 } },
  { dex: 23, name: 'Ekans', types: ['Poison'], baseStats: { hp: 35, attack: 60, defense: 44, specialAttack: 40, specialDefense: 54, speed: 55 } },
  { dex: 24, name: 'Arbok', types: ['Poison'], baseStats: { hp: 60, attack: 95, defense: 69, specialAttack: 65, specialDefense: 79, speed: 80 } },
  { dex: 25, name: 'Pikachu', types: ['Electric'], baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 } },
  { dex: 26, name: 'Raichu', types: ['Electric'], baseStats: { hp: 60, attack: 90, defense: 55, specialAttack: 90, specialDefense: 80, speed: 110 } },
  { dex: 27, name: 'Sandshrew', types: ['Ground'], baseStats: { hp: 50, attack: 75, defense: 85, specialAttack: 20, specialDefense: 30, speed: 40 } },
  { dex: 28, name: 'Sandslash', types: ['Ground'], baseStats: { hp: 75, attack: 100, defense: 110, specialAttack: 45, specialDefense: 55, speed: 65 } },
  { dex: 29, name: 'Nidoran♀', types: ['Poison'], baseStats: { hp: 55, attack: 47, defense: 52, specialAttack: 40, specialDefense: 40, speed: 41 } },
  { dex: 30, name: 'Nidorina', types: ['Poison'], baseStats: { hp: 70, attack: 62, defense: 67, specialAttack: 55, specialDefense: 55, speed: 56 } },
  { dex: 31, name: 'Nidoqueen', types: ['Poison', 'Ground'], baseStats: { hp: 90, attack: 92, defense: 87, specialAttack: 75, specialDefense: 85, speed: 76 } },
  { dex: 32, name: 'Nidoran♂', types: ['Poison'], baseStats: { hp: 46, attack: 57, defense: 40, specialAttack: 40, specialDefense: 40, speed: 50 } },
  { dex: 33, name: 'Nidorino', types: ['Poison'], baseStats: { hp: 61, attack: 72, defense: 57, specialAttack: 55, specialDefense: 55, speed: 65 } },
  { dex: 34, name: 'Nidoking', types: ['Poison', 'Ground'], baseStats: { hp: 81, attack: 102, defense: 77, specialAttack: 85, specialDefense: 75, speed: 85 } },
  { dex: 35, name: 'Clefairy', types: ['Fairy'], baseStats: { hp: 70, attack: 45, defense: 48, specialAttack: 60, specialDefense: 65, speed: 35 } },
  { dex: 36, name: 'Clefable', types: ['Fairy'], baseStats: { hp: 95, attack: 70, defense: 73, specialAttack: 95, specialDefense: 90, speed: 60 } },
  { dex: 37, name: 'Vulpix', types: ['Fire'], baseStats: { hp: 38, attack: 41, defense: 40, specialAttack: 50, specialDefense: 65, speed: 65 } },
  { dex: 38, name: 'Ninetales', types: ['Fire'], baseStats: { hp: 73, attack: 76, defense: 75, specialAttack: 81, specialDefense: 100, speed: 100 } },
  { dex: 39, name: 'Jigglypuff', types: ['Normal', 'Fairy'], baseStats: { hp: 115, attack: 45, defense: 20, specialAttack: 45, specialDefense: 25, speed: 20 } },
  { dex: 40, name: 'Wigglytuff', types: ['Normal', 'Fairy'], baseStats: { hp: 140, attack: 70, defense: 45, specialAttack: 85, specialDefense: 50, speed: 45 } },
  { dex: 41, name: 'Zubat', types: ['Poison', 'Flying'], baseStats: { hp: 40, attack: 45, defense: 35, specialAttack: 30, specialDefense: 40, speed: 55 } },
  { dex: 42, name: 'Golbat', types: ['Poison', 'Flying'], baseStats: { hp: 75, attack: 80, defense: 70, specialAttack: 65, specialDefense: 75, speed: 90 } },
  { dex: 43, name: 'Oddish', types: ['Grass', 'Poison'], baseStats: { hp: 45, attack: 50, defense: 55, specialAttack: 75, specialDefense: 65, speed: 30 } },
  { dex: 44, name: 'Gloom', types: ['Grass', 'Poison'], baseStats: { hp: 60, attack: 65, defense: 70, specialAttack: 85, specialDefense: 75, speed: 40 } },
  { dex: 45, name: 'Vileplume', types: ['Grass', 'Poison'], baseStats: { hp: 75, attack: 80, defense: 85, specialAttack: 110, specialDefense: 90, speed: 50 } },
  { dex: 46, name: 'Paras', types: ['Bug', 'Grass'], baseStats: { hp: 35, attack: 70, defense: 55, specialAttack: 45, specialDefense: 55, speed: 25 } },
  { dex: 47, name: 'Parasect', types: ['Bug', 'Grass'], baseStats: { hp: 60, attack: 95, defense: 80, specialAttack: 60, specialDefense: 80, speed: 30 } },
  { dex: 48, name: 'Venonat', types: ['Bug', 'Poison'], baseStats: { hp: 60, attack: 55, defense: 50, specialAttack: 40, specialDefense: 55, speed: 45 } },
  { dex: 49, name: 'Venomoth', types: ['Bug', 'Poison'], baseStats: { hp: 70, attack: 65, defense: 60, specialAttack: 90, specialDefense: 75, speed: 90 } },
  { dex: 50, name: 'Diglett', types: ['Ground'], baseStats: { hp: 10, attack: 55, defense: 25, specialAttack: 35, specialDefense: 45, speed: 95 } },
  { dex: 51, name: 'Dugtrio', types: ['Ground'], baseStats: { hp: 35, attack: 100, defense: 50, specialAttack: 50, specialDefense: 70, speed: 120 } },
  { dex: 52, name: 'Meowth', types: ['Normal'], baseStats: { hp: 40, attack: 45, defense: 35, specialAttack: 40, specialDefense: 40, speed: 90 } },
  { dex: 53, name: 'Persian', types: ['Normal'], baseStats: { hp: 65, attack: 70, defense: 60, specialAttack: 65, specialDefense: 65, speed: 115 } },
  { dex: 54, name: 'Psyduck', types: ['Water'], baseStats: { hp: 50, attack: 52, defense: 48, specialAttack: 65, specialDefense: 50, speed: 55 } },
  { dex: 55, name: 'Golduck', types: ['Water'], baseStats: { hp: 80, attack: 82, defense: 78, specialAttack: 95, specialDefense: 80, speed: 85 } },
  { dex: 56, name: 'Mankey', types: ['Fighting'], baseStats: { hp: 40, attack: 80, defense: 35, specialAttack: 35, specialDefense: 45, speed: 70 } },
  { dex: 57, name: 'Primeape', types: ['Fighting'], baseStats: { hp: 65, attack: 105, defense: 60, specialAttack: 60, specialDefense: 70, speed: 95 } },
  { dex: 58, name: 'Growlithe', types: ['Fire'], baseStats: { hp: 55, attack: 70, defense: 45, specialAttack: 70, specialDefense: 50, speed: 60 } },
  { dex: 59, name: 'Arcanine', types: ['Fire'], baseStats: { hp: 90, attack: 110, defense: 80, specialAttack: 100, specialDefense: 80, speed: 95 } },
  { dex: 60, name: 'Poliwag', types: ['Water'], baseStats: { hp: 40, attack: 50, defense: 40, specialAttack: 40, specialDefense: 40, speed: 90 } },
  { dex: 61, name: 'Poliwhirl', types: ['Water'], baseStats: { hp: 65, attack: 65, defense: 65, specialAttack: 50, specialDefense: 50, speed: 90 } },
  { dex: 62, name: 'Poliwrath', types: ['Water', 'Fighting'], baseStats: { hp: 90, attack: 95, defense: 95, specialAttack: 70, specialDefense: 90, speed: 70 } },
  { dex: 63, name: 'Abra', types: ['Psychic'], baseStats: { hp: 25, attack: 20, defense: 15, specialAttack: 105, specialDefense: 55, speed: 90 } },
  { dex: 64, name: 'Kadabra', types: ['Psychic'], baseStats: { hp: 40, attack: 35, defense: 30, specialAttack: 120, specialDefense: 70, speed: 105 } },
  { dex: 65, name: 'Alakazam', types: ['Psychic'], baseStats: { hp: 55, attack: 50, defense: 45, specialAttack: 135, specialDefense: 95, speed: 120 } },
  { dex: 66, name: 'Machop', types: ['Fighting'], baseStats: { hp: 70, attack: 80, defense: 50, specialAttack: 35, specialDefense: 35, speed: 35 } },
  { dex: 67, name: 'Machoke', types: ['Fighting'], baseStats: { hp: 80, attack: 100, defense: 70, specialAttack: 50, specialDefense: 60, speed: 45 } },
  { dex: 68, name: 'Machamp', types: ['Fighting'], baseStats: { hp: 90, attack: 130, defense: 80, specialAttack: 65, specialDefense: 85, speed: 55 } },
  { dex: 69, name: 'Bellsprout', types: ['Grass', 'Poison'], baseStats: { hp: 50, attack: 75, defense: 35, specialAttack: 70, specialDefense: 30, speed: 40 } },
  { dex: 70, name: 'Weepinbell', types: ['Grass', 'Poison'], baseStats: { hp: 65, attack: 90, defense: 50, specialAttack: 85, specialDefense: 45, speed: 55 } },
  { dex: 71, name: 'Victreebel', types: ['Grass', 'Poison'], baseStats: { hp: 80, attack: 105, defense: 65, specialAttack: 100, specialDefense: 70, speed: 70 } },
  { dex: 72, name: 'Tentacool', types: ['Water', 'Poison'], baseStats: { hp: 40, attack: 40, defense: 35, specialAttack: 50, specialDefense: 100, speed: 70 } },
  { dex: 73, name: 'Tentacruel', types: ['Water', 'Poison'], baseStats: { hp: 80, attack: 70, defense: 65, specialAttack: 80, specialDefense: 120, speed: 100 } },
  { dex: 74, name: 'Geodude', types: ['Rock', 'Ground'], baseStats: { hp: 40, attack: 80, defense: 100, specialAttack: 30, specialDefense: 30, speed: 20 } },
  { dex: 75, name: 'Graveler', types: ['Rock', 'Ground'], baseStats: { hp: 55, attack: 95, defense: 115, specialAttack: 45, specialDefense: 45, speed: 35 } },
  { dex: 76, name: 'Golem', types: ['Rock', 'Ground'], baseStats: { hp: 80, attack: 120, defense: 130, specialAttack: 55, specialDefense: 65, speed: 45 } },
  { dex: 77, name: 'Ponyta', types: ['Fire'], baseStats: { hp: 50, attack: 85, defense: 55, specialAttack: 65, specialDefense: 65, speed: 90 } },
  { dex: 78, name: 'Rapidash', types: ['Fire'], baseStats: { hp: 65, attack: 100, defense: 70, specialAttack: 80, specialDefense: 80, speed: 105 } },
  { dex: 79, name: 'Slowpoke', types: ['Water', 'Psychic'], baseStats: { hp: 90, attack: 65, defense: 65, specialAttack: 40, specialDefense: 40, speed: 15 } },
  { dex: 80, name: 'Slowbro', types: ['Water', 'Psychic'], baseStats: { hp: 95, attack: 75, defense: 110, specialAttack: 100, specialDefense: 80, speed: 30 } },
  { dex: 81, name: 'Magnemite', types: ['Electric', 'Steel'], baseStats: { hp: 25, attack: 35, defense: 70, specialAttack: 95, specialDefense: 55, speed: 45 } },
  { dex: 82, name: 'Magneton', types: ['Electric', 'Steel'], baseStats: { hp: 50, attack: 60, defense: 95, specialAttack: 120, specialDefense: 70, speed: 70 } },
  { dex: 83, name: 'Farfetch\'d', types: ['Normal', 'Flying'], baseStats: { hp: 52, attack: 90, defense: 55, specialAttack: 58, specialDefense: 62, speed: 60 } },
  { dex: 84, name: 'Doduo', types: ['Normal', 'Flying'], baseStats: { hp: 35, attack: 85, defense: 45, specialAttack: 35, specialDefense: 35, speed: 75 } },
  { dex: 85, name: 'Dodrio', types: ['Normal', 'Flying'], baseStats: { hp: 60, attack: 110, defense: 70, specialAttack: 60, specialDefense: 60, speed: 110 } },
  { dex: 86, name: 'Seel', types: ['Water'], baseStats: { hp: 65, attack: 45, defense: 55, specialAttack: 45, specialDefense: 70, speed: 45 } },
  { dex: 87, name: 'Dewgong', types: ['Water', 'Ice'], baseStats: { hp: 90, attack: 70, defense: 80, specialAttack: 70, specialDefense: 95, speed: 70 } },
  { dex: 88, name: 'Grimer', types: ['Poison'], baseStats: { hp: 80, attack: 80, defense: 50, specialAttack: 40, specialDefense: 50, speed: 25 } },
  { dex: 89, name: 'Muk', types: ['Poison'], baseStats: { hp: 105, attack: 105, defense: 75, specialAttack: 65, specialDefense: 100, speed: 50 } },
  { dex: 90, name: 'Shellder', types: ['Water'], baseStats: { hp: 30, attack: 65, defense: 100, specialAttack: 45, specialDefense: 25, speed: 40 } },
  { dex: 91, name: 'Cloyster', types: ['Water', 'Ice'], baseStats: { hp: 50, attack: 95, defense: 180, specialAttack: 85, specialDefense: 45, speed: 70 } },
  { dex: 92, name: 'Gastly', types: ['Ghost', 'Poison'], baseStats: { hp: 30, attack: 35, defense: 30, specialAttack: 100, specialDefense: 35, speed: 80 } },
  { dex: 93, name: 'Haunter', types: ['Ghost', 'Poison'], baseStats: { hp: 45, attack: 50, defense: 45, specialAttack: 115, specialDefense: 55, speed: 95 } },
  { dex: 94, name: 'Gengar', types: ['Ghost', 'Poison'], baseStats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 } },
  { dex: 95, name: 'Onix', types: ['Rock', 'Ground'], baseStats: { hp: 35, attack: 45, defense: 160, specialAttack: 30, specialDefense: 45, speed: 70 } },
  { dex: 96, name: 'Drowzee', types: ['Psychic'], baseStats: { hp: 60, attack: 48, defense: 45, specialAttack: 43, specialDefense: 90, speed: 42 } },
  { dex: 97, name: 'Hypno', types: ['Psychic'], baseStats: { hp: 85, attack: 73, defense: 70, specialAttack: 73, specialDefense: 115, speed: 67 } },
  { dex: 98, name: 'Krabby', types: ['Water'], baseStats: { hp: 30, attack: 105, defense: 90, specialAttack: 25, specialDefense: 25, speed: 50 } },
  { dex: 99, name: 'Kingler', types: ['Water'], baseStats: { hp: 55, attack: 130, defense: 115, specialAttack: 50, specialDefense: 50, speed: 75 } },
  { dex: 100, name: 'Voltorb', types: ['Electric'], baseStats: { hp: 40, attack: 30, defense: 50, specialAttack: 55, specialDefense: 55, speed: 100 } },
  { dex: 101, name: 'Electrode', types: ['Electric'], baseStats: { hp: 60, attack: 50, defense: 70, specialAttack: 80, specialDefense: 80, speed: 150 } },
  { dex: 102, name: 'Exeggcute', types: ['Grass', 'Psychic'], baseStats: { hp: 60, attack: 40, defense: 80, specialAttack: 60, specialDefense: 45, speed: 40 } },
  { dex: 103, name: 'Exeggutor', types: ['Grass', 'Psychic'], baseStats: { hp: 95, attack: 95, defense: 85, specialAttack: 125, specialDefense: 75, speed: 55 } },
  { dex: 104, name: 'Cubone', types: ['Ground'], baseStats: { hp: 50, attack: 50, defense: 95, specialAttack: 40, specialDefense: 50, speed: 35 } },
  { dex: 105, name: 'Marowak', types: ['Ground'], baseStats: { hp: 60, attack: 80, defense: 110, specialAttack: 50, specialDefense: 80, speed: 45 } },
  { dex: 106, name: 'Hitmonlee', types: ['Fighting'], baseStats: { hp: 50, attack: 120, defense: 53, specialAttack: 35, specialDefense: 110, speed: 87 } },
  { dex: 107, name: 'Hitmonchan', types: ['Fighting'], baseStats: { hp: 50, attack: 105, defense: 79, specialAttack: 35, specialDefense: 110, speed: 76 } },
  { dex: 108, name: 'Lickitung', types: ['Normal'], baseStats: { hp: 90, attack: 55, defense: 75, specialAttack: 60, specialDefense: 75, speed: 30 } },
  { dex: 109, name: 'Koffing', types: ['Poison'], baseStats: { hp: 40, attack: 65, defense: 95, specialAttack: 60, specialDefense: 45, speed: 35 } },
  { dex: 110, name: 'Weezing', types: ['Poison'], baseStats: { hp: 65, attack: 90, defense: 120, specialAttack: 85, specialDefense: 70, speed: 60 } },
  { dex: 111, name: 'Rhyhorn', types: ['Ground', 'Rock'], baseStats: { hp: 80, attack: 85, defense: 95, specialAttack: 30, specialDefense: 30, speed: 25 } },
  { dex: 112, name: 'Rhydon', types: ['Ground', 'Rock'], baseStats: { hp: 105, attack: 130, defense: 120, specialAttack: 45, specialDefense: 45, speed: 40 } },
  { dex: 113, name: 'Chansey', types: ['Normal'], baseStats: { hp: 250, attack: 5, defense: 5, specialAttack: 35, specialDefense: 105, speed: 50 } },
  { dex: 114, name: 'Tangela', types: ['Grass'], baseStats: { hp: 65, attack: 55, defense: 115, specialAttack: 100, specialDefense: 40, speed: 60 } },
  { dex: 115, name: 'Kangaskhan', types: ['Normal'], baseStats: { hp: 105, attack: 95, defense: 80, specialAttack: 40, specialDefense: 80, speed: 90 } },
  { dex: 116, name: 'Horsea', types: ['Water'], baseStats: { hp: 30, attack: 40, defense: 70, specialAttack: 70, specialDefense: 25, speed: 60 } },
  { dex: 117, name: 'Seadra', types: ['Water'], baseStats: { hp: 55, attack: 65, defense: 95, specialAttack: 95, specialDefense: 45, speed: 85 } },
  { dex: 118, name: 'Goldeen', types: ['Water'], baseStats: { hp: 45, attack: 67, defense: 60, specialAttack: 35, specialDefense: 50, speed: 63 } },
  { dex: 119, name: 'Seaking', types: ['Water'], baseStats: { hp: 80, attack: 92, defense: 65, specialAttack: 65, specialDefense: 80, speed: 68 } },
  { dex: 120, name: 'Staryu', types: ['Water'], baseStats: { hp: 30, attack: 45, defense: 55, specialAttack: 70, specialDefense: 55, speed: 85 } },
  { dex: 121, name: 'Starmie', types: ['Water', 'Psychic'], baseStats: { hp: 60, attack: 75, defense: 85, specialAttack: 100, specialDefense: 85, speed: 115 } },
  { dex: 122, name: 'Mr. Mime', types: ['Psychic', 'Fairy'], baseStats: { hp: 40, attack: 45, defense: 65, specialAttack: 100, specialDefense: 120, speed: 90 } },
  { dex: 123, name: 'Scyther', types: ['Bug', 'Flying'], baseStats: { hp: 70, attack: 110, defense: 80, specialAttack: 55, specialDefense: 80, speed: 105 } },
  { dex: 124, name: 'Jynx', types: ['Ice', 'Psychic'], baseStats: { hp: 65, attack: 50, defense: 35, specialAttack: 115, specialDefense: 95, speed: 95 } },
  { dex: 125, name: 'Electabuzz', types: ['Electric'], baseStats: { hp: 65, attack: 83, defense: 57, specialAttack: 95, specialDefense: 85, speed: 105 } },
  { dex: 126, name: 'Magmar', types: ['Fire'], baseStats: { hp: 65, attack: 95, defense: 57, specialAttack: 100, specialDefense: 85, speed: 93 } },
  { dex: 127, name: 'Pinsir', types: ['Bug'], baseStats: { hp: 65, attack: 125, defense: 100, specialAttack: 55, specialDefense: 70, speed: 85 } },
  { dex: 128, name: 'Tauros', types: ['Normal'], baseStats: { hp: 75, attack: 100, defense: 95, specialAttack: 40, specialDefense: 70, speed: 110 } },
  { dex: 129, name: 'Magikarp', types: ['Water'], baseStats: { hp: 20, attack: 10, defense: 55, specialAttack: 15, specialDefense: 20, speed: 80 } },
  { dex: 130, name: 'Gyarados', types: ['Water', 'Flying'], baseStats: { hp: 95, attack: 125, defense: 79, specialAttack: 60, specialDefense: 100, speed: 81 } },
  { dex: 131, name: 'Lapras', types: ['Water', 'Ice'], baseStats: { hp: 130, attack: 85, defense: 80, specialAttack: 85, specialDefense: 95, speed: 60 } },
  { dex: 132, name: 'Ditto', types: ['Normal'], baseStats: { hp: 48, attack: 48, defense: 48, specialAttack: 48, specialDefense: 48, speed: 48 } },
  { dex: 133, name: 'Eevee', types: ['Normal'], baseStats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55 } },
  { dex: 134, name: 'Vaporeon', types: ['Water'], baseStats: { hp: 130, attack: 65, defense: 60, specialAttack: 110, specialDefense: 95, speed: 65 } },
  { dex: 135, name: 'Jolteon', types: ['Electric'], baseStats: { hp: 65, attack: 65, defense: 60, specialAttack: 110, specialDefense: 95, speed: 130 } },
  { dex: 136, name: 'Flareon', types: ['Fire'], baseStats: { hp: 65, attack: 130, defense: 60, specialAttack: 95, specialDefense: 110, speed: 65 } },
  { dex: 137, name: 'Porygon', types: ['Normal'], baseStats: { hp: 65, attack: 60, defense: 70, specialAttack: 85, specialDefense: 75, speed: 40 } },
  { dex: 138, name: 'Omanyte', types: ['Rock', 'Water'], baseStats: { hp: 35, attack: 40, defense: 100, specialAttack: 90, specialDefense: 55, speed: 35 } },
  { dex: 139, name: 'Omastar', types: ['Rock', 'Water'], baseStats: { hp: 70, attack: 60, defense: 125, specialAttack: 115, specialDefense: 70, speed: 55 } },
  { dex: 140, name: 'Kabuto', types: ['Rock', 'Water'], baseStats: { hp: 30, attack: 80, defense: 90, specialAttack: 55, specialDefense: 45, speed: 55 } },
  { dex: 141, name: 'Kabutops', types: ['Rock', 'Water'], baseStats: { hp: 60, attack: 115, defense: 105, specialAttack: 65, specialDefense: 70, speed: 80 } },
  { dex: 142, name: 'Aerodactyl', types: ['Rock', 'Flying'], baseStats: { hp: 80, attack: 105, defense: 65, specialAttack: 60, specialDefense: 75, speed: 130 } },
  { dex: 143, name: 'Snorlax', types: ['Normal'], baseStats: { hp: 160, attack: 110, defense: 65, specialAttack: 65, specialDefense: 110, speed: 30 } },
  { dex: 144, name: 'Articuno', types: ['Ice', 'Flying'], baseStats: { hp: 90, attack: 85, defense: 100, specialAttack: 95, specialDefense: 125, speed: 85 } },
  { dex: 145, name: 'Zapdos', types: ['Electric', 'Flying'], baseStats: { hp: 90, attack: 90, defense: 85, specialAttack: 125, specialDefense: 90, speed: 100 } },
  { dex: 146, name: 'Moltres', types: ['Fire', 'Flying'], baseStats: { hp: 90, attack: 100, defense: 90, specialAttack: 125, specialDefense: 85, speed: 90 } },
  { dex: 147, name: 'Dratini', types: ['Dragon'], baseStats: { hp: 41, attack: 64, defense: 45, specialAttack: 50, specialDefense: 50, speed: 50 } },
  { dex: 148, name: 'Dragonair', types: ['Dragon'], baseStats: { hp: 61, attack: 84, defense: 65, specialAttack: 70, specialDefense: 70, speed: 70 } },
  { dex: 149, name: 'Dragonite', types: ['Dragon', 'Flying'], baseStats: { hp: 91, attack: 134, defense: 95, specialAttack: 100, specialDefense: 100, speed: 80 } },
  { dex: 150, name: 'Mewtwo', types: ['Psychic'], baseStats: { hp: 106, attack: 110, defense: 90, specialAttack: 154, specialDefense: 90, speed: 130 } },
  { dex: 151, name: 'Mew', types: ['Psychic'], baseStats: { hp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100 } },

  // Gen 2 e Favoritos
  { dex: 196, name: 'Espeon', types: ['Psychic'], baseStats: { hp: 65, attack: 65, defense: 60, specialAttack: 130, specialDefense: 95, speed: 110 } },
  { dex: 197, name: 'Umbreon', types: ['Dark'], baseStats: { hp: 95, attack: 65, defense: 110, specialAttack: 60, specialDefense: 130, speed: 65 } },
  { dex: 212, name: 'Scizor', types: ['Bug', 'Steel'], baseStats: { hp: 70, attack: 130, defense: 100, specialAttack: 55, specialDefense: 80, speed: 65 } },
  { dex: 248, name: 'Tyranitar', types: ['Rock', 'Dark'], baseStats: { hp: 100, attack: 134, defense: 110, specialAttack: 95, specialDefense: 100, speed: 61 } },
  { dex: 249, name: 'Lugia', types: ['Psychic', 'Flying'], baseStats: { hp: 106, attack: 90, defense: 130, specialAttack: 90, specialDefense: 154, speed: 110 } },
  { dex: 250, name: 'Ho-Oh', types: ['Fire', 'Flying'], baseStats: { hp: 106, attack: 130, defense: 90, specialAttack: 110, specialDefense: 154, speed: 90 } },

  // Gen 3
  { dex: 254, name: 'Sceptile', types: ['Grass'], baseStats: { hp: 70, attack: 85, defense: 65, specialAttack: 105, specialDefense: 85, speed: 120 } },
  { dex: 257, name: 'Blaziken', types: ['Fire', 'Fighting'], baseStats: { hp: 80, attack: 120, defense: 70, specialAttack: 110, specialDefense: 70, speed: 80 } },
  { dex: 260, name: 'Swampert', types: ['Water', 'Ground'], baseStats: { hp: 100, attack: 110, defense: 90, specialAttack: 85, specialDefense: 90, speed: 60 } },
  { dex: 282, name: 'Gardevoir', types: ['Psychic', 'Fairy'], baseStats: { hp: 68, attack: 65, defense: 65, specialAttack: 125, specialDefense: 115, speed: 80 } },
  { dex: 373, name: 'Salamence', types: ['Dragon', 'Flying'], baseStats: { hp: 95, attack: 135, defense: 80, specialAttack: 110, specialDefense: 80, speed: 100 } },
  { dex: 376, name: 'Metagross', types: ['Steel', 'Psychic'], baseStats: { hp: 80, attack: 135, defense: 130, specialAttack: 95, specialDefense: 90, speed: 70 } },
  { dex: 382, name: 'Kyogre', types: ['Water'], baseStats: { hp: 100, attack: 100, defense: 90, specialAttack: 150, specialDefense: 140, speed: 90 } },
  { dex: 383, name: 'Groudon', types: ['Ground'], baseStats: { hp: 100, attack: 150, defense: 140, specialAttack: 100, specialDefense: 90, speed: 90 } },
  { dex: 384, name: 'Rayquaza', types: ['Dragon', 'Flying'], baseStats: { hp: 105, attack: 150, defense: 90, specialAttack: 150, specialDefense: 90, speed: 95 } },

  // Gen 4
  { dex: 392, name: 'Infernape', types: ['Fire', 'Fighting'], baseStats: { hp: 76, attack: 104, defense: 71, specialAttack: 104, specialDefense: 71, speed: 108 } },
  { dex: 445, name: 'Garchomp', types: ['Dragon', 'Ground'], baseStats: { hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102 } },
  { dex: 448, name: 'Lucario', types: ['Fighting', 'Steel'], baseStats: { hp: 70, attack: 110, defense: 70, specialAttack: 115, specialDefense: 70, speed: 90 } },
  { dex: 468, name: 'Togekiss', types: ['Fairy', 'Flying'], baseStats: { hp: 85, attack: 50, defense: 95, specialAttack: 120, specialDefense: 115, speed: 80 } },
  { dex: 483, name: 'Dialga', types: ['Steel', 'Dragon'], baseStats: { hp: 100, attack: 120, defense: 120, specialAttack: 150, specialDefense: 100, speed: 90 } },
  { dex: 484, name: 'Palkia', types: ['Water', 'Dragon'], baseStats: { hp: 90, attack: 120, defense: 100, specialAttack: 150, specialDefense: 120, speed: 100 } },
  { dex: 487, name: 'Giratina', types: ['Ghost', 'Dragon'], baseStats: { hp: 150, attack: 100, defense: 120, specialAttack: 100, specialDefense: 120, speed: 90 } },
  { dex: 491, name: 'Darkrai', types: ['Dark'], baseStats: { hp: 70, attack: 90, defense: 90, specialAttack: 135, specialDefense: 90, speed: 125 } },
  { dex: 493, name: 'Arceus', types: ['Normal'], baseStats: { hp: 120, attack: 120, defense: 120, specialAttack: 120, specialDefense: 120, speed: 120 } },
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
  const clean = (name || '').trim().toLowerCase();
  if (!clean) return undefined;
  return POKEMON_DATABASE.find(
    (p) =>
      p.name.toLowerCase() === clean ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, ''),
  );
}
