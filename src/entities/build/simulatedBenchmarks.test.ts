import { describe, expect, it } from 'vitest';
import { CATALOG, DEFAULT_PICKS } from '../../data/catalog/catalog';
import { CPU_BENCHMARKS } from '../../data/benchmarks/cpu';
import { GPU_BENCHMARKS } from '../../data/benchmarks/gpu';
import { SIMULATED_GAMES, simulatedBenchmarks } from './simulatedBenchmarks';
import { CPU_GAME_BENCHMARKS } from '../../data/benchmarks/cpuGames';
import { GPU_GAME_BENCHMARKS } from '../../data/benchmarks/gpuGames';
import { bundledFans } from './selection';
import type { Picks } from '../../shared/lib/types';

const baseline = (): Picks => {
  const cs = CATALOG.case.find(p => p.name === 'Proseware Tower')!;
  return { ...DEFAULT_PICKS,
    cpu: 'contoso-core-3-230', gpu: 'fabrikam-rx-9060-xt',
    board: CATALOG.board.find(p => p.name === 'Contoso Board B860')!.id,
    ram: 'proseware-pulse-32gb-ddr5-6000',
    storage: CATALOG.storage.find(p => p.name.includes('Blue N500') && p.price === 119)!.id,
    cooler: CATALOG.cooler.find(p => p.name === 'Acme Labs Frost 24')!.id,
    psu: CATALOG.psu.find(p => p.watt === 1000)!.id,
    case: cs.id, fans: bundledFans(cs.id),
  };
};

describe('fictional whole-build benchmark protocol', () => {
  it('uses independent game fixtures with explicit presets and no invented game loading times', () => {
    const picks = baseline();
    for (const game of SIMULATED_GAMES) {
      const result = simulatedBenchmarks(picks, '1440p', undefined, game);
      expect(result).toMatchObject({ kind: 'simulation', datasetVersion: 'rigsmith-game-simulation-v2', game, scenario: null, status: 'available', loadSeconds: null });
      expect(result.averageFps).toBe(Math.min(CPU_GAME_BENCHMARKS[picks.cpu][game].averageFps, GPU_GAME_BENCHMARKS[picks.gpu][game]['1440p'].averageFps));
      expect(result.preset).toContain(game === 'counter-strike-2' ? 'Very High' : 'Ultra');
      expect(result.sourceUrl).toMatch(/^https:\/\//);
      expect(result.method).toBeDefined();
      expect(result.referenceGpu).toBeDefined();
      expect(result.disclaimer).toContain('Reference');
      expect(result.disclaimer).toContain('1% lows');
    }
  });
  it('shows a GPU improvement without claiming measured evidence or selecting parts', () => {
    const picks = baseline();
    const before = structuredClone(picks);
    const base = simulatedBenchmarks(picks, '1440p');
    const upgrade = simulatedBenchmarks({ ...picks, gpu: 'fabrikam-rx-9070-xt' }, '1440p');
    expect(base).toMatchObject({ kind: 'simulation', status: 'available', scenario: 'cinematic', datasetVersion: 'rigsmith-simulation-v1' });
    expect(upgrade.averageFps!).toBeGreaterThan(base.averageFps!);
    expect(picks).toEqual(before);
  });
  it('uses scenario-specific CPU/GPU ceilings, not price or core count', () => {
    const picks = { ...baseline(), gpu: 'fabrikam-rx-9090-xtx' };
    const result = simulatedBenchmarks(picks, '1080p', 'competitive');
    expect(result.averageFps).toBe(Math.min(CPU_BENCHMARKS[picks.cpu].competitive.averageFps, GPU_BENCHMARKS[picks.gpu].competitive['1080p'].averageFps));
    expect(result.limitingComponent).toBe('cpu');
    expect(result.low1PercentFps!).toBeLessThanOrEqual(result.averageFps!);
  });
  it('does not turn storage speed or excess RAM capacity into FPS', () => {
    const picks = baseline();
    const base = simulatedBenchmarks(picks, '1440p');
    const changed = simulatedBenchmarks({ ...picks, ram: 'proseware-pulse-64gb-ddr5-6000', storage: CATALOG.storage.find(p => p.id !== picks.storage)!.id }, '1440p');
    expect(changed.status).toBe('available');
    expect(changed.averageFps).toBe(base.averageFps);
    expect(changed.loadSeconds).not.toBeNull();
  });
  it('returns unavailable instead of a fabricated result for missing data or known conflicts', () => {
    const picks = baseline();
    expect(simulatedBenchmarks({ ...picks, gpu: 'unknown' }, '1440p')).toMatchObject({ status: 'unavailable', averageFps: null });
    expect(simulatedBenchmarks({ ...picks, cpu: 'fabrikam-r5-9600x' }, '1440p')).toMatchObject({ status: 'unavailable', reason: 'Known build conflict', averageFps: null });
  });
});
