import React from "react";
// ADR 0005: application composition lives in src/app.
// docs/decisions/0005-feature-first-source-layout.md
import "../shared/styles/styles.css";
import "../shared/styles/tooltip.css";
import { buildVals } from "../entities/build/buildVals";
import { RigsmithView } from "./RigsmithView";
import type { AppState, BuildDecision } from "./state/AppState";
import { stateFromLocation, urlForState } from "./routes";
import { stopWebmcpTools, syncWebmcpTools } from "./webmcp";
import { DEFAULT_PICKS, partIn } from "../data/catalog/catalog";
import { compatibilityIssues, metrics, noiseWord, shipDate } from "../entities/build/metrics";
import type { CartLine, PcSlot, Picks, Route, Slot, Watchdog } from "../shared/lib/types";

import { BUILD_SLOTS, bundledFans, buildBlocker, requireQuantity, selectedPicks, selectedPrice, ShopError } from "../entities/build/selection";
import { cartBlocker } from "../entities/cart/cartValidation";
import { listingStock } from "../data/catalog/listingStock";
import { budgetPlan, validateBudgetShares } from "../entities/build/budgetPlan";
import { balancedStarter } from "./webmcp/buildAdvisor";

type Mutation = { patch?: Partial<AppState>; result?: Record<string, any> };

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
    route: "home", productId: DEFAULT_PICKS.gpu, productColorId: null, category: "gpu", productSlot: "gpu",
    catalogOpen: false, dept: "pc", openDept: null,
    picks: { ...DEFAULT_PICKS },
    chosen: [],
    builderSlot: "cpu", builderSearch: "", builderCompatibleOnly: true, builderFacets: {},
    cornerMin: true, cornerX: null, cornerY: null,
    budget: 1800, budgetShares: {}, target: 144, res: "1440p", quiet: true,
    fitOnly: false, fastShip: false, minPrice: 0, maxPrice: 2200, useFilter: "any", brand: "any", facetFilters: {}, sort: "popular", stockOnly: false, onSale: false, search: "", recentSearches: ["quiet graphics card", "1 TB NVMe", "phone under $700"],
    buildBrief: "", buildRevision: 0, decisions: {}, inspected: null,
    lastChange: null, prev: null, cart: [], watchdogs: [], step: 0, toast: null, saved: 2,
    ...stateFromLocation(),
  };

  private t?: number;
  private urlReady = false;
  private syncingFromUrl = false;
  private onResize = () => this.forceUpdate();
  private onPopState = () => {
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
    this.urlReady = true;
  }
  componentWillUnmount() {
    if (RigsmithApp.instance === this) RigsmithApp.instance = null;
    stopWebmcpTools();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("popstate", this.onPopState);
    clearTimeout(this.t);
  }

  componentDidUpdate(prevProps: {}, prevState: AppState) {
    if (!this.urlReady) return;
    if (this.syncingFromUrl) {
      this.syncingFromUrl = false;
      return;
    }
    const pageChanged = prevState.route !== this.state.route
      || prevState.category !== this.state.category
      || prevState.productId !== this.state.productId
      || prevState.productColorId !== this.state.productColorId
      || prevState.dept !== this.state.dept
      || prevState.openDept !== this.state.openDept;
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

  dockPoint() {
    const w = window.innerWidth || 1280, h = window.innerHeight || 800;
    const box = this.state.cornerMin ? { w: 168, h: 44 } : { w: 296, h: 232 };
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
      const blocked = buildBlocker(state.picks, state.chosen, state.budget);
      if (blocked) throw blocked;
      const alreadyAdded = state.cart.some(line => line.kind === 'build');
      const cart: CartLine[] = alreadyAdded ? state.cart : [...state.cart, { kind: 'build', id: 'build', qty: 1 }];
      const cartIssue = cartBlocker(cart, state.picks, state.chosen, state.budget);
      if (cartIssue) throw cartIssue;
      return { patch: { cart, route: 'cart', toast: 'Build added to cart' },
        result: { added: 'build', alreadyAdded, price: metrics(state.picks, state.res).price } };
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
      const blocked = cartBlocker(state.cart, state.picks, state.chosen, state.budget);
      if (blocked) throw blocked;
      return { patch: { route: 'checkout', step: 0 }, result: { opened: 'checkout', step: 'delivery', demo: true } };
    });
  }

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

  toggleBuilderFacet(id: string, value: string) {
    const selected = this.state.builderFacets[id] || [];
    const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
    this.setState({ builderFacets: { ...this.state.builderFacets, [id]: next } });
  }

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
  set(slot: PcSlot, id: string, decision?: BuildDecision) {
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
      if (issues.length) throw new ShopError('build_incompatible', issues[0]);
      const price = selectedPrice(picks, chosen);
      if (price > state.budget) throw new ShopError('over_budget', 'Selected parts exceed the agreed budget. Change a part or explicitly update the budget.');
      const decisions = { ...state.decisions };
      delete decisions[slot];
      if (decision) decisions[slot] = decision;
      if (slot === 'case') delete decisions.fans;
      return { patch: { picks, chosen, decisions, prev: this.snapshot(state), inspected: null,
        buildRevision: state.buildRevision + 1, lastChange: null,
        // A product detail or category page is a useful place to inspect a
        // candidate, but the committed choice always brings the shopper back
        // to the configurator and focuses the slot that changed.
        route: 'builder' as const, builderSlot: slot,
        toast: `${item.name} selected` },
        result: { slot, fitted: item.name, selectedPrice: price, budgetRemainingUSD: state.budget - price,
          selectedCount: chosen.length, complete: BUILD_SLOTS.every(s => chosen.includes(s)), compatible: true,
          ...(slot === 'case' ? { bundledFans: picks.fans } : {}) } };
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
        prev: this.snapshot(state), inspected: null, buildRevision: state.buildRevision + 1, lastChange: null,
        route: 'builder', builderSlot: slot },
        result: { slot, action: 'reset' } };
    });
  }

  resetBuild() {
    return this.mutate(state => ({ patch: { picks: { ...DEFAULT_PICKS }, chosen: [], decisions: {}, inspected: null,
      prev: this.snapshot(state), buildRevision: state.buildRevision + 1, builderSearch: '', lastChange: null }, result: { reset: true } }));
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

  beginBuild(brief: string, budget: number, res: AppState['res'], reset = false, requestedShares?: unknown, starter?: 'balanced') {
    return this.mutate(state => {
      if (typeof brief !== 'string' || brief.trim().length < 5 || brief.length > 500) throw new ShopError('invalid_brief', 'Summarise the shopper request in 5–500 characters.');
      if (!Number.isFinite(budget) || budget <= 0) throw new ShopError('invalid_budget', 'Budget must be positive.');
      const checked = validateBudgetShares(requestedShares);
      if (!checked.valid) throw new ShopError('invalid_budget_allocation', checked.message);
      const plan = budgetPlan(budget, res, checked.shares);
      if (starter !== undefined && starter !== 'balanced') throw new ShopError('invalid_starter', 'Use the balanced starter or omit starter.');
      if (starter && state.chosen.length && !reset) throw new ShopError('starter_requires_reset', 'The balanced starter would replace existing selections. Pass reset=true or clear the build first.');
      const starterPlan = starter === 'balanced' ? balancedStarter(budget, res) : null;
      if (starter === 'balanced' && !starterPlan) throw new ShopError('starter_unavailable', 'The balanced starter cannot leave a compatible in-stock GPU under this budget.');
      const patch: Partial<AppState> = { buildBrief: brief.trim(), budget, res, route: 'builder', inspected: null,
        budgetShares: checked.shares,
        builderSlot: starterPlan ? 'gpu' : 'cpu', buildRevision: state.buildRevision + 1,
        ...(reset ? { picks: { ...DEFAULT_PICKS }, chosen: [], decisions: {}, prev: this.snapshot(state) } : {}) };
      if (starterPlan) {
        patch.picks = starterPlan.picks;
        patch.chosen = starterPlan.chosen;
        patch.decisions = {};
      }
      return { patch: { buildBrief: brief.trim(), budget, res, route: 'builder', inspected: null,
        ...patch },
        result: { opened: 'builder', budget, resolution: res, reset,
          budgetAllocation: { source: plan.source, slots: plan.rows },
          ...(starterPlan ? {
            starter: 'balanced', starterPriceUSD: starterPlan.price,
            starterSelected: starterPlan.chosen, next: 'The balanced starter filled every non-GPU slot. Choose the GPU with ranked list_compatible_parts; compatibility, stock and the exact whole-build budget still win.',
          } : {
            next: 'Use each slot allowance as a planning hint, then choose parts yourself with list_compatible_parts and set_build_component. Compatibility, stock and the exact whole-build budget always win.',
          }) } };
    });
  }

  inspectBuildOptions(slot: PcSlot, ids: string[]) {
    return this.mutate(state => {
      if (!BUILD_SLOTS.includes(slot) || !Array.isArray(ids) || ids.length < 1 || ids.length > 4 || new Set(ids).size !== ids.length)
        throw new ShopError('invalid_candidates', 'Inspect one to four distinct products in one build slot.');
      if (ids.some(id => !partIn(slot, id))) throw new ShopError('wrong_slot', 'All candidates must belong to the requested slot.');
      return { patch: { buildBrief: state.buildBrief || 'Compare parts for the current build', inspected: { slot, ids: [...ids], revision: state.buildRevision }, route: 'builder', builderSlot: slot }, result: { inspected: ids } };
    });
  }

  showInCatalog(patch: Partial<Pick<AppState,
    'route' | 'category' | 'productSlot' | 'dept' | 'search' | 'brand' | 'facetFilters' |
    'minPrice' | 'maxPrice' | 'sort' | 'stockOnly' | 'onSale' | 'productId' |
    'productColorId' | 'builderSlot'>>) {
    return this.mutate(() => ({ patch: { catalogOpen: false, ...patch }, result: { shown: patch.route } }));
  }

  static readonly BUILD_STEPS: PcSlot[] = ['cpu', 'board', 'ram', 'gpu', 'storage', 'cooler', 'psu', 'case', 'fans'];

  setBuilderPart(slot: PcSlot, id: string) { return this.set(slot, id); }

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
