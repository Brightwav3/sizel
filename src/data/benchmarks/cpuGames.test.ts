import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog/catalog";
import { CPU_GAME_BENCHMARKS } from "./cpuGames";
import type { SimulatedGame } from "./types";

const games: SimulatedGame[] = ["counter-strike-2", "fortnite", "cyberpunk-2077"];

describe("CPU game benchmark fixtures", () => {
  it("covers exactly every CPU in the canonical catalog", () => {
    expect(Object.keys(CPU_GAME_BENCHMARKS).sort()).toEqual(
      CATALOG.cpu.map(cpu => cpu.id).sort(),
    );
  });

  it("contains finite positive ceilings with valid 1% lows for every game", () => {
    for (const benchmark of Object.values(CPU_GAME_BENCHMARKS)) {
      for (const game of games) {
        const sample = benchmark[game];
        expect(Number.isFinite(sample.averageFps)).toBe(true);
        expect(Number.isFinite(sample.low1PercentFps)).toBe(true);
        expect(sample.averageFps).toBeGreaterThan(0);
        expect(sample.low1PercentFps).toBeGreaterThan(0);
        expect(sample.low1PercentFps).toBeLessThanOrEqual(sample.averageFps);
      }
    }
  });

  it("keeps each game inside its fixed simulation band", () => {
    for (const benchmark of Object.values(CPU_GAME_BENCHMARKS)) {
      expect(benchmark["counter-strike-2"].averageFps).toBeGreaterThanOrEqual(200);
      expect(benchmark["counter-strike-2"].averageFps).toBeLessThanOrEqual(600);
      expect(benchmark.fortnite.averageFps).toBeGreaterThanOrEqual(120);
      expect(benchmark.fortnite.averageFps).toBeLessThanOrEqual(300);
      expect(benchmark["cyberpunk-2077"].averageFps).toBeGreaterThanOrEqual(80);
      expect(benchmark["cyberpunk-2077"].averageFps).toBeLessThanOrEqual(180);
    }
  });

  it("keeps game workloads meaningfully different", () => {
    const baseline = CPU_GAME_BENCHMARKS["contoso-core-5-250"];
    expect(baseline["counter-strike-2"].averageFps).toBeGreaterThan(baseline.fortnite.averageFps);
    expect(baseline.fortnite.averageFps).toBeGreaterThan(baseline["cyberpunk-2077"].averageFps);
  });

  it("shows the X3D versus multicore tradeoff across game roles", () => {
    const gamingSpecialized = CPU_GAME_BENCHMARKS["fabrikam-r9-9950x3d"];
    const multicore = CPU_GAME_BENCHMARKS["fabrikam-r9-9950x"];
    expect(gamingSpecialized["counter-strike-2"].averageFps).toBeGreaterThan(multicore["counter-strike-2"].averageFps);
    expect(gamingSpecialized.fortnite.averageFps).toBeGreaterThan(multicore.fortnite.averageFps);
    expect(gamingSpecialized["cyberpunk-2077"].averageFps).toBeLessThan(multicore["cyberpunk-2077"].averageFps);
  });
});
