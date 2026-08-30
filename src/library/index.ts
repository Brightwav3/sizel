/**
 * Rigsmith UI — a byte-identical dissection of `Rigsmith Prototype.dc.html`.
 *
 * Every style declaration string in these files is copied from the prototype
 * verbatim and parsed by `sx`, so a diff against the prototype is meaningful.
 * `styles.css` is the prototype's <style> block, unchanged.
 */
export { sx, useHover, type Vals } from "./sx";
export * from "./types";

export { CATALOG, CAT_META, CAT_ICON, DEPTS, ORDER, GUIDED, GSTEP, GAMES, SPECS, DESCS, DEFAULT_PICKS, PRODUCTS, getProductById } from "./data/catalog";
export { metrics, part, compatibilityIssues, money, shipDate, noiseWord, gameFps, RES } from "./data/metrics";
export type { Resolution } from "./data/metrics";

export { AppShell } from "./shell/AppShell";
export { TopBar } from "./shell/TopBar";
export { Sidebar, FilterPanel } from "./shell/Sidebar";

export { HomeScreen } from "./screens/HomeScreen";
export { CategoryScreen, ProductCard } from "./screens/CategoryScreen";
export { ProductScreen } from "./screens/ProductScreen";
export { BuilderScreen } from "./screens/BuilderScreen";
export { PickerScreen } from "./screens/PickerScreen";
export { CartScreen, CheckoutScreen, DoneScreen } from "./screens/CheckoutScreens";
export { GuidedScreen } from "./screens/GuidedScreen";
export { FloatingBuildCard, Toast } from "./overlays/FloatingBuildCard";

export { RigsmithApp } from "./RigsmithApp";
