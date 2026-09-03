# ADR 0001: Port the canonical catalog and supplied assets before building the UI

- **Status:** Accepted
- **Date:** 2026-08-29
- **Decision owners:** Rigsmith demo implementation

## Context

Rigsmith has a supplied fictional electronics database in JSON and SQLite, plus generated product images, logos, and brand guides. The first requested milestone is data portability; the UI and WebMCP layer must not distort or replace the source records.

## Decision

The repository stores a direct copy of `products.json` and `products.db` under `public/catalog/`. Supplied images, generated logos, and brand guides are copied without regeneration, flattening, or renaming. The original relative `image_path` and `image_url` values remain unchanged.

## Rejected alternatives            [MANDATORY]

- Rebuilding the catalog in TypeScript would create a second source of truth.
- Importing only JSON would fail the requested database port and remove the SQLite artifact.
- Copying only selected images would risk broken product relationships and incomplete coverage.
- Reusing archived image directories would violate the supplied asset rules.

## Consequences

### Positive

The future frontend can consume stable local assets, every original product ID is preserved, and the SQLite copy remains available for inspection or later server-side use.

### Costs

The repository includes the full supplied asset set and is larger than a UI-only prototype.

## Enforced in                      [MANDATORY]

- `public/catalog/products.json`
- `public/catalog/products.db`
- `public/catalog/images/`
- `public/catalog/logos/`
- `public/catalog/brand-guides/`
- `scripts/check-catalog.ts`

## Explicit non-decisions           [MANDATORY]

This ADR does not authorize UI creation, WebMCP registration, external product APIs, real-world brands, asset regeneration, or changes to the source database.
