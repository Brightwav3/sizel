import React from "react";
import { CATALOG, CAT_META, SPECS } from "../../data/catalog";
import { siblingVariants } from "../../data/storageVariants";
import { colorwaysFor } from "../../data/colorways";
import { money } from "../../data/metrics";
import { productTitle } from "../../domain/queries";
import { ratingFor, reviewsFor } from "../../data/reviews";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildProductVals(context: BuildContext) {
  const { app, route, openDept, pSlot, pick, buildableProduct, hasBuild, chosenCount, candidateIssues, pFits } = context;
  const watchKind = pick.stock === 0 ? "availability" as const : "price" as const;
  // The same device at other storage capacities: separate listings, one choice.
  const variants = siblingVariants(pick, CATALOG[pSlot] ?? []);
  // Alza-style: every tier is priced against the cheapest one, so the deltas
  // stay the same whichever tier you are looking at.
  const cheapest = variants.length ? variants[0].price : pick.price;
  const colorways = colorwaysFor(pick, pSlot);

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
      // The compatibility box is only meaningful for a part that goes into a
      // build the shopper has actually started. A phone has nothing to be
      // compatible with, and neither has an empty configurator.
      pFitShow: buildableProduct && hasBuild ? "grid" : "none",
      pFitBg: pFits ? "var(--success-soft)" : "var(--danger-soft)",
      pFitFg: pFits ? "var(--success)" : "var(--danger)",
      pFitIcon: pFits ? "check_circle" : "error",
      pFitText: !buildableProduct || !hasBuild ? ""
        : pFits ? `Fits the ${chosenCount === 1 ? "part" : `${chosenCount} parts`} you have chosen.`
        : candidateIssues.join(" "),
      // Buying comes first; the configurator is one service the shop offers,
      // so slotting a part into a build is the secondary action.
      pTitle: productTitle(pick, pSlot),
      pRating: ratingFor(pick),
      pReviews: reviewsFor(pick),
      // An out-of-stock product is watched for its return, one in stock for a
      // price drop. The check and the toggle have to agree on which.
      pWatched: app.isWatched(pick.id, watchKind),
      pWatchLabel: app.isWatched(pick.id, watchKind)
        ? "Watchdog is on"
        : watchKind === "availability" ? "Tell me when it is back" : "Tell me if the price drops",
      pWatch: () => app.toggleWatchdog(pSlot, pick.id, watchKind),
      pActionLabel: "Add to cart",
      pStorageLabel: pick.variantLabel ?? "",
      pStorageOptions: variants.map(variant => ({
        id: variant.id,
        label: variant.variantLabel ?? "",
        extra: `+ ${money(variant.price - cheapest)}`,
        note: variant.stock === 0 ? "Out of stock" : "In stock",
        soldOut: variant.stock === 0,
        selected: variant.id === pick.id,
        pick: () => app.setState({ route: "product", productSlot: pSlot, productId: variant.id }),
      })),
      // Colour is presentation only: no separate listing behind it yet.
      pColorways: colorways,
      pDelivery: pick.days <= 2 ? "Delivery tomorrow" : `Delivery in ${pick.days} days`,
      pPriceExVat: money(Math.round(pick.price / 1.21)),
      pAllFromBrand: () => app.setState({ route: "category", category: pSlot, productSlot: pSlot, brand: pick.brand ?? "any", openDept: null }),
      pAddToCart: () => app.addToCart(pSlot, pick.id),
      pBuildActionShow: buildableProduct ? "flex" : "none",
      pBuildActionLabel: "Add to my PC build",
      pAddToBuild: () => app.set(pSlot as PcSlot, pick.id),
  };
}

