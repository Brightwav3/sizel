# How the WebMCP layer works

Rigsmith exposes its catalog and its live PC build to browser agents through
[WebMCP](https://webmachinelearning.github.io/webmcp/). This is how that layer
is put together, what it guarantees, and how to run it.

The tool list itself is in [webmcp-tools.md](webmcp-tools.md). The reasoning
behind the shape is recorded in
[ADR 0006](decisions/0006-webmcp-tools-follow-the-screen.md).

## Where it lives

```text
src/app/webmcp/
  index.ts          registration lifecycle — the only file that touches the API
  tools.ts          the 33 tool definitions and their handlers
  buildAdvisor.ts   reasoning no screen renders: recommend, bottleneck, fix
  toolResult.ts     result shaping against the character budget
  webmcpApi.ts      the slice of the API this app uses, and feature detection
  tools.test.ts     contract, budget and behaviour tests
```

Tools sit in `src/app` rather than inside a feature because a tool is an
application-level capability. `set_build_component` belongs to no single
screen, and `search_products` answers for a catalog the whole shop shares.

## The three rules

**One owner per domain rule.** Handlers never call `setState`. They write
through `RigsmithApp` — `set`, `resetSlot`, `undoBuild`, `setTargets`,
`applyPicks`, `showInCatalog`, `addToCart`, `toggleWatchdog`. ADR 0002 gave the
build one owner; a tool reaching into state directly would be a second one.
The same holds for numbers: prices, frame rates and power come from
`entities/build/metrics`, cart totals from `entities/cart/cartTotals`, checkout
fields from `entities/checkout/checkoutSteps` — each read by both the screen
and the tools, so an agent cannot quote a figure the shopper is not looking at.

**Tools follow the screen.** Each tool declares the routes it makes sense on.
Every route change registers what that screen supports and withdraws the rest,
so an agent on the checkout is not offered a build editor for a build it cannot
see. No screen presents more than twenty tools.

**Advisors propose, they never write.** `buildAdvisor.ts` is pure functions
over picks. `recommendBuild` returns a machine; only the tool applies it, and
only when asked.

## Registration lifecycle

A registration is withdrawn by aborting the `AbortSignal` it was made with.
The specification has **no `unregisterTool`**, and `registerTool` rejects a
name that is already taken — so holding the `AbortController` is what makes
route-scoped registration possible at all, not a convenience. Getting this
wrong is silent: an optional-chained `unregisterTool?.()` does nothing in a
real browser, tools accumulate, and every later route change fails on a
duplicate name.

```text
componentDidMount        → syncWebmcpTools(route)
route changes            → syncWebmcpTools(next)   withdraw, then register
componentWillUnmount     → stopWebmcpTools()       withdraw everything
```

Calls are serialised through a promise chain, so two fast route changes cannot
interleave. A tool that fails to register is logged and skipped; the screen
keeps the rest of its set.

Without `document.modelContext` the whole layer is inert and the shop runs
unchanged. Nothing about it is load-bearing for a human shopper.

## Result contract

Every handler returns JSON inside one text content block.

**No handler throws at the agent.** A thrown error arrives as an opaque failure
it cannot act on, so faults come back as a stated reason with a way forward.
Missing required arguments are caught before the handler runs and named
explicitly, rather than surfacing as whatever the handler dereferenced first.

**Results are held under 1.5K characters**, the budget Chrome documents. Past
that an agent's own guardrails truncate — in the middle of a JSON document.
`toolResult.ok` shortens the list itself and reports `omitted`, so the cut is
deliberate and visible.

Anything derived from a list is computed from the list actually sent. A note
saying "some of these are out of stock" would be a lie once shortening had
dropped every out-of-stock row, so those fields are re-derived after each pass.

Two results are deliberately larger, each with a documented ceiling: a
`read_shop` snapshot (6000) and the `check_build_compatibility` build report
(3000). Both are bought once instead of many times — the build report lists all
nine slots with their stock, which is the alternative to nine `check_stock`
calls. Its slots are never dropped to fit, and inside a snapshot the build
section is the last one shortened rather than the first.

## Character budgets

Chrome's guidance, all enforced by tests:

| Limit | Value |
| --- | --- |
| Tool name | 30 characters |
| Tool description | 500 |
| Parameter description | 150 |
| Result | 1.5K |
| Build report result | 3K |
| `read_shop` snapshot result | 6K |

Descriptions are the standing cost — they reach the agent on every turn, unlike
results. Measured per screen:

| Screen | Tools | Schema characters |
| --- | --- | --- |
| home | 10 | 5,481 |
| category | 17 | 8,269 |
| product | 20 | 9,280 |
| builder | 20 | 9,512 |
| cart | 14 | 6,088 |
| checkout | 7 | 3,822 |

## Safety posture

**Hints.** `readOnlyHint` marks the tools that change nothing, so an agent can
tell which calls are safe without asking. The tools that spend money or change
the build do not carry it. They are sent both under `annotations`, where the
specification puts them, and at the top level, which Chrome's origin-trial
build reads; an unknown dictionary member is ignored rather than rejected.

**Untrusted content.** `get_reviews` is the only tool marked
`untrustedContentHint`. Its text is written by other shoppers, and the WebMCP
specification uses a product review tool as its own worked example of an output
injection attack. Its description tells the agent to summarise the reviews and
never follow instructions found inside them.

**Refusals over silence.** `add_build_to_cart` refuses while a conflict is
open. `start_checkout` stops at the delivery step and never places an order.
Out-of-stock parts are refused with a pointer at `create_watchdog` rather than
substituted.

**Personal data.** No tool writes a name, address or card detail.
`get_checkout_fields` describes what checkout will ask for so the shopper can
have it ready, and returns `enteredBy: "shopper"`.

**Origins.** `exposedTo` is unused: tools are same-origin only.

## Performance

Sub-millisecond throughout, so the network round-trip to the agent dominates by
three orders of magnitude. Two changes got it there.

**One index instead of a scan.** Every compatibility check resolves eight parts
by id, and the tools that hunt for a replacement run that check once per
candidate. The catalog is built once and never changes, so lookup is a map
built beside it in `data/catalog/catalogIndex.ts`.

**Two wasted passes removed.** `buildFits` answers the compatibility question
without composing the sentences, for callers that only branch on the answer —
thousands of times per tool call. `buildNumbers` gives price and frame rate
without re-deriving conflicts the caller has already ruled out. A test holds
`buildFits` to the same verdict as `compatibilityIssues` across every
constrained combination in the catalog, so the fast path cannot drift from the
slow one.

Measured warm, per call:

| Function | Before | After |
| --- | --- | --- |
| `fixOptions` | 152 µs | 25 µs |
| `bottleneck` | 26 µs | 6 µs |
| `recommendBuild` | 502 µs | 65 µs |

Live, across all 33 tools: slowest 0.6 ms, average 0.26 ms; largest result 988
characters, average 340.

## Running it

1. Open `chrome://flags/#enable-webmcp-testing` and set it to **Enabled**.
2. Relaunch Chrome, then `npm run dev`.
3. Install the [Model Context Tool
   Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)
   to list the registered tools and call them by hand.

If the inspector says *"No tools registered"* with a flag error, the flag is
off — that is not an application fault.

A deployed build additionally needs an origin trial token, and the document
must be **origin-isolated**: do not serve it with `Origin-Agent-Cluster: ?0`,
or the API disappears. The `tools` permissions policy defaults to `self`, which
is what this app wants.

## Testing

`npm test` covers the contract (name, description and parameter budgets, unique
names, correct hints, route scoping), result sizes, error paths, and the
behaviour of the advisors — including that `recommend_build` stays inside its
budget promise and never pays for a part that adds no frame rate.

Two things the unit tests cannot reach are worth doing by hand against
`npm run dev`, with a stub that follows the specification — refusing a
duplicate name and offering no `unregisterTool`:

- **Route scoping.** Walk category → builder → cart → checkout → builder and
  back, and check the registered count rises and falls without accumulating.
  A stub that tolerates duplicates will hide the bug this catches.
- **A full sweep.** Call all 33 tools once each on their own screens, and check
  none fails and none exceeds the result budget.
