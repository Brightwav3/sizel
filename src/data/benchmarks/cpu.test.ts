import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog/catalog";
import { CPU_BENCHMARKS } from "./cpu";
import type { BenchmarkScenario } from "./types";

const scenarios: BenchmarkScenario[] = ["competitive", "cinematic"];

describe("CPU benchmark fixtures", () => {
  it("covers exactly every CPU in the canonical catalog", () => {
    expect(Object.keys(CPU_BENCHMARKS).sort()).toEqual(
      CATALOG.cpu.map(cpu => cpu.id).sort(),
    );
  });

  it("contains finite positive frame ceilings with valid 1% lows", () => {
    for (const benchmark of Object.values(CPU_BENCHMARKS)) {
      for (const scenario of scenarios) {
        const sample = benchmark[scenario];
        expect(Number.isFinite(sample.averageFps)).toBe(true);
        expect(Number.isFinite(sample.low1PercentFps)).toBe(true);
        expect(sample.averageFps).toBeGreaterThan(0);
        expect(sample.low1PercentFps).toBeGreaterThan(0);
        expect(sample.low1PercentFps).toBeLessThanOrEqual(sample.averageFps);
      }
    }
  });

  it("keeps the fictional fixture inside the intended scenario bands", () => {
    for (const benchmark of Object.values(CPU_BENCHMARKS)) {
      expect(benchmark.competitive.averageFps).toBeGreaterThanOrEqual(160);
      expect(benchmark.competitive.averageFps).toBeLessThanOrEqual(400);
      expect(benchmark.cinematic.averageFps).toBeGreaterThanOrEqual(80);
      expect(benchmark.cinematic.averageFps).toBeLessThanOrEqual(190);
    }
  });

  it("models a scenario tradeoff between gaming-specialized X3D and multicore CPU", () => {
    const gamingSpecialized = CPU_BENCHMARKS["fabrikam-r9-9950x3d"];
    const multicore = CPU_BENCHMARKS["fabrikam-r9-9950x"];

    expect(gamingSpecialized.competitive.averageFps).toBeGreaterThan(multicore.competitive.averageFps);
    expect(gamingSpecialized.cinematic.averageFps).toBeLessThan(multicore.cinematic.averageFps);
  });
});
