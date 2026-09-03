# ADR 0015: Build edits preserve the storefront route

## Status

Accepted

## Date

2026-09-02

## Decision owners

Rigsmith build flow

## Context

The floating build pill is available across the storefront and is the visible
build experience. Earlier controller mutations forced the internal `builder`
route after a selection, which moved shoppers away from the catalog and made
the pill appear to open a separate page. `/pc-builder` is not a public route.

## Decision

Build edits preserve the shopper's current storefront route by default. The
`begin_build` action opens the floating pill in place, and selecting a product
from the catalog returns to that product/category context. The public
`show_in_catalog` action no longer exposes the internal `builder` view;
The legacy `focus_builder_slot` controller behavior is not a registered WebMCP
descriptor; the stable agent flow opens the relevant catalog category through
`show_in_catalog`.

## Rejected alternatives

- Keep forcing the internal builder route after every selection: this breaks
  the in-place pill interaction and surprises shoppers.
- Expose `/pc-builder` as another public route: this duplicates the catalog
  flow and creates a second UI owner for the same build state.
- Add a second build state for the pill: this would violate `AppState.picks`
  as the single owner of the active build.

## Consequences

Positive: catalog navigation stays stable, the build pill remains available,
and visual and WebMCP edits share one state path. The controller still accepts
the legacy `builder` destination for internal callers, but public tools do not
request it.

Cost: callers that need a dedicated builder screen must explicitly choose and
own that route; there is no implicit navigation after a mutation.

## Enforced in

- `src/app/App.tsx`
- `src/app/webmcp/tools.ts`
- `src/features/pc-builder/overlayVals.ts`
- `src/features/catalog/catalogVals.ts`

## Explicit non-decisions

This decision does not change product URLs, catalog IDs, compatibility rules,
or ownership of the active build state. It also does not make checkout accept
an incomplete or incompatible build.
