# ADR 0007: Agents select parts; the shop supplies facts and validates changes

- **Status:** Accepted; descriptor-surface details superseded by [ADR 0016](0016-unregistered-webmcp-descriptors-are-removed.md)
- **Date:** 2026-08-31
- **Decision owners:** Rigsmith project and repository owner
- **Supersedes:** The automatic recommendation and pre-commit response portions of ADR 0006

## Context

The owner wants the agent to actually choose components and explain why it chose them. Previously `recommend_build` delegated the whole choice to a deterministic shop algorithm, applied nine parts at once, and opened the completed builder afterward. That measured orchestration speed but did not demonstrate independent selection or a visible collaborative workflow. The production audit also found differing UI/tool checks and responses that could precede or misrepresent committed React state.

## Decision

Remove `recommend_build` from the exposed tool set. Keep the legacy pure helper only for existing numerical fixtures, with truthful `withinBudget`; it cannot apply anything and is not offered to agents. `begin_build` opens the in-place build panel and records the brief and hard budget, preserving current choices unless reset is explicit.

The agent reads candidate facts from search results or `get_product` and explains its choices in the conversation. This validates candidate ids and current domain state, not the truth of natural-language claims or the agent's cognition. An initially added explanation panel was removed at the owner's request; preserve the existing storefront layout. Human selection remains possible without composing text.

All selection and cart commands share controller validation, run sequentially and resolve after the React commit. Case and bundled fans update atomically; undo restores picks, selection marks and explanations. Domain checks live outside components so buttons, tool calls and checkout apply the same rules. Budget is the exact user limit; stock accounting includes parts in assembled builds and individual product lines.

## Rejected alternatives

- Keep automatic selection and ask the agent to explain it afterward: this does not satisfy independent selection.
- Add fake progress or delays to the instant recommendation: hides the actual implementation rather than making work visible.
- Treat a reason string as proof of correct reasoning: not enforceable. Show the supporting options and limitations for review.
- Depend on disabled buttons or tool descriptions as enforcement: neither guards all controller callers.

## Explicit non-decisions

- The shop will not select a complete build automatically for the agent.
- The storefront will not add an explanation panel or block human shoppers on agent-authored text.
- This decision does not turn the synthetic catalog or preview checkout into a production commerce service.

## Consequences

More tool calls and model work are expected. The old four-call benchmark no longer describes the task. Agent-independent choice quality needs separate evaluation, beyond contract tests. The former grouped snapshot descriptor is no longer part of the exposed tool surface; current reads use the stable individual tools.

The catalog remains synthetic, state remains in memory and checkout remains non-transactional. These are explicitly labeled limits; this change does not create a production commerce backend. Compatibility still covers only the implemented rules.

## Enforced in

- `src/app/webmcp/production.test.ts`
- `src/entities/build/selection.ts`
- `src/entities/cart/cartValidation.ts`
- `src/app/App.tsx`
- `src/features/pc-builder/BuilderScreen.tsx`
