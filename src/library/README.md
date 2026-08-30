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

`AppState.picks` is the only active PC build. Screens do not keep a second writable copy. Builder selections call the controller's existing mutation path, so totals, compatibility, overlays, cart, and checkout update together.

See `docs/decisions/0002-single-build-state-and-domain-view-models.md`.

## Data boundary

`data/realCatalog.ts` adapts `public/catalog/products.json` into the UI model. Product IDs and source specifications remain stable. `data/metrics.ts` owns compatibility and derived build metrics.

## Styling

The application uses the supplied design-system tokens plus route-specific CSS:

- `styles.css` — preserved prototype styles.
- `configurator.css` — PC builder.
- `home.css` — storefront homepage.
- `sidebar.css` and `shell/eshop-sidebar.css` — navigation and filters.
- `motion.css` — optional motion helpers.

## Verification

Run:

```bash
npm run build
npm run check:catalog
npm run audit:prototype
```
