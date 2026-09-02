import { BUILD_SLOTS } from "../build/selection";
import { listingStock } from "../../data/catalog/listingStock";
// ADR 0002: one owner per domain rule — this one owns what a cart costs.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
import { partIn } from "../../data/catalog/catalog";
import { productTitle } from "../product/queries";
import type { CartLine, PcSlot, Slot, Picks } from "../../shared/lib/types";

/** Orders above this ship for nothing. */
export const FREE_SHIPPING_OVER = 99;
const FLAT_SHIPPING = 6;

export interface CartRow {
  index: number;
  kind: CartLine["kind"];
  id: string;
  slot?: Slot;
  name: string;
  qty: number;
  unit: number;
  total: number;
  days: number;
  outOfStock: boolean;
}

export interface CartTotals {
  rows: CartRow[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  /** Delivery of the whole order: the slowest line decides. */
  slowestDays: number;
}

/**
 * What the cart costs. The checkout screen and the WebMCP tools both read
 * this, so an agent can never quote a total the shopper is not looking at.
 * The assembled machine is priced as one unit from the build metrics.
 */
export function cartTotals(cart: CartLine[], build: { price: number; days: number }, picks?: Picks, chosen?: PcSlot[]): CartTotals {
  const buildParts = picks && chosen ? chosen.map(slot => ({ slot, product: partIn(slot, picks[slot]) })).filter((item): item is { slot: PcSlot; product: NonNullable<ReturnType<typeof partIn>> } => Boolean(item.product)) : [];
  const draftBuild = chosen !== undefined;
  const buildPrice = draftBuild ? buildParts.reduce((sum, item) => sum + item.product.price, 0) : build.price;
  const buildDays = draftBuild ? Math.max(0, ...buildParts.map(item => item.product.days)) : build.days;
  const buildOutOfStock = draftBuild
    ? !chosen?.length || buildParts.length !== chosen.length || buildParts.some(item => listingStock(item.product, item.slot) === 0)
    : !picks || BUILD_SLOTS.some(slot => !partIn(slot, picks[slot]) || listingStock(partIn(slot, picks[slot])!, slot) === 0);
  const rows = cart.map((line, index): CartRow => {
    const product = line.kind === "product" && line.slot ? partIn(line.slot, line.id) : undefined;
    const unit = line.kind === "build" ? buildPrice : product?.price ?? 0;
    const days = line.kind === "build" ? buildDays : product?.days ?? 0;
    return {
      index,
      kind: line.kind,
      id: line.id,
      slot: line.slot,
      name: line.kind === "build" ? "Custom PC build" : product ? productTitle(product, line.slot) : "Product",
      qty: line.qty,
      unit,
      total: unit * line.qty,
      days,
      outOfStock: line.kind === "build" ? buildOutOfStock : !product || listingStock(product, line.slot!) === 0,
    };
  });

  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const shipping = subtotal >= FREE_SHIPPING_OVER || subtotal === 0 ? 0 : FLAT_SHIPPING;
  return {
    rows,
    itemCount: rows.reduce((sum, row) => sum + row.qty, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    slowestDays: rows.length ? Math.max(...rows.map(row => row.days)) : 0,
  };
}
