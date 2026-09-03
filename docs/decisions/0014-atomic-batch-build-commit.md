# ADR 0014: Apply the agent's complete PC selection atomically in the demo

- **Status:** Accepted
- **Date:** 2026-09-01
- **Decision owners:** Rigsmith WebMCP build flow

## Context

The agent already chooses the build order and the concrete components. The
previous demo contract then required one WebMCP write per selected slot. A
complete build has eight independent non-fan choices because the case supplies
its bundled fans, so the final application step cost eight serialized calls.
That cost is visible in the demo's latency, while the individual choices have
already been reasoned about before the first write.

## Decision

The judge-facing demo exposes `set_build_components` instead of
`set_build_component`. The agent supplies exactly one catalog id for `cpu`,
`gpu`, `board`, `ram`, `storage`, `cooler`, `psu` and `case`. The controller
derives the bundled fans, validates the complete selection against current
catalog ids, stock, compatibility and hard budget, and commits it as one
mutation. A failed validation applies no part of the batch.

The original `set_build_component` remains implemented for human UI commands,
the full storefront descriptor profile and compatibility tests. It is not sent
to the stable judge-facing demo, so the agent has one clear batch write path.

## Rejected alternatives

- **Keep eight single-slot calls in the demo:** This preserves incremental
  visibility but spends calls after the agent has already made all choices.
- **Expose both single-slot and batch tools:** This gives the agent two write
  strategies and makes the faster path less predictable during evaluation.
- **Let the batch tool choose missing components:** This would move the central
  build decision back into the website instead of leaving it with the agent.
- **Allow partial batches:** This creates ambiguous atomicity and still leaves
  the tool responsible for deciding when a build is ready to apply.

## Consequences

### Positive

- The demo removes seven serialized build-write calls in the common complete
  build flow.
- Stock, compatibility and budget rules still run in the shared controller.
- A failed batch cannot leave a partially applied build.
- The human UI and full storefront profile keep the existing single-slot path.

### Costs

- The builder updates after the complete batch rather than after every chosen
  component.
- A malformed or incompatible selection rejects the whole batch and requires a
  corrected retry.
- The demo registry now has a different write contract from the full
  storefront profile.

The compatibility discovery path also keeps its batch response compact while
applying `limit` independently to every requested slot. A dedicated larger
response ceiling is used for that read so the application does not silently
turn a requested limit of 10 into two candidates per slot.

## Enforced in

- `src/app/App.tsx`
- `src/app/webmcp/tools.ts`

## Explicit non-decisions

This decision does not change the selected model, add reasoning or ranking to a
tool, choose components on behalf of the agent, alter human configurator
actions, or authorize cart changes and checkout.
