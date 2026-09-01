# ADR 0010: Explicit simulated benchmarks for fictional shopping tasks

- **Status:** Accepted
- **Date:** 2026-08-31
- **Extends:** Whole-build comparison and the removal of unsupported measured performance claims

## Context

Unknown real performance correctly prevents real-world claims but cannot test optimization over fictional products. The owner requested category-specific Luna agents to author a coherent simulated dataset. The shop must supply evidence, not choose a precomputed winner.

## Decision

Category fixtures live in `src/data/benchmarks`: CPU reference ceilings, GPU workload results at three resolutions, memory scenario support and storage loading times. All numeric performance fixtures are authored fiction, not measurements or extrapolations from cores, clocks, VRAM or price. Catalog capacity remains factual within the fictional catalog.

Version `rigsmith-simulation-v1` defines two fictional raster workloads: `competitive` and `cinematic`, with no ray tracing, upscaling or frame generation. Default cinematic is an explicit assumption, not a customer requirement. Agents can select a scenario in `estimate_performance` and `compare_build_options`.

Whole-build composition uses the minimum of CPU and GPU average FPS ceilings, and separately the minimum of their 1% low ceilings. This is an intentionally simplified simulation protocol, not physical modeling or measured CPU/GPU pair evidence. Supported RAM capacity is a prerequisite, not an FPS multiplier. Storage load time is reported separately, never used to boost FPS. Known incompatible or missing-fixture builds report unavailable results instead of fabricated numbers. Stock and budget eligibility remain separate checks.

Measured FPS and noise remain null. Simulated results have a separate `simulation` object with dataset version, scenario, resolution and status. Comparisons return simulated deltas without ranking or applying choices. Neither prices nor the shopper budget alter performance fixtures. No global optimum is certified and no UI panel is added.

## Rejected alternatives

- Use a CPU/core/clock formula as if it were measured performance.
- Present synthetic numbers as real product benchmarks or predictions.
- Let the shop rank or apply a winner based on the simulated score.

## Explicit non-decisions

- The fixtures do not certify actual game or application performance.
- Measured FPS and noise remain unavailable.
- This does not add a benchmark panel or change the human-facing storefront.

## Consequences

The dataset enables repeatable tradeoff tests within the mock catalog, including GPU upgrades near the budget, CPU-limited results, diminishing returns and scenario-dependent rankings. It cannot justify real hardware purchases. The old internal clock/core formula is not the simulation source. Version the fixture protocol when changing behavior and rerun category coverage and integration tests.

## Enforced in

- Category tests in `src/data/benchmarks`
- `src/entities/build/simulatedBenchmarks.test.ts`
- `src/app/webmcp/production.test.ts`
