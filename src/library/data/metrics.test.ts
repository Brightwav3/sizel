import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_PICKS } from "./catalog";
import { compatibilityIssues, powerDraw } from "./metrics";

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
    const expected = Math.ceil(powerDraw({ psu: psu550, gpu: bigGpu.id }) * 1.15);
    const full = Math.ceil(powerDraw({ ...DEFAULT_PICKS, gpu: bigGpu.id }) * 1.15);
    expect(issues.join(" ")).toContain(`about ${expected} W`);
    expect(expected).toBeLessThan(full);
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
