import type { SimulatedGame } from './types';

export const GAME_DATASET_VERSION = 'rigsmith-game-simulation-v2';

export const GAME_PROTOCOLS: Record<SimulatedGame, {
  preset: string;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
}> = {
  'cyberpunk-2077': {
    preset: 'Ultra, native raster, no ray tracing, upscaling or frame generation',
    sourceLabel: 'PCGuide RTX 5090 review',
    sourceUrl: 'https://www.pcguide.com/gpu/review/msi-suprim-soc-rtx-5090/',
    note: 'Average FPS is calibrated to the cited PCGuide raster reference; 1% lows and the CPU/build ceiling remain synthetic.',
  },
  'counter-strike-2': {
    preset: 'Very High, native raster, no upscaling or frame generation',
    sourceLabel: 'PCGuide RTX 5090 review',
    sourceUrl: 'https://www.pcguide.com/gpu/review/msi-suprim-soc-rtx-5090/',
    note: 'Average FPS is calibrated to the cited PCGuide raster reference; 1% lows and the CPU/build ceiling remain synthetic.',
  },
  fortnite: {
    preset: 'Ultra DX12, 100% render scale with TAA, Nanite off, hardware RT off, software Lumen enabled, no upscaling or frame generation',
    sourceLabel: '4Gamer RTX 5080 review',
    sourceUrl: 'https://www.4gamer.net/games/869/G086964/20250129055/',
    note: 'Average FPS is calibrated to the cited 4Gamer reference; 1% lows and the CPU/build ceiling remain synthetic.',
  },
};
