# Rigsmith WebMCP tool reference

Generated with `npx tsx scripts/generate-webmcp-docs.mjs` from `src/app/webmcp/tools.ts`. This document covers only the **13** tools exposed by the stable judge-facing demo registry. The source is authoritative if this file and runtime ever disagree.

## Scope

Rigsmith is a local demo electronics storefront. This reference covers the demo registry's catalog reads, nine-slot PC builder and cart actions. Catalog prices, inventory and delivery are synthetic. No demo tool submits payment, creates an order, sends a notification or claims measured hardware performance.

## Registration and runtime behavior

- The page feature-detects `document.modelContext.registerTool`. When the browser does not provide WebMCP, the storefront runs unchanged.
- The demo registers exactly the tools listed in the table below. Other application descriptors are intentionally outside this reference.
- Registration is stable across route changes. The app does not remove and re-add tools for every screen; route metadata is an availability hint for the larger tool catalogue.
- If WebMCP is injected after React mounts, registration is retried every 100 ms, up to 100 retries. A failed registration removes only that registration attempt. Unmounting aborts every registered signal. The current API has no separate unregister operation.
- Every registered handler receives the browser-provided `AbortSignal`. Ordinary domain commands are serialized and resolve after the React state commit.
- Required fields are checked before handler execution. Missing `undefined` or `null` values return `missing_argument`. The browser also sees the JSON Schema, whose object schemas reject additional properties.
- A handler exception is converted into `{ error: "tool_failed", hint }`; it is not allowed to escape as an opaque rejected tool call. Domain command failures use `command_failed` only for non-domain exceptions.

## Response envelope and limits

Every result is a WebMCP result whose first content block is JSON text: `{ content: [{ type: "text", text: "..." }] }`. Error results additionally set `isError: true`. Callers must parse the text before using the payload.

Successful ordinary results target a 1,500-character JSON budget. Build reports target 3,000 characters; batched and detailed comparison results target 6,000. A result with a declared list is shortened from the end and reports `omitted`; derived summaries are recalculated from the items actually returned. If a result cannot be safely shortened, it returns `result_too_large` with a recovery hint.

## Shared domain rules

- Money is in USD. The hard PC budget is a whole-build ceiling; budget-share rows are planning hints, never per-slot hard caps.
- PC slots are `cpu`, `gpu`, `board`, `ram`, `storage`, `cooler`, `psu`, `case`, and `fans`. A default part in an unchosen slot is only a placeholder; it does not make the build complete.
- The same state/controller is used by the screen and WebMCP. Mutations are queued in order, so consecutive tool writes see the latest committed state.
- A selected part must exist in the requested slot, have stock, fit current compatibility rules, and keep the selected total within budget. Selecting a case atomically selects its bundled fan pack. Resetting a case resets both case and fans.
- Compatibility checks cover seven known rules: CPU/board socket, RAM/board memory type, board/case form factor, GPU/case length clearance, PSU headroom, CPU/cooler socket support, and storage/board interface. A pass is not BIOS, radiator, thermal, physical or full production certification.
- Product stock is checked against aggregate quantities. Product lines allow whole quantities 0–5 and quantity zero removes a line; an assembled PC is always one line at quantity one. Checkout revalidates the complete cart.
- Shipping exposes a deterministic `shipsOn` date derived from runtime date plus the slowest `shipsInDays`; `arrival` is always `null`.
- `compare_build_options` exposes explicitly labeled simulations only. Its game ids are `counter-strike-2`, `fortnite`, and `cyberpunk-2077`; generic scenarios are `competitive` and `cinematic`. Simulation data never becomes a measured FPS, noise, or real-game guarantee.

## Recommended agent workflow

1. Search with `search_products`. Use catalog ids returned by tools; do not invent ids.
2. For a PC, call `begin_build` with the shopper's brief and exact budget. Optionally pass `budgetShares` as allocation hints. Choose the first slot yourself from the shopper's goals; the tool does not choose one for you.
3. Use `list_compatible_parts` for fitting candidates. For the focused GPU pass, `mode: "ranked"` with `slot: "gpu"` scans the full compatible pool within its ceiling and returns a simulated primary plus an in-stock fallback. It is not an automatic recommendation.
4. Apply the agent's own choice using `set_build_component`. No prior inspection is required because stock, fit and budget are rechecked at commit. Explain trade-offs to the shopper; optional `reason`, `tradeoff` and `alternativeId` fields are notes, not proof of reasoning.
5. Verify with `check_build_compatibility`. Use `compare_build_options` for explicit counterfactual swaps; it does not apply them and does not certify a global optimum.
6. Only after the shopper requests the cart action, use `add_to_cart` or `add_build_to_cart`. Use `get_cart` for the final line, price and stock review.

