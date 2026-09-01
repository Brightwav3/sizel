# WebMCP architecture

> Current selection contract (ADR 0009): inspection and explanation fields are optional. Select known catalog ids directly; current stock, compatibility and budget checks remain mandatory. Earlier descriptions of required inspection below are historical.

Rigsmith implements 36 descriptors through `src/app/webmcp`, while the
judge-facing demo exposes a stable allowlist of 13. [ADR 0007](decisions/0007-agents-select-and-explain-parts.md) supersedes automatic recommendation and pre-commit replies. [ADR 0012](decisions/0012-stable-webmcp-demo-registry.md) defines the demo registry. [Tool reference](webmcp-tools.md) is generated from descriptors.

## Agent selection, existing UI

`begin_build` opens the existing builder and records the brief and exact budget. It never selects a starting slot or part; the agent decides whether to begin with the GPU, CPU or another slot based on the shopper's request. `list_compatible_parts` can rank a GPU primary and in-stock fallback under a price ceiling, deriving a watchdog offer only from the real listing. Phone searches group storage variants by model by default, avoiding pagination through every tier when the agent needs model comparisons. `inspect_build_options` focuses a slot and returns candidate facts. `set_build_component` validates the agent's known catalog id against current state; inspection, reason and tradeoff are optional. The existing build sheet updates as selections commit. Reasons belong in the conversation; no additional explanation panel is added to the storefront.

There is no automatic whole-build recommendation or starter tool. The legacy pure helper remains for numerical fixtures only. The controller validates candidate ids and constraints, not the truth of natural-language reasons or the agent's cognition.

## Shared commands

`RigsmithApp` owns state. Selection and cart commands serialize and resolve after React commits, using the latest state. Expected validation failures do not apply the requested change. A case and included fans update atomically; undo restores selections and explanations. Build/target changes invalidate prior inspection.

`entities/build/selection.ts` owns orderability and exact budget checks. `entities/cart/cartValidation.ts` checks whole quantities, five-per-product limits and combined stock use across product and build lines. UI commands, WebMCP and checkout share these rules. Build lines still refer to the editable build and checkout revalidates them.

## Registration and results

The demo registers its stable allowlist once when the controller mounts. Route
changes do not remove and re-add tools; handlers validate the live controller
state when called. AbortController still withdraws every registration on
unmount, and pending acknowledgements do not block the rest of the set. The
full descriptor list retains route metadata for the future storefront profile.
The API is optional.

Results are JSON text. Ordinary output budget is 1500 characters, full build reports 3000, snapshots and candidate inspection 6000. List omissions are explicit. `read_shop` awaits allowlisted read handlers; failures remain local to each section. Read tools do not navigate. `show_in_catalog` is the explicit UI navigation call, and build selections return to the configurator. Search exposes `nextOffset`, including after character-budget shortening.

Incomplete builds report missing slots and no complete-build performance estimate. Defaults in unselected slots are not a chosen build.

## Limits and verification

Catalog data are synthetic, compatibility checks cover seven rules, and FPS is not measured performance. State is in memory; watches send no notifications. Checkout is explicitly a preview without payment or order creation. Production requires authoritative services and persistence; WebMCP does not replace them.

Run `npm test` and `npm run build`. Regression tests use actual controller methods with deferred commits; separately verify native React and visible selection in the browser. See [benchmark protocol](webmcp-benchmark.md).
