import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_PICKS } from "../../data/catalog/catalog";
import { buildFits, buildNumbers, compatibilityIssues, metrics, powerDraw, requiredPower } from "./metrics";
import type { Picks } from "../../shared/lib/types";

/**
 * A shopper who has chosen nothing has no build, and a shopper who has chosen
 * two parts has a two-part build. The compatibility checks are given only the
 * slots that were actually chosen, so a verdict can never cite a part nobody
 * picked — the bug that told an empty configurator its 550 W supply was short
 * of the 888 W "this build" needed.
 */

const psu550 = "tailspin-power-550";
const bigGpu = CATALOG.gpu.find(g => (g.watt ?? 0) >= 500)!;

describe("compatibilityIssues on a partial build", () => {
  it("says nothing about an empty build", () => {
    expect(compatibilityIssues({})).toEqual([]);
  });

  it("says nothing about a single part, which cannot clash with anything", () => {
    expect(compatibilityIssues({ psu: psu550 })).toEqual([]);
    expect(compatibilityIssues({ gpu: bigGpu.id })).toEqual([]);
  });

  it("never names a part that is not in the build it was given", () => {
    const unchosen = Object.entries(DEFAULT_PICKS)
      .filter(([slot]) => slot !== "psu")
      .map(([slot, id]) => CATALOG[slot as keyof typeof CATALOG].find(p => p.id === id)!.name);
    for (const issue of compatibilityIssues({ psu: psu550, gpu: bigGpu.id })) {
      for (const name of unchosen) expect(issue).not.toContain(name);
    }
  });

  it("weighs a supply against the parts actually chosen", () => {
    const issues = compatibilityIssues({ psu: psu550, gpu: bigGpu.id });
    expect(issues.some(issue => issue.includes("provides 550 W"))).toBe(true);

    // The demand quoted is the one the two chosen parts draw, plus headroom —
    // not the draw of a full machine assembled from defaults.
    const expected = requiredPower({ psu: psu550, gpu: bigGpu.id });
    const full = requiredPower({ ...DEFAULT_PICKS, gpu: bigGpu.id });
    expect(issues.join(" ")).toContain(`about ${expected} W`);
    expect(expected).toBeLessThanOrEqual(full);
  });

  it("grows the demand as more parts are chosen", () => {
    const withGpu = powerDraw({ gpu: bigGpu.id });
    const withGpuAndCpu = powerDraw({ gpu: bigGpu.id, cpu: DEFAULT_PICKS.cpu });
    expect(withGpuAndCpu).toBeGreaterThan(withGpu);
  });

  it("still catches a real clash between two chosen parts", () => {
    const board = CATALOG.board.find(b => b.socket)!;
    const cpu = CATALOG.cpu.find(c => c.socket && c.socket !== board.socket);
    if (!cpu) return; // every CPU in the catalog fits every board
    expect(compatibilityIssues({ cpu: cpu.id, board: board.id }).length).toBeGreaterThan(0);
  });
});

describe("buildFits", () => {
  /** Every combination of the parts that constrain each other, plus defaults. */
  const builds = () => {
    const out: Partial<Picks>[] = [{}, { ...DEFAULT_PICKS }];
    for (const cpu of CATALOG.cpu) {
      for (const board of CATALOG.board) {
        out.push({ ...DEFAULT_PICKS, cpu: cpu.id, board: board.id });
        out.push({ cpu: cpu.id, board: board.id });
      }
    }
    for (const cs of CATALOG.case) {
      for (const gpu of CATALOG.gpu) out.push({ ...DEFAULT_PICKS, case: cs.id, gpu: gpu.id, fans: `${cs.id}::fans` });
    }
    for (const psu of CATALOG.psu) {
      for (const gpu of CATALOG.gpu) out.push({ ...DEFAULT_PICKS, psu: psu.id, gpu: gpu.id });
    }
    for (const ram of CATALOG.ram) out.push({ ...DEFAULT_PICKS, ram: ram.id });
    for (const cooler of CATALOG.cooler) out.push({ ...DEFAULT_PICKS, cooler: cooler.id });
    for (const storage of CATALOG.storage) out.push({ ...DEFAULT_PICKS, storage: storage.id });
    return out;
  };

  it("agrees with compatibilityIssues on every constrained combination", () => {
    const cases = builds();
    expect(cases.length).toBeGreaterThan(100);
    for (const picks of cases) {
      expect(buildFits(picks), JSON.stringify(picks)).toBe(compatibilityIssues(picks).length === 0);
    }
  });

  it("finds both sides: some of those builds fit and some do not", () => {
    const results = builds().map(buildFits);
    expect(results).toContain(true);
    expect(results).toContain(false);
  });
});

describe("buildNumbers", () => {
  it("carries the same numbers metrics reports", () => {
    for (const res of ["1080p", "1440p", "4K"] as const) {
      const picks = { ...DEFAULT_PICKS } as Picks;
      const full = metrics(picks, res);
      const numbers = buildNumbers(picks, res);
      expect(numbers.price).toBe(full.price);
      expect(numbers.fps).toBe(full.fps);
      expect(numbers.noise).toBe(full.noise);
      expect(numbers.days).toBe(full.days);
      expect(numbers.watt).toBe(full.watt);
    }
  });
});
