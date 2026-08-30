import type { AppState } from "./AppState";
import type { Slot } from "../types";

const categorySlugs: Record<string, string> = {
  gpu: "graphic-cards", cpu: "processors", board: "motherboards", ram: "memory",
  cooler: "cpu-coolers", psu: "power-supplies", storage: "storage", case: "pc-cases",
  phones: "smartphones", consoles: "consoles",
};

const slotForSlug = (slug: string): Slot | null =>
  (Object.keys(categorySlugs) as Slot[]).find(slot => categorySlugs[slot] === slug) || null;

export function stateFromLocation(): Partial<AppState> {
  const segments = window.location.pathname.split("/").filter(Boolean).map(segment => decodeURIComponent(segment));
  if (segments.length === 0) return { route: "home" };
  if (segments[0] === "pc-builder") return { route: "builder" };
  if (segments[0] === "build") return { route: "guided", gStep: 0, gDone: [] };
  if (segments[0] === "compare") return { route: "picker", pickerSlot: "gpu" };
  if (segments[0] === "cart") return { route: "cart" };
  if (segments[0] === "checkout") return { route: "checkout", step: 0 };
  if (segments[0] === "order-complete") return { route: "done" };
  const dept = segments[0] === "pc-parts" ? "pc" : segments[0] === "phones" ? "phone" : segments[0] === "gaming" ? "gaming" : null;
  const slot = segments[1] ? slotForSlug(segments[1]) : null;
  if (!dept || !slot) return { route: "home" };
  if (segments[2]) return { route: "product", dept, openDept: null, category: slot, productSlot: slot, productId: segments[2] };
  return { route: "category", dept, openDept: null, category: slot, productSlot: slot };
}

export function urlForState(state: AppState): string {
  if (state.route === "home") return "/";
  if (state.route === "builder") return "/pc-builder";
  if (state.route === "guided") return "/build";
  if (state.route === "picker") return "/compare";
  if (state.route === "cart") return "/cart";
  if (state.route === "checkout") return "/checkout";
  if (state.route === "done") return "/order-complete";
  const slot = state.route === "product" ? state.productSlot : state.category;
  const productDept = slot === "phones" ? "phone" : slot === "consoles" ? "gaming" : "pc";
  const baseDept = state.route === "product" ? productDept : state.dept;
  const base = baseDept === "phone" ? "/phones" : baseDept === "gaming" ? "/gaming" : "/pc-parts";
  const category = categorySlugs[slot] || categorySlugs.gpu;
  return `${base}/${category}${state.route === "product" ? `/${encodeURIComponent(state.productId)}` : ""}`;
}
