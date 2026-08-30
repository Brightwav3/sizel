# Demo script

What to say to an agent to see Rigsmith work, and which tool each line should
reach. Written to be run in Chrome with WebMCP enabled and the [Model Context
Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd)
open, so the tool calls are visible beside the page.

Setup is in the [README](../README.md#running-the-tools-locally). Every product
and brand is fictional.

## The three-minute run

The whole point is that the browser is not a passive surface: each call lands
on screen while the shopper watches. Keep the page visible throughout.

### 1 — A machine for a budget (~35s)

> "I want a gaming PC for about $1,000."

`set_build_target` moves the controls; `recommend_build` proposes a complete
nine-part machine and applies it. The build panel fills in, slot by slot.

Expect around **$1,042, 139 fps at 1440p, 387 W, everything fits**. The total is
four per cent over $1,000 — the tool caps itself at ten and reports
`withinBudget`.

> "Why only 139 frames?"

`explain_build_bottleneck` names the graphics card as the limit and says
nothing else holds it back. On a cheaper processor it names that instead, with
the frames it costs.

### 2 — Break it, on purpose (~40s)

> "Put a Fabrikam R5 9600X in it."

`set_build_component` fits it and the screen turns: a red banner, *"1 part do
not fit"*, and the sentence

> Fabrikam R5 9600X uses AM5, but Contoso Board B860 uses LGA1851.

This is the moment the demo exists for. A compatibility message states a
conflict but never names the part to change — a scraping agent is stuck here.

> "Fix it."

`fix_build_issue` returns six ways out: three processors and three
motherboards, each of which clears the conflict, smallest price change first,
with the effect on frame rate. One of them is **$60 cheaper** than what is
fitted. The agent offers; the shopper picks.

Apply one and the banner clears.

### 3 — The shop says no (~20s)

> "Use the Northwind GX 5090 Reference Edition instead."

The result carries `concern: "out_of_stock"` and

> This part sets the delivery date. Tell the shopper and offer to watch it.

A good agent raises the delay rather than quietly substituting something else.

> "Yes, watch it."

`create_watchdog`. Everything stays on this device — it is not an email alert,
and the tool description says so.

### 4 — Is a PC even the right answer? (~30s)

> "Would a console be cheaper?"

`compare_build_to_product` puts the build against a Fourth Castle V Slim:
price, delivery, and what each states it can do. The result says outright that
the build's frame rate is this shop's estimate while the console's figures are
stated capabilities, and that the two are not measured the same way. The
catalog has no frame-rate number for a console and the tool does not invent
one.

### 5 — Hand back control (~25s)

> "Add the build to the cart and start checkout."

`add_build_to_cart` refuses while a conflict is open, so clear it first.
`start_checkout` opens the delivery step — and stops. `get_checkout_fields`
can tell the shopper what to have ready: name, phone, address, then card
details.

**No tool fills any of those in.** The order is not placed. That is the line
this project draws, and it is worth saying out loud in the video.

## Shorter variations

**Filtering that actually filters (~20s)**

> "Find me a 16 GB graphics card with ray tracing under $700."

`list_filters` gives the facet names, `search_products` applies them. Ask for a
filter a category does not have and the answer names it as wrong rather than
ignoring it and returning everything.

**Watching the agent search (~15s)**

> "Show me what you looked at."

`show_in_catalog` puts the query, brand and price range into the real
controls. The shopper sees the same grid the agent reasoned over.

**Phones (~20s)**

> "What storage sizes does the Pear Phone 16e come in?"

`get_product_variants` returns 128 / 256 / 512 GB with prices and five
finishes. `select_product_variant` opens the one being discussed.

## Recording notes

- Keep the tool inspector and the page side by side; the point is that they
  agree.
- The build panel, the total and the compatibility banner all move as calls
  land. Do not cut away from them.
- Three minutes is the cap, audio is required, and the video must be public on
  YouTube.
- Say once that the catalog is fictional.

## What a judge can check without watching anything

```bash
npm install
npm test          # 107 tests: tool contract, result budgets, build rules, docs
npm run build
npm run check:catalog
```

The tool contract tests are the interesting ones: they hold every tool to
Chrome's character budgets, check that read-only tools are marked read-only and
that the only tool returning shopper-written text is marked untrusted, and fail
if the README and the tool reference drift from what the code registers.
