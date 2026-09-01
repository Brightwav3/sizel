import React from "react";
import { CAT_META } from "../../data/catalog/catalog";

import type { PcSlot } from "../lib/types";
import { CATALOG } from "../../data/catalog/catalog";
import { money } from "../../entities/build/metrics";
import { productTitle } from "../../entities/product/queries";
import type { BuildContext } from "../../entities/build/buildContext";

export function buildShellVals(context: BuildContext) {
  const { app, s, route, on, shopping, dept, depts, openDept, categories, cat, catList, brandOf, brandLogo } = context;
  const searchCategory = shopping ? s.category : "gpu";
  const searchDept = searchCategory === "phones" ? "phone" : searchCategory === "consoles" ? "gaming" : "pc";
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
      goCheckout: () => app.startCheckout(),
      isHome: on("home"), isCategory: on("category"), isProduct: on("product"),
      isBuilder: on("builder"), isCart: on("cart"),
      isCheckout: on("checkout"), isDone: on("done"),
      startGuided: () => app.setState({ route: "builder", chosen: [], builderSlot: "cpu" }),

      /** Watched products, newest first, each removable from the panel. */
      watchCount: s.watchdogs.length,
      watchItems: s.watchdogs.map((watch, index) => {
        const part = CATALOG[watch.slot].find(item => item.id === watch.productId);
        const cheaper = part ? part.price < watch.priceAtWatch : false;
        const back = part ? part.stock !== 0 : false;
        return {
          id: watch.productId,
          name: part ? productTitle(part, watch.slot) : watch.productId,
          image: part?.imagePath,
          note: watch.kind === "price"
            ? (cheaper ? `Dropped to ${money(part!.price)}` : `Watching from ${money(watch.priceAtWatch)}`)
            : (back ? "Back in stock" : "Waiting for stock"),
          hit: watch.kind === "price" ? cheaper : back,
          open: () => app.setState({ route: "product", productSlot: watch.slot, productId: watch.productId }),
          drop: () => app.toggleWatchdog(watch.slot, watch.productId, watch.kind),
        };
      }).reverse(),
      savedCount: s.saved, cartCount: s.cart.reduce((total, line) => total + line.qty, 0),
      cartDotBg: s.cart.length ? "var(--gray-900)" : "var(--surface-sunken)",
      cartDotFg: s.cart.length ? "#fff" : "var(--text-tertiary)",
      toastText: s.toast || "", toastOpacity: s.toast ? 1 : 0,
      searchValue: s.search,
      searchChange: (e: React.ChangeEvent<HTMLInputElement>) => app.setState({
        search: e.target.value,
        route: e.target.value ? "category" : "home",
        category: searchCategory,
        productSlot: searchCategory,
        dept: searchDept,
        brand: "any",
        openDept: null,
      }),
      recentSearches: s.recentSearches,
      runSearch: (query: string) => {
        const search = query.trim();
        if (!search) return;
        app.setState({
          search,
          route: "category",
          category: searchCategory,
          productSlot: searchCategory,
          dept: searchDept,
          openDept: null,
          brand: "any",
          recentSearches: [search, ...s.recentSearches.filter(item => item.toLowerCase() !== search.toLowerCase())].slice(0, 6),
        });
      },
      searchRecommendations: [
        { slot: "gpu", product: CATALOG.gpu.find(part => part.stock !== 0) },
        { slot: "phones", product: CATALOG.phones.find(part => part.stock !== 0) },
        { slot: "storage", product: CATALOG.storage.find(part => part.stock !== 0) },
        { slot: "cooler", product: CATALOG.cooler.find(part => part.stock !== 0) },
      ].filter(item => item.product).map(item => ({
        id: item.product!.id,
        name: productTitle(item.product!, item.slot as any),
        image: item.product!.imagePath,
        go: () => app.setState({ route: "product", productSlot: item.slot as any, productId: item.product!.id, productColorId: null }),
      })),
  };
}
