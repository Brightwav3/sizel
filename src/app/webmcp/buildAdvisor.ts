/**
 * Build reasoning the screens never needed, but an agent does.
 *
 * ADR 0002 keeps one owner for the active build and one model for its
 * numbers; nothing here writes state or recomputes price, frame rate or
 * power. Every function takes picks and returns a proposal, so the caller
 * stays the single write path.
 */
import { CATALOG, DEFAULT_PICKS } from "../../data/catalog/catalog";
import { RES, buildFits, buildNumbers, compatibilityIssues, metrics, part, powerDraw } from "../../entities/build/metrics";
import type { Resolution } from "../../entities/build/metrics";
import { partFits } from "../../entities/product/queries";
import type { Part, PcSlot, Picks } from "../../shared/lib/types";

/** Constraint order: each part narrows the ones after it. */
const PICK_ORDER: PcSlot[] = ["cpu", "board", "ram", "cooler", "gpu", "psu", "case", "storage", "fans"];

/** Share of the budget each slot may claim before the upgrade pass runs. */
const BUDGET_SHARE: Record<PcSlot, number> = {
  gpu: 0.34, cpu: 0.18, board: 0.10, ram: 0.08, storage: 0.08,
  psu: 0.08, case: 0.06, cooler: 0.05, fans: 0.03,
};

/** How good a part is within its own slot. Frame rate, then benchmark score. */
const rank = (product: Part) => product.fps ?? product.score ?? product.watt ?? product.price;

/** Case fans ship with the case, so the fan pack always follows the chassis. */
export const fansForCase = (caseId: string) =>
  CATALOG.fans.find(pack => pack.id === `${caseId}::fans`)?.id ?? DEFAULT_PICKS.fans;

const quietEnough = (product: Part) => (product.noise ?? 0) <= 34;

/**
 * Parts that slot in without raising an issue against what is chosen so far.
 *
 * `ceiling` narrows by price before the compatibility check runs, because a
 * number comparison is far cheaper than assembling a candidate build. When
 * nothing affordable fits, the caller still needs the unpriced pool, so both
 * come back and `overBudget` is the caller's to record.
 */
function fittingPool(slot: PcSlot, picks: Partial<Picks>, quiet: boolean, ceiling = Infinity): Part[] {
  const affordable = ceiling === Infinity ? CATALOG[slot] : CATALOG[slot].filter(product => product.price <= ceiling);
  const pool = (affordable.length ? affordable : CATALOG[slot]).filter(product => partFits(product, slot, picks));
  if (!pool.length && affordable.length && affordable.length < CATALOG[slot].length) {
    return CATALOG[slot].filter(product => partFits(product, slot, picks));
  }
  if (!quiet) return pool;
  const silent = pool.filter(quietEnough);
  return silent.length ? silent : pool;
}

export interface BuildProposal {
  picks: Picks;
  price: number;
  fps: number;
  watt: number;
  issues: string[];
  /** Budget left unspent after the upgrade pass. */
  headroom: number;
  /** Slots that had to break their budget share to stay compatible. */
  overBudget: PcSlot[];
}

/**
 * A whole machine for a budget: claim a share per slot, then spend what is
 * left on the parts that move frame rate. Deterministic, so the same budget
 * always returns the same build and an agent can explain its own suggestion.
 */
export function recommendBuild(budget: number, res: Resolution = "1440p", quiet = false): BuildProposal {
  const picks: Partial<Picks> = {};
  const overBudget: PcSlot[] = [];

  for (const slot of PICK_ORDER) {
    if (slot === "fans") { picks.fans = fansForCase(picks.case ?? DEFAULT_PICKS.case); continue; }
    const share = budget * BUDGET_SHARE[slot] * 1.2;
    const choices = fittingPool(slot, picks, quiet, share);
    if (!choices.length) { picks[slot] = DEFAULT_PICKS[slot]; continue; }
    if (choices.every(product => product.price > share)) overBudget.push(slot);
    const best = choices.reduce((a, b) => rank(b) > rank(a) || (rank(b) === rank(a) && b.price < a.price) ? b : a);
    picks[slot] = best.id;
  }

  let complete = { ...DEFAULT_PICKS, ...picks } as Picks;
  const spend = (build: Picks) => PICK_ORDER.reduce((total, slot) => total + part(build, slot).price, 0);

  // Upgrade pass: the slots that decide frame rate get the leftover money.
  for (const slot of ["gpu", "cpu", "ram", "storage"] as PcSlot[]) {
    const left = budget - spend(complete);
    if (left <= 0) break;
    const current = part(complete, slot);
    const ceiling = current.price + left;
    const better = fittingPool(slot, complete, quiet, ceiling)
      .filter(product => product.price <= ceiling && rank(product) > rank(current))
      .sort((a, b) => rank(b) - rank(a))[0];
    if (!better) continue;
    const next = { ...complete, [slot]: better.id } as Picks;
    if (buildFits(next)) complete = next;
  }

  const numbers = buildNumbers(complete, res);
  return {
    picks: complete,
    price: numbers.price,
    fps: numbers.fps,
    watt: numbers.watt,
    issues: compatibilityIssues(complete),
    headroom: budget - numbers.price,
    overBudget,
  };
}

