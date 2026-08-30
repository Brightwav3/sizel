# Handoff: complete and accelerate the Rigsmith WebMCP shopping flow

Date: 2026-08-31

## Objective

Finish the WebMCP interface improvements identified in the session report, then
measure the **complete user task** in a fresh Codex task. Target less than one
minute without skipping verification, hiding delays or bypassing browser review.
The target has not been demonstrated for the complete task.

The user wants **both a Pear phone recommendation and a completed PC build**.
The $1700 budget applies only to the PC. The final build must be applied,
verified, and visibly displayed in the Codex in-app browser preview. Stop there:
no cart additions, watchdogs, checkout or orders. Return the phone recommendation,
PC summary, combined hardware price, and any limitations in English.

## Primary evidence: read this report first

[Rigsmith WebMCP Session Report](C:/Users/Sajmon/Documents/Codex/2026-08-30/open-https-rigsmith-brightwav3-chatgpt-site-3/outputs/Rigsmith-WebMCP-Session-Report.docx)

Absolute path:
`C:/Users/Sajmon/Documents/Codex/2026-08-30/open-https-rigsmith-brightwav3-chatgpt-site-3/outputs/Rigsmith-WebMCP-Session-Report.docx`

The report is outside the repository and is not included in Git. If running on
another machine, request this file rather than pretending it is available.
It reviews one recorded session, not a new live test or a source-code audit.

Its measured run took **81 seconds** through the final visual check and made
**15 WebMCP calls**: `read_shop` x4, `recommend_build` x1, `get_current_build` x1,
`show_in_catalog` x1, `check_stock` x8. Two discovery fetches were separate.
Initial skill reading and final-answer writing were excluded.

The task succeeded: $1448 PC, $1199 Pear Phone 16 Pro Max 512 GB recommendation,
$2647 combined hardware price, completed builder visible, no purchase actions.
These are historical observations, not prices or stock to reuse without tools.

## Current implementation and completed work

Repository: `C:/Users/Sajmon/Projects/Active/rigsmith`

Live public site: https://rigsmith.brightwav3.chatgpt.site/

Relevant commits before this handoff:

- `5ff512d`: PNG-to-WebP conversion, faster concurrent registration, Sites build.
- `d107253`: Google Fonts no longer block application startup.
- `b5b8477`: `read_shop`, richer phone comparisons, shared PSU requirements.
- `86c8f92`: search-plus-comparison and combined target/build application.

There are 34 tool definitions. Existing individual tools remain compatible.
`read_shop` is the preferred read entry point, always available, with explicit
read-only sections and per-section errors. Its output ceiling is 6000 characters;
ordinary tool results retain a 1500-character ceiling.

Implemented fast-path arguments:

- `read_shop.search.compare: true`: search and compare up to three distinct model
  IDs from the requested ordering. This is a shortlist, not a universal best-product
  ranking. Price-descending ordering can favor expensive storage variants.
- `read_shop.compareDeviceSearch`: discover and compare up to three devices against
  the current PC; defaults to consoles.
- `recommend_build` with `apply: true, configure: true`: update picks and requested
  budget/resolution/FPS/quiet settings in one controller operation.
- `read_shop.include: ["build", "cart", "watchdogs"]`: grouped state reads.
- Selected read-only summaries are available on every route; write tools remain
  route-scoped. Process tool-change notifications and refresh discovery when needed.

The most recent implementation check passed **122 tests** and `npm run build`.
The build has an existing warning about a JavaScript chunk exceeding 500 kB.
These checks were not rerun just for the documentation-only handoff.

## Priority 1: make one build read genuinely complete

Currently `read_shop.include: ["build"]` delegates to `check_build_compatibility`.
It includes total, sockets, clearance, power, performance, bottleneck, and **GPU
stock only**. It does not list every slot and its availability. This led to eight
extra stock checks in the report. Batched product details could reduce those calls,
but completeness should not depend on the agent finding a workaround.

Return all nine selected slots, including bundled fans, with product ID, name or
clear identification, price, stock status, and shipping time. Use the same stock
semantics as the existing storefront and `check_stock`; do not invent inventory.
`listingStock` is deterministic storefront presentation data, not a live warehouse.

Keep totals, compatibility, clearance and power in the same snapshot. Explicitly
report overall availability and any blocking parts. Ensure the output budget cannot
silently omit slots or replace the entire essential build section with an error
under normal full-build usage. Consider a compact shared report helper and a
deliberately documented budget for the full report rather than duplicating logic.

Acceptance:

- One `read_shop` call verifies all nine selections without `get_current_build`,
  separate `check_stock` calls or per-product reads.
- Test an in-stock build, unavailable non-GPU part, slow non-GPU part, and bundled
  fans. Test completeness when phone/device comparisons share the response.
- The summary agrees with the UI and individual stock tools.

## Priority 2: explicit units and accurate tool descriptions

The report correctly flags ambiguous `recommend_build.headroom`. Source inspection
in this task confirmed `buildAdvisor.ts` assigns it `budget - numbers.price`.
It means money left, not PSU watts. Use `budgetRemainingUSD`; handle legacy callers
explicitly instead of silently changing the meaning of the existing field.

