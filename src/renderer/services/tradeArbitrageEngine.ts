/**
 * Engine Matemática e Regras de Negócio de Arbitragem & Rentabilidade Comercial
 * Jogo: Poke Idle World (Moedas: Dólar e Diamante)
 */

export interface GlobalMarketContext {
  /** Preço médio atual de 1 Diamante em Dólares (V_dia) */
  vDia: number;
  /** Taxa de comissão do mercado em decimal (ex: 0.05 para 5%) */
  taxaComissao: number;
}

export type PurchaseCurrency = 'dolar' | 'diamante';

export interface PurchaseTransactionInput {
  item: string;
  moedaCompra: PurchaseCurrency;
  qtdPaga: number;
  qtdAdquirida: number; // Padrão 1
}

export interface CostBreakdownResult {
  custoTotalDolar: number;
  custoUnitarioDolar: number;
  precoMinimoVendaDolar: number; // Break-even unitário em Dólar com comissão embutida
  precoMinimoVendaDiamante: number; // Break-even unitário em Diamantes com comissão embutida
  margemSeguranca10Dolar: number; // PrecoMinimo * 1.10
  margemSeguranca15Dolar: number; // PrecoMinimo * 1.15
  margemSeguranca10Diamante: number;
  margemSeguranca15Diamante: number;
}

export interface SaleSimulationInput {
  precoAnunciadoDolar?: number;
  precoAnunciadoDiamante?: number;
}

export interface SaleSideResult {
  precoAnunciado: number;
  valorBrutoDolar: number;
  retornoLiquidoDolar: number;
  lucroDolar: number;
  margemLucroPercent: number;
  isPrejuizo: boolean;
}

export interface SaleSimulationResult {
  vendaDolar: SaleSideResult;
  vendaDiamante: SaleSideResult;
  recomendacao: {
    melhorOpcao: 'dolar' | 'diamante' | 'empate' | 'nenhuma';
    diferencaLucroDolar: number;
    vantagemPercentual: number;
    badgeTexto: string;
    badgeTipo: 'success' | 'warning' | 'neutral' | 'danger';
    alertaPrejuizo: string | null;
  };
}

export class TradeArbitrageEngine {
  /**
   * 1. Calcula os custos unitários e preços de equilíbrio (Break-even com taxa)
   */
  public static calculateCosts(
    input: PurchaseTransactionInput,
    context: GlobalMarketContext,
  ): CostBreakdownResult {
    const vDia = Math.max(0.0001, context.vDia || 4_500_000);
    const taxa = Math.min(0.99, Math.max(0, context.taxaComissao || 0));
    const divisorTaxa = Math.max(0.01, 1 - taxa);

    const qtdPaga = Math.max(0, input.qtdPaga || 0);
    const qtdAdquirida = Math.max(1, input.qtdAdquirida || 1);

    // 1. Custo Total em Dólares (C_total)
    let custoTotalDolar = 0;
    if (input.moedaCompra === 'dolar') {
      custoTotalDolar = qtdPaga;
    } else {
      custoTotalDolar = qtdPaga * vDia;
    }

    // 2. Custo Unitário em Dólares (C_unitario_dolar)
    const custoUnitarioDolar = custoTotalDolar / qtdAdquirida;

    // 3. Preço Mínimo de Venda sem Prejuízo (Break-even Unitário com Taxa)
    // PrecoMinimo * (1 - T) = CustoUnitario  =>  PrecoMinimo = CustoUnitario / (1 - T)
    const precoMinimoVendaDolar = custoUnitarioDolar / divisorTaxa;
    const precoMinimoVendaDiamante = precoMinimoVendaDolar / vDia;

    // Margens de segurança sugeridas (+10% e +15%)
    const margemSeguranca10Dolar = precoMinimoVendaDolar * 1.1;
    const margemSeguranca15Dolar = precoMinimoVendaDolar * 1.15;
    const margemSeguranca10Diamante = precoMinimoVendaDiamante * 1.1;
    const margemSeguranca15Diamante = precoMinimoVendaDiamante * 1.15;

    return {
      custoTotalDolar: Math.round(custoTotalDolar),
      custoUnitarioDolar: Math.round(custoUnitarioDolar),
      precoMinimoVendaDolar: Math.round(precoMinimoVendaDolar),
      precoMinimoVendaDiamante: Number(precoMinimoVendaDiamante.toFixed(4)),
      margemSeguranca10Dolar: Math.round(margemSeguranca10Dolar),
      margemSeguranca15Dolar: Math.round(margemSeguranca15Dolar),
      margemSeguranca10Diamante: Number(margemSeguranca10Diamante.toFixed(4)),
      margemSeguranca15Diamante: Number(margemSeguranca15Diamante.toFixed(4)),
    };
  }

