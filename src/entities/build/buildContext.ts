import type { RigsmithApp } from "../../app/App";
import type { Vals } from "../../shared/lib/types";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS } from "../../data/catalog/catalog";
import { compatibilityIssues, money } from "./metrics";
import type { Part, PcSlot, Picks, Slot } from "../../shared/lib/types";
import { FACETS, FIT_FACET_IDS } from "../../features/catalog/catalogFacets";
import {
  allProducts as allCatalogProducts, applyProductFilters, brandOf, brandLogo,
  candidatePool, facetSummary, facetValues, priceBounds, sortProducts,
} from "../product/queries";
import type { ProductQuery, SortId } from "../product/queries";

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

    // Catalog reads go through the pure query module so the WebMCP tools and
    // this view-model cannot drift apart. src/entities/product/queries.ts
    const query: ProductQuery = {
      category: s.category,
      departmentId: s.openDept,
      search: s.search,
      brand: s.brand,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      stockOnly: s.stockOnly,
      onSale: s.onSale,
      useFilter: s.useFilter,
      facets: s.facetFilters,
      maxDays: s.fastShip ? 2 : undefined,
      fitsWith: s.fitOnly ? app.chosenPicks() : null,
      sort: s.sort as SortId,
    };
    const UNUSED_wantRes = s.useFilter.split(" ")[0];
    const allProducts = allCatalogProducts();
    const searchText = s.search.trim().toLowerCase();
    const cat = s.category;
    const catList = candidatePool(query);
    const bounds = priceBounds(catList);
    const UNUSED_facetDefinitions = FACETS[cat] || [];
    const specFilters = facetSummary(query, catList).map(facet => ({
      id: facet.id,
      label: facet.label,
      fit: facet.fit,
      detail: facet.options.length + " options",
      options: facet.options.map(option => ({
        label: option.value,
        count: String(option.count),
        mark: option.selected ? "check" : "",
        bg: option.selected ? "var(--gray-900)" : "var(--gray-0)",
        bd: option.selected ? "var(--gray-900)" : "var(--border-default)",
        go: () => app.toggleFacet(facet.id, option.value),
      })),
    }));
    const UNUSED_fitFacetIds = FIT_FACET_IDS[cat] ?? [];
    const fitFilters = specFilters.filter(facet => facet.fit);
    const UNUSED_technicalFilters = specFilters.filter(facet => !facet.fit);
    const visible = sortProducts(applyProductFilters(catList, query), query.sort);
    const hidden = catList.length - visible.length;

    const pSlot = s.productSlot || "gpu";
    const pick = (CATALOG[pSlot] || CATALOG.gpu).find(g => g.id === s.productId) || CATALOG[pSlot][0];
    const buildableProduct = ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"].includes(pSlot);
    /**
     * There is a build only once the shopper has chosen a part for themselves.
     * `picks` always holds a part in every slot so build metrics stay defined,
     * but those defaults are not a machine anyone asked for: judging a product
     * against them told a shopper with an empty configurator that a 550 W
     * supply was short of the 888 W "this build" needed.
     *
     * So the verdict weighs the chosen parts only, the way the "Fits my N-part
     * build" filter already does, and the shop says nothing at all until there
     * is something to say.
     */
    const chosenPicks = app.chosenPicks();
    const chosenCount = s.chosen.length;
    const hasBuild = chosenCount > 0;
    const candidateIssues = buildableProduct && hasBuild
      ? compatibilityIssues({ ...chosenPicks, [pSlot as PcSlot]: pick.id })
      : [];
    const pFits = candidateIssues.length === 0;

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

    return { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, allProducts, searchText, cat, catList, brandOf, brandLogo, facetValues, specFilters, fitFilters, visible, hidden, bounds, query, pSlot, pick, buildableProduct, chosenPicks, chosenCount, hasBuild, candidateIssues, pFits, stepDefs, st, filtersOn, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandRibbon, homeDepartments, homeCategories };
}

export type BuildContext = ReturnType<typeof createBuildContext>;