Power already reports `headroomW = psuW - drawW` and
`marginAboveRequiredW = psuW - requiredW`. The shared `requiredPower` function takes
the maximum of calculated draw plus headroom and the GPU catalog PSU recommendation.
The adviser, compatibility checks and UI use that requirement. Preserve this fix.

Tool descriptions should distinguish application-state edits from purchases.
`apply:true` modifies the configurator; it does not purchase anything. Cost-preview
guidance should respect explicit authorization. Watchdog suggestions must remain
optional and must not override a user's no-watchdogs instruction. Do not weaken
browser security review or use misleading annotations to avoid approvals.

## Priority 3: validate the actual cold-task workflow

An earlier **9.606-second** run measured three WebMCP calls on an already connected
browser. It omitted full per-part stock verification and the visible-builder
finish. It is **not** evidence of a sub-minute complete task. The 83-second earlier
rerun also included browser blocks and is not a clean equivalent baseline.

For the next benchmark:

1. Start the clock before browser setup and record any excluded initial instruction
   reading. Follow the browser skill; reuse/claim the existing tab when appropriate.
2. Keep the preview visible. Discover current tools, then use grouped reads.
3. Recommend a phone from live results; apply and verify the $1700/1440p PC.
4. Open the completed builder, process route-change notifications, and verify all
   nine selections. Capture the final visible state through the supported browser
   API. Forward image results as images, never JSON/text/base64 dumps.
5. Stop the measurement after final verification. Record every attempted tool call,
   errors, discovery, browser setup, screenshot work and approval wait separately.
   Report total elapsed time separately from summed tool execution time.

The report's screenshot was incorrectly serialized as text and had to be repeated.
That was an agent orchestration error, not a shop bug. Its second discovery after
navigation was legitimate. Do not optimize by omitting necessary browser setup,
visual verification, unavailable-part checks or authorization.

No game-specific FPS or CZK exchange-rate source exists in the demonstrated tools.
Report those limits rather than assigning a generic estimate to Cyberpunk or
inventing a conversion. Do not create a new visible Codex task unless the user asks;
describe a repeatable fresh-task benchmark if a fresh task cannot be run here.

## Files and tests to start with

- `src/app/webmcp/tools.ts`: schemas, descriptions, snapshots and individual handlers.
- `src/app/webmcp/toolResult.ts`: output ceilings and truncation.
- `src/app/webmcp/buildAdvisor.ts`: recommendations and power reports.
- `src/entities/build/metrics.ts`: shared compatibility and power rules.
- `src/data/catalog/listingStock.ts`: storefront stock semantics.
- `src/app/App.tsx`: controller-owned mutations and visible navigation.
- `src/app/webmcp/index.ts`: registration lifecycle; don't reintroduce serialized
  per-tool registration.
- `src/app/webmcp/efficiency.test.ts`, `tools.test.ts`, `registration.test.ts`,
  `docs.test.ts`, and `src/entities/build/metrics.test.ts`.
- `docs/webmcp-tools.md`, `docs/webmcp-architecture.md`, and
  `docs/decisions/0006-webmcp-tools-follow-the-screen.md`.

Run `npm test`, `npm run build`, and relevant catalog checks. Update tool reference
and architecture documentation with interface changes. Preserve unrelated edits.

## Deployment and repository notes

The user previously requested commits and release on GPT Sites, and explicitly
made the site public. Follow the current Sites hosting skill and approval rules.
Reuse `.openai/hosting.json`; do not create another site or change its access.

The project ID is `appgprj_6a949c45a67c8191a1433a138503ca1c`.
The latest deployed source snapshot from this session was
`364ee58042cb3f820f0ca8f3c6f74059eb9ddc2f` (Sites version 3). Query current remote
state before relying on this, since another task may have deployed afterward.

Local project commits and deployed snapshot commits intentionally differ. The
initial full-history push stalled on hundreds of MB of original PNG history.
A source-only checkout was used instead:
`C:/Users/Sajmon/Projects/Active/rigsmith-backups/20260830-231308/sites-source`.
It contains the exact committed source tree and a small independent Git history.
Verify source-tree equality before saving a version; never claim that a local
project SHA was pushed when only a different snapshot SHA was pushed.

Build output is `dist/client`, `dist/server/index.js`, and hosting metadata.
Use the Sites packaging helper with a clean staging directory containing only the
current outputs; old root-level `dist` files may remain from before the layout
change. Pass `/c/...` paths to Git Bash's tar helper on Windows. Obtain fresh Sites
write credentials as needed, use per-command authorization, and never persist or
print tokens. Do not force-push over another agent's source changes.

Original PNG backup (keep outside deployment):
`C:/Users/Sajmon/Projects/Active/rigsmith-backups/20260830-231308/original-png-images.zip`.
It contains 270 originals, approximately 417.4 MiB; deployed WebP images total
approximately 32.9 MiB. Do not undo the conversion to address tool latency.
