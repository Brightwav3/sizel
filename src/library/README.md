# Rigsmith UI architecture

The UI is a React and TypeScript application built around one active PC build.

## Runtime flow

```text
RigsmithApp
  -> buildContext
  -> app/vals/*Vals
  -> RigsmithView
  -> AppShell + active screen + overlays
```

- `RigsmithApp.tsx` owns lifecycle, navigation synchronization, and build mutations.
- `app/AppState.ts` defines the single application state.
- `app/buildContext.ts` computes shared catalog, compatibility, and merchandising data once per render.
- `app/buildVals.ts` composes domain view-models.
- `app/vals/` separates shell, home, catalog, product, builder, picker, guided, overlay, and checkout values.
- `screens/` renders route-level experiences.
- `shell/` owns persistent navigation and filters.
- `overlays/` owns the floating build summary and toast.

## State ownership

`AppState.picks` is the only active PC build. Screens do not keep a second writable copy. Builder selections call the controller's existing mutation path, so totals, compatibility, overlays, cart, and checkout update together. `AppState.chosen` records which slots the shopper picked explicitly; the untouched slots keep their defaults so metrics stay defined. `RigsmithApp.set` and `setBuilderPart` are the only write paths, and `RigsmithApp.instance` exposes the mounted controller to code outside the tree.

Catalog reads live in `domain/queries.ts` — pure functions over the catalog with no React, styling, or closures. The view-models and any tool layer call the same `searchProducts` / `facetSummary`, so a machine-readable result cannot drift from the listing on screen.

See `docs/decisions/0002-single-build-state-and-domain-view-models.md`.

## Data boundary

`data/realCatalog.ts` adapts `public/catalog/products.json` into the UI model. Product IDs and source specifications remain stable. `data/metrics.ts` owns compatibility and derived build metrics.

## Styling

The application uses the supplied design-system tokens plus route-specific CSS:

- `styles.css` — shared primitives (`.card`, `.ph`, `.pill`, `.eyebrow`).
- `home.css` — storefront homepage.
- `catalog.css` — category listing and the product card.
- `product.css`, `configurator.css` — product page and PC builder.
- `cart.css`, `checkout.css` — cart, checkout, order confirmation.
- `sidebar.css`, `shell/eshop-sidebar.css`, `shell/topbar.css`, `shell/app-shell.css` — page frame, navigation and filters.
- `responsive.css` — every grid that reflows, with the base value each media query overrides.
- `motion.css` — optional motion helpers.

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
npm run audit:prototype
```
