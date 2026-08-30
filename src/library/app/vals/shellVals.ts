import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildShellVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
      depts, catalog: categories,
      catsMaxH: openDept ? (openDept.cats.length * 40 + 64) + "px" : "0px",
      catsOp: openDept ? 1 : 0,
      deptName: dept.name,
      departmentOverview: shopping && Boolean(s.openDept),
      departmentCategories: categories,
      departmentSections: dept.cats.map(category => ({
        id: category,
        name: CAT_META[category].name,
        icon: CAT_ICON[category],
        count: String(CAT_META[category].count),
        go: () => app.setState({ route: "category", dept: dept.id, category, brand: "any", openDept: null }),
        products: CATALOG[category].slice(0, 4).map(product => ({
          name: product.name,
          brand: product.brand,
          image: product.imagePath,
          price: money(product.price),
          go: () => app.setState({ route: "product", productSlot: category, productId: product.id, openDept: null }),
        })),
      })),
      subcatLabel: s.search ? "Brands in search results" : "Brands in " + CAT_META[cat].name.toLowerCase(),
      catNameLower: CAT_META[cat].name.toLowerCase(),
      brandRowShow: s.brand === "any" ? "flex" : "none",
      brandBackShow: s.brand === "any" ? "none" : "flex",
      brandClear: () => app.setState({ brand: "any" }),
      gridLabel: s.brand === "any" ? CAT_META[cat].name : s.brand + " " + CAT_META[cat].name.toLowerCase(),
      subcats: Array.from(new Set(catList.map(brandOf))).map(b => ({
        name: b, icon: "verified", logo: brandLogo(b), count: String(catList.filter(x => brandOf(x) === b).length),
        bg: "#fff", bd: "var(--border-subtle)", fg: "var(--text-primary)", ic: "var(--text-secondary)",
        go: () => app.setState({ brand: b }),
      })),
      crumb: [dept.name, dept.name === CAT_META[s.category].name ? null : CAT_META[s.category].name, s.brand === "any" ? null : s.brand].filter(Boolean).join(" / "),
      goHome: () => app.go("home"), goBuilder: () => app.go("builder"),
      goCategory: () => app.go("category"), goCart: () => app.go("cart"),
      goCheckout: () => app.setState({ route: "checkout", step: 0 }),
      goCompare: () => app.setState({ route: "picker", pickerSlot: "gpu" }),
      isHome: on("home"), isCategory: on("category"), isProduct: on("product"),
      isBuilder: on("builder"), isPicker: on("picker"), isCart: on("cart"),
      isCheckout: on("checkout"), isDone: on("done"),

      savedCount: s.saved, cartCount: s.inCart ? 1 : 0,
      cartDotBg: s.inCart ? "var(--gray-900)" : "var(--surface-sunken)",
      cartDotFg: s.inCart ? "#fff" : "var(--text-tertiary)",
      toastText: s.toast || "", toastOpacity: s.toast ? 1 : 0,
      searchValue: s.search,
      searchChange: (e: React.ChangeEvent<HTMLInputElement>) => app.setState({ search: e.target.value, route: e.target.value ? "category" : "home", category: "gpu", brand: "any" }),
  };
}

