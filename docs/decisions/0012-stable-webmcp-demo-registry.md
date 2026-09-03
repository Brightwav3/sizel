# ADR 0012: Keep the judge-facing WebMCP registry small and stable

- **Status:** Accepted
- **Date:** 2026-08-31
- **Supersedes:** The route-registration part of ADR 0006 for the demo profile
- **Superseded in part by:** [ADR 0013](0013-agent-chooses-build-order.md), which removes the automatic build starter
- **Superseded in part by:** [ADR 0014](0014-atomic-batch-build-commit.md), which replaces the demo's single-slot write with an atomic batch write
- **Superseded in part by:** [ADR 0016](0016-unregistered-webmcp-descriptors-are-removed.md), which makes the stable registry the complete exposed descriptor surface

## Context

The full storefront has many useful tool descriptors, but a judge-facing demo
does not need every catalogue, review, checkout and account capability. Route
registration also creates add/remove churn when the agent moves between a
phone page, a product page and the PC builder. WebMCP guidance recommends
static registration by default and warns that extra or overlapping tools add
context and selection cost.

## Decision

The demo registers one stable allowlist of fifteen tools at mount time:

`search_products`, `get_product`, `get_reviews`, `compare_products`, `show_in_catalog`,
`begin_build`, `list_compatible_parts`, `set_build_components`,

`check_build_compatibility`, `estimate_performance`, `compare_build_options`, `create_watchdog`,
`add_to_cart`, `add_build_to_cart`, and `get_cart`.

The `TOOLS` descriptor list is the complete exposed surface. `toolsForRoute`
remains available for route-aware contract tests, but the demo registry does
not change on route transitions. Handlers validate the current controller state
when they run.

Read and navigation are separate. `search_products`, `get_product`,
`compare_products` returns data without changing the route.
`show_in_catalog` is the explicit UI navigation tool. It changes only what is
visible and does not alter the build, cart or watch list. Artificial dwell
delays are not part of a tool call.

The registration wrapper forwards WebMCP's execution options, including the
call's `AbortSignal`, to handlers. Unmounting still aborts each registration.

The stable build flow also carries bounded planning data instead of adding
slot-specific selection tools. `begin_build` may accept shopper percentages
such as `{cpu: 20, gpu: 40}` and returns dollar hints for every slot. It does
not select a starting slot or part; the agent owns the build order.
`list_compatible_parts` reports the current allowance beside fitting
candidates, for one slot or a bounded batch. `set_build_components` applies the
agent's complete selection atomically after the agent has chosen the parts.
`compare_build_options` evaluates
the alternatives supplied by the agent and returns deterministic eligibility,
availability and simulation facts without selecting a winner or deciding
whether to create a watch. The hints never override whole-build budget, stock
or compatibility checks. `estimate_performance` is the separate read path for

one current-build simulation; both tools normalize common game labels to the
canonical fixture ids and return an explicit no-benchmark result for unsupported
games.
## Consequences

- Tool discovery is stable while the agent moves through the shop.
- The agent gets fewer overlapping choices in the demo context.
- A visible page change costs an explicit `show_in_catalog` call, making the
  UI transition honest and inspectable rather than hidden in a read result.
- The underlying UI/controller capabilities remain available to manual
  shoppers, but unregistered WebMCP descriptor wrappers are not retained.

## Enforced in

- `src/app/webmcp/index.ts`
- `src/app/webmcp/tools.ts`
- `src/app/webmcp/webmcpApi.ts`
- `src/app/App.tsx`
- `src/app/webmcp/registration.test.ts`
- `src/app/webmcp/production.test.ts`
