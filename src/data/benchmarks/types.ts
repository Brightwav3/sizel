/** Fictional test fixtures. None of these values represents hardware measurements. */
export type BenchmarkScenario = 'competitive' | 'cinematic';
export type SimulatedGame = 'counter-strike-2' | 'fortnite' | 'cyberpunk-2077';
export type CpuGameBenchmark = Record<SimulatedGame, FrameSample>;
export type GpuGameBenchmark = Record<SimulatedGame, Record<BenchmarkResolution, FrameSample>>;
export type BenchmarkResolution = '1080p' | '1440p' | '4K';
export type FrameSample = { averageFps: number; low1PercentFps: number };
export type CpuBenchmark = Record<BenchmarkScenario, FrameSample>;
export type GpuBenchmark = Record<BenchmarkScenario, Record<BenchmarkResolution, FrameSample>>;
export type MemoryBenchmark = { capacityGB: number; supportedScenarios: BenchmarkScenario[]; note: string };
export type StorageBenchmark = { capacityGB: number; loadSeconds: Record<BenchmarkScenario, number>; note: string };