export interface Bottleneck {
  slot: PcSlot;
  reason: string;
  currentFps: number;
  /** Frame rate the graphics card could reach if nothing held it back. */
  ceilingFps: number;
  lostFps: number;
  upgrade: { id: string; name: string; price: number; fps: number } | null;
}

/**
 * What holds the frame rate down. `metrics` scales the card by the processor
 * and memory scores; this reads the same factors back out and names the part
 * that costs the most frames.
 */
export function bottleneck(picks: Picks, res: Resolution = "1440p"): Bottleneck {
  const gpu = part(picks, "gpu"), cpu = part(picks, "cpu"), ram = part(picks, "ram");
  const ceiling = Math.round((gpu.fps ?? 0) * RES[res]);
  const current = buildNumbers(picks, res).fps;
  const factors: { slot: PcSlot; factor: number; part: Part }[] = [
    { slot: "cpu", factor: Math.min(1, (cpu.score ?? 100) / 100), part: cpu },
    { slot: "ram", factor: Math.min(1, (ram.score ?? 100) / 100), part: ram },
  ];
  const worst = factors.reduce((a, b) => b.factor < a.factor ? b : a);

  if (worst.factor >= 1) {
    return {
      slot: "gpu",
      reason: `The ${gpu.name} sets the frame rate; nothing else holds it back at ${res}.`,
      currentFps: current, ceilingFps: ceiling, lostFps: 0,
      upgrade: nextBest("gpu", picks, res),
    };
  }
  return {
    slot: worst.slot,
    reason: `${worst.part.name} runs the ${gpu.name} at ${Math.round(worst.factor * 100)}% of its pace.`,
    currentFps: current, ceilingFps: ceiling, lostFps: ceiling - current,
    upgrade: nextBest(worst.slot, picks, res),
  };
}

/** The cheapest fitting part in a slot that actually raises the frame rate. */
function nextBest(slot: PcSlot, picks: Picks, res: Resolution) {
  const current = part(picks, slot);
  const now = buildNumbers(picks, res).fps;
  const better = CATALOG[slot]
    .filter(product => product.id !== current.id && rank(product) > rank(current))
    .sort((a, b) => a.price - b.price)
    .reduce<{ product: Part; fps: number } | null>((found, product) => {
      if (found) return found;
      const next = { ...picks, [slot]: product.id } as Picks;
      if (!buildFits(next)) return null;
      const fps = buildNumbers(next, res).fps;
      return fps > now ? { product, fps } : null;
    }, null);
  return better
    ? { id: better.product.id, name: better.product.name, price: better.product.price, fps: better.fps }
    : null;
}

export interface FixOption {
  slot: PcSlot;
  id: string;
  name: string;
  price: number;
  /** Price change against the part being replaced. */
  priceDelta: number;
  fpsDelta: number;
}

/**
 * Replacements that clear every open compatibility issue.
 *
 * `compatibilityIssues` states a conflict in words but never names the part to
 * change, so an agent would have to guess at the fix. This walks the slots the
 * issues mention and returns the swaps that leave the build clean, smallest
 * price change first, so the shopper is offered a fix and not a rebuild.
 */
export function fixOptions(picks: Picks, res: Resolution = "1440p", preferred?: PcSlot): FixOption[] {
  const issues = compatibilityIssues(picks);
  if (!issues.length) return [];
  const blamed = PICK_ORDER.filter(slot => issues.some(issue => issue.includes(part(picks, slot).name)));
  const slots = preferred ? [preferred] : (blamed.length ? blamed : PICK_ORDER);
  const baseline = buildNumbers(picks, res);

  return slots.flatMap(slot => {
    const current = part(picks, slot);
    return CATALOG[slot]
      .filter(product => product.id !== current.id)
      .map(product => ({
        product,
        next: {
          ...picks,
          [slot]: product.id,
          ...(slot === "case" ? { fans: fansForCase(product.id) } : {}),
        } as Picks,
      }))
      .filter(option => buildFits(option.next))
      .map(option => ({
        slot,
        id: option.product.id,
        name: option.product.name,
        price: option.product.price,
        priceDelta: option.product.price - current.price,
        fpsDelta: buildNumbers(option.next, res).fps - baseline.fps,
      }))
      .sort((a, b) => Math.abs(a.priceDelta) - Math.abs(b.priceDelta))
      .slice(0, 3);
  });
}

/** Power headroom, stated the way the compatibility rule states it. */
export function powerReport(picks: Picks) {
  const draw = powerDraw(picks);
  const psu = part(picks, "psu");
  const required = Math.ceil(draw * 1.15);
  return { drawW: draw, requiredW: required, psuW: psu.watt ?? 0, psu: psu.name, ok: (psu.watt ?? 0) >= required };
}
