/**
 * Pure catalog queries. No React, no styling, no state mutation, no closures.
 *
 * ADR 0002 gave the app one build owner; this module gives it one query owner.
 * The UI view-models and the WebMCP tools both call these functions, so an
 * agent searching the catalog sees exactly what the shopper sees.
 */
import { CATALOG, CAT_META, DEPTS, locateProduct } from "../../data/catalog/catalog";
// ADR 0005: reusable product rules live in the product entity.
// docs/decisions/0005-feature-first-source-layout.md
import { buildFits } from "../build/metrics";
import { FACETS, FIT_FACET_IDS } from "../../features/catalog/catalogFacets";
import type { FacetDefinition } from "../../features/catalog/catalogFacets";
import { capacityLabel } from "../../data/catalog/storageVariants";
import type { Part, PcSlot, Picks, Slot } from "../../shared/lib/types";

export interface ProductQuery {
  /** Category to browse. Ignored when `search` or `departmentId` is set. */
  category?: Slot;
  /** Browse a whole department instead of one category. */
  departmentId?: string | null;
  /** Free text across name, model, description and specifications. */
  search?: string;
  /** Brand name, or "any". */
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Only parts that ship within two days and are in stock. */
  stockOnly?: boolean;
  onSale?: boolean;
  /** Graphics cards only: "1080p gaming" | "1440p gaming" | "4K gaming" | "any". */
  useFilter?: string;
  /** Facet id -> selected values, from `facetSummary`. */
  facets?: Record<string, string[]>;
  /** Keep only listings that ship within this many days. */
  maxDays?: number;
  /** Keep only parts that raise no compatibility issue against this build. */
  fitsWith?: Partial<Picks> | null;
  sort?: SortId;
}

const BUILD_SLOTS: PcSlot[] = ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"];

/** Does this part slot into the build without raising an issue? */
export function partFits(product: Part, category: Slot, build: Partial<Picks>): boolean {
  if (!BUILD_SLOTS.includes(category as PcSlot)) return true;
  return buildFits({ ...build, [category as PcSlot]: product.id });
}

