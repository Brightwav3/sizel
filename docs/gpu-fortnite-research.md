# Fortnite GPU research

## 4Gamer RTX 5090 FE (primary measured source)

Source: [4Gamer RTX 5090 Founders Edition review](https://www.4gamer.net/games/869/G086964/20250123053/), published 2025-01-23 by Shinichi Miyazaki. The review used an Intel Core i9-14900K (P-core 3.2 GHz, max 5.6 GHz, 24C/32T), ASRock Z790 Steel Legend Wi-Fi, 32 GB Corsair DDR5-5600 CL40, Windows 11 Pro 24H2, and GeForce driver 571.86.

Fortnite settings were Ultra, 3D resolution 100%, TAA, VSync off, unlimited frame rate, Nanite off, hardware ray tracing off, and Lumen highest for global illumination/reflections. Thus this is native raster with no hardware RT, upscaling, or frame generation, but it still includes software Lumen. The review normally specifies DX11 under Benchmark Regulation 30; DX11 crashed on the RTX 5090, so this review used DX12 for Fortnite on both cards. The benchmark is a one-minute CapFrameX capture of a fixed Battle Royale replay route from Pleasant Piazza toward Grim Gate, repeated twice and averaged.

### Correct chart mapping

The chart filenames are not in resolution order. `024.png` is 3840x2160, `025.png` is 2560x1440, and `026.png` is 1920x1080. Values below are average FPS / 1-percentile FPS, read directly from the charts:

| GPU | 1080p | 1440p | 4K |
|---|---:|---:|---:|
| RTX 5090 FE | 144.0 / 115.6 | 124.7 / 105.5 | 86.8 / 73.1 |
| RTX 4090 FE | 121.1 / 92.6 | 98.4 / 78.8 | 65.3 / 55.7 |

Chart images: [1080p](https://www.4gamer.net/games/869/G086964/20250123053/TN/026.png), [1440p](https://www.4gamer.net/games/869/G086964/20250123053/TN/025.png), [4K](https://www.4gamer.net/games/869/G086964/20250123053/TN/024.png).

The source does not measure RX 9070 XT. Do not substitute calculator or aggregator estimates. 4Gamer's underlying [Benchmark Regulation 30](https://www.4gamer.net/games/032/G003251/20241015024/) documents the settings and route; it states that the default is DX11, while the RTX 5090 review explicitly overrides that to DX12 because DX11 crashed.

## 4Gamer RTX 5080 FE (same reviewer and route)

The [RTX 5080 FE review](https://www.4gamer.net/games/869/G086964/20250129055/) uses the same Core i9-14900K test platform, 32 GB DDR5-5600 CL40 memory, Windows 11 Pro 24H2, and the same one-minute CapFrameX replay route. It uses GeForce driver 572.02. Fortnite is explicitly run in DX12 because DX11 crashed on the RTX 5090, and the same API is used for the 5080 comparison. The review states that Fortnite results are graphs 14–16. Settings inherit Regulation 30's Fortnite Ultra setup: 3D resolution 100%, TAA, Nanite off, hardware RT off, no upscaling or frame generation, with Lumen at its Ultra preset value. This remains a software-Lumen workload rather than a fully Lumen-off raster test.

The chart filenames again run 4K, 1440p, 1080p (`035.png`, `036.png`, `037.png`). Average FPS, read directly from the labelled charts:

| GPU | 1080p | 1440p | 4K |
|---|---:|---:|---:|
| RTX 5080 FE | 113.3 | 92.9 | 56.6 |
| RTX 5090 FE | 146.8 | 119.4 | 86.8 |
| RTX 4090 FE | 120.2 | 98.8 | 65.6 |
| RTX 4080 SUPER FE | 103.4 | 81.6 | 49.7 |

Chart images: [4K](https://www.4gamer.net/games/869/G086964/20250129055/TN/035.png), [1440p](https://www.4gamer.net/games/869/G086964/20250129055/TN/036.png), [1080p](https://www.4gamer.net/games/869/G086964/20250129055/TN/037.png).

The apparent non-monotonic scaling (for example, RTX 5090 146.8 FPS at 1080p versus 119.4 FPS at 1440p, while the RTX 5080 is 113.3 versus 92.9) is present in the charts and should be preserved as measured. It likely reflects the fixed replay's CPU/game behavior, but no correction is justified.

Calibration note: these are measured anchors for this specific Fortnite route and software-Lumen workload. They should not be labelled simply “no ray tracing” without the Lumen qualification. If the app estimates unmeasured GPUs, it should mark those values as simulated nearest-tier scaling and keep them separate from these measured anchors.
