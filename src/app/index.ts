/**
 * Rigsmith UI.
 *
 * Ported from `Rigsmith Prototype.dc.html`. The port kept the prototype's
 * inline declaration strings so it could be diffed against the original; that
 * bridge is gone (ADR 0004) and every screen is now styled from the CSS files
 * beside it and the tokens in `src/_ds`.
 */
export * from "../shared/lib/types";

export { CATALOG, CAT_META, CAT_ICON, DEPTS, ORDER, SPECS, DESCS, DEFAULT_PICKS, PRODUCTS, getProductById } from "../data/catalog/catalog";
export { metrics, part, powerDraw, compatibilityIssues, money, shipDate, noiseWord, RES } from "../entities/build/metrics";
export type { BuildMetrics, Resolution } from "../entities/build/metrics";

export { AppShell } from "../shared/layout/AppShell";
export { TopBar } from "../shared/layout/TopBar";
export { FilterPanel } from "../features/catalog/EshopFilters";

export { HomeScreen } from "../features/catalog/home/HomeScreen";
export { CategoryScreen, ProductCard } from "../features/catalog/CategoryScreen";
export { ProductScreen } from "../features/product/ProductScreen";
export { BuilderScreen } from "../features/pc-builder/BuilderScreen";
export { CartScreen } from "../features/cart/CartScreen";
export { CheckoutScreen, DoneScreen } from "../features/checkout/CheckoutScreens";
export { FloatingBuildCard, Toast } from "../features/pc-builder/FloatingBuildCard";

export { RigsmithApp } from "./App";
export { getRigsmithApp } from "./state/appInstance";

export {
  allProducts, applyProductFilters, brandLogo, brandOf, candidatePool, facetSummary,
  facetValues, findProduct, productSummary, productTitle, searchProducts, sortProducts,
} from "../entities/product/queries";
export type { FacetOption, FacetSummary, ProductQuery, ProductSearchResult, ProductSummary, SortId } from "../entities/product/queries";
