import type { CpuGameBenchmark } from "./types";

/**
 * Hand-authored fictional CPU ceilings for the game comparison demo.
 *
 * These are simulation inputs, not hardware measurements or predictions of
 * performance in the named games. The preset convention is fixed: Counter-
 * Strike 2 uses Very High native raster, Fortnite uses Ultra DX12 with
 * software Lumen, and Cyberpunk 2077 uses Ultra native raster without ray
 * tracing. No upscaling or frame generation is represented.
 */
export const CPU_GAME_BENCHMARKS: Record<string, CpuGameBenchmark> = {
  "contoso-core-3-230": {
    "counter-strike-2": { averageFps: 214, low1PercentFps: 158 },
    fortnite: { averageFps: 142, low1PercentFps: 104 },
    "cyberpunk-2077": { averageFps: 84, low1PercentFps: 61 },
  },
  "contoso-core-5-250": {
    "counter-strike-2": { averageFps: 286, low1PercentFps: 214 },
    fortnite: { averageFps: 184, low1PercentFps: 137 },
    "cyberpunk-2077": { averageFps: 103, low1PercentFps: 76 },
  },
  "contoso-core-7-275k": {
    "counter-strike-2": { averageFps: 362, low1PercentFps: 277 },
    fortnite: { averageFps: 223, low1PercentFps: 168 },
    "cyberpunk-2077": { averageFps: 127, low1PercentFps: 94 },
  },
  "contoso-core-9-295k": {
    "counter-strike-2": { averageFps: 405, low1PercentFps: 311 },
    fortnite: { averageFps: 252, low1PercentFps: 190 },
    "cyberpunk-2077": { averageFps: 151, low1PercentFps: 112 },
  },
  "contoso-core-ultra-9-295x": {
    "counter-strike-2": { averageFps: 431, low1PercentFps: 332 },
    fortnite: { averageFps: 267, low1PercentFps: 202 },
    "cyberpunk-2077": { averageFps: 158, low1PercentFps: 117 },
  },
  "fabrikam-r5-9600x": {
    "counter-strike-2": { averageFps: 302, low1PercentFps: 231 },
    fortnite: { averageFps: 193, low1PercentFps: 145 },
    "cyberpunk-2077": { averageFps: 108, low1PercentFps: 79 },
  },
  "fabrikam-r7-9700x": {
    "counter-strike-2": { averageFps: 355, low1PercentFps: 271 },
    fortnite: { averageFps: 225, low1PercentFps: 169 },
    "cyberpunk-2077": { averageFps: 135, low1PercentFps: 99 },
  },
  "fabrikam-r7-9800x3d": {
    "counter-strike-2": { averageFps: 492, low1PercentFps: 381 },
    fortnite: { averageFps: 286, low1PercentFps: 222 },
    "cyberpunk-2077": { averageFps: 139, low1PercentFps: 103 },
  },
  "fabrikam-r9-9950x": {
    "counter-strike-2": { averageFps: 414, low1PercentFps: 317 },
    fortnite: { averageFps: 273, low1PercentFps: 205 },
    "cyberpunk-2077": { averageFps: 169, low1PercentFps: 126 },
  },
  "fabrikam-r9-9950x3d": {
    "counter-strike-2": { averageFps: 506, low1PercentFps: 394 },
    fortnite: { averageFps: 298, low1PercentFps: 231 },
    "cyberpunk-2077": { averageFps: 154, low1PercentFps: 114 },
  },
  "contoso-core-7-265k": {
    "counter-strike-2": { averageFps: 329, low1PercentFps: 251 },
    fortnite: { averageFps: 211, low1PercentFps: 158 },
    "cyberpunk-2077": { averageFps: 120, low1PercentFps: 88 },
  },
  "fabrikam-r5-8600x": {
    "counter-strike-2": { averageFps: 267, low1PercentFps: 202 },
    fortnite: { averageFps: 171, low1PercentFps: 127 },
    "cyberpunk-2077": { averageFps: 96, low1PercentFps: 70 },
  },
  "fabrikam-r9-9900x": {
    "counter-strike-2": { averageFps: 391, low1PercentFps: 299 },
    fortnite: { averageFps: 261, low1PercentFps: 196 },
    "cyberpunk-2077": { averageFps: 163, low1PercentFps: 121 },
  },
};
