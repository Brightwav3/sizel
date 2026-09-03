import React from "react";
// ADR 0005: application composition lives in src/app.
// docs/decisions/0005-feature-first-source-layout.md
import "../shared/styles/styles.css";
import "../shared/styles/tooltip.css";
import { buildVals } from "../entities/build/buildVals";
import { RigsmithView } from "./RigsmithView";
import type { AppState, BuildDecision } from "./state/AppState";
import { stateFromLocation, urlForState } from "./routes";
import { stopWebmcpTools, syncWebmcpTools, takeUserControl } from "./webmcp";
import { CAT_META, DEFAULT_PICKS, DEPTS, partIn } from "../data/catalog/catalog";
import { findProduct, productTitle } from "../entities/product/queries";
import { compatibilityIssues, metrics, noiseWord, shipDate } from "../entities/build/metrics";
import type { CartLine, PcSlot, Picks, Route, Slot, Watchdog } from "../shared/lib/types";

import { BUILD_SLOTS, buildDraftBlocker, bundledFans, buildBlocker, requireQuantity, selectedPicks, selectedPrice, ShopError } from "../entities/build/selection";
import { cartBlocker } from "../entities/cart/cartValidation";
import { listingStock } from "../data/catalog/listingStock";
import { budgetPlan, validateBudgetShares } from "../entities/build/budgetPlan";
import { CHECKOUT_STEPS } from "../entities/checkout/checkoutSteps";

type Mutation = { patch?: Partial<AppState>; result?: Record<string, any> };
type BatchComponentSlot = Exclude<PcSlot, "fans">;
const BATCH_COMPONENT_SLOTS = BUILD_SLOTS.filter((slot): slot is BatchComponentSlot => slot !== "fans");

/**
 * The whole shop. State, the metrics model, and the derived value bag are the
 * prototype's logic class; every screen below renders it.
 */
// ADR 0002: this controller owns the active build for UI and future tool bindings.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
export class RigsmithApp extends React.Component<{}, AppState> {
  /**
   * The mounted controller, for code that lives outside the React tree —
   * WebMCP tool handlers above all. A class instance is the right holder here:
   * `this` never goes stale the way a hook closure does, so a tool registered
   * once at mount always reads and writes the current build.
   */
  static instance: RigsmithApp | null = null;

  state: AppState = {
    route: "home", productId: DEFAULT_PICKS.gpu, productColorId: null, category: "gpu", productSlot: "gpu", brandCategory: "all",
    catalogOpen: false, dept: "pc", openDept: null, isLoading: true,
    picks: { ...DEFAULT_PICKS },
    chosen: [],
    cornerMin: true, cornerX: null, cornerY: null,
    budget: 1800, budgetShares: {}, target: 144, res: "1440p", quiet: true,
    fitOnly: false, fastShip: false, minPrice: 0, maxPrice: 2200, useFilter: "any", brand: "any", facetFilters: {}, sort: "popular", stockOnly: false, onSale: false, search: "", recentSearches: ["quiet graphics card", "1 TB NVMe", "phone under $700"],
    buildBrief: "", buildRevision: 0, decisions: {}, inspected: null,
    lastChange: null, prev: null, cart: [], watchdogs: [], step: 0, checkoutValues: {}, checkoutErrors: {}, demoOrderId: null, toast: null, saved: 2,
    ...stateFromLocation(),
  };

  private t?: number;
  private bootTimer?: number;
  private urlReady = false;
  private syncingFromUrl = false;
  private onResize = () => this.forceUpdate();
  private pauseAgentForShopper = () => {
    if (!takeUserControl()) return;
    this.setState({ toast: "You took control — agent actions are paused." }, () => this.flash());
  };
  private onShopperInteraction = (event: MouseEvent | KeyboardEvent) => {
    if (!event.isTrusted) return;
    const target = event.target as Element | null;
    if (!target?.closest("button, a, input, select, textarea, [role='button']")) return;
    this.pauseAgentForShopper();
  };
  private onPopState = () => {
    this.pauseAgentForShopper();
    const next = stateFromLocation();
    this.syncingFromUrl = true;
    this.setState(next as any);
  };

