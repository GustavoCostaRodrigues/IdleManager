import React, { useState, useMemo } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import {
  POKEMON_DATABASE,
  getPokemonByName,
  getPokemonLocalSpriteUrl,
  getPokemonSpriteUrl,
  getPokemonFallbackOutfitUrl,
  searchPokemon,
  type PokemonSpeciesData,
} from '../data/pokemonBaseStats.js';
import {
  PiwCalculatorEngine,
  STAT_DEFINITIONS,
  type StatDefinition,
  type StatKey,
  type IvInputParameters,
} from '../services/piwCalculatorEngine.js';

interface PiwCalculatorProps {
  onCopySuccess?: () => void;
}

export const PiwCalculatorReact: React.FC<PiwCalculatorProps> = ({ onCopySuccess }) => {
  // Estado básico - sem pokémon selecionado por padrão e nível padrão = 1
  const [selectedSpecies, setSelectedSpecies] = useState<PokemonSpeciesData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<number>(1.8); // 1.80 Lendária padrão PIW
  const [projectedLevel, setProjectedLevel] = useState<number>(300);
  const [copied, setCopied] = useState<boolean>(false);

  // Stats atuais
  const [stats, setStats] = useState<Record<StatKey, number>>({
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  });

  // Resultados da Engine Matemática
  const calculation = useMemo(() => {
    if (!selectedSpecies) return null;
    const input: IvInputParameters = {
      species: selectedSpecies,
      level,
      qualityMultiplier: multiplier,
      stats,
    };
    return PiwCalculatorEngine.calculate(input);
  }, [selectedSpecies, level, multiplier, stats]);

  // Projeção de Nível e Power
  const projection = useMemo(() => {
    if (!selectedSpecies || !calculation) return null;
    const input: IvInputParameters = {
      species: selectedSpecies,
      level,
      qualityMultiplier: multiplier,
      stats,
    };
    return PiwCalculatorEngine.projectStats(input, calculation, projectedLevel);
  }, [selectedSpecies, level, multiplier, stats, calculation, projectedLevel]);

  // Troca de Pokémon
  const handleSelectSpecies = (species: PokemonSpeciesData) => {
    setSelectedSpecies(species);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setLevel(1);
    const newStats = PiwCalculatorEngine.generateRealisticStats(species, 1, multiplier, 24.0);
    setStats(newStats);
  };

  // Atualização de Stat individual
  const handleStatChange = (key: StatKey, valueStr: string) => {
    const num = parseInt(valueStr, 10);
    setStats((prev: Record<StatKey, number>) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  // Copiar Card formatado para Discord / Chat
  const handleCopyCard = () => {
    if (!selectedSpecies || !calculation || !projection) return;
    const cardText = PiwCalculatorEngine.formatDiscordCard(
      selectedSpecies,
      level,
      multiplier,
      calculation,
      projection,
    );

    navigator.clipboard.writeText(cardText).then(() => {
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Cores de Tier do Tailwind
  const getTierClasses = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 's':
        return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
      case 'a':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'b':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  const searchResults = useMemo(() => {
    return searchPokemon(searchQuery);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 p-4 text-slate-100 font-sans select-none">
      {/* 1. BARRA SUPERIOR COMPACTA: POKÉMON, NÍVEL E MULTIPLICADOR */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Seletor do Pokémon */}
        <div className="flex items-center gap-3 relative min-w-[280px]">
          <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            {selectedSpecies ? (
              <img
                key={selectedSpecies.dex}
                src={getPokemonSpriteUrl(selectedSpecies.dex)}
                alt={selectedSpecies.name}
                className="w-10 h-10 object-contain image-rendering-pixelated"
                onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.currentTarget;
                  target.onerror = () => {
                    target.onerror = null;
                    target.src = getPokemonLocalSpriteUrl(selectedSpecies.dex);
                  };
                  target.src = getPokemonFallbackOutfitUrl(selectedSpecies.dex);
                }}
              />
            ) : (
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12h6m6 0h6" />
              </svg>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-white">
                {selectedSpecies ? selectedSpecies.name : 'Selecione um Pokémon'}
              </strong>
              <span className="text-xs font-semibold text-sky-400">
                {selectedSpecies ? `#${String(selectedSpecies.dex).padStart(3, '0')}` : '#---'}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar por nome ou Dex (ex: Charmander, Gengar, #004)..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-md px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none transition"
              />

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 divide-y divide-slate-700/50">
                  {searchResults.slice(0, 8).map((p: PokemonSpeciesData) => (
                    <div
                      key={p.dex}
                      onClick={() => handleSelectSpecies(p)}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-700 cursor-pointer transition"
                    >
                      <img
                        src={getPokemonSpriteUrl(p.dex)}
                        alt={p.name}
                        className="w-7 h-7 object-contain"
                        onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = getPokemonFallbackOutfitUrl(p.dex);
                        }}
                      />
                      <span className="text-xs font-semibold">{p.name}</span>
                      <span className="text-[10px] text-slate-400">
                        #{String(p.dex).padStart(3, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nível Atual */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Nível:</label>
          <div className="relative flex items-center">
            <input
              type="number"
              min={1}
              max={500}
              value={level}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLevel(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-16 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-md py-1 px-2 text-center text-sm font-bold text-white outline-none"
            />
            <span className="absolute right-2 text-xs text-slate-500 pointer-events-none">Nv</span>
          </div>
        </div>

        {/* Qualidade / Multiplicador */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Qualidade (Mult.):</label>
          <div className="relative flex items-center">
            <input
              type="number"
              step={0.01}
              min={0.1}
              max={10.0}
              value={multiplier}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const v = parseFloat(e.target.value);
                setMultiplier(isNaN(v) ? 1.0 : v);
              }}
              className="w-20 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-md py-1 px-2 text-center text-sm font-bold text-white outline-none"
            />
            <span className="absolute right-2 text-xs text-slate-500 pointer-events-none">x</span>
          </div>
        </div>
      </div>

      {/* 2. TABELA CENTRAL UNIFICADA DOS 6 ATRIBUTOS */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col">
        <div className="grid grid-cols-12 gap-3 pb-2.5 border-b border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span className="col-span-3">Atributo & Base</span>
          <span className="col-span-2 text-center">Valor Atual (No Jogo)</span>
          <span className="col-span-2 text-center">IV Calculado (/32.0)</span>
          <span className="col-span-4">Barra de Eficiência</span>
          <span className="col-span-1 text-center">Tier</span>
        </div>

        <div className="divide-y divide-slate-700/50">
          {STAT_DEFINITIONS.map((def: StatDefinition) => {
            const statResult = calculation ? calculation.stats[def.key] : null;
            const base = selectedSpecies ? selectedSpecies.baseStats[def.key] : '-';

            return (
              <div key={def.key} className="grid grid-cols-12 gap-3 items-center py-2.5 hover:bg-slate-700/20 transition rounded-lg px-1">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: def.color }} />
                  <strong className="text-sm font-semibold text-white">{def.label}</strong>
                  <span className="text-[11px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    Base: {base}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    max={99999}
                    value={stats[def.key] || 0}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatChange(def.key, e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-md py-1 px-2 text-center text-sm font-bold text-white outline-none"
                  />
                </div>

                <div className="col-span-2 text-center">
                  <strong className="text-base font-extrabold text-white">
                    {statResult ? statResult.ivEstimate.toFixed(1) : '-'} <span className="text-slate-400 text-xs font-normal">/ 32</span>
                  </strong>
                </div>

                <div className="col-span-4 flex items-center gap-3 pr-2">
                  <div className="flex-1 h-2 bg-slate-900 border border-slate-700/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${statResult ? Math.min(100, statResult.percentage) : 0}%`,
                        backgroundColor: def.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300 w-12 text-right">
                    {statResult ? `${statResult.percentage.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${statResult ? getTierClasses(statResult.tier) : 'bg-slate-500/20 text-slate-400 border-slate-500/40'}`}>
                    {statResult ? statResult.tier : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PAINEL INFERIOR: RESUMO TOTAL À ESQUERDA + SIMULADOR À DIREITA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Faixa Estimada de IV Total */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Potencial Geral</span>
              <h3 className="text-base font-bold text-white">Faixa Estimada de IV Total</h3>
            </div>

            <button
              onClick={handleCopyCard}
              disabled={!selectedSpecies}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${selectedSpecies
                  ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                }`}
            >
              <span>{copied ? '✔ Copiado!' : '📋 Copiar Card'}</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{calculation ? calculation.totalEstimate.toFixed(1) : '0.0'}</span>
              <span className="text-sm font-semibold text-slate-400">/ 192</span>
              <span className="text-base font-bold text-sky-400">
                ({calculation ? `${calculation.overallPercentage.toFixed(1)}%` : '0.0%'})
              </span>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full border tracking-wide uppercase ${calculation ? getTierClasses(calculation.tier) : 'bg-slate-500/20 text-slate-400 border-slate-500/40'}`}>
              TIER {calculation ? calculation.tier : 'C'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-md p-1.5">
              <div className="text-[10px] text-slate-400">Mínimo</div>
              <strong className="text-slate-200">{calculation ? `${calculation.totalMin.toFixed(1)} / 192` : '0.0 / 192'}</strong>
            </div>
            <div className="bg-slate-900/60 border border-sky-500/40 rounded-md p-1.5">
              <div className="text-[10px] text-sky-400">Mais Provável</div>
              <strong className="text-sky-300">{calculation ? `${calculation.totalEstimate.toFixed(1)} / 192` : '0.0 / 192'}</strong>
            </div>
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-md p-1.5">
              <div className="text-[10px] text-slate-400">Máximo</div>
              <strong className="text-slate-200">{calculation ? `${calculation.totalMax.toFixed(1)} / 192` : '0.0 / 192'}</strong>
            </div>
          </div>

          <div className={`text-xs font-medium px-2.5 py-1.5 rounded-md flex items-center gap-2 border ${calculation
              ? calculation.isConsistent
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-900/50 text-slate-400 border-slate-700/60'
            }`}>
            <span>{calculation ? (calculation.isConsistent ? '✔' : '⚠') : 'ℹ'}</span>
            <span>{calculation ? calculation.consistencyMessage : 'Pesquise e selecione um Pokémon acima para calcular o IV.'}</span>
          </div>
        </div>

        {/* Card: Simulador de Nível & Power */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Crescimento & Power</span>
              <h3 className="text-base font-bold text-white">Simulador de Nível</h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setProjectedLevel((l: number) => Math.max(1, l - 10))}
                className="bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-2 py-1 rounded text-white transition"
              >
                -10
              </button>
              <input
                type="number"
                min={1}
                max={500}
                value={projectedLevel}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProjectedLevel(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 bg-slate-900 border border-slate-700 focus:border-sky-400 text-center text-xs font-bold py-1 rounded text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setProjectedLevel((l: number) => Math.min(500, l + 10))}
                className="bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-2 py-1 rounded text-white transition"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => setProjectedLevel(300)}
                className="bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-2 py-1 rounded text-white transition"
              >
                300
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STAT_DEFINITIONS.map((def: StatDefinition) => {
              const val = projection ? projection.stats[def.key] : '-';
              const delta = projection ? projection.deltas[def.key] : null;
              return (
                <div key={def.key} className="bg-slate-900 border border-slate-700/80 rounded-md p-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">{def.shortLabel}:</span>
                  <div className="flex items-center gap-1">
                    <strong className="text-white font-bold">{val}</strong>
                    {delta !== null && (
                      <span className={`text-[10px] font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ({delta >= 0 ? `+${delta}` : delta})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">⚡ Power Total Projetado</span>
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-black text-white">
                  {projection ? projection.totalPower.toLocaleString('pt-BR') : '--'}
                </strong>
                {projection && (
                  <span className="text-xs font-bold text-emerald-400">
                    {projection.powerDelta >= 0 ? `(+${projection.powerDelta.toLocaleString('pt-BR')})` : projection.powerDelta.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-400">
              Nível <strong className="text-white">{projectedLevel}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};