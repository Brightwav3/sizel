# Sizel

> **Naming note:** Sizel was developed under the working title **Rigsmith**. Some internal identifiers and historical documentation still use Rigsmith.

> Current selection contract (ADR 0009): inspection and explanation fields are optional. Select known catalog ids directly; current stock, compatibility and budget checks remain mandatory. Earlier descriptions of required inspection below are historical.

Sizel is a demo electronics store for phones, gaming consoles and PC components, designed for shoppers and browser agents. Product browsing, comparisons and a shopping cart form the storefront; a custom PC builder is one of its shopping tools. It carries a local catalog of 135 product records, shown as 164 listings once phones and consoles expand into their storage tiers. The catalog and shopping actions are exposed through 37 WebMCP tools.

All products, brands, logos, and product images are fictional. The application does not depend on an external catalog API.

## Agent-led building (31 August 2026)

`recommend_build` is no longer exposed. For PC requests, agents start with `begin_build`, decide which slot to solve first, choose catalog products, and apply the complete selection with `set_build_components`. `begin_build` accepts optional `budgetShares`, such as {cpu: 20, gpu: 40}, and returns dollar allowances for every slot. It never selects a starting slot or part. Omitted slots receive the resolution-aware remainder; these are planning hints, not hard caps. `list_compatible_parts` repeats the current slot allowance next to fitting candidates and can batch several slots, while `compare_build_options` calculates explicit simulated results and deltas for alternatives supplied by the agent. Phone searches group storage variants by model by default, so one search can supply distinct comparison candidates. `inspect_build_options` is optional when more facts are needed, as are reason and tradeoff fields. The existing builder opens before selection and shows the selected parts as the agent works. Material tradeoffs belong in the agent conversation, not an additional page panel.

Build and cart writes share UI validation and finish after React commits. A complete build must fit the exact budget and stock limits before checkout. Catalog data remain synthetic; checkout is a preview, not a payment or order service. See [ADR 0007](docs/decisions/0007-agents-select-and-explain-parts.md).

`compare_build_options` evaluates whole-build alternatives supplied by the agent, including multiple-part platform changes, without choosing or applying them. It compares cost, budget and known orderability checks; unavailable benchmark evidence must not be treated as proof of equal performance or value. It does not certify the best build. See [ADR 0008](docs/decisions/0008-whole-build-counterfactual-comparison.md) and the [agent decision test](docs/agent-choice-test.md). That test prompt is an evaluation harness, not a required shopper prompt: the workflow is also described in the tools themselves.

When the agent compares alternatives across all three game simulations, the result includes their availability, delivery and performance deltas. The agent decides whether a slow or unavailable option matters for the shopper and asks before calling `create_watchdog`; the comparison tool does not make that decision.

## Start here

### Simulated benchmarks

Game-labeled simulations are available through `game: "counter-strike-2"`, `"fortnite"` or `"cyberpunk-2077"` in `estimate_performance` and `compare_build_options`. Two additional category agents authored independent CPU and GPU fixtures. Results include fixed presets, average FPS and 1% lows, and are explicitly invented test data, **not real-game measurements or predictions**. Choose `game` or a generic `scenario`, not both. See [the game simulation protocol](docs/decisions/0011-game-labeled-simulation-fixtures.md).

Three category-specific agents authored CPU, GPU, and memory/storage fixtures. `estimate_performance` and `compare_build_options` expose `competitive` and `cinematic` scenarios at 1080p, 1440p and 4K, including simulated average FPS, 1% lows and loading time. Every result is versioned and labeled simulation; measured FPS and noise remain unavailable. The shop compares agent-proposed options without selecting a winner. See [the simulation protocol](docs/decisions/0010-explicit-simulated-benchmarks.md), [CPU fixtures](docs/benchmarks-cpu.md), [GPU fixtures](docs/benchmarks-gpu.md) and [memory/storage fixtures](docs/benchmarks-memory-storage.md).

