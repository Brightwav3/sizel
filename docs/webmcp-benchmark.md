# Benchmarking the complete shopping task

The target is the **whole user task** in under a minute: a Pear phone
recommendation plus a $1700 / 1440p PC that is applied, verified and visible in
the browser preview. That target has not been demonstrated yet. The recorded
run in the session report took 81 seconds and 15 WebMCP calls.

This file is the protocol, so a later run is comparable rather than a new
measurement of a different thing.

## What counts as the task

1. A phone recommendation drawn from live catalog results.
2. A complete nine-part PC within $1700 at 1440p, applied to the configurator.
3. All nine selections verified — part, price, stock, delivery.
4. The completed builder visible in the browser preview, captured through the
   supported screenshot API and forwarded as an image.
5. An English answer: phone, PC summary, combined hardware price, limitations.

No cart writes, no watchdogs, no checkout, no orders.

## Measurement rules

- Start the clock **before** browser setup. Note separately any instruction
  reading excluded from the clock.
- Stop the clock **after** the final visual verification, not after writing
  the answer.
- Report total elapsed time and summed tool execution time as two numbers.
  They are not interchangeable.
- Record every attempted call, including failures and retries; every discovery
  fetch; browser setup; screenshot work; and any approval wait, each as its own
  line.
- Never omit browser setup, visual verification, unavailable-part checks or
  authorization to make the number smaller. A run that skips them is not a
  measurement of this task.

## The call budget this interface allows

| Step | Call |
| --- | --- |
| 1 | `read_shop` — `search.compare` for phones, `include: ["build"]` |
| 2 | `recommend_build` — `budget: 1700, resolution: "1440p", apply: true, configure: true` |
| 3 | `show_in_catalog` — `view: "builder"` |
| 4 | `read_shop` — `include: ["build"]` to verify all nine slots |

Four calls, plus discovery and the screenshot. Step 4 needs no
`get_current_build` and no per-part `check_stock`: the build report carries
every slot with the same stock the storefront shows.

A second discovery fetch after navigation is legitimate — the route change
alters the tool set. Do not count it as waste.

## Known limits to report, never to paper over

- No per-game FPS source exists. `fps` is a catalog estimate. Do not attach it
  to a named game.
- No exchange-rate source exists. Prices are USD; do not convert.
