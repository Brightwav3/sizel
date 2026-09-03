# GPU benchmark fixtures

`src/data/benchmarks/gpu.ts` contains the fictional GPU performance fixtures used by the comparison experience. It exports one `GpuBenchmark` for every GPU in the canonical `CATALOG.gpu` list.

Each fixture has two scenario presets and three resolutions. A sample contains `averageFps` and `low1PercentFps`. The values are hand-authored comparison fixtures. They are not measurements, and they are not calculated from clock speed, memory size, price, or another catalog field.

## Presets

- `competitive` represents a responsive, high-frame-rate raster workload with lighter scene complexity. Its 1440p values are generally about 100–350 FPS.
- `cinematic` represents a heavier raster workload with more complex lighting and scene detail. Its 1440p values are generally about 40–160 FPS.

Both presets assume the same test platform and direct rendering. They include no ray tracing, upscaling, frame generation, named game, driver claim, or image quality claim. `low1PercentFps` is a fictional frame-time stability signal and is always at or below `averageFps`.

The fixtures fall into broad performance tiers. Moving from the Fabrikam RX 9060 XT to the RX 9070 and RX 9070 XT is a visible gaming uplift in both presets. The upper tiers continue to improve, while each extra step represents a smaller practical gain than the broad midrange jumps. The Northwind reference edition is slightly below the regular GX 5090 fixture to model a conservative variant comparison.

Every resolution is lower than the previous one for a given GPU and scenario. This keeps comparisons coherent without suggesting that the numbers are universal scaling laws.

## Build estimate model

The GPU fixture supplies the GPU side of a scenario and resolution estimate. The CPU benchmark worker supplies a scenario ceiling for the selected processor. The build estimate combines those independent fictional limits with the disclosed model:

```text
estimated FPS = min(CPU scenario ceiling, GPU scenario average FPS)
```

This is useful for explaining why a faster graphics card may show little change in a CPU-limited competitive workload. It is a product comparison aid, not a substitute for measured benchmarks on a specific game, system, driver, or settings profile.
