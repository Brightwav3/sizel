import type { RigsmithApp } from "../RigsmithApp";
import type { Vals } from "../sx";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GAMES, GSTEP, GUIDED, ORDER, SPECS } from "../data/catalog";
import { RES, compatibilityIssues, money } from "../data/metrics";
import type { Part, PcSlot, Picks, Slot } from "../types";
import { FACETS, FIT_FACET_IDS, FIXED } from "./catalogFacets";
import type { FacetDefinition } from "./catalogFacets";

// ADR 0002: shared calculations run once before domain view-models are assembled.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
export function createBuildContext(app: RigsmithApp) {
    const s = app.state, m = app.metrics(), route = s.route;
    const on = (k: string) => route === k;
    const sideStyle = (active: boolean) => ({
      bg: active ? "var(--surface-active)" : "transparent",
      fg: active ? "var(--text-primary)" : "var(--text-secondary)",
      fw: active ? 500 : 400,
      ic: active ? "var(--text-secondary)" : "var(--text-tertiary)",
    });

    const shopping = route === "category" || route === "product";
    const dept = DEPTS.find(d => d.id === s.dept) || DEPTS[0];
    const picked = s.openDept;
    const depts = DEPTS.map(d => {
      const isPicked = picked === d.id;
      return {
        ...sideStyle(isPicked),
        name: d.name, icon: d.icon, bd: isPicked ? "var(--border-default)" : "transparent",
        count: String(d.cats.reduce((a, c) => a + CAT_META[c].count, 0)),
        chevron: isPicked ? "180deg" : "0deg",
        maxH: "36px",
        padY: "8px",
        op: 1,
        go: () => app.setState({ openDept: d.id, route: "category", dept: d.id, category: d.cats[0], brand: "any", search: "" }),
      };
    });
    const openDept = DEPTS.find(d => d.id === picked);
    const categories = (openDept ? openDept.cats : []).map(id => {
      const active = shopping && s.category === id;
      return {
        ...sideStyle(active), name: CAT_META[id].name, count: String(CAT_META[id].count), icon: CAT_ICON[id],
        go: () => app.setState({ route: "category", dept: openDept!.id, category: id, brand: "any", openDept: null }),
      };
    });
    const spend = Math.min(100, Math.round(m.price / s.budget * 100));
    const over = m.price > s.budget, fpsOk = m.fps >= s.target, quietOk = !s.quiet || m.noise < 34;

    const rows = ORDER.map(o => {
      const f = FIXED.find(x => x.slot === o.slot);
      if (f) return { icon: f.icon, name: f.name, cat: f.cat, note: f.note, noteFg: "var(--text-secondary)", price: money(f.price), canChange: false, change: null, badge: null, bg: "#fff" };
      const p = app.part(o.slot);
      const changed = s.lastChange && s.lastChange.title.indexOf(p.name) > -1;
      let note = p.tag, noteFg = "var(--text-secondary)";
      if (o.slot === "gpu") { note = "Sets your frame rate"; noteFg = "var(--amber-600)"; }
      if (o.slot === "storage") note = p.note!;
      if (o.slot === "cooler") note = p.noise! < 30 ? "Keeps it quiet under load" : "Louder under load";
      if (["board", "psu", "case", "fans"].includes(o.slot)) note = p.note!;
      return {
        icon: o.icon, image: p.imagePath, name: p.name, cat: o.cat, note, noteFg, price: money(p.price), canChange: true,
        change: () => app.setState({ route: "picker", pickerSlot: o.slot }),
        badge: changed ? "just changed" : null, bg: changed ? "var(--blue-50)" : "#fff",
      };
    });

    const games = GAMES.map(g => {
      const fps = Math.round(m.fps * g.m), ok = fps >= s.target;
      return {
        name: g.name, fps: fps + " fps", pct: Math.min(100, Math.round(fps / 200 * 100)) + "%",
        color: ok ? "var(--green-600)" : "var(--amber-600)",
        note: ok ? "Meets your goal" : "Short of your " + s.target + " fps goal",
      };
    });

    const wantRes = s.useFilter.split(" ")[0];
    const allProducts = Object.values(CATALOG).flat().filter(product => !product.id.endsWith("::fans"));
    const searchText = s.search.trim().toLowerCase();
    const cat = s.category;
    const catList = searchText
      ? allProducts.filter(product => [product.name, product.model, product.description, JSON.stringify(product.specifications)].join(" ").toLowerCase().includes(searchText))
      : picked ? dept.cats.flatMap(category => CATALOG[category])
      : CATALOG[cat] || CATALOG.gpu;
    const brandOf = (p: any) => p.brand || p.name.split(" ")[0];
    const brandLogo = (brand: string) => "/catalog/logos/" + brand.toLowerCase().replace(/\s+/g, "-") + ".png";
    const facetDefinitions = FACETS[cat] || [];
    const facetValues = (definition: FacetDefinition, product: Part) => {
      const value = definition.get(product);
      return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
    };
    const specFilters = facetDefinitions.map(definition => {
      const selected = s.facetFilters[definition.id] || [];
      const values = Array.from(new Set(catList.flatMap(product => facetValues(definition, product)))).sort((a, b) => a.localeCompare(b));
      return {
        id: definition.id,
        label: definition.label,
        detail: values.length + " options",
        options: values.map(value => ({
          label: value,
          count: String(catList.filter(product => facetValues(definition, product).includes(value)).length),
          mark: selected.includes(value) ? "check" : "",
          bg: selected.includes(value) ? "var(--gray-900)" : "var(--gray-0)",
          bd: selected.includes(value) ? "var(--gray-900)" : "var(--border-default)",
          go: () => app.toggleFacet(definition.id, value),
        })),
      };
    }).filter(facet => facet.options.length > 0);
    const fitFacetIds = FIT_FACET_IDS[cat] ?? [];
    const fitFilters = specFilters.filter(facet => fitFacetIds.includes(facet.id));
    const technicalFilters = specFilters.filter(facet => !fitFacetIds.includes(facet.id));
    let visible = catList.filter(g =>
      g.price >= s.minPrice && g.price <= s.maxPrice &&
      (!s.stockOnly || (g.days <= 2 && g.stock !== 0)) &&
      (!s.onSale || g.merchandising === "sale") &&
      (s.brand === "any" || brandOf(g) === s.brand) &&
      (cat !== "gpu" || s.useFilter === "any" || g.good!.indexOf(wantRes) > -1) &&
      facetDefinitions.every(definition => {
        const selected = s.facetFilters[definition.id] || [];
        return selected.length === 0 || selected.some(value => facetValues(definition, g).includes(value));
      }));
    if (s.sort === "price") visible = [...visible].sort((a, b) => a.price - b.price);
    if (s.sort === "priceDesc") visible = [...visible].sort((a, b) => b.price - a.price);
    if (s.sort === "perf") visible = [...visible].sort((a, b) => (b.fps || b.score || 0) - (a.fps || a.score || 0));
    if (s.sort === "new") visible = [...visible].sort((a, b) => a.days - b.days);
    const hidden = catList.length - visible.length;

    const pSlot = s.productSlot || "gpu";
    const pick = (CATALOG[pSlot] || CATALOG.gpu).find(g => g.id === s.productId) || CATALOG[pSlot][0];
    const buildableProduct = ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"].includes(pSlot);
    const candidateBuild = buildableProduct ? app.metrics({ ...s.picks, [pSlot as PcSlot]: pick.id }) : null;
    const pFits = candidateBuild?.fits ?? true;

    const pslot = s.pickerSlot || "gpu";
    const cur = app.part(pslot);
    const pool = CATALOG[pslot];
    const ordered = [cur, ...pool.filter(o => o.id !== cur.id)].slice(0, 3);
    const mtx = ordered.map(o => app.metrics({ ...s.picks, [pslot]: o.id }));
    const rowDefs = [
      { k: "Price", vals: mtx.map(x => money(x.price)), ok: mtx.map(x => x.price <= s.budget) },
      { k: "Frame rate", vals: mtx.map(x => x.fps + " fps"), ok: mtx.map(x => x.fps >= s.target) },
      { k: "Noise", vals: mtx.map(x => app.noiseWord(x.noise)), ok: mtx.map(x => x.noise < 34) },
      { k: "Fits your build", vals: mtx.map(x => x.fits ? "Yes" : "No"), ok: mtx.map(x => x.fits) },
      { k: "Arrives", vals: mtx.map(x => app.shipDate(x.days)), ok: mtx.map(() => true) },
    ];
    const fg = (ok: boolean) => ok ? "var(--text-primary)" : "var(--amber-600)";
    const pickerRows = rowDefs.map(r => ({
      k: r.k, bg0: "var(--blue-50)",
      v0: r.vals[0], v1: r.vals[1], v2: r.vals[2], fg0: fg(r.ok[0]), fg1: fg(r.ok[1]), fg2: fg(r.ok[2]),
    }));

    const stepDefs = [
      { title: "Where should it go?", cta: "Continue to payment",
        fields: [{ label: "Full name", span: "auto" }, { label: "Phone", span: "auto" }, { label: "Street address", span: "1 / -1" }, { label: "City", span: "auto" }, { label: "Postcode", span: "auto" }] },
      { title: "How would you like to pay?", cta: "Review order",
        fields: [{ label: "Card number", span: "1 / -1" }, { label: "Expiry", span: "auto" }, { label: "Security code", span: "auto" }] },
      { title: "Everything look right?", cta: "Place order",
        fields: [{ label: "Quiet 1440p gaming PC, 9 parts", span: "1 / -1" }, { label: "Assembled and tested", span: "1 / -1" }] },
    ];
    const st = stepDefs[Math.min(s.step, 2)];
    const filtersOn = route === "category" || route === "product";
    const gSpent = GUIDED.filter(x => s.gDone.includes(x)).reduce((a, x) => a + app.part(x).price, 0);
    const valueGpu = CATALOG.gpu.filter(p => p.stock !== 0).slice().sort((a, b) => a.price - b.price)[0];
    const quietGpu = CATALOG.gpu.filter(p => p.stock !== 0).slice().sort((a, b) => (a.noise ?? 99) - (b.noise ?? 99))[0];
    const featuredCpu = CATALOG.cpu.find(p => p.id === DEFAULT_PICKS.cpu)!;
    const featuredCooler = CATALOG.cooler.slice().sort((a, b) => (a.noise ?? 99) - (b.noise ?? 99))[0];
    const featuredStorage = CATALOG.storage.slice().sort((a, b) => a.price - b.price)[0];
    const featuredPhone = CATALOG.phones.filter(p => p.stock !== 0).slice().sort((a, b) => b.score! - a.score!)[0] || CATALOG.phones[0];
    const featuredConsole = CATALOG.consoles.filter(p => p.stock !== 0).slice().sort((a, b) => b.score! - a.score!)[0] || CATALOG.consoles[0];
    const promoProduct = (product: any, slot: Slot, label: string, copy: string, hero: Vals) => ({
      label, copy, name: product.name, brand: product.brand, price: money(product.price), image: product.imagePath,
      availability: product.availability === "in_stock" ? "Available now" : "Check availability",
      ...hero,
      go: () => app.setState({ route: "product", productSlot: slot, productId: product.id }),
    });
    const brandNames = Array.from(new Set(allProducts.map(product => product.brand).filter((brand): brand is string => Boolean(brand)))).sort();
    const brandRibbon = brandNames.map(brand => ({
      name: brand,
      logo: "/catalog/logos/" + brand.toLowerCase().replace(/\s+/g, "-") + ".png",
      go: () => app.setState({ route: "category", dept: "pc", category: "gpu", brand, search: "" }),
    }));
    const homeDepartments = DEPTS.map(d => {
      const shopCats = d.cats.filter(category => category !== "fans");
      const count = shopCats.reduce((sum, category) => sum + (CAT_META[category]?.count ?? 0), 0);
      return {
        id: d.id,
        name: d.name,
        icon: d.icon,
        count: String(count),
        blurb: d.id === "pc" ? "Build-ready parts with compatibility checks" : d.id === "phone" ? "Fictional phones with clear specs" : "Consoles for living-room and portable play",
        go: () => app.setState({ route: "category", dept: d.id, category: shopCats[0], brand: "any", search: "" }),
      };
    });
    const homeCategorySlots: Slot[] = ["gpu", "cpu", "ram", "storage", "phones", "consoles"];
    const homeCategories = homeCategorySlots.map(category => ({
      name: CAT_META[category].name,
      count: String(CAT_META[category].count),
      icon: CAT_ICON[category],
      go: () => app.setState({ route: "category", dept: category === "phones" ? "phone" : category === "consoles" ? "gaming" : "pc", category, brand: "any", search: "" }),
    }));

    return { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories };
}

export type BuildContext = ReturnType<typeof createBuildContext>;
