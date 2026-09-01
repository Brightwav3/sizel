import type { GpuGameBenchmark } from "./types";
import { calibrateGpuGameBenchmarks } from "./gpuGameCalibration";

/**
 * Hand-authored fictional game workload fixtures for the comparison UI.
 *
 * Historical v1 inputs retained only for authored tier and low/average ratios.
 * The exported calibrated dataset below uses the protocols in gameProtocol.ts,
 * including software Lumen for Fortnite. These inputs are not measurements.
 */
export const AUTHORED_GPU_GAME_BENCHMARKS: Record<string, GpuGameBenchmark> = {
  "northwind-gx-5050": {
    "counter-strike-2": {
      "1080p": { averageFps: 302, low1PercentFps: 228 },
      "1440p": { averageFps: 224, low1PercentFps: 171 },
      "4K": { averageFps: 132, low1PercentFps: 100 },
    },
    fortnite: {
      "1080p": { averageFps: 214, low1PercentFps: 161 },
      "1440p": { averageFps: 156, low1PercentFps: 117 },
      "4K": { averageFps: 86, low1PercentFps: 64 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 96, low1PercentFps: 71 },
      "1440p": { averageFps: 68, low1PercentFps: 50 },
      "4K": { averageFps: 37, low1PercentFps: 27 },
    },
  },
  "northwind-gx-5060": {
    "counter-strike-2": {
      "1080p": { averageFps: 356, low1PercentFps: 270 },
      "1440p": { averageFps: 268, low1PercentFps: 203 },
      "4K": { averageFps: 160, low1PercentFps: 122 },
    },
    fortnite: {
      "1080p": { averageFps: 255, low1PercentFps: 192 },
      "1440p": { averageFps: 185, low1PercentFps: 139 },
      "4K": { averageFps: 103, low1PercentFps: 77 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 121, low1PercentFps: 89 },
      "1440p": { averageFps: 86, low1PercentFps: 63 },
      "4K": { averageFps: 48, low1PercentFps: 35 },
    },
  },
  "northwind-gx-5070": {
    "counter-strike-2": {
      "1080p": { averageFps: 421, low1PercentFps: 319 },
      "1440p": { averageFps: 319, low1PercentFps: 243 },
      "4K": { averageFps: 198, low1PercentFps: 150 },
    },
    fortnite: {
      "1080p": { averageFps: 303, low1PercentFps: 228 },
      "1440p": { averageFps: 222, low1PercentFps: 167 },
      "4K": { averageFps: 127, low1PercentFps: 95 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 149, low1PercentFps: 109 },
      "1440p": { averageFps: 108, low1PercentFps: 79 },
      "4K": { averageFps: 61, low1PercentFps: 45 },
    },
  },
  "northwind-gx-5070-ti": {
    "counter-strike-2": {
      "1080p": { averageFps: 448, low1PercentFps: 340 },
      "1440p": { averageFps: 344, low1PercentFps: 261 },
      "4K": { averageFps: 218, low1PercentFps: 165 },
    },
    fortnite: {
      "1080p": { averageFps: 325, low1PercentFps: 245 },
      "1440p": { averageFps: 240, low1PercentFps: 180 },
      "4K": { averageFps: 140, low1PercentFps: 105 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 164, low1PercentFps: 120 },
      "1440p": { averageFps: 120, low1PercentFps: 88 },
      "4K": { averageFps: 68, low1PercentFps: 50 },
    },
  },
  "northwind-gx-5080": {
    "counter-strike-2": {
      "1080p": { averageFps: 488, low1PercentFps: 371 },
      "1440p": { averageFps: 382, low1PercentFps: 290 },
      "4K": { averageFps: 246, low1PercentFps: 187 },
    },
    fortnite: {
      "1080p": { averageFps: 355, low1PercentFps: 267 },
      "1440p": { averageFps: 264, low1PercentFps: 198 },
      "4K": { averageFps: 155, low1PercentFps: 116 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 185, low1PercentFps: 135 },
      "1440p": { averageFps: 136, low1PercentFps: 99 },
      "4K": { averageFps: 78, low1PercentFps: 57 },
    },
  },
  "northwind-gx-5090": {
    "counter-strike-2": {
      "1080p": { averageFps: 548, low1PercentFps: 416 },
      "1440p": { averageFps: 438, low1PercentFps: 333 },
      "4K": { averageFps: 292, low1PercentFps: 222 },
    },
    fortnite: {
      "1080p": { averageFps: 396, low1PercentFps: 298 },
      "1440p": { averageFps: 297, low1PercentFps: 223 },
      "4K": { averageFps: 180, low1PercentFps: 135 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 215, low1PercentFps: 157 },
      "1440p": { averageFps: 160, low1PercentFps: 117 },
      "4K": { averageFps: 92, low1PercentFps: 67 },
    },
  },
  "northwind-gx-5090-reference-edition": {
    "counter-strike-2": {
      "1080p": { averageFps: 536, low1PercentFps: 407 },
      "1440p": { averageFps: 429, low1PercentFps: 326 },
      "4K": { averageFps: 286, low1PercentFps: 217 },
    },
    fortnite: {
      "1080p": { averageFps: 388, low1PercentFps: 292 },
      "1440p": { averageFps: 291, low1PercentFps: 218 },
      "4K": { averageFps: 176, low1PercentFps: 132 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 210, low1PercentFps: 153 },
      "1440p": { averageFps: 156, low1PercentFps: 114 },
      "4K": { averageFps: 89, low1PercentFps: 65 },
    },
  },
  "fabrikam-rx-9060": {
    "counter-strike-2": {
      "1080p": { averageFps: 318, low1PercentFps: 241 },
      "1440p": { averageFps: 239, low1PercentFps: 182 },
      "4K": { averageFps: 141, low1PercentFps: 107 },
    },
    fortnite: {
      "1080p": { averageFps: 225, low1PercentFps: 169 },
      "1440p": { averageFps: 163, low1PercentFps: 122 },
      "4K": { averageFps: 91, low1PercentFps: 68 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 103, low1PercentFps: 76 },
      "1440p": { averageFps: 73, low1PercentFps: 54 },
      "4K": { averageFps: 40, low1PercentFps: 29 },
    },
  },
  "fabrikam-rx-9060-xt": {
    "counter-strike-2": {
      "1080p": { averageFps: 362, low1PercentFps: 275 },
      "1440p": { averageFps: 278, low1PercentFps: 211 },
      "4K": { averageFps: 169, low1PercentFps: 128 },
    },
    fortnite: {
      "1080p": { averageFps: 262, low1PercentFps: 197 },
      "1440p": { averageFps: 194, low1PercentFps: 145 },
      "4K": { averageFps: 111, low1PercentFps: 83 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 128, low1PercentFps: 94 },
      "1440p": { averageFps: 93, low1PercentFps: 68 },
      "4K": { averageFps: 52, low1PercentFps: 38 },
    },
  },
  "fabrikam-rx-9070": {
    "counter-strike-2": {
      "1080p": { averageFps: 432, low1PercentFps: 328 },
      "1440p": { averageFps: 343, low1PercentFps: 261 },
      "4K": { averageFps: 216, low1PercentFps: 164 },
    },
    fortnite: {
      "1080p": { averageFps: 319, low1PercentFps: 240 },
      "1440p": { averageFps: 237, low1PercentFps: 178 },
      "4K": { averageFps: 139, low1PercentFps: 104 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 157, low1PercentFps: 115 },
      "1440p": { averageFps: 115, low1PercentFps: 84 },
      "4K": { averageFps: 60, low1PercentFps: 44 },
    },
  },
  "fabrikam-rx-9070-xt": {
    "counter-strike-2": {
      "1080p": { averageFps: 472, low1PercentFps: 359 },
      "1440p": { averageFps: 378, low1PercentFps: 287 },
      "4K": { averageFps: 241, low1PercentFps: 183 },
    },
    fortnite: {
      "1080p": { averageFps: 349, low1PercentFps: 263 },
      "1440p": { averageFps: 260, low1PercentFps: 195 },
      "4K": { averageFps: 154, low1PercentFps: 115 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 177, low1PercentFps: 129 },
      "1440p": { averageFps: 131, low1PercentFps: 96 },
      "4K": { averageFps: 74, low1PercentFps: 54 },
    },
  },
  "fabrikam-rx-9080-xt": {
    "counter-strike-2": {
      "1080p": { averageFps: 514, low1PercentFps: 391 },
      "1440p": { averageFps: 416, low1PercentFps: 316 },
      "4K": { averageFps: 270, low1PercentFps: 205 },
    },
    fortnite: {
      "1080p": { averageFps: 383, low1PercentFps: 288 },
      "1440p": { averageFps: 287, low1PercentFps: 215 },
      "4K": { averageFps: 171, low1PercentFps: 128 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 198, low1PercentFps: 145 },
      "1440p": { averageFps: 147, low1PercentFps: 107 },
      "4K": { averageFps: 84, low1PercentFps: 61 },
    },
  },
  "fabrikam-rx-9090-xtx": {
    "counter-strike-2": {
      "1080p": { averageFps: 548, low1PercentFps: 417 },
      "1440p": { averageFps: 447, low1PercentFps: 340 },
      "4K": { averageFps: 295, low1PercentFps: 224 },
    },
    fortnite: {
      "1080p": { averageFps: 406, low1PercentFps: 305 },
      "1440p": { averageFps: 307, low1PercentFps: 230 },
      "4K": { averageFps: 186, low1PercentFps: 139 },
    },
    "cyberpunk-2077": {
      "1080p": { averageFps: 213, low1PercentFps: 156 },
      "1440p": { averageFps: 159, low1PercentFps: 116 },
      "4K": { averageFps: 91, low1PercentFps: 66 },
    },
  },
};

export const GPU_GAME_BENCHMARKS = calibrateGpuGameBenchmarks(AUTHORED_GPU_GAME_BENCHMARKS);
