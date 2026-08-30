// ADR 0001: the adapter owns catalog access, including how it is looked up.
// docs/decisions/0001-canonical-catalog-port.md
import { CATALOG } from "./realCatalog";
import type { Part, Slot } from "../../shared/lib/types";

/**
 * Id lookup for the catalog.
 *
 * Every compatibility check resolves eight parts by id, and the tools that
 * search for a replacement run that check once per candidate — a scan of the
 * whole catalog for each one. The catalog is built once and never changes, so
 * the lookup is a map built once beside it.
 */
const bySlot: Record<Slot, Map<string, Part>> = Object.fromEntries(
  (Object.keys(CATALOG) as Slot[]).map(slot => [slot, new Map(CATALOG[slot].map(product => [product.id, product]))]),
) as Record<Slot, Map<string, Part>>;

const everywhere = new Map<string, { product: Part; category: Slot }>();
for (const slot of Object.keys(CATALOG) as Slot[]) {
  for (const product of CATALOG[slot]) {
    if (!everywhere.has(product.id)) everywhere.set(product.id, { product, category: slot });
  }
}

/** The part with this id in this category, or undefined. */
export const partIn = (slot: Slot, id: string | undefined): Part | undefined =>
  id === undefined ? undefined : bySlot[slot].get(id);

/** The part with this id anywhere in the catalog, with the category it sits in. */
export const locateProduct = (id: string): { product: Part; category: Slot } | undefined =>
  everywhere.get(id);
