import type { CpuBenchmark } from "./types";

/**
 * Hand-authored fictional CPU-bound reference ceilings for the demo model.
 * These are scenario inputs, not measurements of the catalog hardware.
 */
export const CPU_BENCHMARKS: Record<string, CpuBenchmark> = {
  "contoso-core-3-230": {
    competitive: { averageFps: 178, low1PercentFps: 132 },
    cinematic: { averageFps: 92, low1PercentFps: 68 },
  },
  "contoso-core-5-250": {
    competitive: { averageFps: 236, low1PercentFps: 177 },
    cinematic: { averageFps: 118, low1PercentFps: 88 },
  },
  "contoso-core-7-275k": {
    competitive: { averageFps: 304, low1PercentFps: 229 },
    cinematic: { averageFps: 151, low1PercentFps: 113 },
  },
  "contoso-core-9-295k": {
    competitive: { averageFps: 336, low1PercentFps: 252 },
    cinematic: { averageFps: 176, low1PercentFps: 132 },
  },
  "contoso-core-ultra-9-295x": {
    competitive: { averageFps: 352, low1PercentFps: 264 },
    cinematic: { averageFps: 184, low1PercentFps: 138 },
  },
  "fabrikam-r5-9600x": {
    competitive: { averageFps: 248, low1PercentFps: 186 },
    cinematic: { averageFps: 108, low1PercentFps: 81 },
  },
  "fabrikam-r7-9700x": {
    competitive: { averageFps: 292, low1PercentFps: 219 },
    cinematic: { averageFps: 137, low1PercentFps: 102 },
  },
  "fabrikam-r7-9800x3d": {
    competitive: { averageFps: 392, low1PercentFps: 304 },
    cinematic: { averageFps: 154, low1PercentFps: 116 },
  },
  "fabrikam-r9-9950x": {
    competitive: { averageFps: 344, low1PercentFps: 258 },
    cinematic: { averageFps: 190, low1PercentFps: 143 },
  },
  "fabrikam-r9-9950x3d": {
    competitive: { averageFps: 400, low1PercentFps: 312 },
    cinematic: { averageFps: 171, low1PercentFps: 128 },
  },
  "contoso-core-7-265k": {
    competitive: { averageFps: 276, low1PercentFps: 207 },
    cinematic: { averageFps: 129, low1PercentFps: 96 },
  },
  "fabrikam-r5-8600x": {
    competitive: { averageFps: 218, low1PercentFps: 163 },
    cinematic: { averageFps: 96, low1PercentFps: 72 },
  },
  "fabrikam-r9-9900x": {
    competitive: { averageFps: 322, low1PercentFps: 241 },
    cinematic: { averageFps: 180, low1PercentFps: 135 },
  },
};