  componentDidMount() {
    RigsmithApp.instance = this;
    // WebMCP tools bind to the mounted controller, so the stable demo set
    // registers once here and remains available while the shopper navigates.
    // The local `?noWebMcp=1` mode is an honest UI-only baseline for demos and
    // timing comparisons; it skips registration instead of trusting a prompt
    // to make an agent ignore tools that are still exposed by the page.
    const webmcpDisabled = new URLSearchParams(window.location.search).get("noWebMcp") === "1";
    if (!webmcpDisabled) syncWebmcpTools();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("popstate", this.onPopState);
    document.addEventListener("click", this.onShopperInteraction);
    document.addEventListener("keydown", this.onShopperInteraction);
    this.urlReady = true;
    this.syncDocumentMetadata();
    this.bootTimer = window.setTimeout(() => this.setState({ isLoading: false }), 180);
  }
  componentWillUnmount() {
    if (RigsmithApp.instance === this) RigsmithApp.instance = null;
    stopWebmcpTools();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("popstate", this.onPopState);
    document.removeEventListener("click", this.onShopperInteraction);
    document.removeEventListener("keydown", this.onShopperInteraction);
    clearTimeout(this.t);
    clearTimeout(this.bootTimer);
  }

  componentDidUpdate(_prevProps: {}, prevState: AppState) {
    if (!this.urlReady) return;
    if (prevState.route !== this.state.route || prevState.productId !== this.state.productId || prevState.category !== this.state.category || prevState.brand !== this.state.brand) {
      this.syncDocumentMetadata();
    }
    if (this.syncingFromUrl) {
      this.syncingFromUrl = false;
      return;
    }
    const pageChanged = prevState.route !== this.state.route
      || prevState.category !== this.state.category
      || prevState.productId !== this.state.productId
      || prevState.productColorId !== this.state.productColorId
      || prevState.dept !== this.state.dept
      || prevState.openDept !== this.state.openDept
      || prevState.brandCategory !== this.state.brandCategory;
    const navigationChanged = pageChanged || prevState.brand !== this.state.brand;
    if (navigationChanged) {
      const nextUrl = urlForState(this.state);
      if (nextUrl !== window.location.pathname) window.history.pushState({}, "", nextUrl);
    }
    /**
     * A new page starts at its top. Without this the shopper keeps the scroll
     * position of the page they left, so opening a product from halfway down a
     * listing drops them into the middle of the product page.
     *
     * Narrowing the brand is a refinement of the page you are on, not a new
     * page, so the grid stays where it was. Back and forward return early
     * above, which leaves the browser's own scroll restoration alone.
     */
    if (pageChanged) window.scrollTo(0, 0);
  }

  private syncDocumentMetadata() {
    const { route, category, dept, brand, productId } = this.state;
    const department = DEPTS.find(item => item.id === dept)?.name ?? "Shop";
    const categoryName = CAT_META[category]?.name ?? department;
    const found = route === "product" ? findProduct(productId) : null;
    const productName = found ? productTitle(found.product, found.category) : "";
    const title = route === "home" ? "Sizel | Electronics, Phones & PC Parts"
      : route === "not-found" ? "Page not found | Sizel"
      : route === "product" ? `${productName} | Sizel`
      : route === "brand" ? `${brand} | Sizel`
      : route === "category" ? `${brand !== "any" ? `${brand} ` : ""}${categoryName} | Sizel`
      : route === "builder" ? "PC Builder | Sizel"
      : route === "cart" ? "Your cart | Sizel"
      : route === "checkout" ? "Checkout preview | Sizel"
      : route === "done" ? "Demo order confirmed | Sizel"
      : "Sizel";
    const description = route === "product" && productName
      ? `See the price, availability, specifications and compatibility details for ${productName}.`
      : route === "not-found"
        ? "The page you are looking for is not available in the Sizel demo shop."
        : route === "builder"
          ? "Build a compatible gaming PC with clear budgets, compatibility checks and transparent trade-offs."
          : "Explore phones, gaming consoles and PC components at Sizel. Compare products, find your next device or build a custom PC.";
    const image = new URL("/branding/SizelThumb.png", window.location.origin).href;
    document.title = title;
    this.setMeta("description", description);
    this.setMeta("og:title", title, "property");
    this.setMeta("og:description", description, "property");
    this.setMeta("og:image", image, "property");
    this.setMeta("twitter:title", title);
    this.setMeta("twitter:description", description);
    this.setMeta("twitter:image", image);
    this.setMeta("og:url", window.location.href, "property");
  }