## Agent selects the build

1. Call `begin_build` with the shopper brief and exact USD budget. This opens the existing builder without selecting any slot or part. If the shopper gives slot shares, pass `budgetShares` such as `{cpu: 20, gpu: 40}`; the response returns dollar hints for every slot and allocates the remainder by resolution. Decide the first slot from the shopper's goals, then select parts in the order that makes sense for the build. Existing selections remain unless reset is explicitly requested.
2. Search products. For a PC, `list_compatible_parts` can return one slot, a bounded `slots` batch or `allRemaining`, with the current slot allowance and optional `maxPrice`, `sort` and compact details. For the focused GPU decision, pass `mode: "ranked"`, `slot: "gpu"` and an optional `maxPrice`; it returns the strongest fictional-game-simulation primary, the next in-stock fallback and a watchdog gate when the real listing qualifies.
3. Choose a product with `set_build_component` using slot and productId. Reason, tradeoff and alternativeId are optional notes. Explain material tradeoffs in conversation. Current stock, fit and budget are validated on every selection, without requiring reinspection after changes.
4. Repeat for the remaining slots; choosing a case includes its fans. Read `check_build_compatibility` to verify the complete build, stock and budget. Cart and checkout remain separate requested actions.
5. Maximize benefit for shopper use within the whole budget, not savings by default. Use `compare_build_options` with a relevant upgrade near the limit, especially GPU for gaming. Derive component price limits from the rest of the build rather than arbitrary caps. Choose the same fictional scenario for all options and explain assumptions. Apply your own changes and compare again. Explain unused budget; missing data are not proof of equal performance.

The site cannot prove an agent understands a component or that every sentence it writes is true. Domain safety checks remain mandatory. See ADR 0009 and ADR 0013.

## Contract and limits

Game-labeled simulation: pass `game` as `counter-strike-2`, `fortnite` or `cyberpunk-2077` to `compare_build_options`. Do not combine it with `scenario`. Results identify the fixed preset and `rigsmith-game-simulation-v2` dataset. Protocols are Counter-Strike 2 Very High native raster; Fortnite Ultra DX12 with 100% TAA, Nanite off, hardware RT off and software Lumen enabled; and Cyberpunk 2077 Ultra native raster. All use no upscaling or frame generation. GPU average-FPS anchors are calibrated against cited external reviews where comparable; other GPU tiers are simulated scaling, while 1% lows and CPU/build limits remain authored simulation inputs. These are simulated fixtures, not measured or predicted real-game FPS. See ADR 0011.

UI and tools share controller commands for selections, quantity and build/cart admission. Commands finish after React commits. Builds must be complete, have no known compatibility conflict, be available and fit the hard budget. Quantity is a whole number, at most five per product line, also bounded by stock across product and build lines. Zero removes a line.

Catalog prices and stock are synthetic. Measured FPS and noise remain unavailable. `compare_build_options` returns versioned, explicitly labeled simulated benchmarks for competitive or cinematic workloads. These use authored category fixtures and an explicit CPU/GPU minimum-ceiling protocol, not the old clock/core formula. GPU averages use calibrated review anchors only for comparable source protocols; unmeasured tiers, 1% lows, CPU limits and whole-build limits remain fictional. Storage loading time is separate from FPS. See ADR 0010 and the category benchmark documents. Simulation can support choices inside the fictional scenario, never real-world performance claims. Seven compatibility rules are implemented; a pass is not complete physical/BIOS certification.

Read-only tools do not move the UI; `show_in_catalog`, `begin_build` and `set_build_component` do. The demo registers a stable allowlist from `DEMO_TOOL_NAMES`; route changes do not churn it. Results normally have a 1500-character budget; build reports and counterfactual comparisons use 3000 or 6000 as documented below. Truncated lists disclose omitted entries. Agent reasons stay in command state; there is no additional explanation panel in the storefront. Existing build lines track the editable build and are revalidated before cart admission.

## Tools

| Tool | Kind | Screens | Required |
| --- | --- | --- | --- |
| `search_products` | read | all | — |
| `get_product` | read | all | productId |
| `compare_products` | read | all | productIds |
| `show_in_catalog` | write | all | — |
| `list_compatible_parts` | read | category, product, builder | — |
| `set_build_component` | write | category, product, builder | slot |
| `check_build_compatibility` | read | all | — |
| `begin_build` | write | home, category, product, builder | brief, budget |
| `compare_build_options` | read | all | alternatives |
| `create_watchdog` | write | category, product | productId |
| `add_to_cart` | write | category, product | productId |
| `add_build_to_cart` | write | builder, cart | — |
| `get_cart` | read | all | — |

