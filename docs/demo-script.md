# Demo: the agent chooses the parts

## Short shopper prompt

Use this natural-language prompt for the judge-facing flow:

> Open the local Rigsmith shop and help me shop. Compare three current phones by
> showing their detail pages, then recommend one. Build a compatible 1440p gaming
> PC for no more than $1,500. While choosing the parts, visit one or two stronger
> competing GPU pages so I can follow the tradeoff. Compare Fortnite,
> Counter-Strike 2 and Cyberpunk 2077 at the same settings; these are fictional
> simulations, not measured benchmarks. Check the completed build's compatibility,
> stock and shipping. If a materially stronger GPU is actually unavailable or
> ships in three or more days, show it to me and ask whether I want a stock or
> price watch; wait for my answer before creating one. Then add the recommended
> phone and compatible PC to the cart. Do not check out, order or pay.

This prompt deliberately bounds the exploratory work: three phone pages, at most
two competing GPU pages, one batched game comparison and one final build report.
The shopper still sees the important route changes and keeps the final say over
the watchdog. It does not prescribe tool names, and it does not require a
watchdog when the live catalog has no qualifying candidate.

> Current selection contract (ADR 0009): inspection and explanation fields are optional. Select known catalog ids directly; current stock, compatibility and budget checks remain mandatory. Earlier descriptions of required inspection below are historical.

Ask the browser agent:

> Choose a PC from this catalog for up to $1700 at 1440p. Open the builder first. Compare candidates yourself and explain why you choose each part over an alternative. Do not add anything to the cart or create watches.

The agent starts with `begin_build`, searches, optionally inspects candidate facts using `inspect_build_options`, and selects with `set_build_component`. It supplies its own reason and tradeoff and explains them in the conversation. The existing builder shows the selected components; there is no added explanation panel.

Before finalizing, the agent can evaluate whole-build tradeoffs with `compare_build_options`, supplying its own candidate swaps without changing the current build. For the watchdog path, pass `games: ["fortnite", "counter-strike-2", "cyberpunk-2077"]`. The result can include a dynamic `watchdogOffer` only for an under-budget, compatible baseline when a candidate GPU averages at least 10% more GPU-fixture FPS across all three games, regresses in none, and is out of stock or ships in three or more days. It also reports whether the alternative build fits the budget. Open that candidate with `show_in_catalog`, ask the shopper, and call `create_watchdog` only after consent. Explain whether gains justify costs for the brief; there is no automatic winner and no hardcoded candidate or delay. The shopper does not need to name these tools in their prompt.

Reserve money for missing parts and revise earlier choices if necessary. Never silently raise the budget. A case includes its fans; undo restores both together.

Finish with `check_build_compatibility` and visual verification. State the total and known limitations. There is no automatic `recommend_build` tool or fixed call-count target.

The catalog is fictional. Stock, prices and performance are illustrative. No game benchmarks or complete physical-fit certification are provided. Checkout is a preview, and watches are temporary records without notifications.
