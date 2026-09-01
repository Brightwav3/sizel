import { partIn } from '../../data/catalog/catalog';
import { NOISE_UNAVAILABLE, PERFORMANCE_UNAVAILABLE, metrics } from '../../entities/build/metrics';
import { BUILD_SLOTS, buildBlocker, bundledFans, ShopError } from '../../entities/build/selection';
import type { Picks } from '../../shared/lib/types';
import type { AppState } from '../state/AppState';
import { simulatedBenchmarks, SIMULATION_BASIS } from '../../entities/build/simulatedBenchmarks';
import type { BenchmarkScenario, SimulatedGame } from '../../data/benchmarks/types';
import { watchdogOfferFor, WATCHDOG_REQUIRED_GAMES, type WatchdogComparison, type WatchdogOffer } from './watchdogGate';

/** Counterfactuals supplied by the agent, never generated, ranked or applied by the shop. */
function compareSingleBuildOptions(state: AppState, alternatives: unknown, scenario: BenchmarkScenario, game?: SimulatedGame) {
  if (!BUILD_SLOTS.every(slot => state.chosen.includes(slot)))
    throw new ShopError('build_incomplete', 'Select every slot before comparing whole builds.');
  if (!Array.isArray(alternatives) || alternatives.length < 1 || alternatives.length > 3)
    throw new ShopError('invalid_alternatives', 'Supply one to three alternative builds as slot-to-product-id changes.');

  const summarize = (picks: Picks, includeDisclaimer = true) => {
    const model = metrics(picks, state.res);
    const blocker = buildBlocker(picks, BUILD_SLOTS, state.budget);
    return {
      priceUSD: model.price, remainingUSD: state.budget - model.price,
      withinBudget: model.price <= state.budget, eligible: !blocker,
      blockedBy: blocker?.code ?? null, issues: model.issues,
      performance: { fps: null, basis: PERFORMANCE_UNAVAILABLE },
      simulation: (() => {
        const simulation = simulatedBenchmarks(picks, state.res, scenario, game);
        if (includeDisclaimer || !game) return simulation;
        const { disclaimer: _disclaimer, ...compact } = simulation;
        return compact;
      })(),
      modeledFps: null, powerW: model.watt,
      acoustics: { noiseDb: null, basis: NOISE_UNAVAILABLE },
      modeledNoiseDb: null,
      shipsInDays: model.days,
    };
  };
  const baseline = summarize(state.picks);
  const seen = new Set([JSON.stringify(BUILD_SLOTS.map(slot => state.picks[slot]))]);
  const options = alternatives.map((changes, index) => {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length)
      throw new ShopError('invalid_alternatives', 'Each alternative must contain at least one slot change.');
    for (const [slot, id] of Object.entries(changes)) {
      if (!BUILD_SLOTS.includes(slot as typeof BUILD_SLOTS[number]) || typeof id !== 'string' || !partIn(slot as typeof BUILD_SLOTS[number], id))
        throw new ShopError('invalid_alternatives', 'Use known build slots and product ids belonging to those slots.');
    }
    const picks: Picks = { ...state.picks, ...changes };
    if (Object.hasOwn(changes, 'case') && !Object.hasOwn(changes, 'fans')) picks.fans = bundledFans(picks.case);
    // Included fans belong to one case, just as in the real selection command.
    if (picks.fans.includes('::fans') && picks.fans !== bundledFans(picks.case))
      throw new ShopError('invalid_alternatives', 'Included fans must belong to the proposed case.');
    const signature = JSON.stringify(BUILD_SLOTS.map(slot => picks[slot]));
    if (seen.has(signature)) throw new ShopError('duplicate_alternative', 'Compare distinct builds, different from the current build.');
    seen.add(signature);
    const result = summarize(picks, false);
    const priceDelta = result.priceUSD - baseline.priceUSD;
    const fpsDelta = result.simulation.averageFps !== null && baseline.simulation.averageFps !== null
      ? result.simulation.averageFps - baseline.simulation.averageFps : null;
    return {
      option: index + 1,
      changes: Object.fromEntries(BUILD_SLOTS.filter(slot => picks[slot] !== state.picks[slot]).map(slot => [slot, picks[slot]])),
      ...result,
      delta: {
        simulatedAverageFps: fpsDelta,
        simulatedLow1PercentFps: result.simulation.low1PercentFps !== null && baseline.simulation.low1PercentFps !== null ? result.simulation.low1PercentFps - baseline.simulation.low1PercentFps : null,
        simulatedLoadSeconds: result.simulation.loadSeconds !== null && baseline.simulation.loadSeconds !== null ? result.simulation.loadSeconds - baseline.simulation.loadSeconds : null,
        extraUSDPerSimulatedFps: fpsDelta !== null && fpsDelta > 0 && priceDelta > 0 ? Math.round(priceDelta / fpsDelta * 100) / 100 : null,
        priceUSD: priceDelta, modeledFps: null,
        modeledFpsPercent: null,
        powerW: result.powerW - baseline.powerW,
        modeledNoiseDb: null,
        extraUSDPerModeledFps: null,
      },
    };
  });
  return {
    revision: state.buildRevision, brief: state.buildBrief, budgetUSD: state.budget, resolution: state.res,
    baseline, alternatives: options,
    simulationBasis: SIMULATION_BASIS,
    limitations: 'Measured performance and noise remain unknown. Simulation supports choices within this fictional scenario only. Eligibility is separate from simulated performance; do not select ineligible options. No global optimum is certified.',
    next: 'Maximize benefit for the shopper use within the whole budget; do not prioritize savings by default. Test a relevant upgrade near the limit (especially GPU for gaming), deriving slot price caps from the remaining build cost. Explain any unspent budget. Apply your own choices with set_build_component and compare again after changes. Missing simulation data do not mean equal performance.',
  };
}

