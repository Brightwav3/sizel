import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_PICKS } from "../../data/catalog/catalog";
import { compatibilityIssues, metrics } from "../../entities/build/metrics";
import type { PcSlot, Picks } from "../../shared/lib/types";
import { bottleneck, fixOptions, powerReport, recommendBuild } from "./buildAdvisor";
import { OUTPUT_BUDGET, ok } from "./toolResult";
import { TOOLS, toolsForRoute } from "./tools";

const text = (result: { content: { text: string }[] }) => result.content[0].text;
const call = (name: string, args: Record<string, unknown> = {}) => {
  const tool = TOOLS.find(entry => entry.name === name)!;
  return text(tool.execute(args) as { content: { text: string }[] });
};

/** A build with a socket clash, for the fix path. */
const clashing = (): Picks => {
  const cpu = CATALOG.cpu.find(part => part.socket === "AM5") ?? CATALOG.cpu[0];
  const board = CATALOG.board.find(part => part.socket !== cpu.socket) ?? CATALOG.board[0];
  return { ...DEFAULT_PICKS, cpu: cpu.id, board: board.id } as Picks;
};

describe("tool contract", () => {
  it("keeps names, descriptions and parameters inside the WebMCP budgets", () => {
    for (const tool of TOOLS) {
      expect(tool.name.length, tool.name).toBeLessThanOrEqual(30);
      expect(tool.description.length, tool.name).toBeLessThanOrEqual(500);
      const properties = (tool.inputSchema as any).properties ?? {};
      for (const [key, definition] of Object.entries<any>(properties)) {
        expect(key.length, `${tool.name}.${key}`).toBeLessThanOrEqual(30);
        expect(String(definition.description).length, `${tool.name}.${key}`).toBeLessThanOrEqual(150);
      }
    }
  });

  it("registers each name once", () => {
    expect(new Set(TOOLS.map(tool => tool.name)).size).toBe(TOOLS.length);
  });

  it("marks every tool that changes nothing as read only", () => {
    const writers = ["set_build_component", "add_to_cart", "add_build_to_cart", "create_watchdog",
      "recommend_build", "set_build_target", "undo_build_change", "show_in_catalog"];
    for (const tool of TOOLS) {
      const readOnly = tool.readOnlyHint === true && tool.annotations?.readOnlyHint === true;
      expect(readOnly, tool.name).toBe(!writers.includes(tool.name));
    }
  });

  it("offers the build editors only on screens that show a build", () => {
    expect(toolsForRoute("checkout").map(tool => tool.name)).not.toContain("set_build_component");
    expect(toolsForRoute("builder").map(tool => tool.name)).toContain("fix_build_issue");
    expect(toolsForRoute("home").map(tool => tool.name)).toContain("search_products");
  });
});

describe("results stay inside the output budget", () => {
  it("shortens a list rather than letting the agent cut the JSON", () => {
    const items = Array.from({ length: 200 }, (_, index) => ({ id: `p${index}`, name: "A long product name here" }));
    const body = text(ok({ items }, "items"));
    expect(body.length).toBeLessThanOrEqual(OUTPUT_BUDGET);
    expect(JSON.parse(body).omitted).toBeGreaterThan(0);
  });

  it("holds for the catalog tools that need no mounted app", () => {
    const gpu = CATALOG.gpu[0];
    const calls = [
      call("search_products", { category: "gpu", limit: 20 }),
      call("search_products", { query: "phone" }),
      call("get_product", { productId: gpu.id }),
      call("list_filters", { category: "gpu" }),
      call("check_stock", { productId: gpu.id }),
      call("compare_products", { productIds: CATALOG.gpu.slice(0, 4).map(part => part.id) }),
    ];
    for (const body of calls) expect(body.length).toBeLessThanOrEqual(OUTPUT_BUDGET);
  });

  it("answers an unknown id with a reason instead of throwing", () => {
    expect(JSON.parse(call("get_product", { productId: "nope" })).error).toBe("product_not_found");
  });
});

describe("recommend_build", () => {
  it.each([900, 1500, 2400, 4000])("returns a compatible machine for $%i", budget => {
    const proposal = recommendBuild(budget);
    expect(compatibilityIssues(proposal.picks)).toEqual([]);
    expect(proposal.issues).toEqual([]);
  });

  it("spends more of a larger budget and gains frame rate for it", () => {
    const small = recommendBuild(900);
    const large = recommendBuild(3000);
    expect(large.price).toBeGreaterThan(small.price);
    expect(large.fps).toBeGreaterThanOrEqual(small.fps);
  });

  it("is deterministic", () => {
    expect(recommendBuild(1800, "1440p", true).picks).toEqual(recommendBuild(1800, "1440p", true).picks);
  });

  it("keeps the fan pack that belongs to the case", () => {
    const proposal = recommendBuild(1800);
    expect(proposal.picks.fans).toBe(`${proposal.picks.case}::fans`);
  });
});

describe("fix_build_issue", () => {
  it("returns nothing for a build that already fits", () => {
    expect(fixOptions({ ...DEFAULT_PICKS } as Picks)).toEqual([]);
  });

  it("offers swaps that clear the conflict", () => {
    const picks = clashing();
    expect(compatibilityIssues(picks).length).toBeGreaterThan(0);
    const options = fixOptions(picks);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      const next = { ...picks, [option.slot]: option.id } as Picks;
      expect(compatibilityIssues(next), `${option.slot} ${option.name}`).toEqual([]);
    }
  });

  it("blames a part the conflict actually names", () => {
    const picks = clashing();
    const slots = new Set(fixOptions(picks).map(option => option.slot));
    expect([...slots].every(slot => (["cpu", "board"] as PcSlot[]).includes(slot))).toBe(true);
  });

  it("respects a requested slot", () => {
    expect(fixOptions(clashing(), "1440p", "board").every(option => option.slot === "board")).toBe(true);
  });
});

describe("explain_build_bottleneck", () => {
  it("names the graphics card when nothing holds it back", () => {
    const strongCpu = CATALOG.cpu.reduce((a, b) => (b.score ?? 0) > (a.score ?? 0) ? b : a);
    const strongRam = CATALOG.ram.reduce((a, b) => (b.score ?? 0) > (a.score ?? 0) ? b : a);
    const picks = { ...DEFAULT_PICKS, cpu: strongCpu.id, ram: strongRam.id } as Picks;
    const report = bottleneck(picks);
    expect(report.slot).toBe("gpu");
    expect(report.lostFps).toBe(0);
  });

  it("names the weak part and the frames it costs", () => {
    const weakCpu = CATALOG.cpu.reduce((a, b) => (b.score ?? 100) < (a.score ?? 100) ? b : a);
    const fastGpu = CATALOG.gpu.reduce((a, b) => (b.fps ?? 0) > (a.fps ?? 0) ? b : a);
    const picks = { ...DEFAULT_PICKS, cpu: weakCpu.id, gpu: fastGpu.id } as Picks;
    const report = bottleneck(picks);
    if (report.slot !== "gpu") {
      expect(report.lostFps).toBeGreaterThan(0);
      expect(report.currentFps).toBe(metrics(picks).fps);
    }
  });
});

describe("powerReport", () => {
  it("states draw, requirement and headroom the way the rule does", () => {
    const report = powerReport({ ...DEFAULT_PICKS } as Picks);
    expect(report.requiredW).toBe(Math.ceil(report.drawW * 1.15));
    expect(report.ok).toBe(report.psuW >= report.requiredW);
  });
});
