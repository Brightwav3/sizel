# ADR 0011: Game-labeled simulation fixtures by hardware category

- **Status:** Accepted
- **Date:** 2026-08-31
- **Extends:** ADR 0010

## Context

The owner requested two additional Luna high-effort agents, one for CPU and one for GPU, to simulate performance in games rather than only generic workloads.

## Decision

Independent explicit CPU and GPU fixture tables cover Counter-Strike 2, Fortnite and Cyberpunk 2077 at 1080p, 1440p and 4K. The game names identify fictional test cases only: values are not measurements or predictions for those actual games. GPU average-FPS anchors may be calibrated to cited reviews where the protocol is comparable; remaining GPU tiers use documented scaled simulation or fictional extrapolation, while 1% lows and CPU ceilings remain authored inputs. None are inferred from price, cores, clocks or VRAM.

`rigsmith-game-simulation-v2` uses CPU/GPU minimum ceilings for average FPS and independently 1% lows, as in ADR 0010. CPU profiles are resolution-independent reference ceilings. Presets are fixed: Counter-Strike 2 Very High native raster, Fortnite Ultra DX12 with software Lumen, and Cyberpunk 2077 Ultra native raster; no ray tracing, upscaling or frame generation. These are simulation conventions, not verified real-game settings or requirements.

The optional `game` parameter in `estimate_performance` and `compare_build_options` selects these fixtures. Supplying both `game` and generic `scenario` is rejected rather than silently overriding one. All alternatives use the same game, resolution and preset. Results carry the game, preset, version and explicit simulation disclaimer. Measured FPS and acoustics remain unknown.

No game-specific storage loading fixtures exist, so game results return null loading times instead of relabeling generic scenario values. RAM uses the fictional 16 GB reference platform convention, not a claim about actual game requirements. Prices, stock and budget remain independently validated; no automatic winner is chosen and no UI panel is added.

## Verification

Category tests cover catalog parity and coherent values. Integration tests cover actual game-table composition, null loading data, invalid/ambiguous requests, non-mutation and three-alternative tool output without truncation.
