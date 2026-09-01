import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog/catalog";
import { GPU_GAME_BENCHMARKS } from "./gpuGames";
import { GPU_GAME_PROVENANCE } from "./gpuGameCalibration";
import type { BenchmarkResolution, SimulatedGame } from "./types";

const games: SimulatedGame[] = ["counter-strike-2", "fortnite", "cyberpunk-2077"];
const resolutions: BenchmarkResolution[] = ["1080p", "1440p", "4K"];

describe("GPU game benchmark fixtures", () => {
  it("covers exactly every canonical GPU", () => {
    expect(Object.keys(GPU_GAME_BENCHMARKS).sort()).toEqual(
      CATALOG.gpu.map(gpu => gpu.id).sort(),
    );
  });

  it("covers every game and resolution with positive finite samples", () => {
    for (const benchmark of Object.values(GPU_GAME_BENCHMARKS)) {
      for (const game of games) {
        for (const resolution of resolutions) {
          const sample = benchmark[game][resolution];
          expect(Number.isFinite(sample.averageFps)).toBe(true);
          expect(Number.isFinite(sample.low1PercentFps)).toBe(true);
          expect(sample.averageFps).toBeGreaterThan(0);
          expect(sample.low1PercentFps).toBeGreaterThan(0);
          expect(sample.low1PercentFps).toBeLessThanOrEqual(sample.averageFps);
        }
      }
    }
  });

  it("declines at each higher resolution for averages and 1% lows", () => {
    for (const benchmark of Object.values(GPU_GAME_BENCHMARKS)) {
      for (const game of games) {
        const samples = resolutions.map(resolution => benchmark[game][resolution]);
        expect(samples[0].averageFps).toBeGreaterThan(samples[1].averageFps);
        expect(samples[1].averageFps).toBeGreaterThan(samples[2].averageFps);
        expect(samples[0].low1PercentFps).toBeGreaterThan(samples[1].low1PercentFps);
        expect(samples[1].low1PercentFps).toBeGreaterThan(samples[2].low1PercentFps);
      }
    }
  });

  it("calibrates unmeasured tiers without claiming direct measurements", () => {
    const amd = GPU_GAME_BENCHMARKS['fabrikam-rx-9070-xt'].fortnite;
    expect(amd['1080p'].averageFps).toBe(111);
    expect(amd['1440p'].averageFps).toBe(92);
    expect(amd['4K'].averageFps).toBe(57);
    expect(GPU_GAME_PROVENANCE['fabrikam-rx-9070-xt'].fortnite).toMatchObject({
      method: 'scaled-simulation', referenceGpu: 'GeForce RTX 5080',
      sourceUrl: 'https://www.4gamer.net/games/869/G086964/20250129055/',
    });
    expect(GPU_GAME_PROVENANCE['fabrikam-rx-9070-xt'].fortnite.note).toContain('higher uncertainty');
    for (const game of games) {
      for (const resolution of resolutions) {
        expect(GPU_GAME_BENCHMARKS['fabrikam-rx-9070'][game][resolution].averageFps)
          .toBeLessThanOrEqual(GPU_GAME_BENCHMARKS['fabrikam-rx-9070-xt'][game][resolution].averageFps);
      }
      expect(GPU_GAME_PROVENANCE['fabrikam-rx-9090-xtx'][game].method).toBe('fictional-extrapolation');
    }
  });

  it("preserves measured anchors and complete provenance", () => {
    expect(resolutions.map(r => GPU_GAME_BENCHMARKS['northwind-gx-5090'].fortnite[r].averageFps)).toEqual([147, 119, 87]);
    expect(resolutions.map(r => GPU_GAME_BENCHMARKS['northwind-gx-5090']['counter-strike-2'][r].averageFps)).toEqual([627, 507, 311]);
    expect(GPU_GAME_BENCHMARKS["northwind-gx-5090"]["cyberpunk-2077"]["4K"].averageFps).toBe(110);
    expect(GPU_GAME_BENCHMARKS["northwind-gx-5080"].fortnite["1440p"].averageFps).toBe(93);
    expect(GPU_GAME_BENCHMARKS["fabrikam-rx-9070-xt"]["counter-strike-2"]["1080p"].averageFps).toBe(339);
    expect(Object.keys(GPU_GAME_PROVENANCE).sort()).toEqual(Object.keys(GPU_GAME_BENCHMARKS).sort());
    for (const gpuId of Object.keys(GPU_GAME_BENCHMARKS)) {
      for (const game of games) {
        expect(GPU_GAME_PROVENANCE[gpuId][game].sourceUrl).toMatch(/^https:\/\//);
        expect(GPU_GAME_PROVENANCE[gpuId][game].method).toMatch(/reference-calibrated|scaled-simulation|fictional-extrapolation/);
      }
    }
  });

});
