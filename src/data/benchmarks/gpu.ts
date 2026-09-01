import type { GpuBenchmark } from "./types";

/**
 * Fictional GPU workload fixtures for the comparison UI.
 *
 * These are hand-authored estimates, not measurements. They assume a fixed
 * modern test platform with raster rendering only: no ray tracing, upscaling,
 * frame generation, or named game is implied by either preset.
 */
export const GPU_BENCHMARKS: Record<string, GpuBenchmark> = {
  "northwind-gx-5050": {
    competitive: {
      "1080p": { averageFps: 228, low1PercentFps: 176 },
      "1440p": { averageFps: 136, low1PercentFps: 105 },
      "4K": { averageFps: 76, low1PercentFps: 59 },
    },
    cinematic: {
      "1080p": { averageFps: 116, low1PercentFps: 90 },
      "1440p": { averageFps: 68, low1PercentFps: 53 },
      "4K": { averageFps: 39, low1PercentFps: 30 },
    },
  },
  "northwind-gx-5060": {
    competitive: {
      "1080p": { averageFps: 278, low1PercentFps: 215 },
      "1440p": { averageFps: 166, low1PercentFps: 128 },
      "4K": { averageFps: 93, low1PercentFps: 72 },
    },
    cinematic: {
      "1080p": { averageFps: 141, low1PercentFps: 110 },
      "1440p": { averageFps: 84, low1PercentFps: 65 },
      "4K": { averageFps: 48, low1PercentFps: 37 },
    },
  },
  "northwind-gx-5070": {
    competitive: {
      "1080p": { averageFps: 338, low1PercentFps: 262 },
      "1440p": { averageFps: 204, low1PercentFps: 158 },
      "4K": { averageFps: 119, low1PercentFps: 92 },
    },
    cinematic: {
      "1080p": { averageFps: 172, low1PercentFps: 134 },
      "1440p": { averageFps: 106, low1PercentFps: 82 },
      "4K": { averageFps: 62, low1PercentFps: 48 },
    },
  },
  "northwind-gx-5070-ti": {
    competitive: {
      "1080p": { averageFps: 365, low1PercentFps: 283 },
      "1440p": { averageFps: 225, low1PercentFps: 174 },
      "4K": { averageFps: 133, low1PercentFps: 103 },
    },
    cinematic: {
      "1080p": { averageFps: 190, low1PercentFps: 148 },
      "1440p": { averageFps: 117, low1PercentFps: 91 },
      "4K": { averageFps: 70, low1PercentFps: 54 },
    },
  },
  "northwind-gx-5080": {
    competitive: {
      "1080p": { averageFps: 420, low1PercentFps: 326 },
      "1440p": { averageFps: 260, low1PercentFps: 201 },
      "4K": { averageFps: 157, low1PercentFps: 121 },
    },
    cinematic: {
      "1080p": { averageFps: 218, low1PercentFps: 170 },
      "1440p": { averageFps: 136, low1PercentFps: 106 },
      "4K": { averageFps: 82, low1PercentFps: 64 },
    },
  },
  "northwind-gx-5090": {
    competitive: {
      "1080p": { averageFps: 484, low1PercentFps: 375 },
      "1440p": { averageFps: 305, low1PercentFps: 236 },
      "4K": { averageFps: 198, low1PercentFps: 153 },
    },
    cinematic: {
      "1080p": { averageFps: 247, low1PercentFps: 192 },
      "1440p": { averageFps: 154, low1PercentFps: 120 },
      "4K": { averageFps: 98, low1PercentFps: 76 },
    },
  },
  "northwind-gx-5090-reference-edition": {
    competitive: {
      "1080p": { averageFps: 472, low1PercentFps: 366 },
      "1440p": { averageFps: 297, low1PercentFps: 230 },
      "4K": { averageFps: 192, low1PercentFps: 149 },
    },
    cinematic: {
      "1080p": { averageFps: 240, low1PercentFps: 187 },
      "1440p": { averageFps: 150, low1PercentFps: 117 },
      "4K": { averageFps: 95, low1PercentFps: 74 },
    },
  },
  "fabrikam-rx-9060": {
    competitive: {
      "1080p": { averageFps: 238, low1PercentFps: 184 },
      "1440p": { averageFps: 142, low1PercentFps: 110 },
      "4K": { averageFps: 79, low1PercentFps: 61 },
    },
    cinematic: {
      "1080p": { averageFps: 121, low1PercentFps: 94 },
      "1440p": { averageFps: 71, low1PercentFps: 55 },
      "4K": { averageFps: 41, low1PercentFps: 32 },
    },
  },
  "fabrikam-rx-9060-xt": {
    competitive: {
      "1080p": { averageFps: 274, low1PercentFps: 212 },
      "1440p": { averageFps: 168, low1PercentFps: 130 },
      "4K": { averageFps: 96, low1PercentFps: 74 },
    },
    cinematic: {
      "1080p": { averageFps: 145, low1PercentFps: 113 },
      "1440p": { averageFps: 85, low1PercentFps: 66 },
      "4K": { averageFps: 49, low1PercentFps: 38 },
    },
  },
  "fabrikam-rx-9070": {
    competitive: {
      "1080p": { averageFps: 337, low1PercentFps: 261 },
      "1440p": { averageFps: 210, low1PercentFps: 163 },
      "4K": { averageFps: 121, low1PercentFps: 94 },
    },
    cinematic: {
      "1080p": { averageFps: 174, low1PercentFps: 135 },
      "1440p": { averageFps: 108, low1PercentFps: 84 },
      "4K": { averageFps: 64, low1PercentFps: 50 },
    },
  },
  "fabrikam-rx-9070-xt": {
    competitive: {
      "1080p": { averageFps: 374, low1PercentFps: 290 },
      "1440p": { averageFps: 238, low1PercentFps: 185 },
      "4K": { averageFps: 140, low1PercentFps: 108 },
    },
    cinematic: {
      "1080p": { averageFps: 198, low1PercentFps: 154 },
      "1440p": { averageFps: 123, low1PercentFps: 96 },
      "4K": { averageFps: 75, low1PercentFps: 58 },
    },
  },
  "fabrikam-rx-9080-xt": {
    competitive: {
      "1080p": { averageFps: 422, low1PercentFps: 327 },
      "1440p": { averageFps: 270, low1PercentFps: 209 },
      "4K": { averageFps: 164, low1PercentFps: 127 },
    },
    cinematic: {
      "1080p": { averageFps: 220, low1PercentFps: 172 },
      "1440p": { averageFps: 140, low1PercentFps: 109 },
      "4K": { averageFps: 86, low1PercentFps: 67 },
    },
  },
  "fabrikam-rx-9090-xtx": {
    competitive: {
      "1080p": { averageFps: 459, low1PercentFps: 356 },
      "1440p": { averageFps: 294, low1PercentFps: 228 },
      "4K": { averageFps: 185, low1PercentFps: 143 },
    },
    cinematic: {
      "1080p": { averageFps: 242, low1PercentFps: 188 },
      "1440p": { averageFps: 153, low1PercentFps: 119 },
      "4K": { averageFps: 96, low1PercentFps: 75 },
    },
  },
};
