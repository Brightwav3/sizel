# Rigsmith

Rigsmith is a fictional electronics shop and PC configurator built for a human-and-agent workflow. It carries a local catalog of 135 product records, shown as 164 listings once phones and consoles expand into their storage tiers, with component selection, compatibility checks, a persistent build summary, and checkout screens. The same catalog and the same live build are exposed to browser agents through 33 WebMCP tools.

All products, brands, logos, and product images are fictional. The application does not depend on an external catalog API.

## Start here

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
| A terminal | `npm install && npm test` — 107 tests, including the tool contract |

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

Thirty-three tools are registered from `src/app/webmcp/`. They follow the
screen: a route offers only the tools it can honour, so the cart never exposes
a build editor and the checkout offers no catalog browsing. No screen presents
more than twenty. Every handler reads and writes the same state the shopper
sees, and results are held inside Chrome's 1.5K character budget.

| Tool | What it does |
| --- | --- |
| `search_products` | Search the catalog by text, category, brand, price or stock |
| `get_product` | One full record, with the facts compatibility checks use |
| `get_current_build` | The nine slots on screen, with price, frame rate and power |
| `list_filters` | The filters a category supports, so filter names are never guessed |
| `list_brands` | Every brand and its listing count, for exact spelling |
| `get_deals` | What the shop is flagging as on sale or newly arrived |
| `compare_products` | Two to four listings, showing only where they differ |
| `check_stock` | Stock on hand and the delivery date |
| `show_in_catalog` | Put the agent's own search on the shopper's screen |
| `list_compatible_parts` | Parts for one slot that fit the build on screen |
| `set_build_component` | Fit a part, or return a slot to its default |
| `check_build_compatibility` | Conflicts in plain sentences, plus power headroom |
| `estimate_performance` | Frame rate, noise, price, power and delivery |
| `explain_build_bottleneck` | The part holding the frame rate down, and what it costs |
| `fix_build_issue` | Swaps that clear a conflict, smallest price change first |
| `recommend_build` | A whole machine for a budget, proposed or applied, never more than ten per cent over |
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
| [docs/build-recommendation.md](docs/build-recommendation.md) | How `recommend_build` decides, measured, with its known limits |
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
