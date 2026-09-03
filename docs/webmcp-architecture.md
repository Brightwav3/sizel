# WebMCP architecture

> Current selection contract: select known catalog ids directly; current stock, compatibility and budget checks remain mandatory.

Rigsmith implements the 15 descriptors registered by the judge-facing demo
through `src/app/webmcp`. The demo no longer performs automatic recommendation
or pre-commit selection. The [tool reference](webmcp-tools.md) is generated
from the descriptors.

## Agent selection, existing UI

`begin_build` opens the in-place build panel and records the brief and exact budget. It never selects a starting slot or part; the agent decides whether to begin with the GPU, CPU or another slot based on the shopper's request. `list_compatible_parts` returns fitting candidates with price, stock and delivery facts, for one slot or a bounded batch. `compare_build_options` evaluates only the alternatives supplied by the agent and returns their eligibility, availability and simulated performance deltas; it does not choose a winner or decide whether to create a watch. When the agent has chosen the complete set, `set_build_components` applies it atomically through the same controller rules used by the UI. Phone searches group storage variants by model by default, avoiding pagination through every tier when the agent needs model comparisons. The existing build sheet updates after the batch commits. Reasons belong in the conversation; no additional explanation panel is added to the storefront.

There is no automatic whole-build recommendation or starter tool. The legacy pure helper remains for numerical fixtures only. The controller validates candidate ids and constraints, not the truth of natural-language reasons or the agent's cognition.

## Shared commands

`RigsmithApp` owns state. Selection and cart commands serialize and resolve after React commits, using the latest state. Expected validation failures do not apply the requested change. A case and included fans update atomically. Build changes use the current shared state and are revalidated before cart admission.

`entities/build/selection.ts` owns orderability and exact budget checks. `entities/cart/cartValidation.ts` checks whole quantities, five-per-product limits and combined stock use across product and build lines. UI commands, WebMCP and checkout share these rules. Build lines still refer to the editable build and checkout revalidates them.

## Registration and results

The demo registers its stable allowlist once when the controller mounts. Route
changes do not remove and re-add tools; handlers validate the live controller
state when called. AbortController still withdraws every registration on
unmount, and pending acknowledgements do not block the rest of the set. The
API is optional.

Results are JSON text. Ordinary output budget is 1500 characters, full build reports 3000, and compatibility batches use their documented compact budget. List omissions are explicit. Read tools do not navigate. `show_in_catalog` is the explicit UI navigation call; build selections update the existing build sheet and preserve the current storefront route. Search exposes `nextOffset`, including after character-budget shortening.

Incomplete builds report missing slots and no complete-build performance estimate. Defaults in unselected slots are not a chosen build.

## Limits and verification

Catalog data are synthetic, compatibility checks cover seven rules, and FPS is not measured performance. State is in memory; watches send no notifications. Checkout is explicitly a preview without payment or order creation. Production requires authoritative services and persistence; WebMCP does not replace them.

Run `npm test` and `npm run build`. Regression tests use actual controller methods with deferred commits; separately verify native React and visible selection in the browser.
