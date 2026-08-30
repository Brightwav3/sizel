import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libraryRoot = path.join(root, "src/library");
const products = JSON.parse(fs.readFileSync(path.join(root, "public/catalog/products.json"), "utf8"));
const adapter = fs.readFileSync(path.join(libraryRoot, "data/realCatalog.ts"), "utf8");
const catalog = fs.readFileSync(path.join(libraryRoot, "data/catalog.ts"), "utf8");
const types = fs.readFileSync(path.join(libraryRoot, "types.ts"), "utf8");
const routeUnion = types.match(/export type Route =([\s\S]*?);/)?.[1] ?? "";
const routeValues = [...routeUnion.matchAll(/["']([a-z]+)["']/g)].map(match => match[1]);
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
// The guided walkthrough was replaced by the configurator; its recommended
// order now lives on the controller as RigsmithApp.BUILD_STEPS.
pass("build order has nine slots", (fs.readFileSync(path.join(libraryRoot, "RigsmithApp.tsx"), "utf8").match(/BUILD_STEPS: PcSlot\[\] = \[[^\]]+\]/)?.[0].match(/"[a-z]+"/g) ?? []).length === 9);
// Every route the union names must have a screen wired to it in the view.
const view = fs.readFileSync(path.join(libraryRoot, "app/RigsmithView.tsx"), "utf8");
const routeFlags = routeValues.map(route => `is${route[0].toUpperCase()}${route.slice(1)}`);
pass("every route has a screen", routeFlags.every(flag => view.includes(`v.${flag}`)), routeValues.join(", "));

const viewFiles = {
  AppShell: "shell/AppShell.tsx", TopBar: "shell/TopBar.tsx", EshopSidebar: "shell/EshopSidebar.tsx",
  HomeScreen: "screens/HomeScreen.tsx", CategoryScreen: "screens/CategoryScreen.tsx", ProductScreen: "screens/ProductScreen.tsx",
  BuilderScreen: "screens/BuilderScreen.tsx", CartScreen: "screens/CheckoutScreens.tsx",
  CheckoutScreen: "screens/CheckoutScreens.tsx", DoneScreen: "screens/CheckoutScreens.tsx",
  FloatingBuildCard: "overlays/FloatingBuildCard.tsx", Toast: "overlays/FloatingBuildCard.tsx",
};
for (const [view, file] of Object.entries(viewFiles)) pass(`view exists: ${view}`, fs.existsSync(path.join(libraryRoot, file)));
for (const result of check) console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}${result.detail ? ` — ${result.detail}` : ""}`);
if (check.some(result => !result.ok)) process.exit(1);
