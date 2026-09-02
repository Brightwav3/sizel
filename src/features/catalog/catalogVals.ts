// ADR 0003: category cards expand canonical SKUs into colour listings.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
import { CATALOG, CAT_META, DESCS, SPECS } from "../../data/catalog/catalog";
import { money } from "../../entities/build/metrics";
import { findProduct, partFits, productTitle } from "../../entities/product/queries";
import { ratingFor } from "../../data/catalog/reviews";
import { colorwaysFor } from "../../data/catalog/colorways";
import { listingStock, stockLabel } from "../../data/catalog/listingStock";
import type { Part, PcSlot } from "../../shared/lib/types";
import type { BuildContext } from "../../entities/build/buildContext";

export function buildCatalogVals(context: BuildContext) {
  const { app, s, route, dept, searchText, cat, catList, filterPool, brandOf, specFilters, fitFilters, visible, hidden, bounds, filtersOn, activeBrandCategory } = context;
  const listingCount = (products: typeof visible, slot: typeof cat) => products.reduce(
    (total, product) => total + Math.max(1, colorwaysFor(product, slot).length), 0,
  );
  const makeBrandCards = (products: Part[]) => products.flatMap(product => {
    const cardCategory = findProduct(product.id)?.category ?? cat;
    const colorways = colorwaysFor(product, cardCategory);
    return (colorways.length ? colorways : [null]).map(colorway => {
      const stockCount = listingStock(product, cardCategory, colorway?.id);
      const out = stockCount === 0;
      const sale = product.merchandising === "sale";
      const fresh = product.merchandising === "new";
      const low = !out && product.low;
      return {
        state: out ? "Out of stock" : low ? "Only " + product.low + " left" : product.days > 3 ? "Pre-order" : "",
        stateBg: out ? "var(--gray-900)" : sale ? "var(--red-500)" : low ? "var(--amber-500)" : "var(--gray-600)",
        stateShow: (out || low || product.days > 3) ? "inline-flex" : "none",
        was: product.was ? money(product.was) : "", wasShow: product.was ? "inline" : "none",
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
        name: `${productTitle(product, cardCategory)}${colorway ? ` · ${colorway.name}` : ""}`,
        brand: brandOf(product), image: colorway?.imagePath ?? product.imagePath,
        rating: ratingFor(product), inBuild: s.chosen.includes(cardCategory as PcSlot) && product.id === s.picks[cardCategory as PcSlot],
        canAddToBuild: ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"].includes(cardCategory),
        addToBuild: () => app.setFromProduct(cardCategory as PcSlot, product.id),
        watched: app.isWatched(product.id, product.stock === 0 ? "availability" : "price"),
        watch: () => app.toggleWatchdog(cardCategory, product.id, product.stock === 0 ? "availability" : "price"),
        desc: (DESCS[cardCategory] || (() => CAT_META[cardCategory].blurb))(product),
        specs: (SPECS[cardCategory] || (() => []))(product),
        cta: out ? "Notify me" : "Add to cart",
        add: () => out
          ? app.setState({ toast: "Out of stock. Demo only — email alerts are not available." }, () => app.flash())
          : app.addToCart(cardCategory, product.id),
        good: product.good || product.note || product.meaning || CAT_META[cardCategory].blurb,
        price: money(product.price), tag: product.tag, tagFg: "var(--text-tertiary)", bd: "var(--border-subtle)",
        stock: out ? "Out of stock" : product.days <= 2 ? `In stock · ${stockLabel(stockCount)} pcs` : "Ships in " + product.days + " days",
        stockFg: out ? "var(--text-tertiary)" : product.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
        go: () => app.setState({ route: "product", productSlot: cardCategory, productId: product.id, productColorId: colorway?.id ?? null, openDept: null }),
      };
    });
  });
  const brandProducts = route === "brand" ? visible : [];
  const visibleListings = route === "brand" ? visible.length : listingCount(visible, cat);
  const poolListings = route === "brand"
    ? context.brandPool.filter(product => activeBrandCategory === undefined || findProduct(product.id)?.category === activeBrandCategory).length
    : listingCount(catList, cat);
  return {
      filtersOpen: filtersOn ? "true" : "false",
      catName: s.search ? "Search results" : s.brand === "any" ? CAT_META[cat].name : s.brand + " " + CAT_META[cat].name.toLowerCase(),
      gpuFilterDisplay: route !== "brand" && cat === "gpu" && !s.openDept ? "flex" : "none",
      catSub: visibleListings + " shown of " + poolListings + " listings",
      minPrice: s.minPrice, minPriceLabel: money(s.minPrice), maxPrice: s.maxPrice, maxPriceLabel: money(s.maxPrice),
      setMinPrice: (e: any) => app.setState({ minPrice: Math.min(+e.target.value, s.maxPrice - 20) }),
      setMaxPrice: (e: any) => app.setState({ maxPrice: Math.max(+e.target.value, s.minPrice + 20) }),
      useFilters: ["1080p gaming", "1440p gaming", "4K gaming"].map(l => ({
        label: l, go: () => app.setState({ useFilter: s.useFilter === l ? "any" : l }),
        mark: s.useFilter === l ? "check" : "",
        bg: s.useFilter === l ? "var(--gray-900)" : "#fff",
        bd: s.useFilter === l ? "var(--gray-900)" : "var(--border-default)",
      })),
      clearFilters: () => app.setState({ useFilter: "any", minPrice: 0, maxPrice: 2200, fitOnly: false, fastShip: false, brand: route === "brand" ? s.brand : "any", brandCategory: route === "brand" ? "all" : s.brandCategory, facetFilters: {}, stockOnly: false, onSale: false, sort: "popular", search: "" }),
      /** Every spec facet in one list — the shopper does not think in "fit" vs "technical". */
      facetGroups: specFilters,
      fitFilters,
      brandFilters: (route === "brand" ? [s.brand] : ["any", ...Array.from(new Set(catList.map(brandOf))) ]).map(b => ({
        label: b === "any" ? "All brands" : b,
        count: b === "any" ? String(filterPool.length) : String(filterPool.filter(x => brandOf(x) === b).length),
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
      anyFilter: s.onSale || s.stockOnly || s.fastShip || s.fitOnly || s.minPrice > 0 || s.maxPrice < 2200 || (s.brand !== "any" && route !== "brand") || (route === "brand" && s.brandCategory !== "all") || s.useFilter !== "any" || s.sort !== "popular" || !!s.search || Object.values(s.facetFilters).some(values => values.length > 0),

      // Filter panel ------------------------------------------------------
      visibleCount: `${visibleListings} of ${poolListings}`,
      poolCount: String(poolListings),
      /** What is currently narrowing the list, each chip removing just itself. */
      activeFilterChips: [
        ...(s.search ? [{ label: `"${s.search}"`, clear: () => app.setState({ search: "" }) }] : []),
        ...(s.brand !== "any" && route !== "brand" ? [{ label: s.brand, clear: () => app.setState({ brand: "any" }) }] : []),
        ...(route === "brand" && s.brandCategory !== "all" ? [{ label: CAT_META[s.brandCategory].name, clear: () => app.setState({ brandCategory: "all" }) }] : []),
        ...(s.minPrice > bounds.min || s.maxPrice < bounds.max
          ? [{ label: `${money(s.minPrice)} – ${money(s.maxPrice)}`, clear: () => app.setState({ minPrice: 0, maxPrice: 2200 }) }] : []),
        ...(s.stockOnly ? [{ label: "In stock", clear: () => app.setState({ stockOnly: false }) }] : []),
        ...(s.fastShip ? [{ label: "Ships in 2 days", clear: () => app.setState({ fastShip: false }) }] : []),
        ...(s.onSale ? [{ label: "On sale", clear: () => app.setState({ onSale: false }) }] : []),
        ...(s.fitOnly ? [{ label: "Fits my build", clear: () => app.setState({ fitOnly: false }) }] : []),
        ...(s.useFilter !== "any" ? [{ label: s.useFilter, clear: () => app.setState({ useFilter: "any" }) }] : []),
        ...Object.entries(s.facetFilters).flatMap(([id, values]) => values.map(value => ({
          label: value, clear: () => app.toggleFacet(id, value),
        }))),
      ],

      /** Price steps taken from what this category actually costs. */ priceMax: bounds.max,
      priceBands: (() => {
        const span = bounds.max - bounds.min;
        if (span <= 0) return [];
        const round = (value: number) => Math.round(value / 10) * 10;
        const cuts = [bounds.min, round(bounds.min + span / 3), round(bounds.min + (span * 2) / 3), bounds.max];
        return cuts.slice(0, 3).map((from, index) => {
          const to = cuts[index + 1];
          const on = s.minPrice === from && s.maxPrice === to;
          return {
            label: index === 0 ? `Under ${money(to)}` : index === 2 ? `${money(from)} and up` : `${money(from)} – ${money(to)}`,
            count: String(filterPool.filter(product => product.price >= from && product.price <= to).length),
            on,
            go: () => app.setState(on ? { minPrice: 0, maxPrice: 2200 } : { minPrice: from, maxPrice: to }),
          };
        });
      })(),

      /** Availability and offers, each with the number of listings it leaves. */
      availabilityFilters: [
        { id: "stock", label: "In stock", on: s.stockOnly, count: filterPool.filter(p => p.stock !== 0).length, go: () => app.setState({ stockOnly: !s.stockOnly }) },
        { id: "fast", label: "Ships within 2 days", on: s.fastShip, count: filterPool.filter(p => p.days <= 2).length, go: () => app.setState({ fastShip: !s.fastShip }) },
        { id: "sale", label: "On sale", on: s.onSale, count: filterPool.filter(p => p.merchandising === "sale").length, go: () => app.setState({ onSale: !s.onSale }) },
      ].map(f => ({ ...f, count: String(f.count), mark: f.on ? "check" : "", bg: f.on ? "var(--gray-900)" : "var(--gray-0)", bd: f.on ? "var(--gray-900)" : "var(--border-default)" })),

      /** The build-aware filter — the reason this shop is not a generic grid. */
      fitFilterShow: route !== "brand" && app.chosenPicks && Object.keys(app.chosenPicks()).length > 0 && ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"].includes(cat) ? "flex" : "none",
      fitOnlyOn: s.fitOnly,
      fitOnlyCount: String(filterPool.filter(product => partFits(product, cat, app.chosenPicks())).length),
      fitOnlyLabel: `Fits my ${Object.keys(app.chosenPicks()).length}-part build`,
      toggleFitOnly: () => app.setState({ fitOnly: !s.fitOnly }),

      gpuCards: visible.flatMap(g => (colorwaysFor(g, cat).length ? colorwaysFor(g, cat) : [null]).map(colorway => {
        const stockCount = listingStock(g, cat, colorway?.id);
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
          name: `${productTitle(g, cat)}${colorway ? ` · ${colorway.name}` : ""}`, brand: brandOf(g), image: colorway?.imagePath ?? g.imagePath,
          rating: ratingFor(g), inBuild: s.chosen.includes(cat as PcSlot) && g.id === (s.picks as any)[cat],
          canAddToBuild: ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"].includes(cat),
          addToBuild: () => app.setFromProduct(cat as PcSlot, g.id),
          watched: app.isWatched(g.id, g.stock === 0 ? "availability" : "price"),
          watch: () => app.toggleWatchdog(cat, g.id, g.stock === 0 ? "availability" : "price"),
          desc: (DESCS[cat] || (() => CAT_META[cat].blurb))(g),
          specs: (SPECS[cat] || (() => []))(g),
          cta: out ? "Notify me" : "Add to cart",
          add: () => out ? app.setState({ toast: "Out of stock. Demo only — email alerts are not available." }, () => app.flash())
            : app.addToCart(cat, g.id),
          good: g.good || g.note || g.meaning || CAT_META[cat].blurb, price: money(g.price),
          tag: s.chosen.includes(cat as PcSlot) && g.id === (s.picks as any)[cat] ? "In your build" : g.tag,
          tagFg: g.id === (s.picks as any)[cat] ? "var(--accent-active)" : g.tag === "Best value" ? "var(--green-600)" : "var(--text-tertiary)",
          bd: g.id === (s.picks as any)[cat] ? "var(--accent)" : "var(--border-subtle)",
          stock: out ? "Out of stock" : g.days <= 2 ? `In stock · ${stockLabel(stockCount)} pcs` : "Ships in " + g.days + " days",
          stockFg: out ? "var(--text-tertiary)" : g.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
          go: () => app.setState({ route: "product", productSlot: cat, productId: g.id, productColorId: colorway?.id ?? null }),
        };
      })),
      departmentCards: dept.cats.flatMap(cardCategory => CATALOG[cardCategory].filter(g =>
        g.price >= s.minPrice && g.price <= s.maxPrice &&
        (!s.stockOnly || (g.days <= 2 && g.stock !== 0)) &&
        (!s.onSale || g.merchandising === "sale") &&
        (s.brand === "any" || brandOf(g) === s.brand) &&
        (!searchText || [g.name, g.model, g.description, JSON.stringify(g.specifications)].join(" ").toLowerCase().includes(searchText))
      ).flatMap(g => (colorwaysFor(g, cardCategory).length ? colorwaysFor(g, cardCategory) : [null]).map(colorway => {
        const stockCount = listingStock(g, cardCategory, colorway?.id);
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
          name: `${productTitle(g, cardCategory)}${colorway ? ` · ${colorway.name}` : ""}`, brand: brandOf(g), image: colorway?.imagePath ?? g.imagePath,
          rating: ratingFor(g), inBuild: s.chosen.includes(cardCategory as PcSlot) && g.id === s.picks[cardCategory as PcSlot],
          canAddToBuild: ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"].includes(cardCategory),
          addToBuild: () => app.setFromProduct(cardCategory as PcSlot, g.id),
          watched: app.isWatched(g.id, g.stock === 0 ? "availability" : "price"),
          watch: () => app.toggleWatchdog(cardCategory, g.id, g.stock === 0 ? "availability" : "price"),
          desc: (DESCS[cardCategory] || (() => CAT_META[cardCategory].blurb))(g),
          specs: (SPECS[cardCategory] || (() => []))(g),
          cta: out ? "Notify me" : "Add to cart",
          add: () => out ? app.setState({ toast: "Out of stock. Demo only — email alerts are not available." }, () => app.flash()) : app.addToCart(cardCategory, g.id),
          good: g.good || g.note || g.meaning || CAT_META[cardCategory].blurb,
          price: money(g.price), tag: g.tag, tagFg: "var(--text-tertiary)", bd: "var(--border-subtle)",
          stock: out ? "Out of stock" : g.days <= 2 ? `In stock · ${stockLabel(stockCount)} pcs` : "Ships in " + g.days + " days",
          stockFg: out ? "var(--text-tertiary)" : g.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
          go: () => app.setState({ route: "product", productSlot: cardCategory, productId: g.id, productColorId: colorway?.id ?? null, openDept: null }),
        };
      }))),
      brandCards: makeBrandCards(brandProducts),
      hiddenNote: hidden > 0 ? hidden + " products hidden by your filters." : null,
  };
}
