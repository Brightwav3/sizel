import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog/realCatalog";
import { GPU_BENCHMARKS } from "./gpu";
import type { BenchmarkResolution, BenchmarkScenario } from "./types";

const scenarios: BenchmarkScenario[] = ["competitive", "cinematic"];
const resolutions: BenchmarkResolution[] = ["1080p", "1440p", "4K"];

describe("GPU benchmark fixtures", () => {
  it("covers every canonical GPU exactly once", () => {
    expect(Object.keys(GPU_BENCHMARKS).sort()).toEqual(CATALOG.gpu.map(gpu => gpu.id).sort());
  });

  it("has finite positive frame samples with valid one-percent lows", () => {
    for (const benchmark of Object.values(GPU_BENCHMARKS)) {
      for (const scenario of scenarios) {
        for (const resolution of resolutions) {
          const sample = benchmark[scenario][resolution];
          expect(Number.isFinite(sample.averageFps)).toBe(true);
          expect(Number.isFinite(sample.low1PercentFps)).toBe(true);
          expect(sample.averageFps).toBeGreaterThan(0);
          expect(sample.low1PercentFps).toBeGreaterThan(0);
          expect(sample.low1PercentFps).toBeLessThanOrEqual(sample.averageFps);
        }
      }
    }
  });

  it("drops coherently as resolution rises", () => {
    for (const benchmark of Object.values(GPU_BENCHMARKS)) {
      for (const scenario of scenarios) {
        expect(benchmark[scenario]["1080p"].averageFps).toBeGreaterThan(benchmark[scenario]["1440p"].averageFps);
        expect(benchmark[scenario]["1440p"].averageFps).toBeGreaterThan(benchmark[scenario]["4K"].averageFps);
      }
    }
  });

  it("keeps preset bands and gives the RX 9060 XT a meaningful upgrade path", () => {
    for (const benchmark of Object.values(GPU_BENCHMARKS)) {
      expect(benchmark.competitive["1440p"].averageFps).toBeGreaterThanOrEqual(100);
      expect(benchmark.competitive["1440p"].averageFps).toBeLessThanOrEqual(350);
      expect(benchmark.cinematic["1440p"].averageFps).toBeGreaterThanOrEqual(40);
      expect(benchmark.cinematic["1440p"].averageFps).toBeLessThanOrEqual(160);
    }

    const rx9060xt = GPU_BENCHMARKS["fabrikam-rx-9060-xt"];
    const rx9070 = GPU_BENCHMARKS["fabrikam-rx-9070"];
    const rx9070xt = GPU_BENCHMARKS["fabrikam-rx-9070-xt"];
    const rx9080xt = GPU_BENCHMARKS["fabrikam-rx-9080-xt"];
    const rx9090xtx = GPU_BENCHMARKS["fabrikam-rx-9090-xtx"];
    expect(rx9070.competitive["1440p"].averageFps - rx9060xt.competitive["1440p"].averageFps).toBeGreaterThanOrEqual(30);
    const rx9070ToXt = rx9070xt.competitive["1440p"].averageFps - rx9070.competitive["1440p"].averageFps;
    expect(rx9070ToXt).toBeGreaterThanOrEqual(15);
    expect(rx9070ToXt).toBeLessThan(rx9070.competitive["1440p"].averageFps - rx9060xt.competitive["1440p"].averageFps);
    expect(rx9090xtx.competitive["1440p"].averageFps - rx9080xt.competitive["1440p"].averageFps).toBeLessThan(
      rx9080xt.competitive["1440p"].averageFps - rx9070xt.competitive["1440p"].averageFps,
    );
    expect(rx9090xtx.competitive["4K"].averageFps - rx9080xt.competitive["4K"].averageFps).toBeLessThan(
      rx9080xt.competitive["4K"].averageFps - rx9070xt.competitive["4K"].averageFps,
    );
    expect(rx9070xt.cinematic["4K"].averageFps).toBeGreaterThan(rx9070.cinematic["4K"].averageFps);
  });
});
