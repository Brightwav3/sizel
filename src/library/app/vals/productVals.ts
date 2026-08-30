import React from "react";
import { CATALOG, CAT_ICON, CAT_META, DEFAULT_PICKS, DEPTS, DESCS, GSTEP, GUIDED, ORDER, SPECS } from "../../data/catalog";
import { RES, money } from "../../data/metrics";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildProductVals(context: BuildContext) {
  const { app, s, m, route, on, sideStyle, shopping, dept, picked, depts, openDept, categories, spend, over, fpsOk, quietOk, rows, games, wantRes, allProducts, searchText, cat, catList, brandOf, brandLogo, facetDefinitions, facetValues, specFilters, fitFacetIds, fitFilters, technicalFilters, visible, hidden, pSlot, pick, buildableProduct, candidateBuild, pFits, pslot, cur, pool, ordered, mtx, rowDefs, fg, pickerRows, stepDefs, st, filtersOn, gSpent, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandNames, brandRibbon, homeDepartments, homeCategorySlots, homeCategories } = context;
  return {
      pImage: pick.imagePath,
      pName: pick.name,
      pSku: pick.id,
      pBrand: pick.brand || pick.name.split(" ")[0],
      pModel: pick.brand ? pick.name.replace(pick.brand + " ", "") : pick.name.split(" ").slice(1).join(" ") || pick.name,
      pIsGpu: pSlot === "gpu", pCatName: CAT_META[pSlot].name,
      pPrice: money(pick.price),
      pStock: pick.days <= 2 ? "In stock · ships tomorrow" : "Ships in " + pick.days + " days",
      pStockFg: pick.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
      pBlurb: pick.blurb || [pick.note || pick.meaning, CAT_META[pSlot].blurb].filter(Boolean).join(". ").replace("..", "."),
      pSpecs: (SPECS[pSlot] || (() => []))(pick),
      pFpsCards: pSlot === "gpu" ? [
        { res: "1080p", fps: Math.round(pick.fps! * 1.32) + " fps" },
        { res: "1440p", fps: pick.fps + " fps" },
        { res: "4K", fps: Math.round(pick.fps! * 0.6) + " fps" },
      ] : [],
      pFacts: pSlot === "gpu" ? [
        { k: "Best for", v: pick.good!.replace("Great for ", "") + " gaming" },
        { k: "Noise", v: app.noiseWord(pick.noise!) },
        { k: "Power needed", v: (Math.ceil((pick.watt! + 240) / 50) * 50) + " W supply" },
        { k: "Availability", v: pick.stock === 0 ? "Out of stock" : "In stock" },
      ] : [
        { k: "Category", v: CAT_META[pSlot].name },
        { k: "Key specification", v: ((SPECS[pSlot] || (() => []))(pick)[0] || "Catalog specification") },
        { k: "Delivery", v: pick.days <= 2 ? "1–2 days" : pick.days + " days" },
        { k: "Availability", v: pick.stock === 0 ? "Out of stock" : "In stock" },
      ],
      pFitBg: pFits ? "var(--success-soft)" : "var(--danger-soft)",
      pFitFg: pFits ? "var(--success)" : "var(--danger)",
      pFitIcon: pFits ? "check_circle" : "error",
      pFitText: !buildableProduct ? "Verified against the canonical Rigsmith product catalog."
        : pFits ? "Compatible with your current build based on the product specifications."
        : (candidateBuild?.issues || ["This product is not compatible with your current build."]).join(" "),
      pActionLabel: buildableProduct ? "Put this in my build" : "Add to cart",
      pAddToBuild: () => buildableProduct
        ? app.set(pSlot as PcSlot, pick.id)
        : app.setState({ inCart: true, toast: pick.name + " added to cart" }, () => app.flash()),
  };
}