  /**
   * 2. Simula venda cruzada (Dólar vs Diamante) e gera recomendação analítica
   */
  public static simulateSale(
    input: SaleSimulationInput,
    costs: CostBreakdownResult,
    context: GlobalMarketContext,
  ): SaleSimulationResult {
    const vDia = Math.max(0.0001, context.vDia || 4_500_000);
    const taxa = Math.min(0.99, Math.max(0, context.taxaComissao || 0));
    const cUnitario = costs.custoUnitarioDolar;

    // --- Opção 1: Venda em Dólar ---
    const precoDolar = Math.max(0, input.precoAnunciadoDolar || 0);
    const valorBrutoDolar = precoDolar;
    const retornoLiquidoDolar = valorBrutoDolar * (1 - taxa);
    const lucroDolar = retornoLiquidoDolar - cUnitario;
    const margemDolarPercent = cUnitario > 0 ? (lucroDolar / cUnitario) * 100 : 0;
    const isPrejuizoDolar = precoDolar > 0 && retornoLiquidoDolar < cUnitario;

    const vendaDolarResult: SaleSideResult = {
      precoAnunciado: precoDolar,
      valorBrutoDolar: Math.round(valorBrutoDolar),
      retornoLiquidoDolar: Math.round(retornoLiquidoDolar),
      lucroDolar: Math.round(lucroDolar),
      margemLucroPercent: Number(margemDolarPercent.toFixed(2)),
      isPrejuizo: isPrejuizoDolar,
    };

    // --- Opção 2: Venda em Diamantes ---
    const precoDiamante = Math.max(0, input.precoAnunciadoDiamante || 0);
    const valorBrutoDiamanteEquiv = precoDiamante * vDia;
    const retornoLiquidoDiamanteEquiv = valorBrutoDiamanteEquiv * (1 - taxa);
    const lucroDiamante = retornoLiquidoDiamanteEquiv - cUnitario;
    const margemDiamantePercent = cUnitario > 0 ? (lucroDiamante / cUnitario) * 100 : 0;
    const isPrejuizoDiamante = precoDiamante > 0 && retornoLiquidoDiamanteEquiv < cUnitario;

    const vendaDiamanteResult: SaleSideResult = {
      precoAnunciado: precoDiamante,
      valorBrutoDolar: Math.round(valorBrutoDiamanteEquiv),
      retornoLiquidoDolar: Math.round(retornoLiquidoDiamanteEquiv),
      lucroDolar: Math.round(lucroDiamante),
      margemLucroPercent: Number(margemDiamantePercent.toFixed(2)),
      isPrejuizo: isPrejuizoDiamante,
    };

    // --- 3. Recomendação de Decisão ---
    let melhorOpcao: 'dolar' | 'diamante' | 'empate' | 'nenhuma' = 'nenhuma';
    let diferencaLucroDolar = 0;
    let vantagemPercentual = 0;
    let badgeTexto = 'Preencha os preços pretendidos para comparar';
    let badgeTipo: 'success' | 'warning' | 'neutral' | 'danger' = 'neutral';
    let alertaPrejuizo: string | null = null;

    const hasDolarInput = precoDolar > 0;
    const hasDiaInput = precoDiamante > 0;

    if (hasDolarInput && isPrejuizoDolar && hasDiaInput && isPrejuizoDiamante) {
      alertaPrejuizo = `⚠️ Prejuízo em ambas as pontas! O Break-even mínimo é de ${this.formatDolar(costs.precoMinimoVendaDolar)} (${costs.precoMinimoVendaDiamante} 💎).`;
      badgeTexto = 'ALERTA: Operação com Prejuízo';
      badgeTipo = 'danger';
      melhorOpcao = 'nenhuma';
    } else if (hasDolarInput && isPrejuizoDolar) {
      alertaPrejuizo = `⚠️ Venda em Dólares abaixo do Break-even (${this.formatDolar(costs.precoMinimoVendaDolar)})! Prejuízo de ${this.formatDolar(Math.abs(lucroDolar))}.`;
    } else if (hasDiaInput && isPrejuizoDiamante) {
      alertaPrejuizo = `⚠️ Venda em Diamantes abaixo do Break-even (${costs.precoMinimoVendaDiamante} 💎)! Prejuízo de ${this.formatDolar(Math.abs(lucroDiamante))}.`;
    }

    if (hasDolarInput && hasDiaInput) {
      diferencaLucroDolar = Math.abs(lucroDiamante - lucroDolar);

      if (lucroDiamante > lucroDolar) {
        melhorOpcao = 'diamante';
        const baseRetorno = retornoLiquidoDolar > 0 ? retornoLiquidoDolar : Math.max(1, cUnitario);
        vantagemPercentual = ((retornoLiquidoDiamanteEquiv - retornoLiquidoDolar) / baseRetorno) * 100;
        badgeTexto = `⭐ Melhor Opção: Vender em Diamantes (${this.formatPercent(vantagemPercentual)} de retorno extra)`;
        badgeTipo = 'success';
      } else if (lucroDolar > lucroDiamante) {
        melhorOpcao = 'dolar';
        const baseRetorno = retornoLiquidoDiamanteEquiv > 0 ? retornoLiquidoDiamanteEquiv : Math.max(1, cUnitario);
        vantagemPercentual = ((retornoLiquidoDolar - retornoLiquidoDiamanteEquiv) / baseRetorno) * 100;
        badgeTexto = `⭐ Melhor Opção: Vender em Dólares (${this.formatPercent(vantagemPercentual)} de retorno extra)`;
        badgeTipo = 'success';
      } else {
        melhorOpcao = 'empate';
        badgeTexto = '🤝 Retornos equivalentes nas duas moedas';
        badgeTipo = 'neutral';
      }
    } else if (hasDiaInput) {
      melhorOpcao = 'diamante';
      badgeTexto = isPrejuizoDiamante ? '⚠️ Venda em Diamante com prejuízo' : '💎 Simulação em Diamantes ativa';
      badgeTipo = isPrejuizoDiamante ? 'danger' : 'neutral';
    } else if (hasDolarInput) {
      melhorOpcao = 'dolar';
      badgeTexto = isPrejuizoDolar ? '⚠️ Venda em Dólar com prejuízo' : '💵 Simulação em Dólar ativa';
      badgeTipo = isPrejuizoDolar ? 'danger' : 'neutral';
    }

    return {
      vendaDolar: vendaDolarResult,
      vendaDiamante: vendaDiamanteResult,
      recomendacao: {
        melhorOpcao,
        diferencaLucroDolar: Math.round(diferencaLucroDolar),
        vantagemPercentual: Number(vantagemPercentual.toFixed(2)),
        badgeTexto,
        badgeTipo,
        alertaPrejuizo,
      },
    };
  }

  public static formatDolar(val: number): string {
    if (isNaN(val) || !isFinite(val)) return '$ 0';
    return '$ ' + Math.round(val).toLocaleString('pt-BR');
  }

  public static formatDiamante(val: number): string {
    if (isNaN(val) || !isFinite(val)) return '0 💎';
    // Se for inteiro formata sem decimais, senão mostra até 4 decimais
    const formatted = val % 1 === 0 ? val.toLocaleString('pt-BR') : val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return formatted + ' 💎';
  }

  public static formatPercent(val: number): string {
    if (isNaN(val) || !isFinite(val)) return '0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  }
}
