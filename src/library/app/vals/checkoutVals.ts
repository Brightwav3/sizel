import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildCheckoutVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
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