  private setMeta(key: string, content: string, attr: "name" | "property" = "name") {
    let meta = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attr, key);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  dockPoint() {
    const w = window.innerWidth || 1280, h = window.innerHeight || 800;
    const box = this.state.cornerMin ? { w: 168, h: 44 } : { w: 296, h: 440 };
    const x = this.state.cornerX === null ? w - box.w - 24 : this.state.cornerX;
    const y = this.state.cornerY === null ? h - box.h - 24 : this.state.cornerY;
    return {
      x: Math.max(8, Math.min(w - box.w - 8, x)),
      y: Math.max(64, Math.min(h - box.h - 8, y)),
    };
  }

  part(slot: PcSlot, picks?: Picks) {
    return partIn(slot, (picks || this.state.picks)[slot])!;
  }

  /** Delegates to the one model in data/metrics.ts. ADR 0002. */
  metrics(picks?: Picks) {
    return metrics(picks || this.state.picks, this.state.res);
  }

  // Commands resolve only after React commits; every queued command sees the
  // latest state. Both UI handlers and WebMCP use this path.
  private mutations: Promise<unknown> = Promise.resolve();
  private mutate(reduce: (state: AppState) => Mutation): Promise<Record<string, any>> {
    const run = this.mutations.then(() => new Promise<Record<string, any>>(resolve => {
      let result: Record<string, any> = {};
      this.setState(state => {
        try {
          const mutation = reduce(state);
          result = mutation.result ?? {};
          return (mutation.patch ?? {}) as AppState;
        } catch (error) {
          result = error instanceof ShopError ? { error: error.code, hint: error.message } : { error: 'command_failed', hint: 'Could not complete the change.' };
          return { toast: result.hint } as AppState;
        }
      }, () => { this.flash(); resolve(result); });
    }));
    this.mutations = run.catch(() => {});
    return run;
  }

  addToCart(slot: Slot, id: string, qty = 1) {
    return this.mutate(state => {
      requireQuantity(qty);
      if (!qty) throw new ShopError('invalid_quantity', 'Choose at least one item.');
      const product = partIn(slot, id);
      if (!product) throw new ShopError('product_not_found', 'Choose a catalog product.');
      const at = state.cart.findIndex(line => line.kind === 'product' && line.id === id);
      const cart: CartLine[] = at >= 0
        ? state.cart.map((line, i) => i === at ? { ...line, qty: line.qty + qty } : line)
        : [...state.cart, { kind: 'product', id, slot, qty }];
      const blocked = cartBlocker(cart, state.picks, state.chosen, state.budget);
      if (blocked) throw blocked;
      return { patch: { cart, toast: `${product.name} added to cart` },
        result: { added: id, quantity: qty, cartLines: cart.length } };
    });
  }

  addBuildToCart() {
    return this.mutate(state => {
      const blocked = buildDraftBlocker(state.picks, state.chosen, state.budget);
      if (blocked) throw blocked;
      const alreadyAdded = state.cart.some(line => line.kind === 'build');
      const cart: CartLine[] = alreadyAdded ? state.cart : [...state.cart, { kind: 'build', id: 'build', qty: 1 }];
      const cartIssue = cartBlocker(cart, state.picks, state.chosen, state.budget);
      if (cartIssue) throw cartIssue;
      return { patch: { cart, route: 'cart', toast: 'Build added to cart' },
        result: { added: 'build', alreadyAdded, price: selectedPrice(state.picks, state.chosen) } };
    });
  }

  setCartQty(index: number, qty: number) {
    return this.mutate(state => {
      requireQuantity(qty);
      const line = state.cart[index];
      if (!Number.isInteger(index) || !line) throw new ShopError('no_such_line', 'Read the cart again.');
      if (line.kind === 'build' && qty > 0 && qty !== 1) throw new ShopError('build_quantity_fixed', 'Build quantity is fixed at one.');
      const cart = qty === 0 ? state.cart.filter((_, i) => i !== index) : state.cart.map((row, i) => i === index ? { ...row, qty } : row);
      // Reductions must remain possible even if another line has become invalid.
      if (qty > line.qty) {
        const blocked = cartBlocker(cart, state.picks, state.chosen, state.budget);
        if (blocked) throw blocked;
      }
      return { patch: { cart }, result: { line: index, quantity: qty, removed: qty === 0 } };
    });
  }