/** Cheapest and dearest listing in a pool, for a price control that fits the category. */
export function priceBounds(pool: Part[]): { min: number; max: number } {
  if (!pool.length) return { min: 0, max: 0 };
  const prices = pool.map(product => product.price);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

export type SortId = "popular" | "price" | "priceDesc" | "perf" | "new";

export interface FacetOption { value: string; count: number; selected: boolean }
export interface FacetSummary { id: string; label: string; fit: boolean; options: FacetOption[] }

export const brandOf = (product: Part) => product.brand || product.name.split(" ")[0];

const spec = (product: Part, ...path: string[]) => {
  let value: any = product.specifications;
  for (const key of path) value = value?.[key];
  return value;
};

const capacity = (gb: unknown) => capacityLabel(Number(gb));

/**
 * The name a shop puts on a listing: the catalog name plus the one attribute
 * people choose by. "Pear Phone 16e" alone does not say which storage tier it
 * is, and every listing of it would read identically.
 */
export function productTitle(product: Part, category?: Slot): string {
  const extras: (string | undefined)[] = [];
  switch (category) {
    case "gpu":
      extras.push(capacity(spec(product, "memory", "capacityGB")), spec(product, "memory", "type"));
      break;
    case "phones":
      extras.push(capacity(spec(product, "storage", "capacityGB")));
      break;
    case "storage":
      extras.push(spec(product, "storage", "protocol") ?? product.storageInterface);
      break;
    case "consoles":
      extras.push(capacity(spec(product, "hardware", "storageGB")), spec(product, "output", "maxResolution"));
      break;
    case "psu":
      extras.push(spec(product, "power", "efficiency"));
      break;
    case "board":
      extras.push(product.formFactor, product.memoryType);
      break;
    case "cooler":
      extras.push(spec(product, "cooling", "type"));
      break;
    case "case":
      extras.push(spec(product, "chassis", "type"));
      break;
    case "cpu":
      extras.push(spec(product, "cpu", "cores") ? `${spec(product, "cpu", "cores")}-core` : undefined);
      break;
  }
  const suffix = extras.filter(Boolean).filter(value => !product.name.includes(String(value)));
  return suffix.length ? `${product.name} ${suffix.join(" ")}` : product.name;
}

export const brandLogo = (brand: string) => "/catalog/logos/" + brand.toLowerCase().replace(/\s+/g, "-") + ".webp";

/** Case fans are bundled with the build, never sold as a standalone listing. */
export const allProducts = (): Part[] =>
  Object.values(CATALOG).flat().filter(product => !product.id.endsWith("::fans"));

export const findProduct = (id: string): { product: Part; category: Slot } | null =>
  locateProduct(id) ?? null;

export const facetValues = (definition: FacetDefinition, product: Part): string[] => {
  const value = definition.get(product);
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
};

/**
 * The listings a query looks at before price, brand and facet filters run.
 * Search spans the whole shop; a department shows all of its categories.
 */
export function candidatePool(query: ProductQuery): Part[] {
  const search = (query.search ?? "").trim().toLowerCase();
  if (search) {
    return allProducts().filter(product =>
      [product.name, product.model, product.description, JSON.stringify(product.specifications)]
        .join(" ").toLowerCase().includes(search));
  }
  if (query.departmentId) {
    const department = DEPTS.find(item => item.id === query.departmentId);
    if (department) return department.cats.flatMap(category => CATALOG[category]);
  }
  return CATALOG[query.category ?? "gpu"] || CATALOG.gpu;
}

export function applyProductFilters(pool: Part[], query: ProductQuery): Part[] {
  const category = query.category ?? "gpu";
  const definitions = FACETS[category] || [];
  const facets = query.facets ?? {};
  const minPrice = query.minPrice ?? 0;
  const maxPrice = query.maxPrice ?? Infinity;
  const wantResolution = (query.useFilter ?? "any").split(" ")[0];
  return pool.filter(product =>
    product.price >= minPrice && product.price <= maxPrice &&
    (!query.stockOnly || (product.days <= 2 && product.stock !== 0)) &&
    (!query.onSale || product.merchandising === "sale") &&
    (query.maxDays === undefined || product.days <= query.maxDays) &&
    (!query.fitsWith || partFits(product, category, query.fitsWith)) &&
    (!query.brand || query.brand === "any" || brandOf(product) === query.brand) &&
    (category !== "gpu" || !query.useFilter || query.useFilter === "any" || (product.good ?? "").indexOf(wantResolution) > -1) &&
    definitions.every(definition => {
      const selected = facets[definition.id] || [];
      return selected.length === 0 || selected.some(value => facetValues(definition, product).includes(value));
    }));
}

export function sortProducts(products: Part[], sort: SortId | undefined): Part[] {
  if (sort === "price") return [...products].sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") return [...products].sort((a, b) => b.price - a.price);
  if (sort === "perf") return [...products].sort((a, b) => (b.fps || b.score || 0) - (a.fps || a.score || 0));
  if (sort === "new") return [...products].sort((a, b) => a.days - b.days);
  return products;
}

/** Facet counts for the pool a query looks at, before its own facet filters run. */
export function facetSummary(query: ProductQuery, pool = candidatePool(query)): FacetSummary[] {
  const category = query.category ?? "gpu";
  const fitIds = FIT_FACET_IDS[category] ?? [];
  const facets = query.facets ?? {};
  return (FACETS[category] || []).map(definition => {
    const selected = facets[definition.id] || [];
    const values = Array.from(new Set(pool.flatMap(product => facetValues(definition, product))))
      .sort((a, b) => a.localeCompare(b));
    return {
      id: definition.id,
      label: definition.label,
      fit: fitIds.includes(definition.id),
      options: values.map(value => ({
        value,
        count: pool.filter(product => facetValues(definition, product).includes(value)).length,
        selected: selected.includes(value),
      })),
    };
  }).filter(facet => facet.options.length > 0);
}

export interface ProductSearchResult {
  items: Part[];
  /** Listings the query looked at, before filters. */
  poolSize: number;
  /** Listings the filters removed. */
  hidden: number;
}

export function searchProducts(query: ProductQuery): ProductSearchResult {
  const pool = candidatePool(query);
  const items = sortProducts(applyProductFilters(pool, query), query.sort);
  return { items, poolSize: pool.length, hidden: pool.length - items.length };
}

/** JSON-safe listing shape — what a tool result should carry. */
export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  model?: string;
  category?: string;
  categoryName?: string;
  price: number;
  priceLabel: string;
  availability: string;
  shipsInDays: number;
  onSale: boolean;
  url: string;
  description?: string;
}

export function productSummary(product: Part, category?: Slot): ProductSummary {
  return {
    id: product.id,
    name: productTitle(product, category),
    brand: brandOf(product),
    model: product.model,
    category,
    categoryName: category ? CAT_META[category]?.name : undefined,
    price: product.price,
    priceLabel: "$" + product.price.toLocaleString("en-US"),
    availability: product.stock === 0 ? "out_of_stock" : product.availability ?? "in_stock",
    shipsInDays: product.days,
    onSale: product.merchandising === "sale",
    url: `/product/${encodeURIComponent(product.id)}`,
    description: product.description,
  };
}
