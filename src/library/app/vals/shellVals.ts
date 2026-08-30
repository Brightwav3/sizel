import React from "react";
import { CAT_META } from "../../data/catalog";

import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildShellVals(context: BuildContext) {
  const { app, s, route, on, shopping, dept, depts, openDept, categories, cat, catList, brandOf, brandLogo } = context;
  return {
      depts, catalog: categories,
      deptName: s.brand === "any" ? dept.name : `${s.brand} ${dept.name}`,
      departmentOverview: shopping && Boolean(s.openDept),
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
      crumbs: [
        { label: dept.name, current: false, go: () => app.setState({ route: "category", dept: dept.id, category: dept.cats[0], productSlot: dept.cats[0], brand: "any", openDept: dept.id }) },
        ...(dept.name === CAT_META[s.category].name ? [] : [{ label: CAT_META[s.category].name, current: s.brand === "any", go: () => app.setState({ route: "category", dept: dept.id, category: s.category, productSlot: s.category, brand: "any", openDept: null }) }]),
        ...(s.brand === "any" ? [] : [{ label: s.brand, current: true, go: () => app.setState({ route: "category", dept: dept.id, category: s.category, productSlot: s.category, brand: s.brand, openDept: null }) }]),
      ],
      goHome: () => app.go("home"), goBuilder: () => app.go("builder"),
      goCategory: () => app.go("category"), goCart: () => app.go("cart"),
      goCheckout: () => app.setState({ route: "checkout", step: 0 }),
      isHome: on("home"), isCategory: on("category"), isProduct: on("product"),
      isBuilder: on("builder"), isCart: on("cart"),
      isCheckout: on("checkout"), isDone: on("done"),
      startGuided: () => app.setState({ route: "builder", chosen: [], builderSlot: "cpu" }),

      savedCount: s.saved, cartCount: s.cart.reduce((total, line) => total + line.qty, 0),
      cartDotBg: s.cart.length ? "var(--gray-900)" : "var(--surface-sunken)",
      cartDotFg: s.cart.length ? "#fff" : "var(--text-tertiary)",
      toastText: s.toast || "", toastOpacity: s.toast ? 1 : 0,
      searchValue: s.search,
      searchChange: (e: React.ChangeEvent<HTMLInputElement>) => app.setState({ search: e.target.value, route: e.target.value ? "category" : "home", category: "gpu", brand: "any" }),
  };
}
