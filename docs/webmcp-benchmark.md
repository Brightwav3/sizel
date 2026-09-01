# Benchmark independent agent selection

The previous four-call workflow used `recommend_build` and no longer exists. Its 81-second / 15-call run measured a different interface. Do not present it as a measurement of independent agent selection.

## Task and workflow

1. `begin_build` opens the existing builder before any selections and records the brief and hard USD budget. No new page panel is added.
2. Search the catalog and use `inspect_build_options` when candidate facts or a focused comparison are useful. It focuses the existing slot listing, without choosing a product. Inspection is optional; selection still validates the current catalog state. Follow `search_products.nextOffset` when more results are needed.
3. Apply the complete agent-selected build with `set_build_components`. The command validates all eight non-fan slots atomically, and the case includes its fans. The selection appears in the existing build sheet. Explain choices in the conversation.
4. Verify completion, price, stock and known conflicts with `check_build_compatibility`, then visually verify the builder. Do not add to cart, create watches or open checkout unless requested.

## Measurement and quality

Start before browser setup and stop after visual verification. Report total time separately from tool time; include discovery, failures, retries and approval waits. Record candidates actually inspected and assess whether reasons cite available facts, address the brief and describe alternatives fairly. Valid text parameters do not prove understanding.

Do not use the legacy internal recommendation helper or fixed product ids as a shortcut. Do not optimize toward an arbitrary call count or fake progress with timers. The earlier under-one-minute target is not a quality criterion for this different task.

Catalog data are synthetic. There are no per-game benchmarks, exchange rates, live stock checks, notification service or payment backend. Seven fit rules do not certify complete BIOS or physical compatibility. This measures configuration, not a completed purchase.
