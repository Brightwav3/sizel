import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildGuidedVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
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
  };
}

