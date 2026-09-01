import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog/catalog";
import { MEMORY_BENCHMARKS, STORAGE_BENCHMARKS } from "./memoryStorage";

describe("memory and storage benchmark fixtures", () => {
  it("covers every catalog RAM listing with its actual capacity", () => {
    const ids = CATALOG.ram.map(part => part.id);
    expect(Object.keys(MEMORY_BENCHMARKS).sort()).toEqual([...ids].sort());
    for (const part of CATALOG.ram) {
      const benchmark = MEMORY_BENCHMARKS[part.id];
      expect(benchmark.capacityGB).toBe((part.specifications as any)?.memory?.capacityGB);
      expect(benchmark.supportedScenarios).toEqual(["competitive", "cinematic"]);
      expect(benchmark.note).toContain("no FPS uplift");
    }
  });

  it("covers every catalog storage listing with positive explicit load times", () => {
    const ids = CATALOG.storage.map(part => part.id);
    expect(Object.keys(STORAGE_BENCHMARKS).sort()).toEqual([...ids].sort());
    for (const part of CATALOG.storage) {
      const benchmark = STORAGE_BENCHMARKS[part.id];
      expect(benchmark.capacityGB).toBe((part.specifications as any)?.storage?.capacityGB);
      expect(benchmark.loadSeconds.competitive).toBeGreaterThan(0);
      expect(benchmark.loadSeconds.cinematic).toBeGreaterThan(0);
      expect(benchmark.note).toContain("not measured evidence");
    }
  });
});
