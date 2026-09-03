# Sizel submission instructions

Sizel is a fictional electronics storefront built with React, TypeScript and
Vite. The repository uses **Rigsmith** in some internal names.

## Public links

- Live app: https://sizel.vercel.app/
- Reviewed source branch: https://github.com/Brightwav3/sizel/tree/codex/remove-dead-builder
- Pull request under review: https://github.com/Brightwav3/sizel/pull/9
- Public demo video (2:43): https://youtu.be/OWxUgB0Qxs0

The source branch is named explicitly because the pull request is intentionally
not merged into `master`.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app works as a normal storefront even
when WebMCP is unavailable.

## Enable WebMCP

Use ChatGPT's in-app browser, which supports WebMCP by default, or use Chrome
149 or newer:

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable the flag and restart Chrome.
3. Open the live app or the local Vite URL.

The judge-facing demo registers exactly these 15 tools:

`search_products`, `get_product`, `get_reviews`, `compare_products`,
`show_in_catalog`, `begin_build`, `list_compatible_parts`,
`set_build_components`, `check_build_compatibility`, `estimate_performance`,
`compare_build_options`, `create_watchdog`, `add_to_cart`,
`add_build_to_cart`, and `get_cart`.

## Recommended demonstration flow

Ask the agent to build a gaming PC within a fixed budget. The agent should:

1. Search the catalog and start a build with `begin_build`.
2. Choose compatible parts with `list_compatible_parts`.
3. Apply the complete eight-part selection with `set_build_components`.
4. Verify the nine-slot build with `check_build_compatibility`.
5. Request simulated performance with `estimate_performance`.
6. Compare an agent-supplied alternative with `compare_build_options`.
7. Add a product or completed build to the cart only when requested.

All catalog data, reviews, prices, stock and performance fixtures are
fictional or synthetic. Performance results are labelled simulations, not
measured game benchmarks. Checkout is a preview and does not place an order.

## Verification

```bash
npm test
npm run build
npm run check:catalog
npm run audit:catalog
```

`npm test` checks that the committed `docs/webmcp-tools.md` reference matches the
current tool descriptors before running Vitest. After changing a descriptor,
run `npm run generate:webmcp-docs`, review the diff, and commit the result.
