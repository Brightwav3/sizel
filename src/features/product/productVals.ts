// ADR 0003: product detail resolves colour and stock from listing identity.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
import { CATALOG, CAT_META, SPECS } from "../../data/catalog/catalog";
import { siblingVariants } from "../../data/catalog/storageVariants";
import { colorwaysFor } from "../../data/catalog/colorways";
import { listingStock, stockLabel } from "../../data/catalog/listingStock";
import { money } from "../../entities/build/metrics";
import { productTitle } from "../../entities/product/queries";
import { ratingFor, reviewsFor } from "../../data/catalog/reviews";
import type { PcSlot } from "../../shared/lib/types";
import type { BuildContext } from "../../entities/build/buildContext";

/** `days` is the catalog's shipping lead time, not a transit or arrival promise. */
const shippingLabel = (days: number) =>
  days === 0 ? "Ships today" : `Ships in ${days} day${days === 1 ? "" : "s"}`;

/** The shipping date is derived from the same catalog lead time used by the tools. */
const shippingDateLabel = (app: BuildContext["app"], days: number) =>
  days === 0 ? "Ships today" : `Ships ${app.shipDate(days)}`;

export function buildProductVals(context: BuildContext) {
  const { app, s, pSlot, pick, buildableProduct, hasBuild, chosenCount, candidateIssues, pFits } = context;
  const watchKind = pick.stock === 0 ? "availability" as const : "price" as const;
  // The same device at other storage capacities: separate listings, one choice.
  const variants = siblingVariants(pick, CATALOG[pSlot] ?? []);
  // Alza-style: every tier is priced against the cheapest one, so the deltas
  // stay the same whichever tier you are looking at.
  const cheapest = variants.length ? variants[0].price : pick.price;
  const colorways = colorwaysFor(pick, pSlot);
  const selectedColor = colorways.find(colorway => colorway.id === s.productColorId) ?? colorways[0];
  const stockCount = listingStock(pick, pSlot, selectedColor?.id);

  return {
      pImage: pick.imagePath,
      pName: pick.name,
      pSku: pick.id,
      pBrand: pick.brand || pick.name.split(" ")[0],
      pModel: pick.brand ? pick.name.replace(pick.brand + " ", "") : pick.name.split(" ").slice(1).join(" ") || pick.name,
      pIsGpu: pSlot === "gpu", pCatName: CAT_META[pSlot].name,
      pPrice: money(pick.price),
      pStock: stockCount === 0 ? "Out of stock" : `In stock · ${stockLabel(stockCount)} pcs · ${shippingLabel(pick.days)}`,
      pStockFg: stockCount === 0 ? "var(--danger)" : pick.days <= 2 ? "var(--green-600)" : "var(--amber-600)",
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
        { k: "Shipping", v: shippingLabel(pick.days) },
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
      // Four review pages, with one verified purchase on each page.
      pReviews: reviewsFor(pick, 16),
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
        pick: () => app.setState({ route: "product", productSlot: pSlot, productId: variant.id, productColorId: selectedColor?.id ?? null }),
      })),
      // Colour is presentation only: no separate listing behind it yet.
      pColorways: colorways,
      pSelectedColorId: selectedColor?.id ?? null,
      pSelectColor: (colorId: string) => app.setState({ productColorId: colorId }),
      pDelivery: shippingDateLabel(app, pick.days),
      pPriceExVat: money(Math.round(pick.price / 1.21)),
      pAllFromBrand: () => app.setState({ route: "category", category: pSlot, productSlot: pSlot, brand: pick.brand ?? "any", openDept: null }),
      pAddToCart: () => app.addToCart(pSlot, pick.id),
      pCanAddToCart: stockCount > 0,
      pMobileActionLabel: stockCount > 0 ? "Add to cart" : "Notify me",
      pMobileAction: stockCount > 0 ? () => app.addToCart(pSlot, pick.id) : () => app.toggleWatchdog(pSlot, pick.id, watchKind),
      pBuildActionShow: buildableProduct ? "flex" : "none",
      pBuildActionLabel: "Add to my PC build",
      pAddToBuild: () => app.set(pSlot as PcSlot, pick.id),
  };
}
