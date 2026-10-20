import type { PokemonSpeciesData } from '../data/pokemonBaseStats.js';

export type StatKey = 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';

export interface StatDefinition {
  key: StatKey;
  label: string;
  shortLabel: string;
  color: string;
}

export const STAT_DEFINITIONS: readonly StatDefinition[] = [
  { key: 'hp', label: 'HP (Vida)', shortLabel: 'HP', color: '#EF4444' },
  { key: 'attack', label: 'Ataque (Atk)', shortLabel: 'Atk', color: '#F97316' },
  { key: 'defense', label: 'Defesa (Def)', shortLabel: 'Def', color: '#EAB308' },
  { key: 'specialAttack', label: 'Sp. Atk', shortLabel: 'Sp.Atk', color: '#3B82F6' },
  { key: 'specialDefense', label: 'Sp. Def', shortLabel: 'Sp.Def', color: '#10B981' },
  { key: 'speed', label: 'Velocidade (Speed)', shortLabel: 'Speed', color: '#EC4899' },
];

export interface IvInputParameters {
  species: PokemonSpeciesData;
  level: number;
  qualityMultiplier: number;
  stats: Record<StatKey, number>;
}

export interface StatIvResult {
  stat: StatKey;
  label: string;
  baseStat: number;
  currentStat: number;
  ivMin: number;
  ivMax: number;
  ivEstimate: number; // Ex: 20.9 ou 28.6
  maxStatPossible: number; // Com IV 32.0
  percentage: number; // 0 - 100%
  tier: 'S' | 'A' | 'B' | 'C';
  rawIv: number;
}

export interface IvCalculationResult {
  stats: Record<StatKey, StatIvResult>;
  totalMin: number;
  totalMax: number;
  totalEstimate: number; // Somatório (0 a 192)
  overallPercentage: number;
  tier: 'S' | 'A' | 'B' | 'C';
  isConsistent: boolean;
  consistencyMessage: string;
}

export interface ProjectedStatsResult {
  targetLevel: number;
  stats: Record<StatKey, number>;
  deltas: Record<StatKey, number>;
  totalPower: number;
  powerDelta: number;
}

/**
 * Motor Matemático Rigoroso da Calculadora de IV do Poke Idle World (Escala /32.0, Max 192).
 */
export class IvCalculatorEngine {
  public static readonly MAX_STAT_IV = 32.0;
  public static readonly MAX_TOTAL_IV = 192.0;

