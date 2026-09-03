# ADR 0013: The agent chooses the build order and component selections

- **Status:** Accepted
- **Date:** 2026-09-01
- **Decision owners:** Rigsmith WebMCP build flow

## Context

The previous `balanced` starter selected most of a PC before the agent had
reasoned about the shopper's goals. In a gaming request, that could lock in a
weak CPU before the agent had considered the GPU, producing a build such as a
high-end graphics card paired with the `Contoso C3 230`.

The point of the WebMCP demo is to show the agent turning a shopper's intent
into a build. The store should expose catalog facts and enforce domain rules,
but it should not silently decide which component is solved first or fill a
foundation on the agent's behalf.

## Decision

`begin_build` only opens the in-place build panel and records the shopper's brief,
resolution, hard budget and optional budget-share hints. It does not accept a
starter and does not select a slot or part.

The agent decides where to start from the shopper's request. For a gaming
request it may begin with the GPU, then choose a compatible CPU, memory,
motherboard, cooler, case, power supply and storage in the order that best
supports its reasoning. It can use `list_compatible_parts`, search results, and
`get_product` to read candidates, then applies its complete selection with
`set_build_components`.

The controller remains responsible for deterministic checks: catalog ids,
stock, compatibility, bundled fans, budget and cart admission. Read tools may
filter or structure facts, but they do not mutate the build. GPU alternatives
are supplied by the agent to `compare_build_options`, which returns facts and
simulations without selecting a winner or deciding whether to create a watch.

## Rejected alternatives

- **Balanced non-GPU starter:** This hid the first selection decisions and could
  produce an unbalanced CPU/GPU pairing.
- **Automatic whole-build recommendation:** This delegates the core reasoning
  the demo is meant to expose.
- **Force GPU-first in the tool:** GPU-first is sensible for some gaming
  requests, but the agent must infer the order from the shopper's goals rather
  than receive a hard-coded sequence.

## Consequences

The agent still needs enough read calls to make an informed selection, but the
demo can apply the finished selection in one batch. The agent's order and
choices remain visible in the conversation and committed builder state. The
catalog remains fictional, and compatibility checks still cover only the
implemented rules.

## Enforced in

- `src/app/App.tsx`
- `src/app/webmcp/tools.ts`
- `src/app/webmcp/production.test.ts`

## Explicit non-decisions

This decision does not authorize automatic cart changes, stock-watch creation,
checkout, or claims that simulated FPS are measured performance.
