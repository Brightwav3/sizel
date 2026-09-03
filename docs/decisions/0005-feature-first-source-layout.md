# ADR 0005: Application source uses feature-first ownership

- **Status:** Accepted
- **Date:** 2026-08-30
- **Decision owners:** Rigsmith project and repository owner

## Context

The whole application lived under `src/library`, although it is not a reusable package. Route screens, catalog adapters, global state, domain calculations, layout components and CSS were separated internally but shared one misleading root. Empty scaffold directories made the intended ownership less clear. The migration must preserve every behavior, DOM structure and visual style while making the location of new code predictable.

## Decision

Runtime composition and navigation live in `src/app`. User-facing capabilities live in `src/features/<feature>`. Product and PC-build rules that do not render UI live in `src/entities`. Reusable UI, layout, styles and low-level types live in `src/shared`. The canonical catalog adapter and storefront catalog data live in `src/data/catalog`.

Feature CSS moves with the feature it styles. Cross-feature shell CSS lives with `shared/layout`; truly global primitives and responsive rules live in `shared/styles`. The migration is mechanical: exported behavior, route URLs, DOM structure, class names, tokens and public assets remain unchanged.

## Rejected alternatives

- Keep `src/library` and only document it: rejected because the name continues to communicate a reusable package boundary that does not exist.
- Group only by technical type (`components`, `hooks`, `utils`): rejected because feature changes would remain scattered across unrelated global buckets.
- Rewrite state management or component markup during the move: rejected because structural and behavioral changes together would prevent reliable 1:1 verification.
- Duplicate files into the new tree before deleting the old tree: rejected because two active homes create ambiguity and allow implementations to drift.

## Consequences

### Positive

- Every feature has one obvious home for UI, view-model and feature CSS.
- Domain rules can be tested without importing React layout code.
- `src/library` and its empty scaffold directories disappear.
- Future refactors can happen one feature at a time.

### Costs

- Existing relative imports must change across the source tree.
- Some shared legacy types remain broad until a separate typing refactor.
- The single application controller remains in place during this migration to preserve behavior.

## Enforced in

- `src/app/App.tsx`
- `src/app/routes.ts`
- `src/features/catalog/CategoryScreen.tsx`
- `src/features/search/SearchBox.tsx`
- `src/features/cart/CartScreen.tsx`
- `src/entities/product/queries.ts`
- `src/entities/build/buildVals.ts`
- `src/shared/layout/AppShell.tsx`
- `src/data/catalog/realCatalog.ts`
- `src/main.tsx`

## Explicit non-decisions

- This ADR does not authorize visual, DOM, routing or copy changes.
- This ADR does not replace React class state or introduce a state library.
- This ADR does not change canonical catalog records, assets or public URLs.
- This ADR does not require every legacy broad type to be redesigned in the same migration.
