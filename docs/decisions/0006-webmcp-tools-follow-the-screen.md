# ADR 0006: WebMCP tools live in src/app/webmcp and follow the screen

- **Status:** Accepted
- **Date:** 2026-08-30
- **Decision owners:** Rigsmith project and repository owner

## Context

The shop had to expose its catalog and its active build to browser agents through WebMCP. Two questions had no obvious answer. Where do tool definitions live, given that a tool spans the catalog adapter, the product entity, the build model and the application controller? And how many tools should an agent see at once, given that Chrome's guidance caps a result at 1.5K characters and that a large tool set is harder for an agent to choose from than a small one.

The build already has one owner (ADR 0002) and the catalog one query owner. Tools must not become a second owner of either.

## Decision

Tool definitions live in `src/app/webmcp`, beside the controller they bind to, not inside the features whose screens they mirror. A tool is an application-level capability: `set_build_component` belongs to no single screen, and `search_products` answers for a catalog the whole shop shares.

Registration follows the route. Each tool declares the screens it makes sense on, and every route change registers what that screen supports and withdraws the rest. A tool with no declared routes is offered everywhere.

A registration is withdrawn by aborting the `AbortSignal` it was made with. The specification offers no `unregisterTool`, and `registerTool` rejects a name that is already taken, so holding the controller is what makes route-scoped registration possible at all rather than a convenience.

Tool handlers never write state directly. Four tool-facing write paths on `RigsmithApp` — `resetSlot`, `undoBuild`, `setTargets`, `applyPicks`, alongside the existing `set` — remain the only way in, so ADR 0002 still holds with agents in the picture.

Reasoning an agent needs but no screen ever rendered — a whole-machine recommendation, the frame-rate bottleneck, the swaps that clear a conflict — lives in `webmcp/buildAdvisor.ts` as pure functions over picks. They propose; the caller writes.

Results are shaped in `webmcp/toolResult.ts` against the documented character budget, shortening a list explicitly rather than letting an agent's own guardrail cut a JSON document in half.

## Rejected alternatives

- Put each tool in the feature that owns its screen: rejected because tools that span features would have no home, and the registration lifecycle would be split across four folders.
- Register every tool once at mount: rejected because a cart screen would offer build editors for a build it does not show, and a larger tool set is a worse one to choose from.
- Let tool handlers call `setState` directly: rejected because it makes tools a second owner of the build, which ADR 0002 exists to prevent.
- Return whole `Part` records from search: rejected because a page of them exceeds the result budget and gets truncated somewhere arbitrary.
- Return reviews from `get_product`: rejected because user-generated content is a prompt-injection surface, and the budget is better spent on specifications.

## Consequences

### Positive

- The route decides the tool set, so an agent sees a small, honest list.
- Tool results and screen values come from one model, so they cannot disagree.
- Without `document.modelContext` the shop runs unchanged; nothing here is load-bearing for a human shopper.
- The advisor functions are pure, so build reasoning is unit-testable without a browser.

### Costs

- A new tool must state its routes, which is a judgment call that can be got wrong.
- Registration is asynchronous and serialised, so a burst of route changes settles a tick behind the screen.
- Every live registration holds an `AbortController` for as long as its screen is showing.
- Handlers must compute their reply from values they hold rather than reading state back, because React applies state on its own schedule.

## Enforced in

- `src/app/webmcp/index.ts`
- `src/app/webmcp/tools.ts`
- `src/app/webmcp/buildAdvisor.ts`
- `src/app/webmcp/toolResult.ts`
- `src/app/webmcp/webmcpApi.ts`
- `src/app/App.tsx`

## Explicit non-decisions

- This ADR does not add a server, an API, or any network call.
- This ADR does not expose tools to other origins; `exposedTo` stays unused.
- This ADR does not decide the deployment origin trial token or hosting headers.
- This ADR does not change catalog records, routes, DOM structure or visual style.
