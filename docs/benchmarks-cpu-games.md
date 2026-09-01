# CPU game benchmark fixtures

`src/data/benchmarks/cpuGames.ts` contains one hand-authored fixture for each
CPU in the canonical catalog. Each fixture gives a fictional CPU-bound ceiling
for `counter-strike-2`, `fortnite`, and `cyberpunk-2077`, with an average FPS
and a simulated 1% low. These CPU fixtures are whole-build limits authored for
the demo; they are not empirical CPU tests and do not claim that the updated
game presets have been validated on each processor.

These numbers are simulation inputs. They are not hardware measurements,
manufacturer claims, or predictions of real game performance. The fixed
presets are Counter-Strike 2 Very High native raster, Fortnite Ultra DX12 with
100% TAA, Nanite off, hardware RT off and software Lumen enabled, and
Cyberpunk 2077 Ultra native raster with no ray tracing. All fixtures use no
upscaling or frame generation. The Fortnite preset includes software Lumen,
so it should not be described as a fully Lumen-off raster workload.

The intended average-FPS bands are 200–600 for Counter-Strike 2, 120–300 for
Fortnite, and 80–180 for Cyberpunk 2077. A 1% low is positive and never higher
than its matching average. The bands are compact so the demo communicates
relative workload roles without implying measurement precision.

Values are explicit per CPU and per game. They were authored from game-role
judgment rather than derived from generic fixture values, clock speed, core
count, price, or a multiplier. X3D CPUs lead the latency-sensitive competitive
games, while the regular high-core R9 9950X has the higher Cyberpunk ceiling.
That tradeoff keeps the comparison useful without claiming that one processor
wins every workload.

When a whole-build simulation combines these fixtures with GPU game ceilings,
it should apply the same game and preset and report the lower CPU/GPU ceiling
as a fictional result.
