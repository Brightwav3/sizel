# Sizel

> **Naming note:** Sizel was developed under the working title **Rigsmith**. Some internal identifiers and historical documentation still use Rigsmith.

> Current selection contract: select known catalog ids directly; current stock, compatibility and budget checks remain mandatory.

Sizel is a demo electronics store for phones, gaming consoles and PC components, designed for shoppers and browser agents. Product browsing, comparisons and a shopping cart form the storefront; a custom PC builder is one of its shopping tools. It carries a local catalog of 135 product records, shown as 164 shopper-visible listings once phones and selected handheld consoles expand into storage tiers; bundled case fans are not sold as separate listings. The catalog and shopping actions are exposed through 15 WebMCP tools.

All products, brands, logos, product images, reviews, prices, stock, and delivery details are fictional or synthetic demo data. The application does not depend on an external catalog API.

## Agent-led building (31 August 2026)

For PC requests, agents start with `begin_build`, decide which slot to solve first, choose catalog products, and apply the complete selection with `set_build_components`. `begin_build` accepts optional `budgetShares`, such as {cpu: 20, gpu: 40}, and returns dollar allowances for every slot. It never selects a starting slot or part. Omitted slots receive the resolution-aware remainder; these are planning hints, not hard caps. `list_compatible_parts` repeats the current slot allowance next to fitting candidates and can batch several slots, while `compare_build_options` calculates explicit simulated results and deltas for alternatives supplied by the agent. Phone searches group storage variants by model by default, so one search can supply distinct comparison candidates. The public UI path uses the in-progress popup and category/product pages so visual agents compare specifications before selecting. Material tradeoffs belong in the agent conversation, not an additional page panel.

Build and cart writes share UI validation and finish after React commits. A complete build must fit the exact budget and stock limits before checkout. Catalog prices, stock, and delivery are synthetic; checkout is a preview, not a payment or order service.

`compare_build_options` evaluates whole-build alternatives supplied by the agent, including multiple-part platform changes, without choosing or applying them. It compares cost, budget and known orderability checks; unavailable benchmark evidence must not be treated as proof of equal performance or value. It does not certify the best build. See the [agent decision test](docs/agent-choice-test.md). That test prompt is an evaluation harness, not a required shopper prompt: the workflow is also described in the tools themselves.

When the agent compares alternatives across all three game simulations, the result includes their availability, delivery and performance deltas. The agent decides whether a slow or unavailable option matters for the shopper and asks before calling `create_watchdog`; the comparison tool does not make that decision.

## Start here

### Simulated benchmarks

Game-labeled simulations are available through `estimate_performance` and `compare_build_options`. Use canonical ids (`counter-strike-2`, `fortnite`, `cyberpunk-2077`) or common labels such as `CS2`, `Counter-Strike 2`, `Cyberpunk` and `Cyberpunk 2077`. Two additional category agents authored independent CPU and GPU fixtures. Results include fixed presets, average FPS and 1% lows, and are explicitly invented test data, **not real-game measurements or predictions**. Choose `game` or a generic `scenario`, not both. The tool reference describes the fixed presets and their limits.

Three category-specific agents authored CPU, GPU, and memory/storage fixtures. `estimate_performance` and `compare_build_options` expose `competitive` and `cinematic` scenarios at 1080p, 1440p and 4K, including simulated average FPS, 1% lows and loading time. Every result is versioned and labeled simulation; measured FPS and noise remain unavailable. The shop compares agent-proposed options without selecting a winner. See the [CPU fixtures](docs/benchmarks-cpu.md), [GPU fixtures](docs/benchmarks-gpu.md) and [memory/storage fixtures](docs/benchmarks-memory-storage.md).

PC building is a constraint-solving task wearing a product catalog's clothes. A
person knows the performance they want; the shop asks them to reason about
sockets, memory standards, case clearance and power headroom at the same time.
WebMCP lets an agent do that reasoning against structured tools while the
person watches it happen on the page and keeps the final say.

