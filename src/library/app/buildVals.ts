import type { Vals } from "../sx";
import type { RigsmithApp } from "../RigsmithApp";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GAMES, GSTEP, GUIDED, ORDER, SPECS } from "../data/catalog";
import { RES, compatibilityIssues, money } from "../data/metrics";
import type { Part, PcSlot, Picks, Slot } from "../types";
import { FACETS, FIT_FACET_IDS, FIXED } from "./catalogFacets";
import type { FacetDefinition } from "./catalogFacets";

export function buildVals(app: RigsmithApp): Vals {
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

      prebuilts: [
        { name: valueGpu.name, claim: `${valueGpu.good} · ${valueGpu.brand}`, price: money(valueGpu.price), image: valueGpu.imagePath, go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }) },
        { name: quietGpu.name, claim: `${quietGpu.good} · ${quietGpu.brand}`, price: money(quietGpu.price), image: quietGpu.imagePath, go: () => app.setState({ route: "product", productSlot: "gpu", productId: quietGpu.id }) },
      ],
      heroProduct: {
        name: valueGpu.name,
        brand: valueGpu.brand,
        price: money(valueGpu.price),
        image: valueGpu.imagePath,
        claim: valueGpu.good,
        go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }),
      },
      brandRibbon,
      promotions: [
        {
          kind: "service",
          name: "Rigsmith PC configurator",
          brand: "Rigsmith service",
          price: "Free to use",
          image: "/catalog/promos/rigsmith-configurator-promo.png",
          availability: "Compatibility checked as you build",
          label: "PC configurator",
          copy: "Choose parts step by step and get a build that fits together.",
          heroEyebrow: "PC configurator",
          heroTitle: "Build a PC that fits together.",
          heroCta: "Start a build",
          heroSecondaryLabel: "Browse all parts",
          heroSecondaryGo: () => app.go("category"),
          heroStats: [{ value: "9", label: "compatibility checks" }, { value: String(CATALOG.gpu.length), label: "graphics cards" }, { value: "135", label: "catalog products" }],
          heroGo: () => app.go("builder"),
          go: () => app.go("builder"),
        },
        {
          kind: "service",
          name: "Compare before buying",
          brand: "Rigsmith service",
          price: "Coming soon",
          image: "/catalog/promos/rigsmith-compare-promo.png",
          availability: "Comparison tool placeholder",
          label: "Compare before buying",
          copy: "Shortlist products by specs, price and fit before you decide.",
          heroEyebrow: "Compare before buying",
          heroTitle: "See the difference before you choose.",
          heroCta: "Browse the catalog",
          heroSecondaryLabel: "Start a build",
          heroSecondaryGo: () => app.go("builder"),
          heroStats: [{ value: "Coming soon", label: "comparison tool" }, { value: "135", label: "products to shortlist" }, { value: "13", label: "fictional brands" }],
          heroGo: () => app.go("category"),
          go: () => app.go("category"),
        },
        promoProduct(valueGpu, "gpu", "PC upgrade pick", "Compare graphics memory, card length and power draw before you buy.", {
          heroEyebrow: "PC parts in focus", heroTitle: "The right graphics card sets the whole build.", heroCta: "Shop graphics cards",
          heroSecondaryLabel: "Build a PC", heroSecondaryGo: () => app.setState({ route: "guided", gStep: 0, gDone: [] }),
          heroStats: [{ value: String((valueGpu.stock ?? 0) > 5 ? "> 5" : (valueGpu.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.gpu.length), label: "graphics cards" }, { value: "9", label: "compatibility checks" }],
          heroGo: () => app.setState({ route: "category", dept: "pc", category: "gpu", brand: "any", search: "" }),
        }),
        promoProduct(featuredPhone, "phones", "Phone spotlight", "Compare battery, camera and display specs in one place.", {
          heroEyebrow: "Phone spotlight", heroTitle: "New phones, compared without the guesswork.", heroCta: "Shop phones",
          heroSecondaryLabel: "Browse all parts", heroSecondaryGo: () => app.go("category"),
          heroStats: [{ value: String((featuredPhone.stock ?? 0) > 5 ? "> 5" : (featuredPhone.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.phones.length), label: "phone models" }, { value: "30", label: "day returns" }],
          heroGo: () => app.setState({ route: "category", dept: "phone", category: "phones", brand: "any", search: "" }),
        }),
        promoProduct(featuredConsole, "consoles", "Gaming spotlight", "Find a ready-to-play system for the living room or on the go.", {
          heroEyebrow: "Gaming spotlight", heroTitle: "Ready-to-play hardware for the next session.", heroCta: "Shop consoles",
          heroSecondaryLabel: "Browse all parts", heroSecondaryGo: () => app.go("category"),
          heroStats: [{ value: String((featuredConsole.stock ?? 0) > 5 ? "> 5" : (featuredConsole.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.consoles.length), label: "console models" }, { value: "2", label: "year warranty" }],
          heroGo: () => app.setState({ route: "category", dept: "gaming", category: "consoles", brand: "any", search: "" }),
        }),
        promoProduct(featuredStorage, "storage", "Storage spotlight", "Keep more games, projects and media ready without guessing which drive fits.", {
          heroEyebrow: "Storage spotlight", heroTitle: "More room for the things you keep.", heroCta: "Shop storage",
          heroSecondaryLabel: "Build a PC", heroSecondaryGo: () => app.setState({ route: "guided", gStep: 0, gDone: [] }),
          heroStats: [{ value: String((featuredStorage.stock ?? 0) > 5 ? "> 5" : (featuredStorage.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.storage.length), label: "storage options" }, { value: "1–2", label: "day delivery" }],
          heroGo: () => app.setState({ route: "category", dept: "pc", category: "storage", brand: "any", search: "" }),
        }),
        promoProduct(featuredCpu, "cpu", "Processor spotlight", "Start with the processor that matches your workload, socket and upgrade path.", {
          heroEyebrow: "Processor spotlight", heroTitle: "The part that sets your build's pace.", heroCta: "Shop processors",
          heroSecondaryLabel: "Build a PC", heroSecondaryGo: () => app.setState({ route: "guided", gStep: 0, gDone: [] }),
          heroStats: [{ value: String((featuredCpu.stock ?? 0) > 5 ? "> 5" : (featuredCpu.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.cpu.length), label: "processor options" }, { value: "9", label: "compatibility checks" }],
          heroGo: () => app.setState({ route: "category", dept: "pc", category: "cpu", brand: "any", search: "" }),
        }),
      ],
      homeDepartments,
      homeCategories,
      catalogCount: String(allProducts.length),
      brandCount: String(new Set(allProducts.map(product => product.brand)).size),
      inStockCount: String(allProducts.filter(product => product.stock !== 0).length),
      news: [
        { when: "Now", text: `${valueGpu.name} · ${valueGpu.brand}`, tag: money(valueGpu.price), tagFg: "var(--green-600)", go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }) },
        { when: "Now", text: `${quietGpu.name} available`, tag: quietGpu.stock === 0 ? "unavailable" : "in stock", tagFg: "var(--text-tertiary)", go: () => app.setState({ route: "product", productSlot: "gpu", productId: quietGpu.id }) },
        { when: "Catalog", text: `${CATALOG.board.length} motherboards ready to compare`, tag: "open picker", tagFg: "var(--accent-active)", go: () => app.setState({ route: "picker", pickerSlot: "board" }) },
      ],
      bestOf: [
        { name: valueGpu.name, why: valueGpu.description, award: "Lowest price", awardFg: "var(--green-600)", price: money(valueGpu.price), picks: valueGpu.availability === "out_of_stock" ? "unavailable" : "in stock", image: valueGpu.imagePath, go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }) },
        { name: quietGpu.name, why: quietGpu.description, award: "Quietest estimate", awardFg: "var(--accent-active)", price: money(quietGpu.price), picks: quietGpu.availability === "out_of_stock" ? "unavailable" : "in stock", image: quietGpu.imagePath, go: () => app.setState({ route: "product", productSlot: "gpu", productId: quietGpu.id }) },
        { name: featuredCpu.name, why: featuredCpu.description, award: "Default processor", awardFg: "var(--text-tertiary)", price: money(featuredCpu.price), picks: featuredCpu.availability === "out_of_stock" ? "unavailable" : "in stock", image: featuredCpu.imagePath, go: () => app.setState({ route: "product", productSlot: "cpu", productId: featuredCpu.id }) },
        { name: featuredCooler.name, why: featuredCooler.description, award: "Quietest estimate", awardFg: "var(--text-tertiary)", price: money(featuredCooler.price), picks: featuredCooler.availability === "out_of_stock" ? "unavailable" : "in stock", image: featuredCooler.imagePath, go: () => app.setState({ route: "product", productSlot: "cooler", productId: featuredCooler.id }) },
      ],
      posts: [
        { kind: "Guide", title: "How much graphics card do you actually need at 1440p?", dek: "We measured nine cards across three games and plotted the point where more money stops buying frames.", meta: "6 min read · 2d ago" },
        { kind: "Teardown", title: "What a quiet PC is really made of", dek: "Fan curves, case mesh, and the three parts that decide whether you hear your computer.", meta: "9 min read · 1w ago" },
        { kind: "Builder story", title: "A $1,200 build that still hits 144 fps", dek: "Where app builder saved money, and the one part they refused to compromise on.", meta: "4 min read · 2w ago" },
      ],
      deals: [
        { name: valueGpu.name, price: money(valueGpu.price), go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }) },
        { name: featuredStorage.name, price: money(featuredStorage.price), go: () => app.setState({ route: "product", productSlot: "storage", productId: featuredStorage.id }) },
        { name: featuredCooler.name, price: money(featuredCooler.price), go: () => app.setState({ route: "product", productSlot: "cooler", productId: featuredCooler.id }) },
      ],

      filtersOpen: filtersOn ? "true" : "false",
      catName: s.search ? "Search results" : s.brand === "any" ? CAT_META[cat].name : s.brand + " " + CAT_META[cat].name.toLowerCase(),
      catBlurb: s.search ? "Matches from all real products, models, and specifications." : CAT_META[cat].blurb,
      catIsGpu: cat === "gpu",
      compareShow: dept.id === "pc" ? "inline-flex" : "none",
      gpuFilterDisplay: cat === "gpu" ? "flex" : "none",
      fitFilterDisplay: fitFilters.length ? "flex" : "none",
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
      departmentCards: dept.cats.flatMap(cardCategory => CATALOG[cardCategory].map(g => {
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

      pImage: pick.imagePath,
      pName: pick.name,
      pSku: pick.id,
      pBrand: pick.brand || pick.name.split(" ")[0],
      pModel: pick.brand ? pick.name.replace(pick.brand + " ", "") : pick.name.split(" ").slice(1).join(" ") || pick.name,
      pIsGpu: pSlot === "gpu", pCatName: CAT_META[pSlot].name,
      pPrice: money(pick.price),
      pStock: pick.days <= 2 ? "In stock · ships tomorrow" : "Ships in " + pick.days + " days",
      pStockFg: pick.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
      pBlurb: pick.blurb || [pick.note || pick.meaning, CAT_META[pSlot].blurb].filter(Boolean).join(". ").replace("..", "."),
      pSpecs: (SPECS[pSlot] || (() => []))(pick),
      pFpsCards: pSlot === "gpu" ? [
        { res: "1080p", fps: Math.round(pick.fps! * 1.32) + " fps" },
        { res: "1440p", fps: pick.fps + " fps" },
        { res: "4K", fps: Math.round(pick.fps! * 0.6) + " fps" },
      ] : [],
      pFacts: pSlot === "gpu" ? [
        { k: "Best for", v: pick.good!.replace("Great for ", "") + " gaming" },
        { k: "Noise", v: app.noiseWord(pick.noise!) },
        { k: "Power needed", v: (Math.ceil((pick.watt! + 240) / 50) * 50) + " W supply" },
        { k: "Availability", v: pick.stock === 0 ? "Out of stock" : "In stock" },
      ] : [
        { k: "Category", v: CAT_META[pSlot].name },
        { k: "Key specification", v: ((SPECS[pSlot] || (() => []))(pick)[0] || "Catalog specification") },
        { k: "Delivery", v: pick.days <= 2 ? "1–2 days" : pick.days + " days" },
        { k: "Availability", v: pick.stock === 0 ? "Out of stock" : "In stock" },
      ],
      pFitBg: pFits ? "var(--success-soft)" : "var(--danger-soft)",
      pFitFg: pFits ? "var(--success)" : "var(--danger)",
      pFitIcon: pFits ? "check_circle" : "error",
      pFitText: !buildableProduct ? "Verified against the canonical Rigsmith product catalog."
        : pFits ? "Compatible with your current build based on the product specifications."
        : (candidateBuild?.issues || ["This product is not compatible with your current build."]).join(" "),
      pActionLabel: buildableProduct ? "Put app in my build" : "Add to cart",
      pAddToBuild: () => buildableProduct
        ? app.set(pSlot as PcSlot, pick.id)
        : app.setState({ inCart: true, toast: pick.name + " added to cart" }, () => app.flash()),

      buildSub: "9 parts chosen · " + (m.fits ? "everything fits" : "one thing does not fit"),
      addBuildLabel: s.inCart ? "In your cart" : "Add build to cart · " + money(m.price),
      addBuildToCart: () => { app.setState({ inCart: true, route: "cart", toast: "Build added to cart" }); app.flash(); },
      optimize: () => {
        const picks: any = { ...s.picks };
        if (m.fps < s.target) picks.gpu = CATALOG.gpu.slice().sort((a, b) => (b.fps ?? 0) - (a.fps ?? 0))[0].id;
        if (s.quiet) picks.cooler = CATALOG.cooler.slice().sort((a, b) => (a.noise ?? 99) - (b.noise ?? 99))[0].id;
        let after = app.metrics(picks);
        if (after.price > s.budget) { picks.storage = CATALOG.storage.slice().sort((a, b) => a.price - b.price)[0].id; after = app.metrics(picks); }
        app.setState({
          picks, prev: s.picks, toast: "Adjusted your build to hit your targets",
          lastChange: { icon: "auto_fix_high", title: "Adjusted parts to hit your targets", deltas: [
            { k: "Frame rate", v: (after.fps - m.fps >= 0 ? "+" : "") + (after.fps - m.fps) + " fps", fg: "var(--green-600)" },
            { k: "Price", v: (after.price - m.price >= 0 ? "+" : "-") + money(Math.abs(after.price - m.price)), fg: "var(--text-secondary)" },
            { k: "Noise", v: app.noiseWord(after.noise), fg: "var(--text-secondary)" },
          ] },
        });
        app.flash();
      },
      rows, games,
      fpsNum: app.digits(m.fps + " fps"),
      fpsLabelPlain: m.fps + " fps",
      priceNum: app.digits(money(m.price)),
      fpsFg: fpsOk ? "var(--green-600)" : "var(--amber-600)",
      fpsNote: fpsOk ? "Smooth at " + s.res + ", high settings" : (s.target - m.fps) + " fps short of your goal",
      noiseWord: app.noiseWord(m.noise),
      noiseFg: quietOk ? "var(--text-tertiary)" : "var(--amber-600)",
      noiseNote: quietOk ? "About as loud as a library" : "Louder than you asked for",
      shipLabel: app.shipDate(m.days),
      powerLabel: m.watt + " W estimated",
      budget: s.budget, budgetLabel: money(s.budget),
      setBudget: (e: any) => app.setState({ budget: +e.target.value }),
      spendPct: spend + "%", spendFg: over ? "var(--amber-600)" : "var(--green-600)",
      headroomLabel: over ? money(m.price - s.budget) + " over budget" : money(s.budget - m.price) + " left over",
      target: s.target, targetLabel: s.target + " fps",
      setTarget: (e: any) => app.setState({ target: +e.target.value }),
      resLabel: s.res,
      resOptions: Object.keys(RES).map(r => ({
        label: r, go: () => app.setState({ res: r as any }),
        bg: s.res === r ? "#fff" : "transparent",
        fg: s.res === r ? "var(--text-primary)" : "var(--text-secondary)",
        fw: s.res === r ? 500 : 400,
        sh: s.res === r ? "0 1px 3px rgba(41,41,41,.10)" : "none",
      })),
      toggleQuiet: () => app.setState({ quiet: !s.quiet }),
      quietBg: s.quiet ? "var(--gray-900)" : "var(--gray-300)", quietX: s.quiet ? "16px" : "2px",
      changeOpen: s.lastChange ? "true" : "false",
      changeIcon: s.lastChange ? s.lastChange.icon : "build",
      changeTitle: s.lastChange ? s.lastChange.title : "",
      changeDeltas: s.lastChange ? s.lastChange.deltas : [],
      undo: () => { app.setState({ picks: s.prev || s.picks, lastChange: null, toast: "Change undone" }); app.flash(); },
      keep: () => app.setState({ lastChange: null }),
      compatIcon: m.fits ? "check_circle" : "error",
      compatFg: m.fits ? "var(--success)" : "var(--danger)",
      compatText: m.fits ? "We checked fit, power, and cooling for all 9 parts. Nothing to worry about."
        : "Your graphics card is too long for app case. Pick a shorter card or a bigger case.",

      pickerLabel: (ORDER.find(o => o.slot === pslot) || ({} as any)).label || "part",
      pickerCols: ordered.map((o, i) => ({
        name: o.name, image: o.imagePath, tag: o.id === cur.id ? "In your build" : o.tag,
        tagFg: o.id === cur.id ? "var(--accent-active)" : "var(--text-tertiary)",
        bg: i === 0 ? "var(--blue-50)" : "#fff",
      })),
      pickerRows,
      pickerActions: ordered.map((o, i) => ({
        selected: o.id === cur.id, choosable: o.id !== cur.id,
        choose: () => app.set(pslot, o.id), bg: i === 0 ? "var(--blue-50)" : "#fff",
      })),

      isGuided: route === "guided",
      gSpentRaw: gSpent,
      gStepNo: Math.min(s.gStep, 8) + 1,
      gTitle: GSTEP[GUIDED[Math.min(s.gStep, 8)]].title,
      gHelp: GSTEP[GUIDED[Math.min(s.gStep, 8)]].help,
      gTrack: GUIDED.map((slot, i) => {
        const done = s.gDone.includes(slot), here = i === s.gStep;
        return {
          label: (ORDER.find(o => o.slot === slot) || ({} as any)).cat || slot,
          bar: here ? "var(--accent)" : done ? "var(--gray-900)" : "var(--gray-200)",
          fg: here ? "var(--accent-active)" : done ? "var(--text-primary)" : "var(--text-tertiary)",
          fw: here || done ? 500 : 400,
        };
      }),
      gSlots: GUIDED.map((slot, i) => {
        const o = ORDER.find(x => x.slot === slot)!, p = app.part(slot);
        const done = s.gDone.includes(slot), here = i === s.gStep;
        return {
          cat: o.cat, icon: o.icon,
          name: done ? p.name : here ? "choosing" : "suggested: " + p.name,
          bd: done ? "var(--gray-900)" : here ? "var(--accent)" : "var(--border-default)",
          bs: done ? "solid" : "dashed",
          bg: done ? "var(--gray-50)" : here ? "var(--blue-50)" : "#fff",
          fg: done ? "var(--text-primary)" : here ? "var(--accent-active)" : "var(--text-tertiary)",
          fw: done || here ? 500 : 400,
          go: () => app.setState({ gStep: i }),
        };
      }),
      gOptions: CATALOG[GUIDED[Math.min(s.gStep, 8)]].map(o => {
        const slot = GUIDED[Math.min(s.gStep, 8)];
        const after = app.metrics({ ...s.picks, [slot]: o.id });
        const chosen = s.picks[slot] === o.id;
        let note = o.note || o.meaning || "", noteFg = "var(--text-secondary)";
        if (slot === "gpu") { note = after.fps + " fps in your games"; noteFg = after.fps >= s.target ? "var(--green-600)" : "var(--amber-600)"; }
        if (!after.fits) { note = "Does not fit your build"; noteFg = "var(--red-600)"; }
        return {
          name: o.name, image: o.imagePath, price: money(o.price), note, noteFg,
          tag: chosen ? "Installed" : o.tag,
          tagFg: chosen ? "var(--accent-active)" : o.tag === "Balanced pick" ? "var(--green-600)" : "var(--text-tertiary)",
          bd: chosen ? "var(--accent)" : "var(--border-subtle)",
          bg: chosen ? "var(--blue-50)" : "#fff",
          pick: () => app.gPick(slot, o.id),
        };
      }),
      gSpent: money(gSpent),
      gLeftLabel: money(Math.max(0, s.budget - gSpent)) + " of " + money(s.budget) + " left",
      gBack: () => app.setState({ gStep: Math.max(0, s.gStep - 1) }),
      gSkip: () => app.gAdvance(GUIDED[Math.min(s.gStep, 8)]),
      gExit: () => app.go(s.gDone.length === 9 ? "builder" : "category"),
      startGuided: () => app.setState({ route: "guided", gStep: 0, gDone: [] }),

      cornerOpen: route !== "guided" ? "true" : "false",
      cornerTransform: "translate(" + app.dockPoint().x + "px," + app.dockPoint().y + "px)",
      cornerExpanded: !s.cornerMin, cornerCollapsed: s.cornerMin,
      cornerToggle: () => app.setState({ cornerMin: !s.cornerMin }),
      cornerDrag: app.cornerDrag,
      cornerTitle: s.gDone.length > 0 && s.gDone.length < 9 ? "Guided build" : "Your build",
      cornerCount: s.gDone.length > 0 && s.gDone.length < 9 ? s.gDone.length + " / 9" : "9 / 9",
      cornerRows: GUIDED.slice(0, 3).map(slot => {
        const inProgress = s.gDone.length > 0 && s.gDone.length < 9;
        const done = !inProgress || s.gDone.includes(slot);
        const p = app.part(slot), o = ORDER.find(x => x.slot === slot)!;
        return {
          name: done ? p.name : o.cat, icon: done ? "check" : "radio_button_checked",
          ic: done ? "var(--success)" : "var(--accent)",
          fg: done ? "var(--text-primary)" : "var(--accent-active)",
          price: done ? money(p.price) : "next",
        };
      }),
      cornerRest: s.gDone.length > 0 && s.gDone.length < 9
        ? GUIDED.slice(3).map(x => (ORDER.find(o => o.slot === x) || ({} as any)).cat).join(", ")
        : "Plus cooler, power supply, case and fans — " + m.fps + " fps, " + app.noiseWord(m.noise).toLowerCase(),
      cornerSpent: s.gDone.length > 0 && s.gDone.length < 9 ? money(gSpent) + " spent so far" : money(m.price) + " total",
      cornerLeft: s.gDone.length > 0 && s.gDone.length < 9
        ? money(Math.max(0, s.budget - gSpent)) + " of " + money(s.budget) + " left"
        : (m.price > s.budget ? money(m.price - s.budget) + " over budget" : money(s.budget - m.price) + " left of " + money(s.budget)),
      cornerCta: s.gDone.length > 0 && s.gDone.length < 9 ? "Resume" : "Open",
      cornerResume: () => app.go(s.gDone.length > 0 && s.gDone.length < 9 ? "guided" : "builder"),

      cartEmpty: !s.inCart, cartFilled: s.inCart,
      buildImage: m.gpu.imagePath,
      cartSub: s.inCart ? "One build · 9 parts" : "Empty",
      cartParts: [m.cpu.name, m.gpu.name, m.ram.name, m.storage.name].join(" · ") + " · 5 more",
      totalLabel: money(m.price),
      stockLine: (9 - (m.days > 2 ? 1 : 0)) + " parts in stock now",
      backorderLine: m.days > 2 ? "One part arrives in " + m.days + " days" : "All parts ready to ship",
      clearCart: () => app.setState({ inCart: false }),

      steps: ["1 Delivery", "2 Payment", "3 Review"].map((l, i) => ({
        label: l,
        fg: i === s.step ? "var(--text-primary)" : "var(--text-tertiary)",
        fw: i === s.step ? 500 : 400,
        bg: i === s.step ? "#fff" : "transparent",
        sh: i === s.step ? "0 1px 3px rgba(41,41,41,.10)" : "none",
      })),
      stepTitle: st.title, stepCta: st.cta, stepFields: st.fields,
      stepNext: () => s.step < 2 ? app.setState({ step: s.step + 1 }) : app.setState({ route: "done" }),
      stepBack: () => s.step > 0 ? app.setState({ step: s.step - 1 }) : app.go("cart"),
      restart: () => app.setState({ route: "builder", inCart: false, step: 0, lastChange: null }),
    };
  }

