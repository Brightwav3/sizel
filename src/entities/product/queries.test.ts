import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_PICKS, DEPTS } from "../../data/catalog/catalog";
import {
  allProducts, applyProductFilters, brandOf, candidatePool, facetSummary, findProduct,
  partFits, priceBounds, productSummary, productTitle, searchProducts, sortProducts,
} from "./queries";

/**
 * `queries.ts` is the one place where the shopper's catalog and an agent's
 * catalog are the same catalog (ADR 0002). These tests pin that behaviour
 * against the real data rather than a fixture, so a catalog edit that breaks a
 * filter fails here instead of silently in the UI.
 */

const gpus = CATALOG.gpu;

describe("candidatePool", () => {
  it("defaults to graphics cards", () => {
    expect(candidatePool({})).toEqual(CATALOG.gpu);
  });

  it("searches across the whole shop, not one category", () => {
    const hits = candidatePool({ search: "woodgrove" });
    expect(hits.length).toBeGreaterThan(0);
    expect(new Set(hits.map(p => findProduct(p.id)!.category)).size).toBeGreaterThan(1);
  });

  it("lets search win over a category", () => {
    expect(candidatePool({ category: "cpu", search: "woodgrove" }))
      .toEqual(candidatePool({ search: "woodgrove" }));
  });

  it("can keep category-page text search inside the active category", () => {
    const hits = candidatePool({ category: "phones", search: "phone", scopeSearchToCategory: true });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(product => findProduct(product.id)?.category === "phones")).toBe(true);
  });

  it("finds phone model names and catalog tags", () => {
    const pro = candidatePool({ category: "phones", search: "pro", scopeSearchToCategory: true });
    const flagship = candidatePool({ category: "phones", search: "flagship", scopeSearchToCategory: true });
    expect(pro.length).toBeGreaterThan(0);
    expect(pro.every(product => findProduct(product.id)?.category === "phones")).toBe(true);
    expect(flagship.length).toBeGreaterThan(0);
  });

  it("flattens a department into its categories", () => {
    const pc = DEPTS.find(d => d.id === "pc")!;
    expect(candidatePool({ departmentId: "pc" }))
      .toHaveLength(pc.cats.reduce((n, c) => n + CATALOG[c].length, 0));
  });

  it("falls back to graphics cards for an unknown department", () => {
    expect(candidatePool({ departmentId: "no-such-dept" })).toEqual(CATALOG.gpu);
  });
});

describe("allProducts", () => {
  it("hides bundled case fans, which are never sold on their own", () => {
    expect(allProducts().some(p => p.id.endsWith("::fans"))).toBe(false);
    expect(Object.values(CATALOG).flat().some(p => p.id.endsWith("::fans"))).toBe(true);
  });
});

describe("applyProductFilters", () => {
  it("keeps the price range inclusive at both ends", () => {
    const { min, max } = priceBounds(gpus);
    expect(applyProductFilters(gpus, { minPrice: min, maxPrice: max })).toHaveLength(gpus.length);
    expect(applyProductFilters(gpus, { minPrice: min, maxPrice: min }).every(p => p.price === min)).toBe(true);
  });

  it("treats stockOnly as in stock AND shipping within two days", () => {
    for (const p of applyProductFilters(gpus, { stockOnly: true })) {
      expect(p.stock).not.toBe(0);
      expect(p.days).toBeLessThanOrEqual(2);
    }
  });

  it("keeps only sale listings under onSale", () => {
    const sale = applyProductFilters(gpus, { onSale: true });
    expect(sale.length).toBeGreaterThan(0);
    expect(sale.every(p => p.merchandising === "sale")).toBe(true);
  });

  it("treats brand 'any' as no brand filter", () => {
    expect(applyProductFilters(gpus, { brand: "any" })).toHaveLength(gpus.length);
    const brand = brandOf(gpus[0]);
    expect(applyProductFilters(gpus, { brand }).every(p => brandOf(p) === brand)).toBe(true);
  });

  it("only applies the resolution filter to graphics cards", () => {
    expect(applyProductFilters(gpus, { useFilter: "1440p gaming" }).length).toBeLessThan(gpus.length);
    expect(applyProductFilters(CATALOG.cpu, { category: "cpu", useFilter: "1440p gaming" }))
      .toHaveLength(CATALOG.cpu.length);
  });

  it("ORs values inside one facet", () => {
    const [facet] = facetSummary({ category: "gpu" });
    const [a, b] = facet.options;
    expect(applyProductFilters(gpus, { facets: { [facet.id]: [a.value, b.value] } }))
      .toHaveLength(a.count + b.count);
  });

  it("drops parts that clash with the build under fitsWith", () => {
    const fitting = applyProductFilters(CATALOG.board, { category: "board", fitsWith: DEFAULT_PICKS });
    expect(fitting.length).toBeGreaterThan(0);
    expect(fitting.length).toBeLessThan(CATALOG.board.length);
    expect(fitting.every(p => partFits(p, "board", DEFAULT_PICKS))).toBe(true);
  });
});

