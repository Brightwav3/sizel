import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildCatalogVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
      filtersOpen: filtersOn ? "true" : "false",
      catName: s.search ? "Search results" : s.brand === "any" ? CAT_META[cat].name : s.brand + " " + CAT_META[cat].name.toLowerCase(),
      catBlurb: s.search ? "Matches from all real products, models, and specifications." : CAT_META[cat].blurb,
      catIsGpu: cat === "gpu",
      compareShow: dept.id === "pc" ? "inline-flex" : "none",
      gpuFilterDisplay: cat === "gpu" && !s.openDept ? "flex" : "none",
      fitFilterDisplay: fitFilters.length && !s.openDept ? "flex" : "none",
      specFilterDisplay: s.openDept ? "none" : "flex",
      catSub: visible.length + " shown of " + CAT_META[cat].count + " products",
      minPrice: s.minPrice, minPriceLabel: money(s.minPrice), maxPrice: s.maxPrice, maxPriceLabel: money(s.maxPrice),
      setMinPrice: (e: any) => app.setState({ minPrice: Math.min(+e.target.value, s.maxPrice - 20) }),
      setMaxPrice: (e: any) => app.setState({ maxPrice: Math.max(+e.target.value, s.minPrice + 20) }),
      useFilters: ["1080p gaming", "1440p gaming", "4K gaming"].map(l => ({
        label: l, go: () => app.setState({ useFilter: s.useFilter === l ? "any" : l }),
        mark: s.useFilter === l ? "check" : "",
        bg: s.useFilter === l ? "var(--gray-900)" : "#fff",
        bd: s.useFilter === l ? "var(--gray-900)" : "var(--border-default)",
      })),
      clearFilters: () => app.setState({ useFilter: "any", minPrice: 0, maxPrice: 2200, fitOnly: false, brand: "any", facetFilters: {}, stockOnly: false, onSale: false, sort: "popular", search: "" }),
      fitFilters,
      specFilters: technicalFilters,
      brandFilters: ["any", ...Array.from(new Set(catList.map(brandOf)))].map(b => ({
        label: b === "any" ? "All brands" : b,
        count: b === "any" ? String(catList.length) : String(catList.filter(x => brandOf(x) === b).length),
        mark: s.brand === b ? "check" : "",
        bg: s.brand === b ? "var(--gray-900)" : "#fff",
        bd: s.brand === b ? "var(--gray-900)" : "var(--border-default)",
        go: () => app.setState({ brand: b }),
      })),
      inlineSorts: [
        { id: "popular", label: "Recommended" },
        { id: "price", label: "Cheapest" },
        { id: "priceDesc", label: "Priciest" },
        { id: "perf", label: "Fastest" },
        { id: "new", label: "Ships soonest" },
      ].map(o => ({
        label: o.label, go: () => app.setState({ sort: o.id }),
        bg: s.sort === o.id ? "#fff" : "transparent",
        fg: s.sort === o.id ? "var(--text-primary)" : "var(--text-secondary)",
        fw: s.sort === o.id ? 500 : 400,
        sh: s.sort === o.id ? "0 1px 3px rgba(41,41,41,.10)" : "none",
      })),
      inlineChips: [
        { id: "sale", label: "On sale", icon: "sell", on: s.onSale },
        { id: "stock", label: "In stock", icon: "check", on: s.stockOnly },
        { id: "budget", label: "Under $500", icon: "payments", on: s.maxPrice <= 500 },
      ].map(c => ({
        label: c.label, icon: c.icon, iconShow: c.on ? "inline" : "none",
        bg: c.on ? "var(--gray-900)" : "#fff",
        fg: c.on ? "#fff" : "var(--text-secondary)",
        bd: c.on ? "var(--gray-900)" : "var(--border-default)",
        fw: c.on ? 500 : 400,
        go: () => c.id === "sale" ? app.setState({ onSale: !s.onSale })
          : c.id === "stock" ? app.setState({ stockOnly: !s.stockOnly })
          : app.setState({ minPrice: 0, maxPrice: s.maxPrice <= 500 ? 2200 : 500 }),
      })),
      anyFilter: s.onSale || s.stockOnly || s.minPrice > 0 || s.maxPrice < 2200 || s.brand !== "any" || s.useFilter !== "any" || s.sort !== "popular" || !!s.search || Object.values(s.facetFilters).some(values => values.length > 0),
      sortOptions: [
        { id: "popular", label: "Most popular" },
        { id: "price", label: "Price, low to high" },
        { id: "priceDesc", label: "Price, high to low" },
        { id: "perf", label: "Performance" },
      ].map(o => ({
        label: o.label, go: () => app.setState({ sort: o.id }),
        bg: s.sort === o.id ? "var(--surface-active)" : "transparent",
        fg: s.sort === o.id ? "var(--text-primary)" : "var(--text-secondary)",
        fw: s.sort === o.id ? 500 : 400,
      })),
      toggleStock: () => app.setState({ stockOnly: !s.stockOnly }),
      stockBg: s.stockOnly ? "var(--gray-900)" : "var(--gray-300)",
      stockX: s.stockOnly ? "16px" : "2px",

      gpuCards: visible.map(g => {
        const stockCount = g.stock ?? 0;
        const out = stockCount === 0;
        const sale = g.merchandising === "sale";
        const fresh = g.merchandising === "new";
        const low = !out && g.low;
        return {
          state: out ? "Out of stock" : low ? "Only " + g.low + " left" : g.days > 3 ? "Pre-order" : "",
          stateBg: out ? "var(--gray-900)" : sale ? "var(--red-500)" : low ? "var(--amber-500)" : "var(--gray-600)",
          stateShow: (out || low || g.days > 3) ? "inline-flex" : "none",
          was: g.was ? money(g.was) : "",
          wasShow: g.was ? "inline" : "none",
          priceKind: sale ? "sale" : fresh ? "new" : "standard",
          priceHeader: sale ? "Price bomb" : fresh ? "New" : "",
          pricePanelBg: sale ? "var(--danger)" : fresh ? "var(--accent-soft)" : "transparent",
          pricePanelBorder: sale ? "none" : fresh ? "1px solid var(--blue-100)" : "none",
          priceHeaderBg: sale ? "var(--price-bomb)" : "var(--accent-active)",
          priceHeaderFg: sale ? "var(--text-primary)" : "var(--text-inverse)",
          priceFg: sale ? "var(--text-inverse)" : fresh ? "var(--accent-active)" : "var(--danger)",
          dim: out ? 0.55 : 1,
          addBg: out ? "var(--surface-sunken)" : "var(--surface-card)",
          addFg: out ? "var(--text-tertiary)" : "var(--text-primary)",
          name: g.name, brand: brandOf(g), image: g.imagePath,
          desc: (DESCS[cat] || (() => CAT_META[cat].blurb))(g),
          specs: (SPECS[cat] || (() => []))(g),
          cta: out ? "Notify me" : "Add to cart",
          add: () => out ? app.setState({ toast: "We'll email you when it's back" }, () => app.flash())
            : app.setState({ inCart: true, toast: g.name + " added to cart" }, () => app.flash()),
          good: g.good || g.note || g.meaning || CAT_META[cat].blurb, price: money(g.price),
          tag: g.id === (s.picks as any)[cat] ? "In your build" : g.tag,
          tagFg: g.id === (s.picks as any)[cat] ? "var(--accent-active)" : g.tag === "Best value" ? "var(--green-600)" : "var(--text-tertiary)",
          bd: g.id === (s.picks as any)[cat] ? "var(--accent)" : "var(--border-subtle)",
          stock: out ? "Out of stock" : g.days <= 2 ? (stockCount > 5 ? "In stock · > 5 pcs" : `In stock · ${stockCount} pcs`) : "Ships in " + g.days + " days",
          stockFg: out ? "var(--text-tertiary)" : g.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
          go: () => app.setState({ route: "product", productSlot: cat, productId: g.id }),
        };
      }),
      departmentCards: dept.cats.flatMap(cardCategory => CATALOG[cardCategory].filter(g =>
        g.price >= s.minPrice && g.price <= s.maxPrice &&
        (!s.stockOnly || (g.days <= 2 && g.stock !== 0)) &&
        (!s.onSale || g.merchandising === "sale") &&
        (s.brand === "any" || brandOf(g) === s.brand) &&
        (!searchText || [g.name, g.model, g.description, JSON.stringify(g.specifications)].join(" ").toLowerCase().includes(searchText))
      ).map(g => {
        const stockCount = g.stock ?? 0;
        const out = stockCount === 0;
        const sale = g.merchandising === "sale";
        const fresh = g.merchandising === "new";
        const low = !out && g.low;
        return {
          state: out ? "Out of stock" : low ? "Only " + g.low + " left" : g.days > 3 ? "Pre-order" : "",
          stateBg: out ? "var(--gray-900)" : sale ? "var(--red-500)" : low ? "var(--amber-500)" : "var(--gray-600)",
          stateShow: (out || low || g.days > 3) ? "inline-flex" : "none",
          was: g.was ? money(g.was) : "", wasShow: g.was ? "inline" : "none",
          priceKind: sale ? "sale" : fresh ? "new" : "standard",
          priceHeader: sale ? "Price bomb" : fresh ? "New" : "",
          pricePanelBg: sale ? "var(--danger)" : fresh ? "var(--accent-soft)" : "transparent",
          pricePanelBorder: sale ? "none" : fresh ? "1px solid var(--blue-100)" : "none",
          priceHeaderBg: sale ? "var(--price-bomb)" : "var(--accent-active)",
          priceHeaderFg: sale ? "var(--text-primary)" : "var(--text-inverse)",
          priceFg: sale ? "var(--text-inverse)" : fresh ? "var(--accent-active)" : "var(--danger)",
          dim: out ? 0.55 : 1,
          addBg: out ? "var(--surface-sunken)" : "var(--surface-card)",
          addFg: out ? "var(--text-tertiary)" : "var(--text-primary)",
          name: g.name, brand: brandOf(g), image: g.imagePath,
          desc: (DESCS[cardCategory] || (() => CAT_META[cardCategory].blurb))(g),
          specs: (SPECS[cardCategory] || (() => []))(g),
          cta: out ? "Notify me" : "Add to cart",
          add: () => out ? app.setState({ toast: "We'll email you when it's back" }, () => app.flash()) : app.setState({ inCart: true, toast: g.name + " added to cart" }, () => app.flash()),
          good: g.good || g.note || g.meaning || CAT_META[cardCategory].blurb,
          price: money(g.price), tag: g.tag, tagFg: "var(--text-tertiary)", bd: "var(--border-subtle)",
          stock: out ? "Out of stock" : g.days <= 2 ? (stockCount > 5 ? "In stock · > 5 pcs" : `In stock · ${stockCount} pcs`) : "Ships in " + g.days + " days",
          stockFg: out ? "var(--text-tertiary)" : g.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
          go: () => app.setState({ route: "product", productSlot: cardCategory, productId: g.id, openDept: null }),
        };
      })),
      hiddenNote: hidden > 0 ? hidden + " products hidden by your filters." : null,
  };
}
