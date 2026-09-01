import { describe, expect, it, vi } from "vitest";
import { CATALOG, DEFAULT_PICKS } from "../../data/catalog/catalog";
import { metrics } from "../../entities/build/metrics";
import { CHECKOUT_STEPS } from "../../entities/checkout/checkoutSteps";
import { buildCheckoutVals } from "./checkoutVals";
import { buildProductVals } from "../product/productVals";

const shipDate = (days: number) => `date+${days}`;
const app = {
  shipDate,
  noiseWord: () => "Quiet",
  isWatched: () => false,
  toggleWatchdog: vi.fn(),
  setState: vi.fn(),
  setCartQty: vi.fn(),
  removeCartLine: vi.fn(),
  go: vi.fn(),
  flash: vi.fn(),
} as any;

const product = CATALOG.gpu.find(item => item.stock !== 0)!;

describe("delivery presentation", () => {
  it("keeps product shipping lead time separate from shipping date", () => {
    const values = buildProductVals({
      app,
      s: { productColorId: null },
      pSlot: "gpu",
      pick: product,
      buildableProduct: false,
      hasBuild: false,
      chosenCount: 0,
      candidateIssues: [],
      pFits: true,
    } as any);

    expect(values.pStock).toContain("Ships in 2 days");
    expect(values.pStock).not.toContain("tomorrow");
    expect(values.pDelivery).toBe("Ships date+2");
  });

  it("uses the same shipping and arrival wording in the cart", () => {
    const values = buildCheckoutVals({
      app,
      s: { cart: [{ kind: "product", id: product.id, slot: "gpu", qty: 1 }], picks: DEFAULT_PICKS, step: 0 },
      m: metrics(DEFAULT_PICKS),
      st: CHECKOUT_STEPS[0],
    } as any);

    expect(values.cartLines[0].stock).toBe("In stock · Ships in 2 days");
    expect(values.cartDeliveryLine).toBe("Ships date+2");
  });
});
