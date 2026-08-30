import { describe, expect, it } from "vitest";
import { CATALOG } from "../../data/catalog/catalog";
import type { CartLine } from "../../shared/lib/types";
import { FREE_SHIPPING_OVER, cartTotals } from "./cartTotals";

const build = { price: 1500, days: 4 };
const cheap = CATALOG.storage.reduce((a, b) => b.price < a.price ? b : a);
const line = (id: string, qty: number): CartLine => ({ kind: "product", id, slot: "storage", qty });

describe("cartTotals", () => {
  it("charges nothing for an empty cart, including shipping", () => {
    const totals = cartTotals([], build);
    expect(totals).toMatchObject({ itemCount: 0, subtotal: 0, shipping: 0, total: 0, slowestDays: 0 });
  });

  it("multiplies each line by its quantity", () => {
    const totals = cartTotals([line(cheap.id, 3)], build);
    expect(totals.rows[0].unit).toBe(cheap.price);
    expect(totals.rows[0].total).toBe(cheap.price * 3);
    expect(totals.itemCount).toBe(3);
  });

  it("prices the assembled machine from the build metrics", () => {
    const totals = cartTotals([{ kind: "build", id: "build", qty: 1 }], build);
    expect(totals.rows[0].name).toBe("Custom PC build");
    expect(totals.subtotal).toBe(build.price);
    expect(totals.slowestDays).toBe(build.days);
  });

  it("ships free above the threshold and charges below it", () => {
    const under = cartTotals([line(cheap.id, 1)], build);
    if (cheap.price < FREE_SHIPPING_OVER) {
      expect(under.shipping).toBeGreaterThan(0);
      expect(under.total).toBe(under.subtotal + under.shipping);
    }
    const over = cartTotals([{ kind: "build", id: "build", qty: 1 }], build);
    expect(over.shipping).toBe(0);
    expect(over.total).toBe(over.subtotal);
  });

  it("takes the delivery date from the slowest line", () => {
    const slow = CATALOG.storage.reduce((a, b) => b.days > a.days ? b : a);
    const totals = cartTotals([line(cheap.id, 1), line(slow.id, 1)], build);
    expect(totals.slowestDays).toBe(Math.max(cheap.days, slow.days));
  });

  it("keeps the line index, so a tool can address the row the screen shows", () => {
    const totals = cartTotals([line(cheap.id, 1), { kind: "build", id: "build", qty: 1 }], build);
    expect(totals.rows.map(row => row.index)).toEqual([0, 1]);
  });
});
