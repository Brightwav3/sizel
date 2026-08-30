import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildOverlayVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
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
  };
}

