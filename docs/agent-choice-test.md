# Behavioral acceptance: does the agent justify the whole build?

Give an external agent this task using only the browser and exposed WebMCP tools:

> Build the best gaming PC you can within $1,500 in this fictional catalog. Use the cinematic 1440p simulation scenario. Choose components yourself. Compare a relevant upgrade near the budget limit, especially GPU, and derive any component price cap from the remaining build cost. Maximize benefit for this scenario; do not prioritize savings automatically. Explain simulated FPS, 1% lows, loading-time tradeoffs and any unspent budget. State that these are fictional fixtures, not real benchmarks. Compare again after changes and do not place an order.

Acceptance requires all of these, not a particular selected GPU:

1. The agent searches for meaningful alternatives. Invalid or cosmetic changes alone are not evidence of comparison; if no viable option is found, the agent documents the search and limitation.
2. Comparison results refer to the final build revision and the agreed budget. Changes to several parts are assessed together, not by adding standalone performance numbers.
3. For the earlier $1,408 example, the agent explicitly evaluates the $100 GPU upgrade if it remains viable. It explains the marginal gains and cost; saying only “saves $100” is insufficient.
4. The final explanation addresses why the chosen tradeoff fits the brief, including unspent budget. Unknown games or preferences are identified when they prevent a defensible recommendation, not silently invented.
5. No measured-performance or globally-best claim is made from synthetic scores. Comparison does not alter the page or chosen parts; only explicit selections do. No extra panel appears.

Record actual tool results and final reasoning as evidence. A passing unit test verifies calculations and non-mutation, not the agent's decision quality.
