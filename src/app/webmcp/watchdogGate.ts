import { listingStock } from '../../data/catalog/listingStock';
import { SIMULATED_GAMES } from '../../entities/build/simulatedBenchmarks';
import { compatibilityIssues, metrics } from '../../entities/build/metrics';
import { partIn } from '../../data/catalog/catalog';
import { GPU_GAME_BENCHMARKS } from '../../data/benchmarks/gpuGames';
import type { SimulatedGame } from '../../data/benchmarks/types';
import type { AppState } from '../state/AppState';

/** A candidate must be meaningfully faster across the complete game set. */
export const WATCHDOG_MIN_IMPROVEMENT_PCT = 10;
/** Prevent a regression in any of the required games from qualifying. */
export const WATCHDOG_MIN_GAME_DELTA_FPS = 0;
/** The shop's explicit point at which a listing deserves a delivery warning. */
export const WATCHDOG_SLOW_DELIVERY_DAYS = 3;
/** Use every game in the demo so the agent cannot cherry-pick a favourable title. */
export const WATCHDOG_REQUIRED_GAMES = [...SIMULATED_GAMES] as const;

export type WatchdogComparison = {
  game: SimulatedGame;
  baseline: {
    status: string;
    averageFps: number | null;
  };
  candidate: {
    status: string;
    averageFps: number | null;
  };
};

export type WatchdogOffer = {
  eligible: true;
  candidateId: string;
  comparedTo: string;
  resolution: AppState['res'];
  games: SimulatedGame[];
  improvementPct: number;
  minGameImprovementPct: number;
  averageDeltaFps: number;
  minDeltaFps: number;
  availability: 'out_of_stock' | `ships_in_${number}_days`;
  shipsInDays: number;
  priceUSD: number;
  priceDeltaUSD: number;
  candidateBuildPriceUSD: number;
  candidateBuildWithinBudget: boolean;
  askBeforeCreate: true;
  reason: string;
};

const round = (value: number, places = 1) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const hasAllRequiredGames = (games: readonly SimulatedGame[]) =>
  WATCHDOG_REQUIRED_GAMES.every(game => games.includes(game));

/**
 * Derive a watchdog offer from the comparison that the agent actually ran.
 *
 * This is deliberately a gate, not a recommendation. It does not choose a
 * product, fabricate a delay, or claim that synthetic FPS are measurements.
 * It returns null unless the candidate wins in every required game, gains at
 * least ten per cent on their average, and has a real availability concern.
 */
export function watchdogOfferFor(
  state: AppState,
  candidateId: string,
  comparisons: readonly WatchdogComparison[],
  candidatePicks: AppState['picks'] = { ...state.picks, gpu: candidateId },
): WatchdogOffer | null {
  const candidate = partIn('gpu', candidateId);
  const baseline = partIn('gpu', state.picks.gpu);
  if (!candidate || !baseline || candidateId === baseline.id) return null;
  const baselineModel = metrics(state.picks, state.res);
  if (baselineModel.price > state.budget) return null;
  const games = comparisons.map(comparison => comparison.game);
  if (!hasAllRequiredGames(games)) return null;

  // A candidate that breaks the selected platform is not an upgrade worth
  // watching, even if its standalone GPU fixture is faster.
  if (compatibilityIssues(candidatePicks).length) return null;

  const stock = listingStock(candidate, 'gpu');
  const availability = stock === 0
    ? 'out_of_stock'
    : candidate.days >= WATCHDOG_SLOW_DELIVERY_DAYS
      ? `ships_in_${candidate.days}_days` as const
      : null;
  if (!availability) return null;

  const byGame = WATCHDOG_REQUIRED_GAMES.map(game => comparisons.find(item => item.game === game));
  if (byGame.some(item => !item || item.baseline.status !== 'available' || item.candidate.status !== 'available')) return null;

  // Compare the GPU fixtures directly. The whole-build simulations above are
  // still required to be available, but a fast GPU can be CPU-limited there;
  // using those capped numbers would hide the component-level tradeoff we are
  // explicitly asking the shopper to watch.
  const improvements = WATCHDOG_REQUIRED_GAMES.map(game => {
    const baselineFps = GPU_GAME_BENCHMARKS[baseline.id]?.[game]?.[state.res]?.averageFps;
    const candidateFps = GPU_GAME_BENCHMARKS[candidate.id]?.[game]?.[state.res]?.averageFps;
    if (baselineFps === undefined || candidateFps === undefined || baselineFps <= 0) return null;
    return {
      delta: candidateFps - baselineFps,
      pct: ((candidateFps - baselineFps) / baselineFps) * 100,
    };
  });
  if (improvements.some(value => value === null)) return null;
  const deltas = improvements.map(value => value!.delta);
  const percentages = improvements.map(value => value!.pct);
  const minDeltaFps = Math.min(...deltas);
  const averageDeltaFps = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const minGameImprovementPct = Math.min(...percentages);
  const improvementPct = percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
  if (minDeltaFps < WATCHDOG_MIN_GAME_DELTA_FPS || improvementPct < WATCHDOG_MIN_IMPROVEMENT_PCT) return null;

  const candidateModel = metrics(candidatePicks, state.res);
  const candidateWithinBudget = candidateModel.price <= state.budget;
  return {
    eligible: true,
    candidateId,
    comparedTo: baseline.id,
    resolution: state.res,
    games: [...WATCHDOG_REQUIRED_GAMES],
    improvementPct: round(improvementPct),
    minGameImprovementPct: round(minGameImprovementPct),
    averageDeltaFps: round(averageDeltaFps),
    minDeltaFps: round(minDeltaFps),
    availability,
    shipsInDays: candidate.days,
    priceUSD: candidate.price,
    priceDeltaUSD: candidate.price - baseline.price,
    candidateBuildPriceUSD: candidateModel.price,
    candidateBuildWithinBudget: candidateWithinBudget,
    askBeforeCreate: true,
    reason: `GPU simulation averages ${round(improvementPct)}% faster across all three games and does not regress in any; ${availability === 'out_of_stock' ? 'the listing is out of stock' : `it ships in ${candidate.days} days`}${candidateWithinBudget ? '' : ` and the alternative build is above the $${state.budget} budget`}. Ask before creating a watchdog.`,
  };
}