PC building is a constraint-solving task wearing a product catalog's clothes. A
person knows the performance they want; the shop asks them to reason about
sockets, memory standards, case clearance and power headroom at the same time.
WebMCP lets an agent do that reasoning against structured tools while the
person watches it happen on the page and keeps the final say.

Two things this shop can answer that clicking cannot:

- **`fix_build_issue`** — a compatibility message states a conflict but never
  names the part to change. This returns the swaps that clear it, smallest
  price change first, with what each does to the frame rate.
- **`explain_build_bottleneck`** — the frame-rate model knows which component
  caps the graphics card. No screen has ever shown that.

| If you have | Read |
| --- | --- |
| Three minutes | [docs/demo-script.md](docs/demo-script.md) — what to say to an agent, and what should happen |
| Ten minutes | [docs/webmcp-architecture.md](docs/webmcp-architecture.md) — how the layer is built and what it guarantees |
| A terminal | `npm install && npm test` — regression tests, including the tool contract |

## Project origin

The project started on 29 August 2026 by importing a design of my own from Claude
Design, and has been extended in this repository ever since. The first commit
therefore lands the imported baseline in one piece; everything after it is work
done on top of it. Nothing in the repository predates the WebMCP Challenge
submission period.

## Quick start

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run check:catalog` | Validate product IDs, category coverage, SQLite, brands, and image paths |
| `npm run audit:catalog` | Validate the catalog adapter, routes, and screens |

## Product capabilities

- Browse 164 listings across PC parts, phones, and consoles.
- Filter by price, brand, availability, and per-category technical facets.
- Choose a storage tier or finish on phones and consoles.
- Read ratings and reviews.
- Build a nine-part PC from one shared application state.
- Check socket, memory, case-clearance, cooling, and power compatibility.
- Watch a listing for stock or a price drop.
- Carry the same build into the floating summary, cart, and checkout.

## Architecture

`RigsmithApp` owns application lifecycle and the single active build. Feature folders own route UI and view-models, entities own reusable product and build rules, and shared contains layout and UI primitives.

```text
src/
  app/          application composition, routes, and state
  app/webmcp/   WebMCP tool definitions and their registration lifecycle
  features/     catalog, product, search, cart, checkout, and PC builder
  entities/     reusable product, build, cart, and checkout rules
  shared/       UI primitives, layout, styles, and shared types
  data/catalog/ canonical catalog adapter and storefront listing data
