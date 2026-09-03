# Memory and storage benchmark fixtures

`src/data/benchmarks/memoryStorage.ts` contains the demo's hand-authored
memory and storage profiles. Every RAM and storage listing in the catalog has
one record, and each record keeps the catalog capacity as a factual field.

These values are fictional simulated fixtures. They are not hardware tests,
lab results, or evidence for a real purchase recommendation.

Memory uses a simple scenario suitability rule: 16 GB is the fictional
reference minimum for both `competitive` and `cinematic`. Larger kits provide
capacity headroom only. Memory does not contribute an FPS multiplier.

Storage has explicit simulated `loadSeconds` values for both scenarios. The
times are hand-authored so the fixture does not pretend to derive game loading
performance from sequential-read specifications. They should be described as
illustrative comparisons and never as measured loading times.

The tests verify complete catalog coverage, capacity agreement, supported
scenarios, and positive simulated times.
