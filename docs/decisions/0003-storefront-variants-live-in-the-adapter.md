# ADR 0003: Storage tiers and colours are derived storefront listings

- **Status:** Accepted
- **Date:** 2026-08-30
- **Decision owners:** Rigsmith project

## Context

ADR 0001 made `public/catalog/products.json` the canonical catalog: one record per device, at one storage capacity, with one photograph. A shop sells a phone at several capacities and several colours. Those are shopping choices the buy box has to ask, but they are not facts the canonical catalog carries.

The storefront now has a distinct photograph for every supported colour. A colour therefore needs its own grid card, availability and deep link even though it still shares the canonical device SKU and price.

## Decision

Storage tiers are expanded in `data/storageVariants.ts` when the adapter builds `CATALOG`, and are ordinary `Part` listings from then on: the grid, search, facets, the cart and the WebMCP tools see them without knowing they were derived. The device's own capacity keeps the canonical id; every other tier takes `<id>::<n>gb`, so existing links, cart lines and watchdogs still resolve. Tiers share the base record's photograph, `variantOf`, and therefore its reviews.

Colour palettes and image paths remain derived in `data/colorways.ts`. The category view expands each phone or console listing once per colour. The canonical product id remains unchanged, while `productColorId` identifies the derived colour listing in application state and as the final product URL segment. Opening a card therefore selects the exact colour shown, and refreshing or sharing the URL preserves it.

Storefront stock is deterministic presentation data derived from category, product id and colour id. It varies per listing while remaining stable across renders. Scarce and expensive categories have lower ceilings; `11` is the display bucket `> 10`.

## Rejected alternatives

- Write the tiers into `products.json`: rejected because the JSON is a port of the canonical catalog and this is a storefront decision. ADR 0001 stands.
- Keep one listing and switch capacity on the product page only: rejected because the price, stock and code differ per tier, so a single listing would have to lie on the grid and in the cart.
- Write every colour into `products.json`: rejected because the JSON remains the canonical device catalog and colour imagery is a storefront concern.
- Pick a random colour and stock value on every render: rejected because cards would change while browsing and deep links could not reproduce what the shopper opened.
- Encode colour into the canonical product id: rejected because cart, reviews, storage sibling detection and external catalog references still identify the underlying SKU.

## Consequences

### Positive

- Capacity is searchable, filterable and priceable like any other listing.
- Every available colour has its own image, grid card, stable stock presentation and deep link.
- The canonical catalog stays a faithful port.
- Reviews stay attached to the device rather than being split across its tiers.

### Costs

- Category counts now count colour-and-storage combinations rather than devices.
- Derived ids carry a `::` separator that URL-encodes in links.
- Cart lines still identify the canonical SKU; preserving colour in cart and checkout is not decided here.

## Enforced in

- `src/data/catalog/storageVariants.ts`
- `src/data/catalog/colorways.ts`
- `src/data/catalog/listingStock.ts`
- `src/data/catalog/realCatalog.ts`
- `src/app/state/AppState.ts`
- `src/app/routes.ts`
- `src/features/catalog/catalogVals.ts`
- `src/features/product/productVals.ts`
- `src/shared/ui/OptionPicker.tsx`
- `src/features/product/ColorPicker.tsx`

## Explicit non-decisions

- This does not make colour a canonical catalog record or change the underlying product SKU.
- This does not define colour-specific prices.
- This does not yet preserve colour in cart or checkout lines.
