# CPU benchmark fixtures

`src/data/benchmarks/cpu.ts` contains hand-authored values for every CPU in
`public/catalog/products.json`. The values are fictional simulation inputs for
the recommendation demo. They are not measured FPS, manufacturer claims, or
predictions of real hardware performance.

Each CPU has two reference scenarios:

- `competitive`: a high-refresh competitive workload where frame-time
  consistency matters. The fixture records an average FPS ceiling and its
  simulated 1% low.
- `cinematic`: a visually heavier workload where the CPU ceiling is lower and
  sustained multicore throughput has more influence. It also records an
  average FPS ceiling and simulated 1% low.

The ceilings stay in compact demo bands: competitive averages are 160–400 FPS
and cinematic averages are 80–190 FPS. Every 1% low is positive and no higher
than its scenario average. These ranges make the fixtures easy to read and
keep the UI from suggesting false precision.

The values were authored by scenario role rather than calculated from catalog
cores, clocks, price, or any other specification. X3D parts intentionally
stand out in the competitive scenario, while the regular high-core R9 9950X
has the higher cinematic ceiling. That tradeoff gives the builder a useful
example of choosing for workload instead of assuming one CPU wins every case.

The fixture does not encode a universal price or tier ranking. A more
expensive CPU can be a poor fit for a specific scenario, and equal simulated
FPS would still not establish equal real-world performance. If the demo later
combines CPU and GPU ceilings, it should label the result as a fictional
CPU-bound/GPU-bound simulation and take the lower applicable ceiling.
