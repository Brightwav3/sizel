import type { Vals } from "../../shared/lib/types";
// ADR 0005: cross-feature build composition lives in the build entity.
// docs/decisions/0005-feature-first-source-layout.md
import type { RigsmithApp } from "../../app/App";
import { createBuildContext } from "./buildContext";
import { buildShellVals } from "../../shared/layout/shellVals";
import { buildHomeVals } from "../../features/catalog/home/homeVals";
import { buildCatalogVals } from "../../features/catalog/catalogVals";
import { buildProductVals } from "../../features/product/productVals";
import { buildBuilderVals } from "../../features/pc-builder/builderVals";
import { buildOverlayVals } from "../../features/pc-builder/overlayVals";
import { buildCheckoutVals } from "../../features/checkout/checkoutVals";

// ADR 0002: domain view-models compose the public value bag at this boundary.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
export function buildVals(app: RigsmithApp): Vals {
  const context = createBuildContext(app);
  return {
    ...buildShellVals(context),
    ...buildHomeVals(context),
    ...buildCatalogVals(context),
    ...buildProductVals(context),
    ...buildBuilderVals(context),
    ...buildOverlayVals(context),
    ...buildCheckoutVals(context),
  };
}
