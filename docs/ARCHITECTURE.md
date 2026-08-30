# Rigsmith UI architecture

The UI is a React and TypeScript application built around one active PC build.

## Runtime flow

```text
RigsmithApp
  -> buildContext
  -> feature and layout *Vals
  -> RigsmithView
  -> AppShell + active screen + overlays
```

- `src/app/App.tsx` owns lifecycle, navigation synchronization, and build mutations.
- `src/app/state/AppState.ts` defines the single application state.
- `src/entities/build/buildContext.ts` computes shared catalog, compatibility, and merchandising data once per render.
- `src/entities/build/buildVals.ts` composes domain view-models.
- `src/features/` owns route experiences and their feature-specific view-models.
- `src/shared/layout/` owns persistent navigation and the application shell.
- `src/shared/ui/` owns reusable presentation primitives.

## State ownership

`AppState.picks` is the only active PC build. Screens do not keep a second writable copy. Builder selections call the controller's existing mutation path, so totals, compatibility, overlays, cart, and checkout update together. `AppState.chosen` records which slots the shopper picked explicitly; the untouched slots keep their defaults so metrics stay defined. `RigsmithApp.set` and `setBuilderPart` are the only write paths, and `RigsmithApp.instance` exposes the mounted controller to code outside the tree.

Catalog reads live in `src/entities/product/queries.ts` — pure functions over the catalog with no React, styling, or closures. The view-models and any tool layer call the same `searchProducts` / `facetSummary`, so a machine-readable result cannot drift from the listing on screen.

See `docs/decisions/0002-single-build-state-and-domain-view-models.md`.

## Data boundary

`src/data/catalog/realCatalog.ts` adapts `public/catalog/products.json` into the UI model. Product IDs and source specifications remain stable. `src/entities/build/metrics.ts` owns compatibility and derived build metrics.

## Styling

The application uses the supplied design-system tokens plus route-specific CSS:

- `src/shared/styles/styles.css` — shared primitives (`.card`, `.ph`, `.pill`, `.eyebrow`).
- `src/features/catalog/home/home.css` — storefront homepage.
- `src/features/catalog/catalog.css` — category listing and the product card.
- `src/features/product/product.css`, `src/features/pc-builder/configurator.css` — product page and PC builder.
- `src/features/cart/cart.css`, `src/features/checkout/checkout.css` — cart, checkout, order confirmation.
- `src/features/catalog/sidebar.css` and `src/shared/layout/*.css` — page frame, navigation and filters.
- `src/shared/styles/responsive.css` — every grid that reflows, with the base value each media query overrides.
- `src/shared/styles/motion.css` — optional motion helpers.

Components carry no inline declaration strings. A value that genuinely varies per
instance is passed as a CSS custom property and consumed by the class; the two
elements that still set `transform` / `opacity` inline do so to outrank
`motion.css`, and say why in a comment.

See `docs/decisions/0004-inline-style-strings-are-a-migration-bridge.md`.

## Verification

Run:

```bash
npm run build
npm run check:catalog
npm run audit:catalog
```