### `search_products`

Search the catalog of PC parts, phones and consoles. Prices are US dollars. Phone results group storage variants by model by default; set distinctModels false when a tier is needed. Use show_in_catalog to put a matching product on screen. Keep inStockOnly off while comparing so slow or unavailable options stay visible.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** `{ total, showing, offset, items, nextOffset }`, plus `distinctModels: true` for grouped phone searches. Each item is a compact listing with `id`, `name`, `brand`, `price`, `stock`, and `shipsInDays`; slow or unavailable items carry a concern and watchdog offer. Results are truncated with `omitted` when necessary.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `query` | string | Free text over name, model, description and specifications. |
| `category` | string | Category scope; omit for whole-catalog text search. Values: cpu, gpu, board, ram, storage, cooler, psu, case, fans, phones, consoles. |
| `brand` | string | Spelled as the catalog spells it. |
| `minPrice` | number | Lowest price. |
| `maxPrice` | number | Highest price. |
| `inStockOnly` | boolean | Final-selection filter. Omit while comparing so slow or unavailable candidates remain visible. |
| `onSale` | boolean | On sale only. |
| `sort` | string | Ordering by catalog order, price or delivery time. Values: popular, price, priceDesc, new. |
| `filters` | object | Facet id to values, from list_filters. Needs category. |
| `distinctModels` | boolean | Phones: group storage variants and return one listing per model. Default true for phones. |
| `limit` | number | 1 to 20, default 5. |
| `offset` | number | Start after this many matches, default 0. Use nextOffset to see more. |

### `get_product`

Return one listing's price, availability, delivery, description and compatibility facts. Use show_in_catalog separately when the shopper should see its detail page.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** A compact product detail object: listing identity, synthetic flag, category, price, stock, shipping date, description, up to six specs, normalized compatibility/device facts, and a relative product URL.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `productId` | string | Id from another tool. |

### `compare_products`

Compare two to four listings by price, stock, delivery and differing specifications. Set includeDetails for compact descriptions and facts in the same read. Use show_in_catalog separately when the shopper should follow a product page. If a stronger listing is slow or unavailable, ask before creating a watchdog or silently substituting it.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** `{ shared, items }`. Each item has identity, price, stock, delivery, only the differing normalized facts, and optional compact details. The comparison is read-only.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `productIds` | array | Two to four catalog ids. |
| `includeDetails` | boolean | Include compact descriptions and compatibility facts. |

### `show_in_catalog`

Change only the visible page so the shopper can follow along: open a category, product, builder or cart. A product view also returns its compact detail data, so do not call get_product for the same id unless a field is missing. Use one visible product call per candidate; it does not edit the build, cart or watch list.

**Descriptor hints:** `readOnlyHint: false`.

**Result and behavior:** Returns which view was shown. Product view also returns the same compact detail payload as `get_product`; category view returns the number of matching listings. It changes only visible navigation/filter state.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `view` | string | Default: category listing. Values: category, product, builder, cart. |
| `category` | string | Category to show. Values: cpu, gpu, board, ram, storage, cooler, psu, case, fans, phones, consoles. |
| `productId` | string | Required when view is 'product'. |
| `query` | string | Text for the search box. |
| `brand` | string | Brand name, or 'any'. |
| `minPrice` | number | Lowest price in US dollars. |
| `maxPrice` | number | Highest price in US dollars. |

### `list_compatible_parts`

Parts that fit the current build. Use mode ranked with slot gpu and maxPrice to scan every matching compatible GPU and return the strongest simulated-game card plus the next in-stock fallback in one read; no second price-sorted call is needed. Use list mode for ordinary candidates or allRemaining. Nothing returned can break the machine.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** List mode returns one row per requested slot with fitting count, catalog count, budget share/allowance, and candidate items. Ranked GPU mode returns a complete ranking scan, `primary`, optional in-stock `fallback`, and a guarded `watchdogOffer`; it never selects a part.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `slot` | string | One slot to fill; use slots or allRemaining for a batch. Values: cpu, gpu, board, ram, storage, cooler, psu, case, fans. |
| `slots` | array | Bounded batch of slots to fill. |
| `allRemaining` | boolean | Return every currently unselected build slot. |
| `maxPrice` | number | Highest price. |
| `filters` | object | Facet id to values for a single slot; use list_filters first. |
| `sort` | string | Ordering; default catalog order. Values: popular, price, priceDesc, new. |
| `mode` | string | Use ranked for one GPU primary and fallback; default list. Values: list, ranked. |
| `includeDetails` | boolean | Include compact descriptions and compatibility facts. |
| `limit` | number | 1 to 10, default 5. |

