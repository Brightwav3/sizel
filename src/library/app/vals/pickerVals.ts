import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildPickerVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
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
  };
}

