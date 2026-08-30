// ADR 0003: listing stock is stable presentation data keyed by SKU and colour.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
import type { Part, Slot } from "../types";

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const categoryCeiling: Record<Slot, number> = {
  gpu: 4,
  cpu: 7,
  board: 6,
  ram: 11,
  storage: 11,
  cooler: 9,
  psu: 8,
  case: 7,
  fans: 11,
  phones: 11,
  consoles: 8,
};

/** Stable pseudo-random storefront stock; 11 is rendered as the >10 bucket. */
export function listingStock(product: Part, slot: Slot, colorId = "default") {
  if (product.stock === 0) return 0;
  let ceiling = categoryCeiling[slot];
  if (product.price >= 1500) ceiling = Math.min(ceiling, 2);
  else if (product.price >= 900) ceiling = Math.min(ceiling, 4);
  return 1 + (hash(`${slot}:${product.id}:${colorId}`) % ceiling);
}

export const stockLabel = (count: number) => count > 10 ? "> 10" : String(count);