  removeCartLine(index: number) { return this.setCartQty(index, 0); }

  startCheckout() {
    return this.mutate(state => {
      if (state.cart.some(line => line.kind === 'build')) {
        const buildIssue = buildBlocker(state.picks, state.chosen, state.budget);
        if (buildIssue) throw buildIssue;
      }
      const blocked = cartBlocker(state.cart, state.picks, state.chosen, state.budget);
      if (blocked) throw blocked;
      return { patch: { route: 'checkout', step: 0, checkoutValues: {}, checkoutErrors: {}, demoOrderId: null }, result: { opened: 'checkout', step: 'delivery', demo: true } };
    });
  }

  setCheckoutField(id: string, value: string) {
    this.setState(state => {
      const checkoutErrors = { ...state.checkoutErrors };
      delete checkoutErrors[id];
      return { checkoutValues: { ...state.checkoutValues, [id]: value }, checkoutErrors };
    });
  }

  private checkoutErrorsForStep(step: number) {
    const values = this.state.checkoutValues;
    const errors: Record<string, string> = {};
    if (step === 0) {
      if ((values.fullName ?? "").trim().length < 2) errors.fullName = "Enter your full name.";
      if ((values.phone ?? "").replace(/\D/g, "").length < 7) errors.phone = "Enter a valid phone number.";
      if ((values.streetAddress ?? "").trim().length < 3) errors.streetAddress = "Enter your street address.";
      if ((values.city ?? "").trim().length < 2) errors.city = "Enter your city.";
      if (!/^[a-z0-9][a-z0-9\s-]{2,9}$/i.test((values.postcode ?? "").trim())) errors.postcode = "Enter a valid postcode.";
    }
    if (step === 1) {
      if ((values.cardNumber ?? "").replace(/\D/g, "").length < 12) errors.cardNumber = "Enter a valid demo card number.";
      if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test((values.expiry ?? "").trim())) errors.expiry = "Use MM / YY format.";
      if (!/^\d{3,4}$/.test((values.securityCode ?? "").trim())) errors.securityCode = "Enter a 3 or 4 digit code.";
    }
    return errors;
  }

  nextCheckoutStep = () => {
    const errors = this.checkoutErrorsForStep(this.state.step);
    if (Object.keys(errors).length) {
      this.setState(state => ({ checkoutErrors: { ...state.checkoutErrors, ...errors }, toast: "Check the highlighted fields." }), () => this.flash());
      return;
    }
    if (this.state.step < CHECKOUT_STEPS.length - 1) {
      this.setState({ step: this.state.step + 1, checkoutErrors: {} });
      return;
    }
    const orderId = `SZ-DEMO-${String(Date.now()).slice(-6)}`;
    this.setState({ route: "done", demoOrderId: orderId, checkoutErrors: {}, toast: null });
  };

  // Watchdogs -----------------------------------------------------------
  /** Start or stop watching a product. Everything stays on this device. */
  toggleWatchdog(slot: Slot, id: string, kind: Watchdog["kind"] = "availability") {
    const at = this.state.watchdogs.findIndex(watch => watch.productId === id && watch.kind === kind);
    if (at >= 0) {
      this.setState({ watchdogs: this.state.watchdogs.filter((_, index) => index !== at), toast: "Watch removed" }, () => this.flash());
      return;
    }
    const part = partIn(slot, id);
    const watch: Watchdog = { productId: id, slot, kind, priceAtWatch: part?.price ?? 0 };
    this.setState({
      watchdogs: [...this.state.watchdogs, watch],
      toast: "Demo watch saved for this session only — no notifications are sent.",
    }, () => this.flash());
  }

  isWatched(id: string, kind: Watchdog["kind"] = "availability") {
    return this.state.watchdogs.some(watch => watch.productId === id && watch.kind === kind);
  }

  shipDate(days: number) { return shipDate(days); }
  noiseWord(n: number) { return noiseWord(n); }

  /** transitions.dev number pop-in: each character enters, last two stagger. */
  digits(str: string, size?: number, color?: string) {
    const chars = String(str).split("");
    return React.createElement("span", {
      className: "t-digit-group", key: str,
      style: { fontSize: size || 24, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: color || "inherit" },
    }, chars.map((ch, i) => React.createElement("span", {
      className: "t-digit", key: i,
      "data-stagger": i === chars.length - 2 ? "1" : i === chars.length - 1 ? "2" : null,
    }, ch === " " ? "\u00a0" : ch)));
  }

  flash() { clearTimeout(this.t); this.t = window.setTimeout(() => this.setState({ toast: null }), 2400); }
  go = (r: Route) => this.setState({ route: r, toast: null, catalogOpen: r === "category" || r === "product" ? this.state.catalogOpen : false });

  toggleFacet(id: string, value: string) {
    const selected = this.state.facetFilters[id] || [];
    const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
    this.setState({ facetFilters: { ...this.state.facetFilters, [id]: next } });
  }

  /** Slots the shopper has explicitly chosen, as a partial build. */
  chosenPicks(): Partial<Picks> {
    return Object.fromEntries(this.state.chosen.map(slot => [slot, this.state.picks[slot]])) as Partial<Picks>;
  }

  private snapshot(state: AppState) {
    return { picks: state.picks, chosen: state.chosen, decisions: state.decisions };
  }

  /** Atomic for UI and agents: a case and its included fans are one choice. */
  // ADR 0015: build edits preserve the shopper's current page.
  // docs/decisions/0015-build-edits-preserve-storefront-route.md
  set(slot: PcSlot, id: string, decision?: BuildDecision, destination: "category" | "preserve" = "preserve") {
    return this.mutate(state => {
      const item = partIn(slot, id);
      if (!BUILD_SLOTS.includes(slot) || !item) throw new ShopError('wrong_slot', 'Choose a product from this slot.');
      if (listingStock(item, slot) === 0) throw new ShopError('out_of_stock', 'Choose an available part.');
      if (decision) {
        const inspected = state.inspected;
        if (typeof decision.reason !== 'string' || typeof decision.tradeoff !== 'string' || decision.reason.length > 600 || decision.tradeoff.length > 400)
          throw new ShopError('invalid_reason', 'Optional reason and tradeoff must be short strings.');
        if (decision.alternativeId !== undefined && (decision.alternativeId === id || !partIn(slot, decision.alternativeId)))
          throw new ShopError('invalid_alternative', 'Use a different catalog product from this slot.');
        // Inspection is optional evidence, never an authorization token. All
        // safety checks below use the current state at the actual commit.
        decision = { ...decision, comparedIds: inspected?.slot === slot && inspected.revision === state.buildRevision && inspected.ids.includes(id) ? [...inspected.ids] : [] };
      }
      const picks = { ...state.picks, [slot]: id, ...(slot === 'case' ? { fans: bundledFans(id) } : {}) };
      const chosen = [...new Set([...state.chosen, slot, ...(slot === 'case' ? ['fans' as const] : [])])];
      if (slot === 'fans' && state.chosen.includes('case') && id !== bundledFans(state.picks.case))
        throw new ShopError('wrong_fan_pack', 'These fans are bundled with another case. Select the case instead.');
      const issues = compatibilityIssues(selectedPicks(picks, chosen));
      const price = selectedPrice(picks, chosen);
      if (price > state.budget) throw new ShopError('over_budget', 'Selected parts exceed the agreed budget. Change a part or explicitly update the budget.');
      const decisions = { ...state.decisions };
      delete decisions[slot];
      if (decision) decisions[slot] = decision;
      if (slot === 'case') delete decisions.fans;
      const destinationState = destination === "category"
        ? { route: "category" as const, dept: "pc", openDept: null, category: slot, productSlot: slot, brand: "any", search: "" }
        : {};
      return { patch: { picks, chosen, decisions, prev: this.snapshot(state), inspected: null,
        buildRevision: state.buildRevision + 1, lastChange: null,
        ...(chosen.length === BUILD_SLOTS.length ? { cornerMin: true } : {}),
        ...destinationState,
        toast: `${item.name} selected` },
        result: { slot, fitted: item.name, selectedPrice: price, budgetRemainingUSD: state.budget - price,
          selectedCount: chosen.length, complete: BUILD_SLOTS.every(s => chosen.includes(s)), compatible: issues.length === 0,
          ...(issues.length ? { issues: issues.slice(0, 2) } : {}),
          ...(slot === 'case' ? { bundledFans: picks.fans } : {}) } };
    });
  }

  // ADR 0014: the judge-facing demo can apply the agent's complete selection atomically.
  // docs/decisions/0014-batch-build-commit.md
  setComponents(components: unknown) {
    return this.mutate(state => {
      if (!components || typeof components !== "object" || Array.isArray(components))
        throw new ShopError('invalid_components', 'Provide one catalog id for every PC slot except fans.');
      const supplied = components as Record<string, unknown>;
      const keys = Object.keys(supplied);
      if (keys.length !== BATCH_COMPONENT_SLOTS.length || keys.some(slot => !BATCH_COMPONENT_SLOTS.includes(slot as BatchComponentSlot)))
        throw new ShopError('invalid_components', 'Provide exactly one id for cpu, gpu, board, ram, storage, cooler, psu and case. Fans are bundled with the case.');

      const picks = { ...state.picks };
      for (const slot of BATCH_COMPONENT_SLOTS) {
        const id = supplied[slot];
        if (typeof id !== 'string' || !partIn(slot, id))
          throw new ShopError('wrong_slot', `Choose a catalog product from the ${slot} slot.`);
        picks[slot] = id;
      }
      picks.fans = bundledFans(picks.case);
      const chosen: PcSlot[] = [...BUILD_SLOTS];
      const blocked = buildBlocker(picks, chosen, state.budget);
      if (blocked) throw blocked;
      const model = metrics(picks, state.res);
      const rows = BATCH_COMPONENT_SLOTS.map(slot => {
        const item = partIn(slot, picks[slot])!;
        return { slot, id: item.id, name: item.name, price: item.price };
      });
      return {
        patch: {
          picks, chosen, decisions: {}, inspected: null,
          prev: this.snapshot(state), buildRevision: state.buildRevision + 1,
          lastChange: null, cornerMin: true,
          toast: 'PC build applied',
        },
        result: {
          applied: true, components: rows, bundledFans: picks.fans,
          selectedCount: chosen.length, complete: true, compatible: model.fits,
          validationComplete: true,
          inStock: true, price: model.price,
          budgetRemainingUSD: state.budget - model.price, shipsInDays: model.days,
        },
      };
    });
  }

  resetSlot(slot: PcSlot) {
    return this.mutate(state => {
      if (!BUILD_SLOTS.includes(slot)) throw new ShopError('wrong_slot', 'Choose a build slot.');
      const remove = slot === 'case' ? ['case', 'fans'] : [slot];
      const decisions = { ...state.decisions };
      for (const key of remove) delete decisions[key as PcSlot];
      return { patch: { picks: { ...state.picks, [slot]: DEFAULT_PICKS[slot], ...(slot === 'case' ? { fans: DEFAULT_PICKS.fans } : {}) },
        chosen: state.chosen.filter(key => !remove.includes(key)), decisions,
        prev: this.snapshot(state), inspected: null, buildRevision: state.buildRevision + 1, lastChange: null },
        result: { slot, action: 'reset' } };
    });
  }

  undoBuild() {
    return this.mutate(state => {
      if (!state.prev) throw new ShopError('nothing_to_undo', 'No build change to undo.');
      return { patch: { ...state.prev, prev: null, inspected: null, buildRevision: state.buildRevision + 1, lastChange: null }, result: { restored: true } };
    });
  }

  setTargets(patch: Partial<Pick<AppState, 'budget' | 'res' | 'target' | 'quiet'>>) {
    return this.mutate(state => {
      if (patch.budget !== undefined && (!Number.isFinite(patch.budget) || patch.budget <= 0)) throw new ShopError('invalid_budget', 'Budget must be a positive number.');
      if (patch.target !== undefined && (!Number.isFinite(patch.target) || patch.target <= 0)) throw new ShopError('invalid_target', 'FPS target must be positive.');
      return { patch: { ...patch, inspected: null, buildRevision: state.buildRevision + 1 }, result: { updated: true, ...patch } };
    });
  }

  // ADR 0013: begin_build opens the build panel in place; the agent owns component order and selection.
  // docs/decisions/0013-agent-chooses-build-order.md
  beginBuild(brief: string, budget: number, res: AppState['res'], reset = false, requestedShares?: unknown) {
    return this.mutate(state => {
      if (typeof brief !== 'string' || brief.trim().length < 5 || brief.length > 500) throw new ShopError('invalid_brief', 'Summarise the shopper request in 5–500 characters.');
      if (!Number.isFinite(budget) || budget <= 0) throw new ShopError('invalid_budget', 'Budget must be positive.');
      const checked = validateBudgetShares(requestedShares);
      if (!checked.valid) throw new ShopError('invalid_budget_allocation', checked.message);
      const plan = budgetPlan(budget, res, checked.shares);
      const patch: Partial<AppState> = { buildBrief: brief.trim(), budget, res, inspected: null, cornerMin: false,
        budgetShares: checked.shares,
        buildRevision: state.buildRevision + 1,
        ...(reset ? { picks: { ...DEFAULT_PICKS }, chosen: [], decisions: {}, prev: this.snapshot(state) } : {}) };
      return { patch: { buildBrief: brief.trim(), budget, res, inspected: null,
        ...patch },
        result: { opened: 'build_panel', budget, resolution: res, reset,
          budgetAllocation: { source: plan.source, slots: plan.rows },
        } };
    });
  }

  inspectBuildOptions(slot: PcSlot, ids: string[]) {
    return this.mutate(state => {
      if (!BUILD_SLOTS.includes(slot) || !Array.isArray(ids) || ids.length < 1 || ids.length > 4 || new Set(ids).size !== ids.length)
        throw new ShopError('invalid_candidates', 'Inspect one to four distinct products in one build slot.');
      if (ids.some(id => !partIn(slot, id))) throw new ShopError('wrong_slot', 'All candidates must belong to the requested slot.');
      return { patch: { buildBrief: state.buildBrief || 'Compare parts for the current build', inspected: { slot, ids: [...ids], revision: state.buildRevision } }, result: { inspected: ids } };
    });
  }

  showInCatalog(patch: Partial<Pick<AppState,
    'route' | 'category' | 'productSlot' | 'dept' | 'search' | 'brand' | 'facetFilters' |
    'minPrice' | 'maxPrice' | 'sort' | 'stockOnly' | 'onSale' | 'productId' |
    'productColorId'>>) {
    return this.mutate(() => ({ patch: { catalogOpen: false, ...patch }, result: { shown: patch.route } }));
  }

  static readonly BUILD_STEPS: PcSlot[] = ['cpu', 'board', 'ram', 'gpu', 'storage', 'cooler', 'psu', 'case', 'fans'];

  /** UI product pages return to the category after adding a part to the build. */
  setFromProduct(slot: PcSlot, id: string) { return this.set(slot, id, undefined, "category"); }

  /** The public UI build path starts at a category, not the retired builder. */
  openBuildSlot(slot: PcSlot = "cpu") {
    this.setState({
      buildBrief: this.state.buildBrief || "PC build in progress",
      cornerMin: true,
      route: "category",
      dept: "pc",
      openDept: null,
      category: slot,
      productSlot: slot,
      brand: "any",
      search: "",
      fitOnly: false,
      fastShip: false,
      minPrice: 0,
      maxPrice: 2200,
      useFilter: "any",
      facetFilters: {},
      sort: "popular",
      stockOnly: false,
      onSale: false,
    });
  }

  /**
   * Drag the floating card, and tell a tap apart from a drag.
   *
   * The collapsed card is one control that has to do both, so a press that
   * never travels more than a few pixels is a click on it, not a nudge. That
   * is what lets the pill open on a single tap; it used to need a double
   * click, with a single click landing on a badge small enough to miss.
   */
  cornerDrag = (e: React.PointerEvent, onTap?: () => void) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const box = (e.currentTarget as HTMLElement).closest("[data-corner]") as HTMLElement;
    const r = box.getBoundingClientRect();
    const x0 = r.left, y0 = r.top;
    let dragged = false;
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) dragged = true;
      if (!dragged) return;
      const w = box.offsetWidth, h = box.offsetHeight;
      this.setState({
        cornerX: Math.max(8, Math.min(window.innerWidth - w - 8, x0 + ev.clientX - startX)),
        cornerY: Math.max(8, Math.min(window.innerHeight - h - 8, y0 + ev.clientY - startY)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!dragged) onTap?.();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /** Everything the screens read. One place, so no screen computes its own numbers. */
  vals() { return buildVals(this); }
  render() {
    return <RigsmithView v={this.vals()} />;
  }
}