/**
 * Compare one to three game-labelled simulations without repeating the same
 * compatibility and price work in separate tool calls. The first game's
 * legacy fields stay in place for existing callers; `simulations` carries the
 * additional game results in a compact, keyed shape.
 */
export function compareBuildOptions(
  state: AppState,
  alternatives: unknown,
  scenario: BenchmarkScenario = 'cinematic',
  game?: SimulatedGame,
  games?: readonly SimulatedGame[],
) {
  const selected = games?.length ? [...games] : [game];
  const runs = selected.map(selectedGame => compareSingleBuildOptions(state, alternatives, scenario, selectedGame));
  const first = runs[0];

  // A watchdog gate is only meaningful after the complete, same-resolution
  // game comparison. A single-game read remains backwards compatible and
  // explicitly reports that no gate was evaluated.
  const watchdogOffers: WatchdogOffer[] = WATCHDOG_REQUIRED_GAMES.every(requiredGame => selected.includes(requiredGame))
    ? first.alternatives.flatMap((option, optionIndex) => {
        const candidateId = typeof option.changes.gpu === 'string' ? option.changes.gpu : null;
        if (!candidateId) return [];
        const comparisons: WatchdogComparison[] = WATCHDOG_REQUIRED_GAMES.map(game => {
          const run = runs[selected.indexOf(game)];
          const candidate = run.alternatives[optionIndex];
          return {
            game,
            baseline: run.baseline.simulation,
            candidate: candidate.simulation,
          };
        });
        const candidatePicks = { ...state.picks, ...option.changes } as Picks;
        const offer = watchdogOfferFor(state, candidateId, comparisons, candidatePicks);
        return offer ? [offer] : [];
      })
    : [];

  if (runs.length === 1) return { ...first, watchdogOffer: null, watchdogOffers: [] };

  const compactSimulation = (simulation: any, provenance = false) => ({
    kind: simulation.kind,
    datasetVersion: simulation.datasetVersion,
    game: simulation.game,
    status: simulation.status,
    averageFps: simulation.averageFps,
    low1PercentFps: simulation.low1PercentFps,
    limitingComponent: simulation.limitingComponent,
    ...(provenance ? {
      preset: simulation.preset,
      method: simulation.method,
      referenceGpu: simulation.referenceGpu,
      sourceUrl: simulation.sourceUrl,
    } : {}),
  });

  const { baseline, alternatives: alternativeRows } = first;
  const summary = {
    revision: first.revision,
    brief: first.brief,
    budgetUSD: first.budgetUSD,
    resolution: first.resolution,
    simulationBasis: first.simulationBasis,
    limitations: first.limitations,
    next: first.next,
  };
  return {
    ...summary,
    baseline: {
      priceUSD: baseline.priceUSD,
      remainingUSD: baseline.remainingUSD,
      withinBudget: baseline.withinBudget,
      eligible: baseline.eligible,
      blockedBy: baseline.blockedBy,
      issues: baseline.issues,
    },
    alternatives: alternativeRows.map(option => ({
      option: option.option,
      changes: option.changes,
      priceUSD: option.priceUSD,
      remainingUSD: option.remainingUSD,
      withinBudget: option.withinBudget,
      eligible: option.eligible,
      blockedBy: option.blockedBy,
      issues: option.issues,
      delta: { priceUSD: option.delta.priceUSD, powerW: option.delta.powerW },
    })),
    games: selected,
    watchdogOffer: watchdogOffers[0] ?? null,
    // Keep the first offer detailed above.  The legacy plural field is still
    // useful when more than one candidate qualifies, but repeating the full
    // offer for every candidate wastes the response budget and caused the
    // two-candidate demo call to fall into `result_too_large`.
    watchdogOffers: watchdogOffers.map(offer => ({
      candidateId: offer.candidateId,
      comparedTo: offer.comparedTo,
      improvementPct: offer.improvementPct,
      availability: offer.availability,
      shipsInDays: offer.shipsInDays,
    })),
    simulations: Object.fromEntries(runs.map(run => {
      const gameId = run.baseline.simulation.game;
      return [gameId, {
        baseline: compactSimulation(run.baseline.simulation, true),
        alternatives: run.alternatives.map(option => ({
          option: option.option,
          simulation: compactSimulation(option.simulation),
          delta: {
            simulatedAverageFps: option.delta.simulatedAverageFps,
            simulatedLow1PercentFps: option.delta.simulatedLow1PercentFps,
            simulatedLoadSeconds: option.delta.simulatedLoadSeconds,
          },
        })),
      }];
    })),
  };
}