```

Each domain rule has one owner, read by both a screen and a tool: build
metrics and compatibility in `entities/build`, cart totals in `entities/cart`,
checkout fields in `entities/checkout`. An agent therefore cannot quote a
figure the shopper is not looking at.

The canonical frontend catalog is `public/catalog/products.json`. Architectural
decisions are recorded in `docs/decisions/`, and `docs/ARCHITECTURE.md`
describes the UI layering.

## WebMCP Challenge status

The interactive application, the local catalog, and the WebMCP tool set are working. Deployment, the public repository URL, and the demo video are still pending.

Thirty-seven tool descriptors are implemented in `src/app/webmcp/`; the
judge-facing demo registers thirteen stable tools from that list. The demo
keeps the same descriptors while the shopper moves between the catalogue,
product pages and the builder. `show_in_catalog` makes visible navigation
explicit, while read tools return data without changing the route. The full
descriptor list remains available for a future storefront profile, and results
are held inside Chrome's 1.5K character budget.

| Tool | What it does |
| --- | --- |
| `read_shop` | Read-only multi-section snapshot with no navigation |
| `search_products` | Search the catalog by text, category, brand, price or stock |
| `get_product` | One full record, with the facts compatibility checks use; use `show_in_catalog` to display it |
| `get_current_build` | The nine slots on screen, with price, frame rate and power |
| `list_filters` | The filters a category supports, so filter names are never guessed |
| `list_brands` | Every brand and its listing count, for exact spelling |
| `get_deals` | What the shop is flagging as on sale or newly arrived |
| `compare_products` | Two to four listings, showing only where they differ; use `show_in_catalog` for pages |
| `check_stock` | Stock on hand and the delivery date |
| `show_in_catalog` | Put a category, product, builder or cart on the shopper's screen |
| `list_compatible_parts` | Fitting parts for one slot or a bounded batch, with budget-share hints |
| `set_build_component` | Fit a part, or return a slot to its default |
| `set_build_components` | Apply the agent's complete PC selection atomically |
| `check_build_compatibility` | All nine slots with stock and delivery, conflicts in plain sentences, power headroom |
| `estimate_performance` | Frame rate, noise, price, power and delivery |
| `explain_build_bottleneck` | The part holding the frame rate down, and what it costs |
| `fix_build_issue` | Swaps that clear a conflict, smallest price change first |
| `begin_build` | Open the builder with the brief, hard budget and optional slot-share hints |
| `inspect_build_options` | Return candidate facts and focus the existing builder slot |
| `compare_build_options` | Compare agent-proposed whole-build alternatives without ranking or applying them |
| `set_build_target` | Budget, resolution, frame rate and noise preference |
| `undo_build_change` | Step the build back one change |
| `create_watchdog` | Watch a listing for stock or a price drop |
| `list_watchdogs` | What is being watched, with the price then and now |
| `remove_watchdog` | Stop watching a listing |
| `list_categories` | The departments and categories, with listing counts |
| `get_product_variants` | The storage tiers and finishes one device is sold in |
| `get_reviews` | Rating and recent reviews, labelled as untrusted content |
| `select_product_variant` | Open one storage tier or finish on screen |
| `focus_builder_slot` | Move the configurator to the part being discussed |
| `compare_build_to_product` | The build against a console or phone |
| `add_to_cart` | Add one product to the cart |
| `add_build_to_cart` | Add the assembled PC, refusing while it does not fit |
| `get_cart` | Every cart line, subtotal, shipping, total and delivery |
| `update_cart_line` | Change a line's quantity, or remove it |
| `start_checkout` | Open the checkout; it never fills in the shopper's details |
| `get_checkout_fields` | What checkout will ask for, so the shopper can have it ready |

Read-only tools carry `readOnlyHint`, so an agent can tell which calls are
safe to make without asking. The ones that spend money or change the build do
not: `add_build_to_cart` refuses outright while a conflict is open, and
`start_checkout` stops at the delivery step rather than placing an order.
`get_reviews` returns text written by other shoppers, so it carries
`untrustedContentHint`.

### Documentation

| Document | What it covers |
| --- | --- |
| [docs/webmcp-tools.md](docs/webmcp-tools.md) | Every tool: parameters, results, screens, error codes |
| [docs/webmcp-architecture.md](docs/webmcp-architecture.md) | How the layer works, budgets, safety posture, performance, testing |
| [docs/decisions/0007-agents-select-and-explain-parts.md](docs/decisions/0007-agents-select-and-explain-parts.md) | Why agents now select and explain parts themselves |
| [docs/demo-script.md](docs/demo-script.md) | What to say to an agent, and which tool each line reaches |
| [docs/decisions/](docs/decisions/) | Architectural decision records |

### Running the tools locally

1. Open `chrome://flags/#enable-webmcp-testing` and set it to **Enabled**.
2. Relaunch Chrome, then run `npm run dev`.
3. Install the [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) to list the registered tools and call them by hand.

Without WebMCP the shop runs exactly as before: registration is skipped when
`document.modelContext` is absent. A deployed build additionally needs an
origin trial token and an origin-isolated document, so do not serve it with
`Origin-Agent-Cluster: ?0`.

## Data and licensing

- `public/catalog/products.json` — canonical product catalog.
- `public/catalog/products.db` — SQLite copy for inspection.
- `public/catalog/images/` — local fictional product imagery.
- `public/catalog/logos/` — fictional brand logos.
- `public/catalog/brand-guides/` — fictional brand guides.

The source code is licensed under the MIT License. See `LICENSE`.