### `set_build_component`

Select a catalog part you chose. No prior inspection call required: current stock, compatibility and hard budget are checked when applying. Opens the selected builder slot. Explain material tradeoffs in conversation; reason, tradeoff and alternativeId are optional notes. A case includes its fans atomically. Reset clears a slot. No automatic recommendations.

**Descriptor hints:** `readOnlyHint: false`.

**Result and behavior:** Returns the changed slot, selected part, selected price, remaining budget, selected count, completeness and compatibility. Selecting a case also returns its bundled fan id. The successful command navigates to the builder and focuses the changed slot.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `slot` | string | Slot to change. Values: cpu, gpu, board, ram, storage, cooler, psu, case, fans. |
| `productId` | string | Chosen catalog product id. Required for set. |
| `action` | string | Default set; reset clears the slot. Values: set, reset. |
| `reason` | string | Optional short reason for this choice. |
| `alternativeId` | string | Optional different catalog product from the same slot. |
| `tradeoff` | string | Optional tradeoff or uncertainty. |

### `check_build_compatibility`

One-call build report: all nine selected slots with price, stock and delivery, plus total, compatibility, sockets, GPU clearance, PSU headroom and performance availability. Use begin_build or list_compatible_parts for budget allocation hints. On a clash, choose another compatible part with list_compatible_parts.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** For an incomplete build, returns selected slots, missing slots, partial price, compatibility issues and no performance estimate. For a complete build, returns all nine slots with stock/delivery, total, availability, seven-rule compatibility, PSU/power, socket, clearance, simulated benchmark payload and unavailable measured-performance fields.

No parameters.

### `begin_build`

Open the configurator with the brief and hard budget. Optional budgetShares gives slot percentages as planning hints. Choose the starting slot and every part yourself with candidate reads and set_build_component. Preserve selections unless reset is requested. Compatibility, stock and the exact whole-build budget win.

**Descriptor hints:** `readOnlyHint: false`.

**Result and behavior:** Returns the opened route, exact budget/resolution, full resolution-aware or shopper-supplied slot allocation, and next-step guidance. It never selects a starting slot or part; the agent owns the build order.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `brief` | string | Shopper needs and constraints, 5–500 characters. |
| `budget` | number | Hard ceiling in USD. Never silently increase it. |
| `resolution` | string | Default: 1440p. Values: 1080p, 1440p, 4K. |
| `budgetShares` | object | Optional slot percentages; omitted slots share the remainder. |
| `reset` | boolean | Discard existing selections only if requested. Default false. |

### `compare_build_options`

Compare 1–3 alternatives YOU propose: cost, eligibility and SIMULATED FPS/1% lows. For the watchdog scenario, pass all three games in one call and usually compare only 1–2 GPU alternatives. The gate appears only for an under-budget compatible baseline when a GPU averages >=10% more across all games, regresses in none, and is out of stock or ships in 3+ days. Ask before create_watchdog. Fixtures are not measurements; this does not apply changes.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** Returns an unchanged baseline and one to three agent-supplied counterfactuals with price, budget, eligibility, compatibility blockers, simulated results and deltas. It may return a watchdog offer only when the complete gate passes. It never mutates the current build.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `alternatives` | array | Alternative slot-to-product-id changes relative to the current build; unchanged slots are inherited. |
| `scenario` | string | Generic fictional workload, default cinematic. Do not combine with game(s). Values: competitive, cinematic. |
| `game` | string | One game simulation; use games for a batch. Values: counter-strike-2, fortnite, cyberpunk-2077. |
| `games` | array | One to three game simulations in one read. |

### `create_watchdog`

Watch a listing for stock or a price drop. Stays on this device. If a comparison marks a stronger listing as slow or unavailable, ask the shopper first; create the watchdog only after they agree.

**Descriptor hints:** `readOnlyHint: false`.

**Result and behavior:** Returns `{ watching, productId, kind, priceAtWatch }`; repeated creation for the same listing/kind is idempotent and reports `alreadySet: true`. The watch is local session state; no notification is sent.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `productId` | string | Id from another tool. |
| `kind` | string | Default: availability. Values: availability, price. |

### `add_to_cart`

Add one product to the cart. Does not purchase anything: use only when the shopper requested a cart change, and never add what they have not agreed to.

**Descriptor hints:** `readOnlyHint: false`.

