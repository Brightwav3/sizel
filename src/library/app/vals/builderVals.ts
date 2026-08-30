import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildBuilderVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
     buildSub: "9 parts chosen · " + (m.fits ? "everything fits" : "one thing does not fit"),
      builderSlot: s.builderSlot,
      builderCategory: (ORDER.find(item => item.slot === s.builderSlot) || ({} as any)).cat || s.builderSlot,
      builderSearch: s.builderSearch,
      setBuilderSearch: (event: React.ChangeEvent<HTMLInputElement>) => app.setState({ builderSearch: event.target.value }),
      clearBuilderSearch: () => app.setState({ builderSearch: "" }),
      builderInstalled: (() => { const part = app.part(s.builderSlot); return { name: part.name, specs: part.specs?.slice(0, 2).join(" · ") }; })(),
      builderRows: ORDER.map(item => { const part = app.part(item.slot); return { slot: item.slot, icon: item.icon, cat: item.cat, name: part.name, price: money(part.price), open: () => app.setState({ builderSlot: item.slot, builderSearch: "" }) }; }),
      builderOptions: CATALOG[s.builderSlot].filter(part => `${part.brand ?? ""} ${part.name} ${part.model ?? ""}`.toLowerCase().includes(s.builderSearch.toLowerCase())).map(part => ({
        id: part.id, brand: part.brand, name: part.name, image: part.imagePath, specs: part.specs?.slice(0, 3).join(" · "),
        stock: part.stock === 0 ? "Unavailable" : `Ships in ${part.days} days`, price: money(part.price), priceKind: part.merchandising ?? "standard",
        installed: s.picks[s.builderSlot] === part.id, disabled: s.picks[s.builderSlot] === part.id || part.stock === 0, select: () => app.set(s.builderSlot, part.id),
      })),
      builderIssues: m.issues, builderDraw: m.watt, builderHeadroom: Math.max(0, (app.part("psu").watt ?? 0) - m.watt),
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
        : "Your graphics card is too long for this case. Pick a shorter card or a bigger case.",
  };
}

