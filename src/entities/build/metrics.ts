import { CATALOG } from "../../data/catalog/catalog";
import type { Part, PcSlot, Picks } from "../../shared/lib/types";

export const money = (n: number) => "$" + n.toLocaleString("en-US");

export const RES = { "1080p": 1.32, "1440p": 1, "4K": 0.6 } as const;
export type Resolution = keyof typeof RES;

const DAYNAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parts the shop assembles and prices as one machine. */
const BUILD_SLOTS: PcSlot[] = ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"];

export const part = (picks: Picks, slot: PcSlot) =>
  CATALOG[slot].find(p => p.id === picks[slot])!;

/** Watts the build draws. One formula, so the check and the readout agree. */
export function powerDraw(picks: Partial<Picks>): number {
  const selected = (slot: PcSlot) => picks[slot] ? CATALOG[slot].find(item => item.id === picks[slot]) : undefined;
  return (selected("gpu")?.watt ?? 0) + (selected("cpu")?.cpuPowerW ?? 0) + 80;
}

/** Compatibility checks read only normalized facts derived from products.json. */
export function compatibilityIssues(picks: Partial<Picks>): string[] {
  const selected = (slot: PcSlot) => picks[slot] ? CATALOG[slot].find(item => item.id === picks[slot]) : undefined;
  const cpu = selected("cpu");
  const board = selected("board");
  const ram = selected("ram");
  const storage = selected("storage");
  const cooler = selected("cooler");
  const psu = selected("psu");
  const cs = selected("case");
  const gpu = selected("gpu");
  const issues: string[] = [];

  if (cpu?.socket && board?.socket && cpu.socket !== board.socket) {
    issues.push(`${cpu.name} uses ${cpu.socket}, but ${board.name} uses ${board.socket}.`);
  }
  if (ram?.memoryType && board?.memoryType && ram.memoryType !== board.memoryType) {
    issues.push(`${board.name} supports ${board.memoryType}, but ${ram.name} is ${ram.memoryType}.`);
  }
  if (board?.formFactor && cs?.supportedMotherboards?.length && !cs.supportedMotherboards.includes(board.formFactor)) {
    issues.push(`${cs.name} does not support the ${board.formFactor} form factor of ${board.name}.`);
  }
  if (gpu?.len && cs?.clearance && gpu.len > cs.clearance) {
    issues.push(`${gpu.name} is ${gpu.len} mm long, but ${cs.name} allows ${cs.clearance} mm.`);
  }
  const draw = powerDraw(picks);
  if (psu?.watt && psu.watt < draw * 1.15) {
    issues.push(`${psu.name} provides ${psu.watt} W, but this build needs about ${Math.ceil(draw * 1.15)} W with headroom.`);
  }
  if (cpu?.socket && cooler?.supportedSockets?.length && !cooler.supportedSockets.includes(cpu.socket)) {
    issues.push(`${cooler.name} does not support the ${cpu.socket} socket used by ${cpu.name}.`);
  }
  if (storage?.storageInterface && board?.storageInterfaces?.length && !board.storageInterfaces.some(type => storage.storageInterface?.includes(type))) {
    issues.push(`${board.name} does not expose a compatible interface for ${storage.name}.`);
  }
  return issues;
}

/**
 * Deterministic validation — the single source for every number on screen and
 * in every tool result. `RigsmithApp.metrics` delegates here; nothing else
 * recomputes price, frame rate, noise or power.
 */
export interface BuildMetrics {
  price: number;
  fps: number;
  noise: number;
  days: number;
  watt: number;
  fits: boolean;
  issues: string[];
  gpu: Part; cpu: Part; ram: Part; storage: Part; cooler: Part;
}

export function metrics(picks: Picks, res: Resolution = "1440p"): BuildMetrics {
  const chosen = BUILD_SLOTS.map(s => part(picks, s));
  const gpu = part(picks, "gpu"), cpu = part(picks, "cpu"), ram = part(picks, "ram");
  const storage = part(picks, "storage"), cooler = part(picks, "cooler");
  const fans = part(picks, "fans");

  const price = chosen.reduce((a, p) => a + p.price, 0);
  const factor = Math.min(1, (cpu.score ?? 100) / 100) * Math.min(1, (ram.score ?? 100) / 100);
  const fps = Math.round((gpu.fps ?? 0) * factor * RES[res]);
  const noise = Math.max(gpu.noise ?? 0, cooler.noise ?? 0) + (fans.id === "f6" ? 1.2 : 0);
  const days = Math.max(...chosen.map(p => p.days));
  const issues = compatibilityIssues(picks);

  return { price, fps, noise, days, watt: powerDraw(picks), fits: issues.length === 0, issues, gpu, cpu, ram, storage, cooler };
}

export function shipDate(days: number, from = new Date(2026, 7, 29)) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return `${DAYNAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const noiseWord = (n: number) =>
  n < 31 ? "Very quiet" : n < 34 ? "Quiet" : n < 37 ? "Noticeable" : "Loud";
