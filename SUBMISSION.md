# Sizel submission instructions

Sizel is a fictional electronics storefront I built with React, TypeScript and
Vite. You'll see **Rigsmith** in some internal names — that was the working
title, and some internal identifiers and historical documentation still use it.

## Public links

- Live app: https://sizel.vercel.app/
- Public source repository: https://github.com/Brightwav3/sizel/tree/master
- Public demo video (2:43): https://youtu.be/OWxUgB0Qxs0

`master` is the current submission source. The cleanup work from PR #9 is
merged there.

## Run locally

You'll need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open whatever local URL Vite prints. The store works as a normal e-shop even
without WebMCP — that part was never optional.

## Enable WebMCP

Use ChatGPT's in-app browser (WebMCP works there by default), or Chrome 149+:

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable it, then restart Chrome.
3. Open the live app or your local Vite URL.

The judge-facing demo registers exactly 15 tools:

`search_products`, `get_product`, `get_reviews`, `compare_products`,
`show_in_catalog`, `begin_build`, `list_compatible_parts`,
`set_build_components`, `check_build_compatibility`, `estimate_performance`,
`compare_build_options`, `create_watchdog`, `add_to_cart`,
`add_build_to_cart`, and `get_cart`.

I kept this list to the stable judge-facing capabilities that map to the real
catalog, build, navigation, and cart flows.

## Recommended demonstration flow

Ask the agent to build a gaming PC within a fixed budget. It should:

1. Search the catalog and start a build with `begin_build`.
2. Pick compatible parts with `list_compatible_parts`.
3. Apply the eight independently selected components with
   `set_build_components`. Case fans are bundled with the case.
4. Verify the nine-slot build with `check_build_compatibility`.
5. Pull simulated performance with `estimate_performance`.
6. Compare against an agent-suggested alternative with
   `compare_build_options`.
7. Add a product or finished build to the cart only when the user asks.

The public UI uses the in-progress build popup and category/product pages; it
does not expose a standalone `/pc-builder` page. The structured WebMCP flow
selects known catalog ids directly and still validates stock, compatibility,
budget, and completeness.

Everything in the catalog — products, reviews, prices, stock, delivery details,
and performance numbers — is fictional or synthetic for this demo. Performance
results are labeled simulations, not real benchmarks. Checkout is a preview; it
doesn't place an order. `create_watchdog` records a local demo watch only when
the agent calls it; it does not send an external notification.

## Verification

```bash
npm test
npm run build
npm run check:catalog
npm run audit:catalog
```

`npm test` first checks that the committed `docs/webmcp-tools.md` reference
still matches the current tool descriptors, then runs Vitest. If you change a
descriptor, run `npm run generate:webmcp-docs`, check the diff, and commit it.
