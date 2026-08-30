# How `recommend_build` decides

`recommend_build` assembles a complete nine-part machine for a budget. This is
what it optimises for, what it deliberately will not do, and where the model
behind it runs out.

The code is `recommendBuild` in `src/app/webmcp/buildAdvisor.ts`. It is
deterministic: the same request always returns the same machine, so an agent
can explain its own suggestion.

## The promise

**A budget may be exceeded by at most ten per cent.** Not a hint — a cap the
algorithm holds to, enforced by a test across every budget from $800 to $5,000.

Below a certain point no budget can be met at all. The cheapest compatible
machine in this catalog costs **$854**. Asked for less, the result says
`withinBudget: false` and reports `cheapestPossible`, rather than quietly
overshooting and hoping nobody checks.

## Where the money goes

Each slot claims a share of the budget, weighted by what the shopper is
building for. Each column sums to 1.

| Slot | 1080p | 1440p | 4K |
| --- | --- | --- | --- |
| Graphics card | 30 % | 36 % | 45 % |
| Processor | 22 % | 17 % | 13 % |
| Motherboard | 10 % | 9 % | 8 % |
| Memory | 8 % | 8 % | 7 % |
| Storage | 8 % | 8 % | 7 % |
| Power supply | 7 % | 7 % | 6 % |
| Case | 6 % | 6 % | 5 % |
| Cooler | 6 % | 6 % | 6 % |
| Case fans | 3 % | 3 % | 3 % |

A slot may stretch to 1.15 × its share, as long as the total cap still holds.

## The passes

**1 — Claim.** Slots are filled in constraint order: `cpu → board → ram →
cooler → gpu → psu → case → storage → fans`. Each part narrows the ones after
it. Before a slot spends, it reserves what every unfilled slot will cost, so an
early slot cannot eat the machine.

**2 — Trim back.** Reserving the cheapest listing per slot is only an estimate,
because the cheapest part is not always a compatible one. If the total still
overshoots, the dearest slot steps down until the cap holds. This is what makes
the ten per cent true rather than intended.

**3 — Upgrade.** Whatever is left goes into the slots that move the frame rate,
repeatedly until nothing more can be bought — money freed by a cheap case can
still reach the graphics card. Candidates are **not** pre-filtered for fit
here: a bigger card outgrows the case and power supply that were bought at
their cheapest, so those are lifted to carry it. Screening such cards out would
tell the shopper their budget cannot buy a card their money plainly covers.

**4 — Trim again.** The first pass buys a processor before the card it will
drive exists, so it can pay for pace the card never asks for. Each slot drops
to the cheapest part that holds the same frame rate, and the money returns to
the next upgrade round.

**5 — Re-size the power supply.** A stronger card can outgrow the unit the
first pass sized.

## How "best" is decided per slot

| Slot | Measured by |
| --- | --- |
| Graphics card | Frame rate |
| Processor, memory | Benchmark score |
| Storage | Capacity |
| Power supply | Cheapest unit covering the draw with 15 % headroom |
| Motherboard, case, cooler, fans | Cheapest that fits |

A slot missing a performance number takes the cheapest part that fits. Paying
more for it buys nothing the build model can show the shopper, so the money
stays with the parts that count.

Upgrades are judged by **the machine they produce**, not by the part's own
number. A processor past the point where the frame-rate model stops rewarding
it is money spent for nothing, so only an upgrade that moves the build is
bought — and among equals, the cheapest.

## What the resolution actually changes

In the frame-rate model a resolution is a plain multiplier:

```text
fps = gpu.fps × min(1, cpu.score / 100) × min(1, ram.score / 100) × RES[resolution]
```

Because it multiplies everything uniformly, **it never changes which machine is
fastest** — only the number that machine reaches. Weighting the budget shares
by resolution shapes the first pass, but the optimiser converges regardless.

What resolution does change is how much machine the shopper needs. 144 frames
at 1080p is a far cheaper ask than 144 at 4K. That is where `targetFps` earns
its place: once the build clears the target the upgrades stop, and the rest of
the budget stays with the shopper. Storage keeps going, because capacity is a
benefit the target says nothing about.

## Measured behaviour

At the default target of 144 fps and 1440p:

| Asked | Spent | Over | Frame rate |
| --- | --- | --- | --- |
| $800 | $868 | +8 % | 111 |
| $999 | $1,042 | +4 % | 139 |
| $1,200 | $1,212 | +1 % | 139 |
| $1,600 | $1,522 | −5 % | 151 |
| $2,400 | $2,302 | −4 % | 162 |
| $3,500 | $3,642 | +4 % | 165 |
| $5,000 | $3,642 | −27 % | 165 |

$5,000 falls short because the catalog runs out: nothing above the $2,099 card
exists. `headroom` reports it.

The $999 machine, applied to the screen and read back from it:

| Slot | Part | Price |
| --- | --- | --- |
| Processor | Contoso C3 230 | $139 |
| Graphics card | Fabrikam RX 9060 XT | $379 |
| Motherboard | Contoso Board B860 | $179 |
| Memory | Proseware Pulse 32 GB DDR5-6000 | $89 |
| Storage | Woodgrove Blue 4 TB | $79 |
| Cooler | Acme Labs Frost 24 | $29 |
| Power supply | Tailspin Power 550 | $59 |
| Case | Proseware Tower | $89 |
| Case fans | included with the case | $0 |

$1,042 · 139 fps at 1440p · 387 W · quiet · everything fits. The power supply
is 550 W against a 446 W requirement; the processor is the cheapest that does
not hold the card back; the leftover went into 4 TB of storage, because the
frame rate had nowhere further to go.

## What it was before

The first version was measured and found wanting. It is worth recording what
went wrong, because each fault looked reasonable in the code:

- **It overspent an $800 budget by 68 per cent.** When nothing compatible fell
  inside a slot's share it fell back to the whole catalog, and the ceiling went
  with it.
- **It bought the dearest motherboard and case it could afford.** The ranking
  was `fps ?? score ?? watt ?? price`, so slots with no performance number fell
  through to price — which reads as "buy the most expensive one that fits".
- **It sized the power supply by wattage**, so it always bought the largest
  unit it could reach: 650 W against a 400 W need.
- **The resolution changed nothing.** 1080p and 4K returned identical parts.

## Known limits

- The frame-rate model is this shop's own estimate over fictional catalog data.
  It is not a benchmark, and `compare_build_to_product` says so in its result
  rather than pretending a console figure is comparable.
- Motherboard and case are always the cheapest that fit. That is correct under
  this model — neither carries a number the model can reward — but a real shop
  would weigh features the catalog does not record.
- `quiet` is a hard filter at 34 dB, not a preference weight. If nothing quiet
  fits, it is dropped rather than traded off.
- The greedy passes do not search the whole space. They are deterministic and
  explainable, which matters more here than the last few dollars of value.
