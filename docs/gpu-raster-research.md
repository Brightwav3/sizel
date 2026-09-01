# GPU raster benchmark research

This note records externally published reference points for the fictional GPU game fixtures. The catalog fixtures state native raster rendering with ray tracing, upscaling, and frame generation disabled. Review results below are usable as calibration anchors only when the review used comparable settings.

## Verified Cyberpunk 2077 samples

| GPU | Resolution | Reported average FPS | Settings stated by source | Source |
|---|---:|---:|---|---|
| GeForce RTX 5060 | 1080p | 100 | High preset, Phantom Liberty; native raster result | [TechSpot RTX 5060 review](https://www.techspot.com/review/2992-nvidia-geforce-rtx-5060/), Cyberpunk section |
| GeForce RTX 5060 | 1440p | 66 | High preset, Phantom Liberty; native raster result | [TechSpot RTX 5060 review](https://www.techspot.com/review/2992-nvidia-geforce-rtx-5060/), Cyberpunk section |
| GeForce RTX 5070 | 4K | 51 | Second-highest raster preset, no RT effects | [TechSpot RTX 5070 review](https://www.techspot.com/review/2960-nvidia-geforce-rtx-5070/), Cyberpunk section |
| Radeon RX 9070 XT | 1440p | 109 | Phantom Liberty, rasterized, no upscaling or frame generation | [GamersNexus RX 9070 XT review](https://gamersnexus.net/gpus/amd-radeon-rx-9070-xt-gpu-review-benchmarks-vs-5070-ti-5070-7900-xt-sapphire-pulse), Cyberpunk section |
| Radeon RX 9070 XT | 4K | 53 | Phantom Liberty, rasterized, no RT | [GamersNexus RX 9070 XT review](https://gamersnexus.net/gpus/amd-radeon-rx-9070-xt-gpu-review-benchmarks-vs-5070-ti-5070-7900-xt-sapphire-pulse), Cyberpunk section |

These numbers were taken from values stated in the review prose, not inferred from chart pixels.

## Coherent PC Guide reference set

PC Guide's PNY RTX 5070 Slim OC review states a complete native-raster series from the same test run: Counter-Strike 2 at 400/271/135 FPS and Cyberpunk 2077 at 150/100/49 FPS for 1080p/1440p/4K. The test platform was Ryzen 7 9800X3D, 64GB DDR5-6600 CL32, and the Cyberpunk result was from the rasterization chart. The card is a factory-overclocked RTX 5070, so use it as a 5070 tier anchor rather than an exact reference-board measurement. [PC Guide RTX 5070 review](https://www.pcguide.com/gpu/review/pny-rtx-5070-slim-oc/)

This is the best single-protocol anchor found for both games and all three resolutions. The PC Guide RX 9070 XT review uses the same general chart layout and test-suite style, but its prose gives relative CS2 results rather than exact FPS. Its prose says the RX 9070 XT leads the RTX 5070 in native Cyberpunk by 14–27% across resolutions. [PC Guide RX 9070 XT review](https://www.pcguide.com/gpu/review/asus-prime-rx-9070-xt-oc/)

## Additional Counter-Strike 2 reference

TechSpot's [RTX 5060 review](https://www.techspot.com/review/2992-nvidia-geforce-rtx-5060/) reports **370 average FPS at 1440p, Medium preset**. Its test platform uses Ryzen 7 9800X3D and DDR5-6000 CL30. This is a separate preset from PC Guide's Very High charts and Rigsmith's competitive-low fixture, so do not merge the samples into a single ranking. High esports FPS alone does not establish that a fixture is unrealistic.

## Implications for the fictional fixtures

- `northwind-gx-5060` is the cleanest direct check: its 1080p/1440p Cyberpunk values (121/86 FPS) are above TechSpot's 100/66 FPS, but the catalog does not specify the review preset or game build. Keep the fixture labeled simulated unless settings are standardized.
- `northwind-gx-5070` reports 61 FPS at 4K versus TechSpot's 51 FPS. The roughly 20% difference is not validated: preset, driver, and test scene may contribute, but the evidence does not establish the cause.
- `fabrikam-rx-9070-xt` reports 131/74 FPS at 1440p/4K versus GamersNexus's 109/53 FPS. The fictional values are roughly 20% and 40% higher; they should not be described as measured results without matching the review methodology.
- TechSpot's RTX 5050 review confirms this class is around 66 FPS average across its complete 1080p game suite, while its Cyberpunk prose gives no exact native-raster FPS. Avoid inventing a Cyberpunk anchor from the chart.
- The published RX 9070 XT raster samples place it near RTX 5070 Ti performance and above RTX 5070, supporting the catalog's broad ordering. They do not validate the fictional RX 9080 XT or RX 9090 XTX names.
- For implementation, anchor the real tiers to the PC Guide RTX 5070 series (150/100/49 Cyberpunk; 400/271/135 CS2) and TechSpot RTX 5060 (100/66 Cyberpunk at 1080p/1440p), then interpolate missing cards as simulation inputs. Do not present interpolated 5050/5060/5070 Ti/5080/5090 or Radeon values as measured values.
- Keep the catalog's RX 9070 XT close to the upper real raster tier, but treat its 131/74 Cyberpunk fixture as a fictional value: it exceeds the inspected PC Guide 5070-tier anchor while remaining in the range of the published RX 9070 XT results.

## Scope limits

Review values vary with game version, preset, CPU, driver, test route, and whether “raster” disables all ray-tracing effects. These samples ground the scale; they are not a basis for directly replacing the authored fixtures.
