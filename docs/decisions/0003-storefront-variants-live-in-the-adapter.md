# ADR 0003: Storage tiers are derived listings; colour is presentation only

- **Status:** Accepted
- **Date:** 2026-08-30
- **Decision owners:** Rigsmith project

## Context

ADR 0001 made `public/catalog/products.json` the canonical catalog: one record per device, at one storage capacity, with one photograph. A shop sells a phone at several capacities and several colours. Those are shopping choices the buy box has to ask, but they are not facts the canonical catalog carries.

The two choices are not the same kind of thing. A capacity has its own price, its own stock and its own code — it is a listing. A colour, with one photograph per device, is not.

## Decision

Storage tiers are expanded in `data/storageVariants.ts` when the adapter builds `CATALOG`, and are ordinary `Part` listings from then on: the grid, search, facets, the cart and the WebMCP tools see them without knowing they were derived. The device's own capacity keeps the canonical id; every other tier takes `<id>::<n>gb`, so existing links, cart lines and watchdogs still resolve. Tiers share the base record's photograph, `variantOf`, and therefore its reviews.

Colour is a fixed palette per brand in `data/colorways.ts`, chosen in local component state on the product page. Nothing downstream can read it.

## Rejected alternatives

- Write the tiers into `products.json`: rejected because the JSON is a port of the canonical catalog and this is a storefront decision. ADR 0001 stands.
- Keep one listing and switch capacity on the product page only: rejected because the price, stock and code differ per tier, so a single listing would have to lie on the grid and in the cart.
- Give colour its own listings too: rejected because there is one photograph per device, so every colour would show the same picture and the shop would claim a difference it cannot show.

## Consequences

### Positive

- Capacity is searchable, filterable and priceable like any other listing.
- The canonical catalog stays a faithful port.
- Reviews stay attached to the device rather than being split across its tiers.

### Costs

- Category counts now count listings, not devices: 14 phones read as 36 listings.
- Derived ids carry a `::` separator that URL-encodes in links.
- Colour cannot be added to the cart until the catalog carries per-colour records.

## Enforced in

- `src/library/data/storageVariants.ts`
- `src/library/data/colorways.ts`
- `src/library/data/realCatalog.ts`
- `src/library/shell/OptionPicker.tsx`
