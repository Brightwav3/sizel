import React from "react";
import "./styles.css";
import { FIXED } from "./app/catalogFacets";
import { buildVals } from "./app/buildVals";
import { RigsmithView } from "./app/RigsmithView";
import type { AppState } from "./app/AppState";
import {
  CATALOG, DEFAULT_PICKS, GUIDED, ORDER,
} from "./data/catalog";
import { RES, compatibilityIssues, money, noiseWord, shipDate } from "./data/metrics";
import type { PcSlot, Picks, Route, Slot } from "./types";

/**
 * The whole shop. State, the metrics model, and the derived value bag are the
 * prototype's logic class; every screen below renders it.
 */
export class RigsmithApp extends React.Component<{}, AppState> {
  state: AppState = {
    route: "home", pickerSlot: null, productId: DEFAULT_PICKS.gpu, category: "gpu", productSlot: "gpu",
    catalogOpen: false, dept: "pc", openDept: "pc",
    picks: { ...DEFAULT_PICKS },
    gStep: 0, gDone: [], cornerMin: true, cornerX: null, cornerY: null,
    budget: 1800, target: 144, res: "1440p", quiet: true,
    fitOnly: true, minPrice: 0, maxPrice: 2200, useFilter: "any", brand: "any", facetFilters: {}, sort: "popular", stockOnly: false, onSale: false, search: "",
    lastChange: null, prev: null, inCart: false, step: 0, toast: null, saved: 2, scrolled: false,
  };

  private t?: number;
  private urlReady = false;
  private syncingFromUrl = false;
  private onResize = () => this.forceUpdate();
  private onPopState = () => {
    const next = this.stateFromLocation();
    this.syncingFromUrl = true;
    this.setState(next as any);
  };

  componentDidMount() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("popstate", this.onPopState);
    const next = this.stateFromLocation();
    if (next.route !== "home") {
      this.syncingFromUrl = true;
      this.setState(next as any, () => { this.urlReady = true; });
    } else {
      this.urlReady = true;
    }
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("popstate", this.onPopState);
    clearTimeout(this.t);
  }

  private categorySlugs: Record<string, string> = {
    gpu: "graphic-cards", cpu: "processors", board: "motherboards", ram: "memory",
    cooler: "cpu-coolers", psu: "power-supplies", storage: "storage", case: "pc-cases",
    phones: "smartphones", consoles: "consoles",
  };

  private slotForSlug(slug: string): Slot | null {
    return (Object.keys(this.categorySlugs) as Slot[]).find(slot => this.categorySlugs[slot] === slug) || null;
  }

  private stateFromLocation(): Partial<AppState> {
    const segments = window.location.pathname.split("/").filter(Boolean).map(segment => decodeURIComponent(segment));
    if (segments.length === 0) return { route: "home" };
    if (segments[0] === "pc-builder") return { route: "builder" };
    if (segments[0] === "build") return { route: "guided", gStep: 0, gDone: [] };
    if (segments[0] === "compare") return { route: "picker", pickerSlot: "gpu" };
    if (segments[0] === "cart") return { route: "cart" };
    if (segments[0] === "checkout") return { route: "checkout", step: 0 };
    if (segments[0] === "order-complete") return { route: "done" };
    const dept = segments[0] === "pc-parts" ? "pc" : segments[0] === "phones" ? "phone" : segments[0] === "gaming" ? "gaming" : null;
    const slot = segments[1] ? this.slotForSlug(segments[1]) : null;
    if (!dept || !slot) return { route: "home" };
    if (segments[2]) return { route: "product", dept, openDept: dept, category: slot, productSlot: slot, productId: segments[2] };
    return { route: "category", dept, openDept: dept, category: slot, productSlot: slot };
  }

  private urlForState(state: AppState): string {
    if (state.route === "home") return "/";
    if (state.route === "builder") return "/pc-builder";
    if (state.route === "guided") return "/build";
    if (state.route === "picker") return "/compare";
    if (state.route === "cart") return "/cart";
    if (state.route === "checkout") return "/checkout";
    if (state.route === "done") return "/order-complete";
    const slot = state.route === "product" ? state.productSlot : state.category;
    const productDept = slot === "phones" ? "phone" : slot === "consoles" ? "gaming" : "pc";
    const baseDept = state.route === "product" ? productDept : state.dept;
    const base = baseDept === "phone" ? "/phones" : baseDept === "gaming" ? "/gaming" : "/pc-parts";
    const category = this.categorySlugs[slot] || this.categorySlugs.gpu;
    return `${base}/${category}${state.route === "product" ? `/${encodeURIComponent(state.productId)}` : ""}`;
  }

  componentDidUpdate(prevProps: {}, prevState: AppState) {
    if (!this.urlReady) return;
    if (this.syncingFromUrl) {
      this.syncingFromUrl = false;
      return;
    }
    const navigationChanged = prevState.route !== this.state.route || prevState.category !== this.state.category || prevState.productId !== this.state.productId || prevState.dept !== this.state.dept;
    if (navigationChanged) {
      const nextUrl = this.urlForState(this.state);
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

  metrics(picks?: Picks) {
    const gpu = this.part("gpu", picks), cpu = this.part("cpu", picks);
    const ram = this.part("ram", picks), storage = this.part("storage", picks), cooler = this.part("cooler", picks);
    const board = this.part("board", picks), psu = this.part("psu", picks);
    const cs = this.part("case", picks), fans = this.part("fans", picks);
    const chosen = [gpu, cpu, board, ram, storage, cooler, psu, cs, fans];
    const price = chosen.reduce((a, p) => a + p.price, 0) + FIXED.reduce((a, p) => a + p.price, 0);
    const factor = Math.min(1, cpu.score! / 100) * Math.min(1, ram.score! / 100);
    const fps = Math.round(gpu.fps! * factor * RES[this.state.res]);
    const noise = Math.max(gpu.noise!, cooler.noise!) + (fans.id === "f6" ? 1.2 : 0);
    const days = Math.max(...chosen.map(p => p.days), ...FIXED.map(p => p.days));
    const watt = (gpu.watt ?? 0) + (cpu.cpuPowerW ?? 65) + 80;
    const issues = compatibilityIssues(picks || this.state.picks);
    const fits = issues.length === 0;
    return { price, fps, noise, days, watt, fits, issues, gpu, cpu, ram, storage, cooler };
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

  set(slot: PcSlot, id: string) {
    const before = this.metrics();
    const picks = { ...this.state.picks, [slot]: id };
    const after = this.metrics(picks);
    const item = CATALOG[slot].find(x => x.id === id)!;
    const dp = after.price - before.price, df = after.fps - before.fps;
    this.setState({
      picks, prev: this.state.picks, route: "builder", pickerSlot: null,
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

  gAdvance(slot: PcSlot) {
    const done = this.state.gDone.includes(slot) ? this.state.gDone : [...this.state.gDone, slot];
    const at = GUIDED.indexOf(slot);
    const last = at >= GUIDED.length - 1;
    this.setState({
      gDone: done, gStep: last ? at : at + 1, route: last ? "builder" : "guided",
      toast: last ? "Build complete — nine parts installed" : null,
    });
    if (last) this.flash();
  }

  gPick(slot: PcSlot, id: string) {
    this.setState({ picks: { ...this.state.picks, [slot]: id }, prev: this.state.picks });
    this.gAdvance(slot);
  }

  /** Everything the screens read. One place, so no screen computes its own numbers. */
  vals() { return buildVals(this); }
  render() {
    return <RigsmithView v={this.vals()} />;
  }
}