  /**
   * Calcula a estimativa e os limites de IV (0 a 32.0) para cada stat e o somatório total.
   */
  public static calculate(input: IvInputParameters): IvCalculationResult {
    const { species, level, qualityMultiplier, stats } = input;
    const safeLevel = Math.max(1, level);
    const safeMultiplier = Math.max(0.5, qualityMultiplier);

    const statsResults = {} as Record<StatKey, StatIvResult>;
    let totalMin = 0;
    let totalMax = 0;
    let totalEstimate = 0;
    let hasAnomaly = false;
    let anomalyMessage = '';

    for (const def of STAT_DEFINITIONS) {
      const key = def.key;
      const base = species.baseStats[key] || 10;
      const current = Math.max(1, stats[key] || 1);
      const isHp = key === 'hp';
      const offset = isHp ? safeLevel + 10 : 5;

      // Base efetiva com multiplicador de qualidade
      const effectiveBase = base * safeMultiplier;

      // Desfaz a fórmula de stat do jogo:
      // Stat = floor(((2 * Base * M + IV) * Level) / 100) + offset
      // Portanto:
      // (Stat - offset) <= ((2 * Base * M + IV) * Level) / 100 < (Stat + 1 - offset)
      const minIvRaw = ((current - offset) * 100) / safeLevel - 2 * effectiveBase;
      const maxIvRaw = ((current + 0.999 - offset) * 100) / safeLevel - 2 * effectiveBase;
      const midIvRaw = (minIvRaw + maxIvRaw) / 2;

      // Verifica se o valor inserido é fisicamente impossível no jogo
      if (midIvRaw < -3.5 || midIvRaw > 35.5) {
        hasAnomaly = true;
        anomalyMessage = `O valor de ${def.label} (${current}) destoa dos base stats de ${species.name} no nível ${safeLevel}.`;
      }

      // Clampa estritamente na escala oficial de 0 a 32.0
      const ivMin = Math.max(0, Math.min(this.MAX_STAT_IV, Math.round(minIvRaw * 10) / 10));
      const ivMax = Math.max(0, Math.min(this.MAX_STAT_IV, Math.round(maxIvRaw * 10) / 10));
      const ivEstimate = Math.max(
        0,
        Math.min(this.MAX_STAT_IV, Math.round(((ivMin + ivMax) / 2) * 10) / 10),
      );

      const percentage = Math.round((ivEstimate / this.MAX_STAT_IV) * 1000) / 10;
      const tier = this.getTier(percentage);

      // Stat máximo possível se tivesse IV perfeito (32.0)
      const maxStatPossible = isHp
        ? Math.floor(((2 * effectiveBase + this.MAX_STAT_IV) * safeLevel) / 100) + offset
        : Math.floor(((2 * effectiveBase + this.MAX_STAT_IV) * safeLevel) / 100) + offset;

      statsResults[key] = {
        stat: key,
        label: def.label,
        baseStat: base,
        currentStat: current,
        ivMin,
        ivMax,
        ivEstimate,
        maxStatPossible,
        percentage,
        tier,
        rawIv: midIvRaw,
      };

      totalMin += ivMin;
      totalMax += ivMax;
      totalEstimate += ivEstimate;
    }

    totalMin = Math.round(totalMin * 10) / 10;
    totalMax = Math.round(totalMax * 10) / 10;
    totalEstimate = Math.round(totalEstimate * 10) / 10;

    const overallPercentage =
      Math.round((totalEstimate / this.MAX_TOTAL_IV) * 1000) / 10;
    const overallTier = this.getTier(overallPercentage);

    const isConsistent = !hasAnomaly;
    const consistencyMessage = isConsistent
      ? 'Stats matematicamente consistentes com a espécie e nível informados.'
      : anomalyMessage;

    return {
      stats: statsResults,
      totalMin,
      totalMax,
      totalEstimate,
      overallPercentage,
      tier: overallTier,
      isConsistent,
      consistencyMessage,
    };
  }

  /**
   * Simula a progressão e projeta os stats e Power total para um nível futuro.
   */
  public static projectStats(
    input: IvInputParameters,
    calculation: IvCalculationResult,
    targetLevel: number,
  ): ProjectedStatsResult {
    const { species, qualityMultiplier, stats: currentStats } = input;
    const safeTargetLevel = Math.max(1, targetLevel);
    const safeMultiplier = Math.max(0.5, qualityMultiplier);

    const projectedStats = {} as Record<StatKey, number>;
    const deltas = {} as Record<StatKey, number>;
    let totalPower = 0;
    let currentTotalPower = 0;

    for (const def of STAT_DEFINITIONS) {
      const key = def.key;
      const base = species.baseStats[key] || 10;
      const effectiveBase = base * safeMultiplier;
      const iv = calculation.stats[key].ivEstimate;
      const isHp = key === 'hp';
      const offset = isHp ? safeTargetLevel + 10 : 5;

      const proj = Math.floor(
        ((2 * effectiveBase + iv) * safeTargetLevel) / 100,
      ) + offset;

      projectedStats[key] = proj;
      const curr = currentStats[key] || 0;
      deltas[key] = proj - curr;

      totalPower += proj;
      currentTotalPower += curr;
    }

    return {
      targetLevel: safeTargetLevel,
      stats: projectedStats,
      deltas,
      totalPower,
      powerDelta: totalPower - currentTotalPower,
    };
  }

