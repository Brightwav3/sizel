import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const products = JSON.parse(fs.readFileSync(path.join(root, "public/catalog/products.json"), "utf8"));
const adapter = fs.readFileSync(path.join(sourceRoot, "data/catalog/realCatalog.ts"), "utf8");
const catalog = fs.readFileSync(path.join(sourceRoot, "data/catalog/catalog.ts"), "utf8");
const types = fs.readFileSync(path.join(sourceRoot, "shared/lib/types.ts"), "utf8");
const routeUnion = types.match(/export type Route =([\s\S]*?);/)?.[1] ?? "";
const routeValues = [...routeUnion.matchAll(/["']([a-z-]+)["']/g)].map(match => match[1]);
const check = [];
const pass = (label, ok, detail = "") => check.push({ label, ok, detail });

const expectedCounts = { cpu: 13, gpu: 13, ram: 13, motherboard: 14, "cpu-cooler": 14, psu: 14, storage: 15, "pc-case": 15, smartphone: 14, console: 10 };
const actualCounts = Object.groupBy(products, product => product.category);
const imageRoot = path.join(root, "public/catalog");
const imageMissing = products.filter(product => !fs.existsSync(path.join(imageRoot, product.image_path)));
const ids = products.map(product => product.id);
const brands = new Set(products.map(product => product.brand));

pass("canonical catalog has 135 products", products.length === 135, `${products.length} products`);
pass("canonical product IDs are unique", new Set(ids).size === ids.length, `${new Set(ids).size} unique IDs`);
pass("canonical image paths exist", imageMissing.length === 0, imageMissing.length ? imageMissing.map(product => product.id).join(", ") : "all image files found");
pass("all expected real categories have exact counts", Object.entries(expectedCounts).every(([category, count]) => actualCounts[category]?.length === count), JSON.stringify(Object.fromEntries(Object.entries(actualCounts).map(([category, items]) => [category, items.length]))));
pass("all 13 fictional brands are represented", brands.size === 13, `${brands.size} brands`);
pass("adapter imports canonical products.json", adapter.includes('from "../../../public/catalog/products.json"'));
pass("adapter exports real catalog through catalog.ts", catalog.includes('export * from "./realCatalog"'));
pass("default picks are derived from canonical parts", ["defaultCpu.id", "defaultGpu.id", "defaultBoard.id", "defaultRam.id", "defaultStorage.id", "defaultCooler.id", "defaultPsu.id", "defaultCase.id", "defaultFans.id"].every(expression => adapter.includes(expression)));
pass("ORDER has nine prototype slots", (adapter.match(/\{ slot: "[a-z]+"/g) ?? []).length === 9);
// The guided walkthrough UI was retired; its recommended order now lives on
// the controller as RigsmithApp.BUILD_STEPS.
const appSource = fs.readFileSync(path.join(sourceRoot, "app/App.tsx"), "utf8");
const buildSteps = appSource.match(/BUILD_STEPS: PcSlot\[\] = \[([^\]]+)\]/)?.[1] ?? "";
pass("build order has nine slots", (buildSteps.match(/[\"'][a-z]+[\"']/g) ?? []).length === 9);
// Brand is intentionally rendered by the category screen and not-found is
// handled before the normal shell.
const view = fs.readFileSync(path.join(sourceRoot, "app/RigsmithView.tsx"), "utf8");
const routeGroups = new Map([
  ["home", "isHome"],
  ["category", "isCategory"],
  ["brand", "isCategory"],
  ["product", "isProduct"],
  ["builder", "isBuilder"],
  ["cart", "isCart"],
  ["checkout", "isCheckout"],
  ["done", "isDone"],
  ["not-found", "isNotFound"],
]);
const missingRoutes = routeValues.filter(route => !routeGroups.has(route) || !view.includes("v." + routeGroups.get(route)));
pass("every route has a screen", missingRoutes.length === 0, missingRoutes.length ? missingRoutes.join(", ") : routeValues.join(", "));

const viewFiles = {
  AppShell: "shared/layout/AppShell.tsx", TopBar: "shared/layout/TopBar.tsx", EshopSidebar: "shared/layout/EshopSidebar.tsx",
  HomeScreen: "features/catalog/home/HomeScreen.tsx", CategoryScreen: "features/catalog/CategoryScreen.tsx", ProductScreen: "features/product/ProductScreen.tsx",
  CartScreen: "features/cart/CartScreen.tsx",
  CheckoutScreen: "features/checkout/CheckoutScreens.tsx", DoneScreen: "features/checkout/CheckoutScreens.tsx",
  FloatingBuildCard: "features/pc-builder/FloatingBuildCard.tsx", Toast: "features/pc-builder/FloatingBuildCard.tsx",
};
for (const [view, file] of Object.entries(viewFiles)) pass(`view exists: ${view}`, fs.existsSync(path.join(sourceRoot, file)));
for (const result of check) console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}${result.detail ? ` — ${result.detail}` : ""}`);
if (check.some(result => !result.ok)) process.exit(1);
