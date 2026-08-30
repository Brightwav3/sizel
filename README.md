# Rigsmith

Rigsmith is a fictional electronics shop and PC configurator built for a human-and-agent workflow. The app includes a 135-product local catalog, component selection, compatibility checks, a persistent build summary, and checkout screens.

All products, brands, logos, and product images are fictional. The application does not depend on an external catalog API.

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
| `npm run audit:prototype` | Validate the catalog adapter, routes, screens, and prototype CSS |

## Product capabilities

- Browse 135 products across PC parts, phones, and consoles.
- Filter by price, brand, availability, and technical specifications.
- Build a nine-part PC from one shared application state.
- Check socket, memory, case-clearance, cooling, and power compatibility.
- Carry the same build into the floating summary, cart, and checkout.

## Architecture

`RigsmithApp` owns application lifecycle and the single active build. `app/buildContext.ts` calculates shared derived data once. Domain modules under `app/vals/` expose route-specific view-models to screens.

```text
src/library/
  app/          application state, navigation, shared calculations, domain view-models
  data/         canonical catalog adapter and compatibility calculations
  screens/      route-level UI
  shell/        top bar, navigation, catalog filters, and page shell
  overlays/     floating build summary and toast
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
