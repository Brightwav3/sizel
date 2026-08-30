import { describe, expect, it } from "vitest";
import type { Part, Slot } from "../../shared/lib/types";
import { listingStock, stockLabel } from "./listingStock";

const product = (id: string, price = 500, stock = 20): Part => ({
  id, name: id, price, stock, days: 2, tag: "Test",
});

describe("listing stock", () => {
  it("is stable for one SKU and colour", () => {
    const item = product("phone");
    expect(listingStock(item, "phones", "blue")).toBe(listingStock(item, "phones", "blue"));
  });

  it("keeps graphics cards scarce and expensive items scarcer", () => {
    for (let index = 0; index < 50; index += 1) {
      expect(listingStock(product(`gpu-${index}`), "gpu")).toBeLessThanOrEqual(4);
      expect(listingStock(product(`premium-${index}`, 1800), "phones", "black")).toBeLessThanOrEqual(2);
    }
  });

  it("never exceeds the >10 display bucket in any category", () => {
    const slots: Slot[] = ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans", "phones", "consoles"];
    for (const slot of slots) {
      for (let index = 0; index < 50; index += 1) expect(listingStock(product(`${slot}-${index}`), slot)).toBeLessThanOrEqual(11);
    }
    expect(stockLabel(11)).toBe("> 10");
  });

  it("preserves canonical out-of-stock status", () => {
    expect(listingStock(product("gone", 500, 0), "phones", "pink")).toBe(0);
  });
});
