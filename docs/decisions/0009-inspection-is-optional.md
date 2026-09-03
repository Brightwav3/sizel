# ADR 0009: Inspection is evidence, not permission to select

- **Status:** Superseded for WebMCP descriptor availability by [ADR 0016](0016-unregistered-webmcp-descriptors-are-removed.md)
- **Date:** 2026-08-31
- **Supersedes:** Mandatory fresh inspection and explanation fields in ADR 0007

## Context

Requiring inspect/select pairs and reinspection after every change increases calls without proving good decisions. Agents can already obtain product facts from search or product details. A short shopper prompt should suffice.

## Decision

The judge-facing demo uses `set_build_components` after the agent has
chosen the complete set; it requires no prior inspection and validates current
stock, compatibility and hard budget atomically. Tools still update the
existing build state visibly through the floating build summary.

The judge-facing demo uses the stable allowlist in ADR 0012, so its registration
does not change across route transitions. Adding agent-side schema caching is
outside the page's control. Clients should reuse known definitions within an
unchanged document/tool set and refresh when available tools change or a
document is replaced, rather than refetching all schemas after each product
selection.

## Rejected alternatives

- Require a fresh inspection before every selection; this adds calls without proving a better decision.
- Treat an inspection result as permission to select; current catalog state still decides whether a selection is valid.
- Force schema caching in the page; caching belongs to the external client.

## Explicit non-decisions

- Candidate inspection is no longer a WebMCP descriptor; agents can use search
  results or `get_product` when they need more facts.
- Stock, compatibility, budget and candidate-id validation remain mandatory at commit time.
- This decision does not claim a measured latency improvement or change the storefront UI.

## Consequences

For an eight-part build with bundled fans, eight mandatory inspection calls are
not part of the current workflow. Fewer calls does not establish a measured
latency improvement or correct reasoning. The page cannot force an external
agent to cache definitions. No additional UI is introduced.

## Enforced in

- `src/app/App.tsx`
- `src/app/webmcp/tools.ts`
- `src/app/webmcp/production.test.ts`
