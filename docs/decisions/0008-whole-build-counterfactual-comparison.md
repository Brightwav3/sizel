# ADR 0008: Compare agent-proposed whole builds before finalizing

- **Status:** Accepted
- **Date:** 2026-08-31
- **Extends:** ADR 0007

## Context

The independent agent produced a $1,408 build within a $1,700 budget and justified individual parts, but did not assess a $100 GPU upgrade at whole-build level. Valid selections and explanation strings do not establish value for the shopper.

## Decision

Expose read-only `compare_build_options`. The agent supplies one to three slot-change maps relative to the current complete build. Multiple simultaneous changes support platform comparisons. The shop calculates whole-build totals, marginal price, explicitly labeled simulated FPS when requested, power, shipping days, hard budget and known orderability checks. Measured FPS and noise remain unavailable. Changed cases inherit their included fans unless the agent supplies another valid fan choice. Unknown, duplicate and unchanged proposals are rejected; incompatible, unavailable and over-budget proposals are returned as ineligible, not hidden.

The tool never generates, ranks or applies candidates. It returns the build revision; comparisons must be repeated after edits. Instructions in build initiation, the complete-build report and the comparison tool ask the agent to examine a meaningful upgrade within budget and a cheaper viable alternative where available, and explain the final tradeoff against the brief in conversation. The existing storefront remains unchanged.

## Rejected alternatives

- An automatic optimizer selecting a winner: takes the decision away from the agent and optimizes a synthetic score.
- A mandatory reason string or comparison-count checkout gate: proves ceremony, not sound reasoning; would also obstruct manual shoppers.
- Always exhaust the budget: savings can be the correct choice.

## Explicit non-decisions

- The comparison tool does not rank proposals, choose a winner or apply changes.
- It does not certify a globally optimal build or measured real-world performance.
- It does not add a comparison-count gate to checkout or require comparison for manual shoppers.

## Consequences

This provides evidence for comparative decisions; it does not certify a global optimum, measured performance, truth of explanations or agent compliance with the workflow. Tools enforce valid inputs and calculate facts; the agent remains responsible for searching meaningful alternatives and assessing needs. Equal simulated FPS cannot establish equivalent real performance. External benchmarks and richer product facts are still needed for production recommendations.

## Enforced in

- `src/app/webmcp/compareBuildOptions.ts`
- `src/app/webmcp/production.test.ts`
- `docs/agent-choice-test.md` (behavioral acceptance task; not claimed as an automated pass)
