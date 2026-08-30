import React from "react";
import "./styles.css";
import { buildVals } from "./app/buildVals";
import { RigsmithView } from "./app/RigsmithView";
import type { AppState } from "./app/AppState";
import { stateFromLocation, urlForState } from "./app/navigation";
import {
  CATALOG, DEFAULT_PICKS, ORDER,
} from "./data/catalog";
import { metrics, money, noiseWord, shipDate } from "./data/metrics";
import type { CartLine, PcSlot, Picks, Route, Slot, Watchdog } from "./types";

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
    route: "home", productId: DEFAULT_PICKS.gpu, category: "gpu", productSlot: "gpu",
    catalogOpen: false, dept: "pc", openDept: null,
    picks: { ...DEFAULT_PICKS },
    chosen: [],
    builderSlot: "cpu", builderSearch: "", builderCompatibleOnly: true, builderFacets: {},
    cornerMin: true, cornerX: null, cornerY: null,
    budget: 1800, target: 144, res: "1440p", quiet: true,
    fitOnly: false, fastShip: false, minPrice: 0, maxPrice: 2200, useFilter: "any", brand: "any", facetFilters: {}, sort: "popular", stockOnly: false, onSale: false, search: "",
    lastChange: null, prev: null, cart: [], watchdogs: [], step: 0, toast: null, saved: 2,
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
    window.addEventListener("resize", this.onResize);
    window.addEventListener("popstate", this.onPopState);
    const next = stateFromLocation();
    if (next.route !== "home") {
      this.syncingFromUrl = true;
      this.setState(next as any, () => { this.syncingFromUrl = false; this.urlReady = true; });
    } else {
      this.urlReady = true;
    }
  }
  componentWillUnmount() {
    if (RigsmithApp.instance === this) RigsmithApp.instance = null;
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
    const navigationChanged = prevState.route !== this.state.route || prevState.category !== this.state.category || prevState.productId !== this.state.productId || prevState.dept !== this.state.dept || prevState.openDept !== this.state.openDept || prevState.brand !== this.state.brand;
    if (navigationChanged) {
      const nextUrl = urlForState(this.state);
      if (nextUrl !== window.location.pathname) window.history.pushState({}, "", nextUrl);
    }
  }

  dockPoint() {
    const w = window.innerWidth || 1280, h = window.innerHeight || 800;
    const box = this.state.cornerMin ? { w: 52, h: 52 } : { w: 296, h: 232 };
    const x = this.state.cornerX === null ? w - box.w - 24 : this.state.cornerX;
    const y = this.state.cornerY === null ? h - box.h - 24 : this.state.cornerY;
    return {
      x: Math.max(8, Math.min(w - box.w - 8, x)),
      y: Math.max(64, Math.min(h - box.h - 8, y)),
    };
  }

  part(slot: PcSlot, picks?: Picks) {
    const p = picks || this.state.picks;
    return CATALOG[slot].find(x => x.id === p[slot])!;
  }

  /** Delegates to the one model in data/metrics.ts. ADR 0002. */
  metrics(picks?: Picks) {
    return metrics(picks || this.state.picks, this.state.res);
  }

  // Cart ---------------------------------------------------------------
  /** Adds a catalog product, merging with an existing line of the same product. */
  addToCart(slot: Slot, id: string, qty = 1) {
    const at = this.state.cart.findIndex(line => line.kind === "product" && line.id === id);
    const cart = at >= 0
      ? this.state.cart.map((line, index) => index === at ? { ...line, qty: line.qty + qty } : line)
      : [...this.state.cart, { kind: "product", id, slot, qty } as CartLine];
    const name = CATALOG[slot].find(part => part.id === id)?.name ?? "Product";
    this.setState({ cart, toast: `${name} added to cart` }, () => this.flash());
  }

  /** The assembled machine is one line; adding it twice does nothing. */
  addBuildToCart() {
    if (this.state.cart.some(line => line.kind === "build")) { this.setState({ route: "cart" }); return; }
    this.setState({
      cart: [...this.state.cart, { kind: "build", id: "build", qty: 1 }],
      route: "cart", toast: "Build added to cart",
    }, () => this.flash());
  }

  setCartQty(index: number, qty: number) {
    if (qty < 1) return this.removeCartLine(index);
    this.setState({ cart: this.state.cart.map((line, at) => at === index ? { ...line, qty } : line) });
  }

  removeCartLine(index: number) {
    this.setState({ cart: this.state.cart.filter((_, at) => at !== index), toast: "Removed from cart" }, () => this.flash());
  }

  // Watchdogs -----------------------------------------------------------
  /** Start or stop watching a product. Everything stays on this device. */
  toggleWatchdog(slot: Slot, id: string, kind: Watchdog["kind"] = "availability") {
    const at = this.state.watchdogs.findIndex(watch => watch.productId === id && watch.kind === kind);
    if (at >= 0) {
      this.setState({ watchdogs: this.state.watchdogs.filter((_, index) => index !== at), toast: "Watch removed" }, () => this.flash());
      return;
    }
    const part = CATALOG[slot].find(item => item.id === id);
    const watch: Watchdog = { productId: id, slot, kind, priceAtWatch: part?.price ?? 0 };
    this.setState({
      watchdogs: [...this.state.watchdogs, watch],
      toast: kind === "price" ? "We will tell you if the price drops" : "We will tell you when it is back",
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

  private withChosen(slot: PcSlot) {
    return this.state.chosen.includes(slot) ? this.state.chosen : [...this.state.chosen, slot];
  }

  /** The one write path into the active build. ADR 0002. */
  set(slot: PcSlot, id: string) {
    const before = this.metrics();
    const picks = { ...this.state.picks, [slot]: id };
    const after = this.metrics(picks);
    const item = CATALOG[slot].find(x => x.id === id)!;
    const dp = after.price - before.price, df = after.fps - before.fps;
    this.setState({
      picks, chosen: this.withChosen(slot), prev: this.state.picks, route: "builder",
      lastChange: {
        icon: (ORDER.find(o => o.slot === slot) || ({} as any)).icon || "build",
        title: "Changed to " + item.name,
        deltas: [
          { k: "Frame rate", v: (df >= 0 ? "+" : "") + df + " fps", fg: df >= 0 ? "var(--green-600)" : "var(--amber-600)" },
          { k: "Price", v: (dp >= 0 ? "+" : "-") + money(Math.abs(dp)), fg: dp <= 0 ? "var(--green-600)" : "var(--text-secondary)" },
          { k: "Noise", v: this.noiseWord(after.noise) === this.noiseWord(before.noise) ? "No change" : this.noiseWord(after.noise), fg: "var(--text-secondary)" },
        ],
      },
      toast: "Build updated — everything re-checked",
    });
    this.flash();
  }

  /** Recommended build order: each part constrains the ones after it. */
  static readonly BUILD_STEPS: PcSlot[] = ["cpu", "board", "ram", "gpu", "storage", "cooler", "psu", "case", "fans"];

  /** Builder-screen selection: same write path, then move to the next gap. */
  setBuilderPart(slot: PcSlot, id: string) {
    const chosen = this.withChosen(slot);
    const next = RigsmithApp.BUILD_STEPS.find(step => !chosen.includes(step));
    this.setState({
      picks: { ...this.state.picks, [slot]: id },
      chosen,
      prev: this.state.picks,
      builderSlot: next ?? slot,
      builderSearch: "",
      builderFacets: {},
      toast: `${CATALOG[slot].find(part => part.id === id)?.name ?? "Part"} selected`,
    });
    this.flash();
  }

  cornerDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const box = (e.currentTarget as HTMLElement).closest("[data-corner]") as HTMLElement;
    const r = box.getBoundingClientRect();
    const x0 = r.left, y0 = r.top;
    const move = (ev: PointerEvent) => {
      const w = box.offsetWidth, h = box.offsetHeight;
      this.setState({
        cornerX: Math.max(8, Math.min(window.innerWidth - w - 8, x0 + ev.clientX - startX)),
        cornerY: Math.max(8, Math.min(window.innerHeight - h - 8, y0 + ev.clientY - startY)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
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
