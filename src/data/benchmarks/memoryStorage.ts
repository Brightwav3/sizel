import type { MemoryBenchmark, StorageBenchmark } from "./types";

/**
 * Fictional, hand-authored scenario coverage for the demo catalog.
 *
 * These records are suitability fixtures, not measurements. Memory does not
 * contribute an FPS multiplier here: 16 GB is the reference minimum for both
 * scenarios and larger kits only provide capacity headroom.
 */
export const MEMORY_BENCHMARKS: Record<string, MemoryBenchmark> = {
  "proseware-pulse-16gb-ddr5-5600": { capacityGB: 16, supportedScenarios: ["competitive", "cinematic"], note: "Meets the fictional 16 GB reference minimum for both scenarios; no FPS uplift is assigned." },
  "proseware-pulse-32gb-ddr5-6000": { capacityGB: 32, supportedScenarios: ["competitive", "cinematic"], note: "Adds capacity headroom over the 16 GB reference; no FPS uplift is assigned." },
  "proseware-pulse-rgb-32gb-ddr5-6400": { capacityGB: 32, supportedScenarios: ["competitive", "cinematic"], note: "Adds capacity headroom over the 16 GB reference; no FPS uplift is assigned." },
  "proseware-pulse-64gb-ddr5-6000": { capacityGB: 64, supportedScenarios: ["competitive", "cinematic"], note: "Provides capacity headroom for heavier multitasking; no FPS uplift is assigned." },
  "proseware-pulse-pro-96gb-ddr5-6800": { capacityGB: 96, supportedScenarios: ["competitive", "cinematic"], note: "Provides high capacity headroom; no FPS uplift is assigned." },
  "fabrikam-memory-16gb-ddr5-5600": { capacityGB: 16, supportedScenarios: ["competitive", "cinematic"], note: "Meets the fictional 16 GB reference minimum for both scenarios; no FPS uplift is assigned." },
  "fabrikam-memory-32gb-ddr5-6000": { capacityGB: 32, supportedScenarios: ["competitive", "cinematic"], note: "Adds capacity headroom over the 16 GB reference; no FPS uplift is assigned." },
  "fabrikam-memory-64gb-ddr5-6000": { capacityGB: 64, supportedScenarios: ["competitive", "cinematic"], note: "Provides capacity headroom for heavier multitasking; no FPS uplift is assigned." },
  "fabrikam-memory-pro-48gb-ddr5-6800": { capacityGB: 48, supportedScenarios: ["competitive", "cinematic"], note: "Adds capacity headroom over the 16 GB reference; no FPS uplift is assigned." },
  "woodgrove-memory-32gb-ddr5-5200": { capacityGB: 32, supportedScenarios: ["competitive", "cinematic"], note: "Adds capacity headroom over the 16 GB reference; no FPS uplift is assigned." },
  "woodgrove-memory-64gb-ddr5-5600": { capacityGB: 64, supportedScenarios: ["competitive", "cinematic"], note: "Provides capacity headroom for heavier multitasking; no FPS uplift is assigned." },
  "proseware-pulse-pro-128gb-ddr5-6400": { capacityGB: 128, supportedScenarios: ["competitive", "cinematic"], note: "Provides maximum catalog capacity headroom; no FPS uplift is assigned." },
  "fabrikam-memory-pro-96gb-ddr5-6400": { capacityGB: 96, supportedScenarios: ["competitive", "cinematic"], note: "Provides high capacity headroom; no FPS uplift is assigned." },
};

/**
 * Fictional load-time fixtures. Values are explicit scenario examples for
 * comparison only; they are not derived from sequential-read specifications.
 */
export const STORAGE_BENCHMARKS: Record<string, StorageBenchmark> = {
  "woodgrove-blue-n500-1tb": { capacityGB: 1000, loadSeconds: { competitive: 8.9, cinematic: 10.8 }, note: "Simulated scenario load times; not measured evidence." },
  "woodgrove-blue-n500-2tb": { capacityGB: 2000, loadSeconds: { competitive: 8.8, cinematic: 10.7 }, note: "Simulated scenario load times; not measured evidence." },
  "woodgrove-black-n800-2tb": { capacityGB: 2000, loadSeconds: { competitive: 7.6, cinematic: 9.5 }, note: "Simulated scenario load times; not measured evidence." },
  "woodgrove-black-n900-4tb": { capacityGB: 4000, loadSeconds: { competitive: 6.9, cinematic: 8.7 }, note: "Simulated scenario load times; not measured evidence." },
  "woodgrove-blue-4tb": { capacityGB: 4000, loadSeconds: { competitive: 8.1, cinematic: 10.0 }, note: "Simulated scenario load times; not measured evidence." },
  "woodgrove-red-8tb": { capacityGB: 8000, loadSeconds: { competitive: 7.8, cinematic: 9.8 }, note: "Simulated scenario load times; not measured evidence." },
  "proseware-flash-s1-1tb": { capacityGB: 1000, loadSeconds: { competitive: 8.4, cinematic: 10.3 }, note: "Simulated scenario load times; not measured evidence." },
  "proseware-flash-s2-2tb": { capacityGB: 2000, loadSeconds: { competitive: 7.9, cinematic: 9.8 }, note: "Simulated scenario load times; not measured evidence." },
  "proseware-flash-x-4tb": { capacityGB: 4000, loadSeconds: { competitive: 6.7, cinematic: 8.4 }, note: "Simulated scenario load times; not measured evidence." },
  "fabrikam-drive-p3-1tb": { capacityGB: 1000, loadSeconds: { competitive: 8.6, cinematic: 10.5 }, note: "Simulated scenario load times; not measured evidence." },
  "fabrikam-drive-p5-2tb": { capacityGB: 2000, loadSeconds: { competitive: 7.4, cinematic: 9.2 }, note: "Simulated scenario load times; not measured evidence." },
  "adventure-pocket-ssd-1tb": { capacityGB: 1000, loadSeconds: { competitive: 9.7, cinematic: 11.6 }, note: "Simulated scenario load times; not measured evidence." },
  "adventure-pocket-ssd-pro-2tb": { capacityGB: 2000, loadSeconds: { competitive: 8.5, cinematic: 10.4 }, note: "Simulated scenario load times; not measured evidence." },
  "woodgrove-black-n900-8tb": { capacityGB: 8000, loadSeconds: { competitive: 6.8, cinematic: 8.6 }, note: "Simulated scenario load times; not measured evidence." },
  "proseware-flash-x-8tb": { capacityGB: 8000, loadSeconds: { competitive: 6.6, cinematic: 8.3 }, note: "Simulated scenario load times; not measured evidence." },
};
