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

The interactive application and local catalog are working. WebMCP tool registration, deployment, public repository URL, and demo video are still pending. Planned tools are documented in `docs/hackathon-submission.md`; the repository does not claim they are implemented yet.

## Data and licensing

- `public/catalog/products.json` — canonical product catalog.
- `public/catalog/products.db` — SQLite copy for inspection.
- `public/catalog/images/` — local fictional product imagery.
- `public/catalog/logos/` — fictional brand logos.
- `public/catalog/brand-guides/` — fictional brand guides.

The source code is licensed under the MIT License. See `LICENSE`.