  /**
   * Gera valores iniciais realistas para os 6 stats com base na espécie e nível
   */
  public static generateRealisticStats(
    species: PokemonSpeciesData,
    level: number,
    qualityMultiplier: number,
    ivBaseline = 24.0,
  ): Record<StatKey, number> {
    const safeLevel = Math.max(1, level);
    const safeMultiplier = Math.max(0.5, qualityMultiplier);
    const result = {} as Record<StatKey, number>;

    for (const def of STAT_DEFINITIONS) {
      const key = def.key;
      const base = species.baseStats[key] || 10;
      const effectiveBase = base * safeMultiplier;
      const isHp = key === 'hp';
      const offset = isHp ? safeLevel + 10 : 5;

      result[key] =
        Math.floor(((2 * effectiveBase + ivBaseline) * safeLevel) / 100) + offset;
    }

    return result;
  }

  public static getTier(pct: number): 'S' | 'A' | 'B' | 'C' {
    if (pct >= 85) return 'S';
    if (pct >= 70) return 'A';
    if (pct >= 50) return 'B';
    return 'C';
  }

  public static formatDiscordCard(
    species: PokemonSpeciesData,
    level: number,
    multiplier: number,
    calc: IvCalculationResult,
    projection: ProjectedStatsResult,
  ): string {
    const tierEmoji = { S: '🌟', A: '🔷', B: '🟢', C: '⚪' }[calc.tier];
    return [
      `╔══════════════════════════════════════════╗`,
      `  ${tierEmoji} ${species.name.toUpperCase()} • ANÁLISE DE IV (ESCALA /32.0) ${tierEmoji}`,
      `╚══════════════════════════════════════════╝`,
      `📊 Nível: ${level} | Multiplicador: ${multiplier.toFixed(2)}x`,
      `🏆 IV Total: ${calc.totalEstimate} / 192 (${calc.overallPercentage}%) • TIER ${calc.tier}`,
      `📈 Faixa Estimada: [Mínimo: ${calc.totalMin} | Máximo: ${calc.totalMax}]`,
      ``,
      `Atributos Calculados (Escala /32.0):`,
      `• HP:      ${calc.stats.hp.ivEstimate.toFixed(1)}/32.0 [${calc.stats.hp.tier}] (Base: ${calc.stats.hp.baseStat} → Atual: ${calc.stats.hp.currentStat})`,
      `• Ataque:  ${calc.stats.attack.ivEstimate.toFixed(1)}/32.0 [${calc.stats.attack.tier}] (Base: ${calc.stats.attack.baseStat} → Atual: ${calc.stats.attack.currentStat})`,
      `• Defesa:  ${calc.stats.defense.ivEstimate.toFixed(1)}/32.0 [${calc.stats.defense.tier}] (Base: ${calc.stats.defense.baseStat} → Atual: ${calc.stats.defense.currentStat})`,
      `• Sp.Atk:  ${calc.stats.specialAttack.ivEstimate.toFixed(1)}/32.0 [${calc.stats.specialAttack.tier}] (Base: ${calc.stats.specialAttack.baseStat} → Atual: ${calc.stats.specialAttack.currentStat})`,
      `• Sp.Def:  ${calc.stats.specialDefense.ivEstimate.toFixed(1)}/32.0 [${calc.stats.specialDefense.tier}] (Base: ${calc.stats.specialDefense.baseStat} → Atual: ${calc.stats.specialDefense.currentStat})`,
      `• Speed:   ${calc.stats.speed.ivEstimate.toFixed(1)}/32.0 [${calc.stats.speed.tier}] (Base: ${calc.stats.speed.baseStat} → Atual: ${calc.stats.speed.currentStat})`,
      ``,
      `🔮 Projeção Simulada para Nível ${projection.targetLevel}:`,
      `• HP: ${projection.stats.hp} | Atk: ${projection.stats.attack} | Def: ${projection.stats.defense}`,
      `• Sp.Atk: ${projection.stats.specialAttack} | Sp.Def: ${projection.stats.specialDefense} | Speed: ${projection.stats.speed}`,
      `⚡ POWER TOTAL: ${projection.totalPower.toLocaleString('pt-BR')} (Δ +${projection.powerDelta.toLocaleString('pt-BR')})`,
      ``,
      `Poke Idle Manager • Analisador Avançado`,
    ].join('\n');
  }
}

export const PiwCalculatorEngine = IvCalculatorEngine;