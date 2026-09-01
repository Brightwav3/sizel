// ADR 0003: product URLs preserve the selected derived colour listing.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
// ADR 0005: route parsing and URL composition belong to src/app.
// docs/decisions/0005-feature-first-source-layout.md
import type { AppState } from "./state/AppState";
import { CATALOG, DEPTS } from "../data/catalog/catalog";
import type { Slot } from "../shared/lib/types";
import { findProduct } from "../entities/product/queries";

const categorySlugs: Record<string, string> = {
  gpu: "graphic-cards", cpu: "processors", board: "motherboards", ram: "memory",
  cooler: "cpu-coolers", psu: "power-supplies", storage: "storage", case: "pc-cases",
  fans: "case-fans", phones: "smartphones", consoles: "consoles",
};

const brandSlug = (brand: string) => brand.toLowerCase().replace(/\s+/g, "-");
const brandForSlug = (slug: string, slots: Slot[]) => Array.from(new Set(
  slots.flatMap(slot => CATALOG[slot]).map(product => product.brand).filter((brand): brand is string => Boolean(brand)),
)).find(brand => brandSlug(brand) === slug) || null;

const slotForSlug = (slug: string): Slot | null =>
  (Object.keys(categorySlugs) as Slot[]).find(slot => categorySlugs[slot] === slug) || null;

const allSlots = Object.keys(CATALOG) as Slot[];
const firstSlotForBrand = (brand: string) => allSlots.find(slot => CATALOG[slot].some(product => product.brand === brand)) || "gpu" as Slot;

export function stateFromLocation(): Partial<AppState> {
  const segments = window.location.pathname.split("/").filter(Boolean).map(segment => decodeURIComponent(segment));
  if (segments.length === 0) return { route: "home" };
  if (segments[0] === "pc-builder") return { route: "builder" };
  if (segments[0] === "build") return { route: "builder" };
  if (segments[0] === "cart") return { route: "cart" };
  if (segments[0] === "checkout") return { route: "checkout", step: 0 };
  if (segments[0] === "order-complete") return { route: "done" };
  if (segments[0] === "brands") {
    const brand = segments[1] ? brandForSlug(segments[1], allSlots) : null;
    if (!brand) return { route: "not-found" };
    const category = firstSlotForBrand(brand);
    const dept = DEPTS.find(item => item.cats.includes(category))?.id || "pc";
    return { route: "brand", dept, openDept: null, category, productSlot: category, brand, brandCategory: "all", search: "" };
  }
  const dept = segments[0] === "pc-parts" ? "pc" : segments[0] === "phones" ? "phone" : segments[0] === "gaming" ? "gaming" : null;
  if (!dept) return { route: "not-found" };
  const department = DEPTS.find(item => item.id === dept)!;
  if (!segments[1]) return { route: "category", dept, openDept: dept, category: department.cats[0], productSlot: department.cats[0], brand: "any" };
  const slot = segments[1] ? slotForSlug(segments[1]) : null;
  if (!slot) {
    const brand = brandForSlug(segments[1], department.cats);
    return brand ? { route: "category", dept, openDept: dept, category: department.cats[0], productSlot: department.cats[0], brand } : { route: "not-found" };
  }
  if (segments[2]) {
    const brand = brandForSlug(segments[2], [slot]);
    if (brand) return { route: "category", dept, openDept: null, category: slot, productSlot: slot, brand };
    if (!findProduct(segments[2])) return { route: "not-found" };
    return { route: "product", dept, openDept: null, category: slot, productSlot: slot, productId: segments[2], productColorId: segments[3] ?? null, brand: "any" };
  }
  return { route: "category", dept, openDept: null, category: slot, productSlot: slot, brand: "any" };
}

export function urlForState(state: AppState): string {
  if (state.route === "home") return "/";
  if (state.route === "builder") return "/pc-builder";
  if (state.route === "cart") return "/cart";
  if (state.route === "checkout") return "/checkout";
  if (state.route === "done") return "/order-complete";
  if (state.route === "not-found") return window.location.pathname;
  if (state.route === "brand") return state.brand === "any" ? "/" : `/brands/${brandSlug(state.brand)}`;
  const slot = state.route === "product" ? state.productSlot : state.category;
  const productDept = slot === "phones" ? "phone" : slot === "consoles" ? "gaming" : "pc";
  const baseDept = state.route === "product" ? productDept : state.dept;
  const base = baseDept === "phone" ? "/phones" : baseDept === "gaming" ? "/gaming" : "/pc-parts";
  if (state.route === "category" && state.openDept) return state.brand === "any" ? base : `${base}/${brandSlug(state.brand)}`;
  const category = categorySlugs[slot] || categorySlugs.gpu;
  const productPath = state.productColorId
    ? `/${encodeURIComponent(state.productId)}/${encodeURIComponent(state.productColorId)}`
    : `/${encodeURIComponent(state.productId)}`;
  return `${base}/${category}${state.route === "product" ? productPath : state.brand === "any" ? "" : `/${brandSlug(state.brand)}`}`;
}