**Result and behavior:** Returns `{ added, quantity, cartLines }` after adding or increasing a product line. It validates quantity, catalog identity, stock across the cart, and any build line already present; it does not purchase.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `productId` | string | Id from another tool. |
| `quantity` | number | 1 to 5, default 1. |

### `add_build_to_cart`

Put the assembled PC in the cart as one line and open the cart. Requires all parts selected, compatible, available and within budget. Does not place an order.

**Descriptor hints:** `readOnlyHint: false`.

**Result and behavior:** Returns `{ added: "build", alreadyAdded, price }` and opens the cart. The build is one cart line with quantity one and is admitted only when complete, compatible, in stock, and within the hard budget.

No parameters.

### `get_cart`

Final cart check: every line with quantity and price, subtotal, shipping, total and delivery. Call after the requested phone and PC have been added, or when the shopper asks. Do not call at the start just to inspect an unchanged cart. Never checks out or pays.

**Descriptor hints:** `readOnlyHint: true`.

**Result and behavior:** Returns cart lines with stable zero-based `line` indexes, kind, id, name, quantity and prices, plus item count, subtotal, shipping, total, free-shipping threshold, delivery date and `blockedBy`. It never checks out.

No parameters.

## Errors

Errors are JSON with `error` and, where useful, a recovery `hint`; error results set `isError: true`. Failed mutations do not apply the intended domain state. The complete error catalogue is:

| Code | Meaning and recovery |
| --- | --- |
| `build_incompatible` | Selected or proposed parts violate one of the seven known compatibility rules. Use `list_compatible_parts` or choose another part. |
| `build_incomplete` | Fewer than all nine PC slots are explicitly selected. Select the missing slots first. |
| `category_required` | Facet filters need one category. Pass `category` or use `list_filters` first. |
| `command_failed` | A non-domain exception prevented a state command from completing. Retry and inspect the current state. |
| `conflicting_arguments` | Mutually exclusive selection arguments were supplied together. Choose exactly one mode. |
| `conflicting_workload` | A generic scenario and game workload were combined. Choose `scenario`, `game`, or `games`. |
| `duplicate_alternative` | An alternative is identical to the current build or another alternative. Change at least one slot. |
| `filters_require_one_slot` | Facet filters are supported only for a single requested build slot. |
| `insufficient_stock` | Aggregate cart demand is greater than current stock across product and build lines. Reduce quantity or choose another listing. |
| `invalid_alternative` | The optional `alternativeId` is the same as the selected id or is not in the same slot. |
| `invalid_alternatives` | The counterfactual list or slot-to-product changes are malformed. Supply one to three non-empty alternatives using valid slot ids. |
| `invalid_brief` | `begin_build.brief` must be a trimmed shopper summary of 5–500 characters. |
| `invalid_budget` | The budget must be a finite positive number. |
| `invalid_budget_allocation` | `budgetShares` is not a valid PC-slot percentage map, contains an unknown slot/value, or exceeds 100% total. |
| `invalid_game` | Use one of the listed game ids: `counter-strike-2`, `fortnite`, or `cyberpunk-2077`. |
| `invalid_mode` | Use `list` or `ranked` for `list_compatible_parts`. |
| `invalid_quantity` | Quantity must be a whole number from zero through the allowed maximum. |
| `invalid_reason` | Optional build-decision notes must be strings no longer than 600 characters for `reason` and 400 for `tradeoff`. |
| `invalid_scenario` | Use the generic scenario `competitive` or `cinematic`. |
| `invalid_slot` | The requested value is not one of the nine PC build slots. |
| `missing_argument` | A required field or selection mode is missing. Read the schema and pass the named field(s). |
| `no_compatible_gpu` | No compatible GPU exists at or below the ranked-mode ceiling. Raise the ceiling only if it remains within the shopper budget. |
| `out_of_stock` | The product or a selected build part has zero available units. Do not silently substitute it. |
| `over_budget` | The selected or proposed complete build exceeds the agreed whole-build budget. |
| `product_not_found` | The id is not a current catalog listing. Re-search and use an id returned by a tool. |
| `ranked_requires_gpu` | Ranked mode is defined only for the GPU slot; pass `slot: "gpu"` or omit `slot`. |
| `result_too_large` | The safe result budget was exceeded. Ask for fewer candidates, fewer details, or one product by id. |
| `tool_failed` | The guarded tool handler threw an exception. Retry; the error hint is truncated to 140 characters. |
| `unknown_filter` | The facet id is not supported by that category. Call `list_filters` and reuse its ids. |
| `wrong_fan_pack` | Fans bundled with another case cannot be selected independently. Select the case that owns the pack. |
| `wrong_slot` | The product id does not belong to the requested PC slot. |
