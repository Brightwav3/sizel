# ADR 0016: Remove unregistered WebMCP descriptors

## Context

The WebMCP source contained a 15-tool judge-facing registry plus 22 legacy
descriptors that were not registered by the demo. Some legacy wrappers, most
notably `read_shop`, dynamically delegated to other descriptors. That made the
source surface look larger than the actual browser-facing contract and made it
easy for README and generated documentation to describe capabilities that a
judge could not call.

## Decision

`src/app/webmcp/tools.ts` contains exactly the 15 stable descriptors named by
`DEMO_TOOL_NAMES`. The 22 unregistered descriptor objects and their descriptor-
only tests and documentation are removed. `get_cart` and `create_watchdog`
remain because they are part of the stable 15-tool flow.

The underlying `RigsmithApp` controller, UI routes, catalog data, domain
validation, and human-shopping behavior are unchanged. The generated tool
reference and public project descriptions are derived from the reduced
registry.

## Rejected alternatives

- Keep a 37-descriptor source registry and expose only 15. This preserves an
  undocumented API surface and allows stale references to return.
- Remove only the names from `DEMO_TOOL_NAMES`. That changes no runtime source
  ambiguity and leaves legacy wrappers reachable to internal callers.
- Keep `read_shop` with partial delegation. Its grouped result contract would
  continue to depend on removed descriptor implementations.
- Delete the underlying controller methods. That would change the visible UI
  and human workflow, which is outside this change.

## Consequences

### Positive

- The source registry, runtime registration, generated reference, README, and
  Devpost description share one 15-tool contract.
- Removed wrappers cannot accidentally be exposed or called through stale
  internal lookups.
- Existing UI/controller behavior remains available without an unregistered
  WebMCP descriptor layer.

### Costs

- Callers of the removed legacy descriptor names must use the stable tools or
  the visible UI workflow.
- Historical benchmark and audit notes may still mention the old surface; those
  records remain historical and are not current API documentation.

## Enforced in

- `src/app/webmcp/tools.ts`
- `src/app/webmcp/index.ts`
- `src/app/webmcp/docs.test.ts`
- `src/app/webmcp/tools.test.ts`
- `src/app/webmcp/production.test.ts`
- `scripts/generate-webmcp-docs.mjs`
- `README.md`

## Explicit non-decisions

- This does not remove the 15 registered tools.
- This does not remove `get_cart` or `create_watchdog`.
- This does not delete UI/controller methods used by manual shopping.
- This does not change catalog facts, compatibility rules, checkout behavior,
  public routes, or the demo workflow.
