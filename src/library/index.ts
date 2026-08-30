/**
 * Rigsmith UI.
 *
 * Ported from `Rigsmith Prototype.dc.html`. The port kept the prototype's
 * inline declaration strings so it could be diffed against the original; that
 * bridge is gone (ADR 0004) and every screen is now styled from the CSS files
 * beside it and the tokens in `src/_ds`.
 */
export * from "./types";

export { CATALOG, CAT_META, CAT_ICON, DEPTS, ORDER, SPECS, DESCS, DEFAULT_PICKS, PRODUCTS, getProductById } from "./data/catalog";
export { metrics, part, powerDraw, compatibilityIssues, money, shipDate, noiseWord, RES } from "./data/metrics";
export type { BuildMetrics, Resolution } from "./data/metrics";

export { AppShell } from "./shell/AppShell";
export { TopBar } from "./shell/TopBar";
export { FilterPanel } from "./shell/EshopFilters";

export { HomeScreen } from "./screens/HomeScreen";
export { CategoryScreen, ProductCard } from "./screens/CategoryScreen";
export { ProductScreen } from "./screens/ProductScreen";
export { BuilderScreen } from "./screens/BuilderScreen";
export { CartScreen, CheckoutScreen, DoneScreen } from "./screens/CheckoutScreens";
export { FloatingBuildCard, Toast } from "./overlays/FloatingBuildCard";

export { RigsmithApp } from "./RigsmithApp";
export { getRigsmithApp } from "./app/appInstance";

export {
  allProducts, applyProductFilters, brandLogo, brandOf, candidatePool, facetSummary,
  facetValues, findProduct, productSummary, productTitle, searchProducts, sortProducts,
} from "./domain/queries";
export type { FacetOption, FacetSummary, ProductQuery, ProductSearchResult, ProductSummary, SortId } from "./domain/queries";
