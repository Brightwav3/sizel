# Rigsmith

Rigsmith is a fictional electronics shop and PC configurator built for a human-and-agent workflow. The app includes a 135-product local catalog, component selection, compatibility checks, a persistent build summary, and checkout screens.

All products, brands, logos, and product images are fictional. The application does not depend on an external catalog API.

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
| `npm run check:catalog` | Validate product IDs, category coverage, SQLite, brands, and image paths |
| `npm run audit:catalog` | Validate the catalog adapter, routes, and screens |

## Product capabilities

- Browse 135 products across PC parts, phones, and consoles.
- Filter by price, brand, availability, and technical specifications.
- Build a nine-part PC from one shared application state.
- Check socket, memory, case-clearance, cooling, and power compatibility.
- Carry the same build into the floating summary, cart, and checkout.

## Architecture

`RigsmithApp` owns application lifecycle and the single active build. Feature folders own route UI and view-models, entities own reusable product and build rules, and shared contains layout and UI primitives.

```text
src/
  app/          application composition, routes, and state
  features/     catalog, product, search, cart, checkout, and PC builder
  entities/     reusable product queries and build calculations
  shared/       UI primitives, layout, styles, and shared types
  data/catalog/ canonical catalog adapter and storefront listing data
```

The canonical frontend catalog is `public/catalog/products.json`. Architectural decisions are recorded in `docs/decisions/`.

## WebMCP Challenge status

The interactive application, the local catalog, and the WebMCP tool set are working. Deployment, the public repository URL, and the demo video are still pending.

Nineteen tools are registered from `src/app/webmcp/`. They follow the screen: a
route offers only the tools it can honour, so the cart never exposes a build
editor. Every handler reads and writes the same state the shopper sees, and
results are held inside Chrome's 1.5K character budget.

| Tool | What it does |
| --- | --- |
| `search_products` | Search the catalog by text, category, brand, price or stock |
| `get_product` | One full record, with the facts compatibility checks use |
| `get_current_build` | The nine slots on screen, with price, frame rate and power |
| `list_filters` | The filters a category supports, so filter names are never guessed |
| `compare_products` | Two to four listings, showing only where they differ |
| `check_stock` | Stock on hand and the delivery date |
| `show_in_catalog` | Put the agent's own search on the shopper's screen |
| `list_compatible_parts` | Parts for one slot that fit the build on screen |
| `set_build_component` | Fit a part, or return a slot to its default |
| `check_build_compatibility` | Conflicts in plain sentences, plus power headroom |
| `estimate_performance` | Frame rate, noise, price, power and delivery |
| `explain_build_bottleneck` | The part holding the frame rate down, and what it costs |
| `fix_build_issue` | Swaps that clear a conflict, smallest price change first |
| `recommend_build` | A whole machine for a budget, proposed or applied |
| `set_build_target` | Budget, resolution, frame rate and noise preference |
| `undo_build_change` | Step the build back one change |
| `create_watchdog` | Watch a listing for stock or a price drop |
| `add_to_cart` | Add one product to the cart |
| `add_build_to_cart` | Add the assembled PC, refusing while it does not fit |

Read-only tools carry `readOnlyHint`, so an agent can tell which calls are
safe to make without asking. The four that spend money or change the build do
not, and `add_build_to_cart` refuses outright while a conflict is open.

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