describe("partFits", () => {
  it("passes every part in a category the build has no rules for", () => {
    expect(CATALOG.phones.every(p => partFits(p, "phones", DEFAULT_PICKS))).toBe(true);
  });

  it("accepts the parts the default build already uses", () => {
    expect(partFits(findProduct(DEFAULT_PICKS.board)!.product, "board", DEFAULT_PICKS)).toBe(true);
  });
});

describe("sortProducts", () => {
  const ascending = (items: { price: number }[]) => items.every((p, i) => i === 0 || items[i - 1].price <= p.price);

  it("sorts by price in both directions", () => {
    expect(ascending(sortProducts(gpus, "price"))).toBe(true);
    expect(ascending([...sortProducts(gpus, "priceDesc")].reverse())).toBe(true);
  });

  it("leaves the catalog order alone for 'popular'", () => {
    expect(sortProducts(gpus, "popular")).toEqual(gpus);
    expect(sortProducts(gpus, undefined)).toEqual(gpus);
  });

  it("does not mutate its input", () => {
    const before = [...gpus];
    sortProducts(gpus, "price");
    expect(gpus).toEqual(before);
  });
});

describe("priceBounds", () => {
  it("returns zeroes for an empty pool", () => {
    expect(priceBounds([])).toEqual({ min: 0, max: 0 });
  });

  it("widens to whole currency units so a slider never clips a listing", () => {
    const { min, max } = priceBounds(gpus);
    expect(Number.isInteger(min) && Number.isInteger(max)).toBe(true);
    expect(gpus.every(p => p.price >= min && p.price <= max)).toBe(true);
  });
});

describe("facetSummary", () => {
  it("counts against the pool before the query's own facets run", () => {
    const [facet] = facetSummary({ category: "gpu" });
    const [option] = facet.options;
    const narrowed = facetSummary({ category: "gpu", facets: { [facet.id]: [option.value] } });
    expect(narrowed[0].options[0].count).toBe(option.count);
    expect(narrowed[0].options[0].selected).toBe(true);
  });

  it("drops facets no listing in the pool has a value for", () => {
    expect(facetSummary({ category: "gpu" }).every(f => f.options.length > 0)).toBe(true);
  });

  it("agrees with the filter it drives", () => {
    for (const facet of facetSummary({ category: "gpu" })) {
      for (const option of facet.options) {
        expect(applyProductFilters(gpus, { facets: { [facet.id]: [option.value] } }))
          .toHaveLength(option.count);
      }
    }
  });
});

describe("searchProducts", () => {
  it("reports what the filters removed", () => {
    const result = searchProducts({ category: "gpu", onSale: true });
    expect(result.poolSize).toBe(gpus.length);
    expect(result.hidden).toBe(result.poolSize - result.items.length);
  });
});

describe("productTitle", () => {
  it("adds the attribute people choose by", () => {
    expect(productTitle(gpus[0], "gpu")).toContain(gpus[0].name);
    expect(productTitle(gpus[0], "gpu").length).toBeGreaterThan(gpus[0].name.length);
  });

  it("never repeats an attribute already in the name", () => {
    for (const p of CATALOG.phones) {
      const extra = productTitle(p, "phones").slice(p.name.length).trim();
      if (extra) expect(p.name).not.toContain(extra);
    }
  });

  it("gives distinct titles to the storage tiers of one phone", () => {
    const titles = CATALOG.phones.map(p => productTitle(p, "phones"));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("falls back to the plain name without a category", () => {
    expect(productTitle(gpus[0])).toBe(gpus[0].name);
  });
});

describe("productSummary", () => {
  it("is JSON-safe and carries a url that resolves back to the listing", () => {
    const summary = productSummary(gpus[0], "gpu");
    expect(JSON.parse(JSON.stringify(summary))).toEqual(summary);
    expect(findProduct(decodeURIComponent(summary.url.replace("/product/", "")))).not.toBeNull();
  });

  it("reports out_of_stock from stock, not from the availability field", () => {
    const summary = productSummary({ ...gpus[0], stock: 0, availability: "in_stock" }, "gpu");
    expect(summary.availability).toBe("out_of_stock");
  });
});

describe("findProduct", () => {
  it("finds every listing in the catalog and nothing else", () => {
    expect(allProducts().every(p => findProduct(p.id)?.product === p)).toBe(true);
    expect(findProduct("no-such-product")).toBeNull();
  });
});
