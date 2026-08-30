import type { Vals } from "../sx";
import type { RigsmithApp } from "../RigsmithApp";
import { createBuildContext } from "./buildContext";
import { buildShellVals } from "./vals/shellVals";
import { buildHomeVals } from "./vals/homeVals";
import { buildCatalogVals } from "./vals/catalogVals";
import { buildProductVals } from "./vals/productVals";
import { buildBuilderVals } from "./vals/builderVals";
import { buildOverlayVals } from "./vals/overlayVals";
import { buildCheckoutVals } from "./vals/checkoutVals";

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
