import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_PICKS } from "../../data/catalog/catalog";
import { compatibilityIssues, metrics } from "../../entities/build/metrics";
import type { PcSlot, Picks } from "../../shared/lib/types";
import { BUDGET_TOLERANCE, bottleneck, cheapestBuild, fixOptions, powerReport, recommendBuild } from "./buildAdvisor";
import { part } from "../../entities/build/metrics";
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
      "recommend_build", "set_build_target", "undo_build_change", "show_in_catalog",
      "update_cart_line", "start_checkout", "remove_watchdog",
      "select_product_variant", "focus_builder_slot"];
    for (const tool of TOOLS) {
      const readOnly = tool.readOnlyHint === true && tool.annotations?.readOnlyHint === true;
      expect(readOnly, tool.name).toBe(!writers.includes(tool.name));
    }
  });

  it("labels the one tool that returns shopper-written text as untrusted", () => {
    for (const tool of TOOLS) {
      const untrusted = tool.untrustedContentHint === true && tool.annotations?.untrustedContentHint === true;
      expect(untrusted, tool.name).toBe(tool.name === "get_reviews");
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

  it("drops a note about rows the shortening removed", () => {
    const items = Array.from({ length: 60 }, (_, index) => ({
      id: `p${index}`, name: "A long product name here", ...(index > 40 ? { concern: "out_of_stock" } : {}),
    }));
    const body = JSON.parse(text(ok({ items }, "items", shown =>
      shown.some((item: any) => item.concern) ? { hint: "some are out of stock" } : {})));
    expect(body.omitted).toBeGreaterThan(0);
    expect(body.items.some((item: any) => item.concern)).toBe(false);
    expect(body.hint).toBeUndefined();
  });

  it("keeps the note when a row it describes survives", () => {
    const items = Array.from({ length: 3 }, (_, index) => ({ id: `p${index}`, concern: "out_of_stock" }));
    const body = JSON.parse(text(ok({ items }, "items", shown =>
      shown.some((item: any) => item.concern) ? { hint: "some are out of stock" } : {})));
    expect(body.hint).toBe("some are out of stock");
  });

  it("answers an unknown id with a reason instead of throwing", () => {
    expect(JSON.parse(call("get_product", { productId: "nope" })).error).toBe("product_not_found");
  });
});

describe("search_products filters", () => {
  it("applies a facet from list_filters and narrows the result", () => {
    const facet = JSON.parse(call("list_filters", { category: "gpu" })).facets[0];
    const all = JSON.parse(call("search_products", { category: "gpu", limit: 20 })).total;
    const narrowed = JSON.parse(call("search_products", {
      category: "gpu", limit: 20, filters: { [facet.id]: [facet.values[0]] },
    }));
    expect(narrowed.total).toBeGreaterThan(0);
    expect(narrowed.total).toBeLessThanOrEqual(all);
  });

  it("names a filter the category does not have instead of ignoring it", () => {
    const result = JSON.parse(call("search_products", { category: "gpu", filters: { "cpu-socket": ["AM5"] } }));
    expect(result.error).toBe("unknown_filter");
    expect(result.hint).toContain("cpu-socket");
  });

  it("refuses filters without a category, because facets are per category", () => {
    expect(JSON.parse(call("search_products", { query: "rtx", filters: { "gpu-memory": ["16 GB"] } })).error)
      .toBe("category_required");
  });
});

describe("get_deals", () => {
  it("returns only what the shop is flagging, with the kind on each", () => {
    const sale = JSON.parse(call("get_deals", { kind: "sale", limit: 10 }));
    expect(sale.items.length).toBeGreaterThan(0);
    expect(sale.items.every((item: any) => item.kind === "sale")).toBe(true);
  });
});

describe("list_brands", () => {
  it("counts listings per brand and narrows to a category", () => {
    const all = JSON.parse(call("list_brands"));
    const gpu = JSON.parse(call("list_brands", { category: "gpu" }));
    expect(all.brands.length).toBeGreaterThan(gpu.brands.length);
    expect(gpu.brands.reduce((sum: number, b: any) => sum + b.count, 0)).toBe(CATALOG.gpu.length);
  });
});

describe("get_checkout_fields", () => {
  it("says what each step asks for and never carries a value", () => {
    const tool = TOOLS.find(entry => entry.name === "get_checkout_fields")!;
    expect(tool.readOnlyHint).toBe(true);
    const body = JSON.stringify(tool.inputSchema);
    expect(body).not.toContain("name");
    expect(body).not.toContain("card");
  });
});

describe("recommend_build", () => {
  it.each([900, 1500, 2400, 4000])("returns a compatible machine for $%i", budget => {
    const proposal = recommendBuild(budget);
    expect(compatibilityIssues(proposal.picks)).toEqual([]);
    expect(proposal.issues).toEqual([]);
  });

  const BUDGETS = [800, 1000, 1200, 1600, 2000, 2400, 3500, 5000];

  it.each(BUDGETS)("keeps $%i inside the ten per cent it promises", budget => {
    const proposal = recommendBuild(budget);
    expect(proposal.price).toBeLessThanOrEqual(budget * (1 + BUDGET_TOLERANCE));
    expect(proposal.withinBudget).toBe(true);
  });

  it("says so plainly when the budget is below what any machine costs", () => {
    const floor = cheapestBuild().price;
    const proposal = recommendBuild(Math.round(floor * 0.8));
    expect(proposal.withinBudget).toBe(false);
    expect(proposal.cheapestPossible).toBe(floor);
  });

  it.each(BUDGETS)("sizes the power supply to the draw at $%i, not to the wallet", budget => {
    const report = powerReport(recommendBuild(budget).picks);
    expect(report.ok).toBe(true);
    // Enough headroom to be legal, not so much that the shopper paid for air.
    expect(report.psuW).toBeLessThan(report.requiredW * 1.6);
  });

  it("buys the cheapest board and case that fit, since neither moves a number", () => {
    const rich = recommendBuild(5000);
    for (const slot of ["board", "case"] as const) {
      const chosen = part(rich.picks, slot);
      const fitting = CATALOG[slot].filter(item =>
        compatibilityIssues({ ...rich.picks, [slot]: item.id }).length === 0);
      const cheapest = Math.min(...fitting.map(item => item.price));
      expect(chosen.price, slot).toBe(cheapest);
    }
  });

  it("stops early at 1080p and keeps spending at 4K for the same target", () => {
    const low = recommendBuild(2400, "1080p", false, 144);
    const high = recommendBuild(2400, "4K", false, 144);
    expect(low.price).toBeLessThan(high.price);
    expect(low.fps).toBeGreaterThanOrEqual(144);
  });

  it("leaves the rest of the budget alone once the target is met", () => {
    const capped = recommendBuild(3500, "1440p", false, 120);
    const uncapped = recommendBuild(3500, "1440p");
    expect(capped.price).toBeLessThan(uncapped.price);
    expect(capped.fps).toBeGreaterThanOrEqual(120);
  });

  it("never pays for a part that adds no frame rate", () => {
    const proposal = recommendBuild(2400);
    const cheaperCpu = CATALOG.cpu.find(item =>
      item.price < part(proposal.picks, "cpu").price
      && compatibilityIssues({ ...proposal.picks, cpu: item.id }).length === 0
      && metrics({ ...proposal.picks, cpu: item.id }).fps >= metrics(proposal.picks).fps);
    expect(cheaperCpu, cheaperCpu?.name).toBeUndefined();
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
