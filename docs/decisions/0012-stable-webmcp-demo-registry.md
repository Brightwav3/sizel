# ADR 0012: Keep the judge-facing WebMCP registry small and stable

- **Status:** Accepted
- **Date:** 2026-08-31
- **Supersedes:** The route-registration part of ADR 0006 for the demo profile

## Context

The full storefront has many useful tool descriptors, but a judge-facing demo
does not need every catalogue, review, checkout and account capability. Route
registration also creates add/remove churn when the agent moves between a
phone page, a product page and the PC builder. WebMCP guidance recommends
static registration by default and warns that extra or overlapping tools add
context and selection cost.

## Decision

The demo registers one stable allowlist of thirteen tools at mount time:

`search_products`, `get_product`, `compare_products`, `show_in_catalog`,
`begin_build`, `list_compatible_parts`, `set_build_component`,
`check_build_compatibility`, `compare_build_options`, `create_watchdog`,
`add_to_cart`, `add_build_to_cart`, and `get_cart`.

The complete `TOOLS` descriptor list remains in the source for the full
storefront profile and documentation. `toolsForRoute` remains available for
that profile and for contract tests, but the demo registry does not change on
route transitions. Handlers validate the current controller state when they
run.

Read and navigation are separate. `search_products`, `get_product`,
`compare_products` and `read_shop` return data without changing the route.
`show_in_catalog` is the explicit UI navigation tool. It changes only what is
visible and does not alter the build, cart or watch list. Artificial dwell
delays are not part of a tool call.

The registration wrapper forwards WebMCP's execution options, including the
call's `AbortSignal`, to handlers. Unmounting still aborts each registration.

The stable build flow also carries bounded planning data instead of adding
slot-specific selection tools. `begin_build` may accept shopper percentages
such as `{cpu: 20, gpu: 40}` and returns dollar hints for every slot. An
explicit `starter: "balanced"` fills only compatible, in-stock non-GPU support
parts and leaves GPU choice to the agent. `list_compatible_parts` reports the
current allowance beside fitting candidates, or its ranked GPU mode returns a
primary, an in-stock fallback and a watchdog gate derived from the actual
comparison. The hints never override whole-build budget, stock or
compatibility checks.

## Consequences

- Tool discovery is stable while the agent moves through the shop.
- The agent gets fewer overlapping choices in the demo context.
- A visible page change costs an explicit `show_in_catalog` call, making the
  UI transition honest and inspectable rather than hidden in a read result.
- The full tool set is not deleted; it can be exposed by a future storefront
  profile without changing the demo contract.

## Enforced in

- `src/app/webmcp/index.ts`
- `src/app/webmcp/tools.ts`
- `src/app/webmcp/webmcpApi.ts`
- `src/app/App.tsx`
- `src/app/webmcp/registration.test.ts`
- `src/app/webmcp/production.test.ts`
