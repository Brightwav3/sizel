# GPU benchmark research

Research date: 2026-08-31. These references support the v2 GPU game calibration; see [the runtime methodology](benchmarks-gpu-games.md) for selected anchors and simulated derivations.
CPU product-page performance widgets were removed; CPU fixtures remain inputs to whole-build simulation.

## Measured reference candidates

[PC Guide, MSI Suprim SOC RTX 5090 review](https://www.pcguide.com/gpu/review/msi-suprim-soc-rtx-5090/), updated July 25, 2025.
Test bench: Ryzen 7 9800X3D, ASUS Prime X870-P WiFi, 64 GB DDR5-6600 CL32.
The review warns that comparison cards used older drivers.

Average FPS transcribed from review charts during research:

| GPU | Game / preset | 1080p | 1440p | 4K |
| --- | --- | ---: | ---: | ---: |
| RTX 5090 | Cyberpunk 2077, Ultra raster | 231 | 212 | 110 |
| RX 9070 XT | Cyberpunk 2077, Ultra raster | 193 | 129 | 61 |
| RTX 5090 | Counter-Strike 2, Very High | 627 | 507 | 311 |
| RX 9070 XT | Counter-Strike 2, Very High | 339 | 231 | 110 |
| RTX 5080 | Cyberpunk 2077, Ultra raster | 213 | 151 | 72 |
| ASUS TUF RTX 5070 OC | Cyberpunk 2077, Ultra raster | 169 | 108 | 48 |
| RTX 5080 FE | Counter-Strike 2, Very High | 468 | 346 | 188 |
| ASUS TUF RTX 5070 OC | Counter-Strike 2, Very High | 357 | 249 | 130 |

Cyberpunk's article prose contains a duplicated-resolution typo; use the chart, not that sentence.
The chart legends say "5th percentile", while prose refers to "1% lows". Exclude secondary metrics until the publisher clarifies this conflict; these are not interchangeable.
These presets differ from the previous v1 High / competitive-low presets. The v2 labels must match the selected reference protocols.

## Expanded research

- [Additional raster references](gpu-raster-research.md): lower-tier RTX 5060, RTX 5070 and an independent RX 9070 XT test, with distinct methodologies preserved.
- [Fortnite references](gpu-fortnite-research.md): renderer and preset checks; do not treat an Ultra result as the current High fixture.

Use a source-specific reference set per game and preset. Missing cells must remain missing in the measured-reference dataset. Any later interpolation for fictional products needs a separate, explicitly simulated field and documented derivation. Do not reuse estimated 1% lows as measured statistics.

## More controlled comparison source

[TechSpot RTX 5090 review](https://www.techspot.com/review/2944-nvidia-geforce-rtx-5090/) and
[TechSpot RX 9070 XT review](https://www.techspot.com/review/2961-amd-radeon-9070-xt/)
use Ryzen 7 9800X3D, MSI X870E Carbon WiFi and DDR5-6000 CL30.
These are useful for a consistent reference platform but do not cover Fortnite in these reviews.

## Mapping constraints

Northwind GX 50-series names suggest NVIDIA RTX 50-series performance tiers, but fictional products must not be presented as measured real hardware.
Fabrikam RX 9070 / RX 9070 XT have close real counterparts.
The fictional RX 9060 XT's 12 GB / 192-bit configuration does not match the real 8/16 GB, 128-bit products:
[AMD RX 9060 XT specifications](https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9060xt.html).
No direct real counterpart was verified for Fabrikam RX 9080 XT or RX 9090 XTX.

## Calibration constraints

1. Fortnite has verified RTX 5080 and RTX 5090 references in the same 4Gamer RTX 5080 review. Use that run consistently; its DX12 Ultra / software-Lumen workload differs from v1. Radeon coverage under that protocol is missing.
2. Choose a reference platform and per-game presets. Keep separately sourced test runs identified; never imply they were one controlled test.
3. Store source URL, test hardware, preset, resolution, date and derivation alongside each supported fixture.
4. Keep missing reference results unavailable rather than inventing 1% lows or applying a universal scaling factor.
5. Update product UI and whole-build WebMCP descriptions together. Retain the simulation label and distinguish individual GPU reference results from complete-build predictions.
