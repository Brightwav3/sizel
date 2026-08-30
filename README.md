# Rigsmith data port

Rigsmith is a fictional electronics e-shop demo. This milestone ports the supplied product database and its local visual assets into a repository-ready layout. No UI has been created yet.

## Ported files

- `public/catalog/products.json` — canonical 135-product catalog.
- `public/catalog/products.db` — SQLite copy of the catalog.
- `public/catalog/images/` — supplied product images, preserving relative paths.
- `public/catalog/logos/` — generated fictional brand logos.
- `public/catalog/brand-guides/` — visual manuals for all 13 fictional brands.

Archived image directories were not imported. No external APIs or real-world product brands are used.

## Validation

Run the catalog checks with a TypeScript runner such as `npx tsx scripts/check-catalog.ts`. The checks cover product count, duplicate IDs, SQLite presence, image paths, brand coverage, and PC component categories.

## Next milestone

Build the catalog and PC configurator UI on top of these local files. The UI must treat `products.json` as the frontend source and preserve every product's original `id`, `image_path`, `image_url`, specifications, pricing, availability, and CPU/GPU `imageCategory` fields.
