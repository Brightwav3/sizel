import type { Part, Slot } from "../types";

/**
 * Storage tiers for phones and handheld consoles.
 *
 * The canonical catalog (ADR 0001) carries one record per device, at one
 * storage capacity. A shop sells the same device at several capacities, and
 * each capacity is its own listing: its own price, its own code, its own place
 * in the grid and in the cart. They are the same hardware otherwise, so every
 * tier reuses the base record's photo, description and reviews.
 *
 * The tiers are derived here rather than written into products.json, because
 * the JSON is a port of the canonical catalog and this is a storefront
 * decision.
 */

/** How many capacity steps a device is offered at, and the ceiling. */
const STEPS = 3;
const MAX_GB = 1024;
/** What one doubling of capacity costs the shopper. */
const PRICE_PER_DOUBLING = 100;

/** How a shop writes a capacity: 512 GB, 1 TB, 2 TB. */
export const capacityLabel = (gb: number) => {
  if (!Number.isFinite(gb) || gb <= 0) return undefined;
  if (gb % 1024 === 0) return `${gb / 1024} TB`;
  if (gb % 1000 === 0) return `${gb / 1000} TB`;
  return `${gb} GB`;
};

/** The catalog writes the capacity into the prose too: "256 GB storage". */
const retellCapacity = (text: string | undefined, baseGb: number, label: string) =>
  text?.replaceAll(`${baseGb} GB storage`, `${label} storage`);

/** base, 2x, 4x — dropping anything above the ceiling. */
const tiersFrom = (baseGb: number) =>
  Array.from({ length: STEPS }, (_, step) => baseGb * 2 ** step).filter(gb => gb <= MAX_GB);

const withCapacity = (specifications: Record<string, unknown>, path: [string, string], gb: number) => {
  const [group, key] = path;
  const branch = (specifications[group] ?? {}) as Record<string, unknown>;
  return { ...specifications, [group]: { ...branch, [key]: gb } };
};

/** Where the capacity lives in the specifications, per category. */
const CAPACITY_PATH: Partial<Record<Slot, [string, string]>> = {
  phones: ["storage", "capacityGB"],
  consoles: ["hardware", "storageGB"],
};

/**
 * One listing per storage tier. The device's own capacity keeps the canonical
 * id, so existing links, cart lines and watchdogs still resolve.
 */
export function storageVariants(part: Part, slot: Slot): Part[] {
  const path = CAPACITY_PATH[slot];
  if (!path) return [part];
  const baseGb = Number((part.specifications?.[path[0]] as Record<string, unknown> | undefined)?.[path[1]]);
  if (!Number.isFinite(baseGb) || baseGb <= 0) return [part];

  const tiers = tiersFrom(baseGb);
  if (tiers.length < 2) return [part];

  return tiers.map(gb => {
    const label = capacityLabel(gb)!;
    if (gb === baseGb) return { ...part, variantOf: part.id, variantLabel: label };
    const uplift = PRICE_PER_DOUBLING * Math.log2(gb / baseGb);
    return {
      ...part,
      id: `${part.id}::${gb}gb`,
      price: part.price + uplift,
      // The badge belongs to the device, not to every tier of it.
      merchandising: undefined,
      was: part.was === undefined ? undefined : part.was + uplift,
      specifications: withCapacity(part.specifications ?? {}, path, gb),
      description: retellCapacity(part.description, baseGb, label),
      blurb: retellCapacity(part.blurb, baseGb, label),
      note: retellCapacity(part.note, baseGb, label),
      specs: (part.specs ?? []).map(chip => chip === capacityLabel(baseGb) ? label : chip),
      variantOf: part.id,
      variantLabel: label,
    };
  });
}

/** Every listing of the same device, cheapest capacity first. */
export const siblingVariants = (part: Part, pool: Part[]): Part[] =>
  part.variantOf ? pool.filter(item => item.variantOf === part.variantOf).sort((a, b) => a.price - b.price) : [];