| If you have | Read |
| --- | --- |
| Submission instructions | [SUBMISSION.md](SUBMISSION.md) — setup, WebMCP access, demo flow and verification |
| Demo video | [YouTube](https://youtu.be/OWxUgB0Qxs0) — public, 2 minutes 43 seconds |
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

- Browse 164 shopper-visible listings across PC parts, phones, and consoles; bundled case fans are not separate listings.
- Filter by price, brand, availability, and per-category technical facets.
- Choose a storage tier or finish on phones and consoles.
- Read ratings and reviews.
- Build a nine-slot PC from one shared application state; case fans are included with the case.
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

The canonical frontend catalog is `public/catalog/products.json`. The public
tool reference and submission instructions are in `docs/webmcp-tools.md` and
`SUBMISSION.md`.

## WebMCP Challenge status

The interactive application, the local catalog, and the WebMCP tool set are working. A live demo is available at [sizel.vercel.app](https://sizel.vercel.app/), and the public source repository is [github.com/Brightwav3/sizel](https://github.com/Brightwav3/sizel). The reviewed submission state is on the [`codex/submission-ready` branch](https://github.com/Brightwav3/sizel/tree/codex/submission-ready) while PR #8 remains open. The video comparison recorded 6 minutes 31 seconds without WebMCP and 2 minutes 35 seconds with WebMCP; those are run-specific observations, not a universal benchmark.

Fifteen tool descriptors are implemented in `src/app/webmcp/` and registered
by the judge-facing demo. The demo keeps the same descriptors while the shopper
moves between the catalogue, product pages and the floating build summary.
`show_in_catalog` makes visible navigation explicit, while read tools return
data without changing the route. Ordinary results are held inside Chrome's
1.5K-character budget; larger build reports, detailed comparisons and
compatibility batches use their documented limits.

| Tool | What it does |
| --- | --- |
| `search_products` | Search the catalog by text, category, brand, price or stock |
| `get_product` | One full record, with the facts compatibility checks use; use `show_in_catalog` to display it |
| `get_reviews` | Verified reviews only, or `nekomentovali overeni` when none are verified |
| `compare_products` | Two to four listings, showing only where they differ; use `show_in_catalog` for pages |
| `show_in_catalog` | Put a category, product, or cart on the shopper's screen; use the build pill for the active build |
| `list_compatible_parts` | Fitting parts for one slot or a bounded batch, with budget-share hints |
| `set_build_components` | Apply the agent's complete PC selection atomically |
| `check_build_compatibility` | All nine slots with stock and delivery, conflicts in plain sentences, power headroom |
| `estimate_performance` | Explicitly simulated performance, price, power and delivery; measured FPS and noise remain unavailable |
| `begin_build` | Open the in-place build panel with the brief, hard budget and optional slot-share hints |
| `compare_build_options` | Compare agent-proposed whole-build alternatives without ranking or applying them |
| `create_watchdog` | Watch a listing for stock or a price drop |
| `add_to_cart` | Add one product to the cart |
| `add_build_to_cart` | Add the assembled PC, refusing while it does not fit |
| `get_cart` | Every cart line, subtotal, shipping, total and delivery |

Read-only tools carry `readOnlyHint`, so an agent can tell which calls are
safe to make without asking. The ones that spend money or change the build do
not: `add_build_to_cart` refuses outright while a conflict is open, and
`get_reviews` returns only verified shopper text, so it carries
`untrustedContentHint`.

### Documentation

| Document | What it covers |
| --- | --- |
| [SUBMISSION.md](SUBMISSION.md) | Self-contained setup, testing and judge instructions |
| [docs/webmcp-tools.md](docs/webmcp-tools.md) | Every tool: parameters, results, screens, error codes |
| [docs/webmcp-architecture.md](docs/webmcp-architecture.md) | How the layer works, budgets, safety posture, performance, testing |

### Running the tools locally

1. Open `chrome://flags/#enable-webmcp-testing` and set it to **Enabled**.
2. Relaunch Chrome, then run `npm run dev`.
3. Install the [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) to list the registered tools and call them by hand.

Without WebMCP the shop runs exactly as before: registration is skipped when
`document.modelContext` is absent. A deployed build additionally needs an
origin trial token and an origin-isolated document, so do not serve it with
`Origin-Agent-Cluster: ?0`.

When a browser agent builds a PC without WebMCP, follow the evidence-first
workflow in [`AGENTS.md`](AGENTS.md): use the in-progress build popup to open
each slot's category, open candidate product details, read **Specifications**,
verify them against the current build, and add the part from its product page.
The public `/pc-builder` route is intentionally unavailable; the structured
WebMCP path selects known catalog ids directly; current stock, compatibility
and budget checks remain mandatory.

## Data and licensing

- `public/catalog/products.json` — canonical product catalog.
- `public/catalog/products.db` — SQLite copy for inspection.
- `public/catalog/images/` — local fictional product imagery.
- `public/catalog/logos/` — fictional brand logos.
- `public/catalog/brand-guides/` — fictional brand guides.

The source code is licensed under the MIT License. See `LICENSE`.
