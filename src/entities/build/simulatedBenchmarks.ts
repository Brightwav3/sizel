import { CPU_BENCHMARKS } from '../../data/benchmarks/cpu';
import { GPU_BENCHMARKS } from '../../data/benchmarks/gpu';
import { CPU_GAME_BENCHMARKS } from '../../data/benchmarks/cpuGames';
import { GPU_GAME_BENCHMARKS } from '../../data/benchmarks/gpuGames';
import { MEMORY_BENCHMARKS, STORAGE_BENCHMARKS } from '../../data/benchmarks/memoryStorage';
import { GAME_DATASET_VERSION, GAME_PROTOCOLS } from '../../data/benchmarks/gameProtocol';
import { GPU_GAME_PROVENANCE } from '../../data/benchmarks/gpuGameCalibration';
import type { BenchmarkResolution, BenchmarkScenario, SimulatedGame } from '../../data/benchmarks/types';
import type { Picks } from '../../shared/lib/types';
import { compatibilityIssues } from './metrics';

export const BENCHMARK_VERSION = 'rigsmith-simulation-v1';
export const BENCHMARK_SCENARIOS = ['competitive', 'cinematic'] as const;
export const SIMULATED_GAMES = ['counter-strike-2', 'fortnite', 'cyberpunk-2077'] as const;
export const SIMULATION_BASIS = 'Authored fictional workload fixtures; not measured hardware or real-game benchmarks. CPU/GPU minimum-ceiling model, not the old clock/core formula.';

/** Compose independently authored category fixtures under an explicit simulation protocol. */
export function simulatedBenchmarks(picks: Picks, resolution: BenchmarkResolution, scenario: BenchmarkScenario = 'cinematic', game?: SimulatedGame) {
  const cpu = game ? CPU_GAME_BENCHMARKS[picks.cpu]?.[game] : CPU_BENCHMARKS[picks.cpu]?.[scenario];
  const gpu = game ? GPU_GAME_BENCHMARKS[picks.gpu]?.[game]?.[resolution] : GPU_BENCHMARKS[picks.gpu]?.[scenario]?.[resolution];
  const memory = MEMORY_BENCHMARKS[picks.ram];
  const storage = STORAGE_BENCHMARKS[picks.storage];
  const missing = [!cpu && 'cpu', !gpu && 'gpu', !memory && 'ram', !storage && 'storage'].filter(Boolean);
  const compatible = compatibilityIssues(picks).length === 0;
  const memoryScenario = game ? game === 'cyberpunk-2077' ? 'cinematic' : 'competitive' : scenario;
  const supported = !!memory?.supportedScenarios.includes(memoryScenario);
  const available = !missing.length && compatible && supported;
  return {
    kind: 'simulation' as const, datasetVersion: game ? GAME_DATASET_VERSION : BENCHMARK_VERSION,
    scenario: game ? null : scenario, resolution,
    ...(game ? { game, preset: GAME_PROTOCOLS[game].preset, method: GPU_GAME_PROVENANCE[picks.gpu]?.[game]?.method, referenceGpu: GPU_GAME_PROVENANCE[picks.gpu]?.[game]?.referenceGpu, sourceUrl: GPU_GAME_PROVENANCE[picks.gpu]?.[game]?.sourceUrl ?? GAME_PROTOCOLS[game].sourceUrl, disclaimer: 'Reference-calibrated average; synthetic 1% lows/CPU ceiling; fictional result, not a tested rig.' } : {}),
    status: available ? 'available' : 'unavailable',
    reason: missing.length ? `Missing fixture: ${missing.join(', ')}` : !compatible ? 'Known build conflict' : !supported ? 'Memory below scenario reference requirement' : null,
    averageFps: available ? Math.min(cpu.averageFps, gpu.averageFps) : null,
    low1PercentFps: available ? Math.min(cpu.low1PercentFps, gpu.low1PercentFps) : null,
    // Game-specific loading fixtures have not been authored; never reuse a
    // generic scenario time under the name of a real game.
    loadSeconds: available && !game ? storage.loadSeconds[scenario] : null,
    limitingComponent: !available ? null : cpu.averageFps < gpu.averageFps ? 'cpu' : gpu.averageFps < cpu.averageFps ? 'gpu' : 'balanced',
  };
}
