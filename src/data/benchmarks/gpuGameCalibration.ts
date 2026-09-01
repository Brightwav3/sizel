import type { GpuGameBenchmark, SimulatedGame, BenchmarkResolution } from './types';

export type GpuCalibrationMethod =
  | 'reference-calibrated'
  | 'scaled-simulation'
  | 'fictional-extrapolation';

export type GpuGameProvenance = {
  referenceGpu: string;
  sourceUrl: string;
  method: GpuCalibrationMethod;
  note: string;
};

const PCGUIDE_5090 = 'https://www.pcguide.com/gpu/review/msi-suprim-soc-rtx-5090/';
const FOUR_GAMER_5080 = 'https://www.4gamer.net/games/869/G086964/20250129055/';

export const GPU_GAME_REFERENCE_AVERAGES: Record<string, Partial<Record<SimulatedGame, number[]>>> = {
  'northwind-gx-5090': {
    'counter-strike-2': [627, 507, 311],
    'cyberpunk-2077': [231, 212, 110],
    fortnite: [147, 119, 87],
  },
  'northwind-gx-5080': {
    'counter-strike-2': [468, 346, 188],
    'cyberpunk-2077': [213, 151, 72],
    fortnite: [113, 93, 57],
  },
  'northwind-gx-5070': {
    'counter-strike-2': [357, 249, 130],
    'cyberpunk-2077': [169, 108, 48],
  },
  'fabrikam-rx-9070-xt': {
    'counter-strike-2': [339, 231, 110],
    'cyberpunk-2077': [193, 129, 61],
  },
};

const realReferenceName: Record<string, string> = {
  'northwind-gx-5090': 'GeForce RTX 5090',
  'northwind-gx-5080': 'GeForce RTX 5080',
  'northwind-gx-5070': 'GeForce RTX 5070',
  'fabrikam-rx-9070-xt': 'Radeon RX 9070 XT',
};

const allGpuIds = [
  'northwind-gx-5050', 'northwind-gx-5060', 'northwind-gx-5070',
  'northwind-gx-5070-ti', 'northwind-gx-5080', 'northwind-gx-5090',
  'northwind-gx-5090-reference-edition', 'fabrikam-rx-9060',
  'fabrikam-rx-9060-xt', 'fabrikam-rx-9070', 'fabrikam-rx-9070-xt',
  'fabrikam-rx-9080-xt', 'fabrikam-rx-9090-xtx',
];
const games: SimulatedGame[] = ['counter-strike-2', 'fortnite', 'cyberpunk-2077'];
const resolutions: BenchmarkResolution[] = ['1080p', '1440p', '4K'];

function referenceFor(gpuId: string, game: SimulatedGame): string {
  if (GPU_GAME_REFERENCE_AVERAGES[gpuId]?.[game]) return gpuId;
  if (gpuId === 'northwind-gx-5090-reference-edition') return 'northwind-gx-5090';
  if (game === 'fortnite') return 'northwind-gx-5080';
  if (gpuId.startsWith('fabrikam-')) return 'fabrikam-rx-9070-xt';
  if (gpuId === 'northwind-gx-5070-ti') return 'northwind-gx-5080';
  return 'northwind-gx-5070';
}

/** Applies the documented per-game/per-resolution ratio to the original authored fixtures. */
export function calibrateGpuGameBenchmarks(authored: Record<string, GpuGameBenchmark>): Record<string, GpuGameBenchmark> {
  return Object.fromEntries(Object.entries(authored).map(([gpuId, benchmark]) => {
    const gamesOut = Object.fromEntries(games.map(game => {
      const referenceId = referenceFor(gpuId, game);
      const reference = GPU_GAME_REFERENCE_AVERAGES[referenceId]?.[game];
      const originalReference = authored[referenceId]?.[game];
      if (!reference || !originalReference) return [game, benchmark[game]];
      const samples = Object.fromEntries(resolutions.map((resolution, index) => {
        const original = benchmark[game][resolution];
        const originalRef = originalReference[resolution];
        const averageFps = Math.round(original.averageFps / originalRef.averageFps * reference[index]);
        const low1PercentFps = Math.round(averageFps * original.low1PercentFps / original.averageFps);
        return [resolution, { averageFps, low1PercentFps }];
      }));
      return [game, samples];
    }));
    return [gpuId, gamesOut];
  })) as Record<string, GpuGameBenchmark>;
}

function provenanceFor(gpuId: string, game: SimulatedGame): GpuGameProvenance {
  const fixtureReference = referenceFor(gpuId, game);
  const referenceGpu = realReferenceName[fixtureReference] ?? fixtureReference;
  const method: GpuCalibrationMethod =
    gpuId === 'fabrikam-rx-9080-xt' || gpuId === 'fabrikam-rx-9090-xtx'
      ? 'fictional-extrapolation'
      : GPU_GAME_REFERENCE_AVERAGES[gpuId]?.[game]
        ? 'reference-calibrated'
        : 'scaled-simulation';
  const sourceUrl = game === 'fortnite'
    ? FOUR_GAMER_5080
    : PCGUIDE_5090;
  const note = method === 'reference-calibrated'
    ? 'Rounded average from the cited review rig; 1% lows remain synthetic.'
    : method === 'fictional-extrapolation'
      ? 'No real product counterpart; authored extrapolation from the nearest measured tier.'
      : `Scaled from ${referenceGpu} using the original fixture's per-game, per-resolution ratio.`;
  const uncertainty = game === 'fortnite' && gpuId.startsWith('fabrikam-')
    ? ' No matching Radeon measurement; cross-vendor scaling has higher uncertainty.' : '';
  return { referenceGpu, sourceUrl, method, note: `${note}${uncertainty}` };
}

export const GPU_GAME_PROVENANCE: Record<string, Record<SimulatedGame, GpuGameProvenance>> =
  Object.fromEntries(allGpuIds.map(gpuId => [gpuId, Object.fromEntries(games.map(game => [game, provenanceFor(gpuId, game)]))])) as Record<string, Record<SimulatedGame, GpuGameProvenance>>;
