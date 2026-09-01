# GPU game simulation fixtures

`src/data/benchmarks/gpuGames.ts` contains hand-authored fictional GPU frame samples for all 13 graphics cards in `CATALOG.gpu`. It covers `counter-strike-2`, `fortnite`, and `cyberpunk-2077` at 1080p, 1440p, and 4K, with both `averageFps` and `low1PercentFps`.

These values remain simulation fixtures. Four matched product tiers use rounded review averages as anchors; all other rows use documented per-game, per-resolution scaling. They do not represent this app's hardware measurements or complete-build predictions.

## Fixed presets

- Counter-Strike 2 uses the calibrated Very High native-raster reference protocol.
- Fortnite uses the calibrated Ultra DX12 software-Lumen reference protocol.
- Cyberpunk 2077 uses the calibrated Ultra native-raster reference protocol.

All three presets use native resolution with no upscaling and no frame generation. The GPU fixture is an authored simulation input. A separate CPU worker authors the CPU ceiling. The parent simulation combines the independent ceilings with `min(CPU ceiling, GPU ceiling)` and keeps the result labeled as a fictional simulation.

The tiers are game-specific. Resolution and per-game scaling preserve the authored differences while calibration grounds four real product tiers. See `src/data/benchmarks/gpuGameCalibration.ts` for source references, selected anchors, and reproducible derivation.

## Calibration provenance

The average FPS for four matched fictional tiers is rounded from measured review references: GX 5090 maps to GeForce RTX 5090, GX 5080 to RTX 5080, GX 5070 to ASUS TUF RTX 5070 OC, and Fabrikam RX 9070 XT to Radeon RX 9070 XT. Fortnite uses the separate 4Gamer RTX 5090/5080 DX12 software-Lumen references. These values remain simulation fixtures because the review rigs and protocols are not the app's complete-build runtime.

Every remaining GPU/game row is marked `scaled-simulation` in `src/data/benchmarks/gpuGameCalibration.ts`: its original per-game, per-resolution ratio to the selected nearest anchor is retained. RX 9080 XT and RX 9090 XTX are marked `fictional-extrapolation`; neither has a verified real product counterpart. The synthetic 1% lows use each row's original low/average ratio and are not measured percentile data.

For each resolution: `average = round(authored product average / authored anchor average * reference average)`. Synthetic lows retain the authored product's low/average ratio. Direct anchors resolve to themselves, so their rounded reference averages are preserved.

For CS2/Cyberpunk, unmeasured lower Northwind tiers use RTX 5070, the 5070 Ti uses RTX 5080, and Fabrikam tiers use RX 9070 XT. For Fortnite, unmeasured tiers use RTX 5080, except the GX 5090 Reference Edition uses RTX 5090 to preserve the small authored variant difference. Both Fortnite anchors come from the same RTX 5080 review. Radeon Fortnite estimates use cross-vendor scaling without a matching Radeon measurement and have higher uncertainty; this is disclosed in the product dialog.

Reference averages include the review system's CPU and other conditions; they are not isolated GPU ceilings. The whole-build minimum model remains a simplified fictional model, with uncalibrated CPU limits. Calibration grounds the scale of the demo, but does not validate every tier ratio or predict performance for actual builds.
