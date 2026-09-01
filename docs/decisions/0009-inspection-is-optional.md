# ADR 0009: Inspection is evidence, not permission to select

- **Status:** Accepted
- **Date:** 2026-08-31
- **Supersedes:** Mandatory fresh inspection and explanation fields in ADR 0007

## Context

Requiring inspect/select pairs and reinspection after every change increases calls without proving good decisions. Agents can already obtain product facts from search or product details. A short shopper prompt should suffice.

## Decision

`set_build_component` requires slot and productId for selection, not a prior inspection. Reason, tradeoff and alternativeId are optional. If supplied, notes and alternative ids are validated. Fresh inspection provenance is recorded only when available; stale or absent inspection never blocks a selection. Controller validation of current stock, compatibility and hard budget remains mandatory at commit time. Tools still update the existing builder visibly.

The full descriptor list retains route metadata for a future storefront
profile. The judge-facing demo uses the stable allowlist in ADR 0012, so its
registration does not change across route transitions. Adding agent-side schema
caching is outside the page's control. Clients should reuse known definitions
within an unchanged document/tool set and refresh when available tools change
or a document is replaced, rather than refetching all schemas after each
product selection.

## Consequences

For an eight-part build with bundled fans, eight mandatory inspection calls are no longer required. Agents may still inspect where useful. Fewer required calls does not establish a measured latency improvement or correct reasoning. The page cannot force an external agent to cache definitions. No additional UI is introduced.

## Enforced in

- `src/app/App.tsx`
- `src/app/webmcp/tools.ts`
- `src/app/webmcp/production.test.ts`
