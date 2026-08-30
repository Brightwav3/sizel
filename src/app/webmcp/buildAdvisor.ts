/**
 * Build reasoning the screens never needed, but an agent does.
 *
 * ADR 0002 keeps one owner for the active build and one model for its
 * numbers; nothing here writes state or recomputes price, frame rate or
 * power. Every function takes picks and returns a proposal, so the caller
 * stays the single write path.
 */
import { CATALOG, DEFAULT_PICKS, partIn } from "../../data/catalog/catalog";
import { RES, buildFits, buildNumbers, compatibilityIssues, metrics, part, powerDraw, requiredPower } from "../../entities/build/metrics";
import type { Resolution } from "../../entities/build/metrics";
import { partFits } from "../../entities/product/queries";
import type { Part, PcSlot, Picks } from "../../shared/lib/types";

/** Constraint order: each part narrows the ones after it. */
const PICK_ORDER: PcSlot[] = ["cpu", "board", "ram", "cooler", "gpu", "psu", "case", "storage", "fans"];

/**
 * Share of the budget each slot may claim, by what the shopper is building for.
 *
 * The resolution decides where the money belongs. At 4K the graphics card sets
 * the frame rate almost alone, so it takes nearly half; at 1080p the processor
 * matters much more and the card much less. Each column sums to 1.
 */
const BUDGET_SHARE: Record<Resolution, Record<PcSlot, number>> = {
  "1080p": { gpu: 0.30, cpu: 0.22, board: 0.10, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.06, cooler: 0.06, fans: 0.03 },
  "1440p": { gpu: 0.36, cpu: 0.17, board: 0.09, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.06, cooler: 0.06, fans: 0.03 },
  "4K":    { gpu: 0.45, cpu: 0.13, board: 0.08, ram: 0.07, storage: 0.07, psu: 0.06, case: 0.05, cooler: 0.06, fans: 0.03 },
};

/** How far over the asked-for budget a proposal may go before it is refused. */
export const BUDGET_TOLERANCE = 0.10;

/** A slot allowance may stretch this far, as long as the total cap still holds. */
const SHARE_STRETCH = 1.15;

/**
 * Where more money buys more machine, and how it is measured.
 *
 * A slot missing from here has no performance number in the catalog, so paying
 * more for it buys nothing the build model can see. Those slots take the
 * cheapest part that fits, which leaves the money for the ones that count.
 */
const PERFORMANCE: Partial<Record<PcSlot, (product: Part) => number>> = {
  gpu: product => product.fps ?? 0,
  cpu: product => product.score ?? 0,
  ram: product => product.score ?? 0,
  storage: product => Number((product.specifications as any)?.storage?.capacityGB ?? 0),
};

/** Cheapest listing per slot, for reserving what the unfilled slots will cost. */
const CHEAPEST: Record<PcSlot, number> = Object.fromEntries(
  (["cpu", "gpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"] as PcSlot[])
    .map(slot => [slot, Math.min(...CATALOG[slot].map(product => product.price))]),
) as Record<PcSlot, number>;

/** Case fans ship with the case, so the fan pack always follows the chassis. */
export const fansForCase = (caseId: string) =>
  CATALOG.fans.find(pack => pack.id === `${caseId}::fans`)?.id ?? DEFAULT_PICKS.fans;

const quietEnough = (product: Part) => (product.noise ?? 0) <= 34;

/** Everything in a slot the shopper would accept, before compatibility. */
function slotPool(slot: PcSlot, quiet: boolean): Part[] {
  if (!quiet) return CATALOG[slot];
  const silent = CATALOG[slot].filter(quietEnough);
  return silent.length ? silent : CATALOG[slot];
}

/** Parts that slot in without raising an issue against what is chosen so far. */
function fittingPool(slot: PcSlot, picks: Partial<Picks>, quiet: boolean): Part[] {
  const pool = slotPool(slot, quiet).filter(product => partFits(product, slot, picks));
  if (pool.length) return pool;
  return CATALOG[slot].filter(product => partFits(product, slot, picks));
}

/**
 * The part to take for one slot, given what it may cost.
 *
 * Where the catalog measures performance, spend the allowance. Where it does
 * not — a case, a motherboard — take the cheapest that fits, because a dearer
 * one changes nothing the shopper can be shown. The power supply is its own
 * rule: the cheapest unit that covers the draw with the same headroom the
 * compatibility check demands, rather than the largest that happens to fit.
 */
function pickForSlot(slot: PcSlot, picks: Partial<Picks>, quiet: boolean, ceiling: number): Part | undefined {
  const pool = fittingPool(slot, picks, quiet);
  if (!pool.length) return undefined;

  if (slot === "psu") {
    const required = requiredPower(picks);
    const enough = pool.filter(product => (product.watt ?? 0) >= required);
    const source = enough.length ? enough : pool;
    const affordable = source.filter(product => product.price <= ceiling);
    const choices = affordable.length ? affordable : source;
    return choices.reduce((a, b) => b.price < a.price ? b : a);
  }

  const affordable = pool.filter(product => product.price <= ceiling);
  const measure = PERFORMANCE[slot];
  if (!measure) {
    const choices = affordable.length ? affordable : pool;
    return choices.reduce((a, b) => b.price < a.price ? b : a);
  }
  if (!affordable.length) return pool.reduce((a, b) => b.price < a.price ? b : a);
  return affordable.reduce((a, b) =>
    measure(b) > measure(a) || (measure(b) === measure(a) && b.price < a.price) ? b : a);
}

/**
 * The least a working machine can cost.
 *
 * Below this no budget can be met, however the money is divided, so a
 * proposal says so plainly instead of quietly overshooting. Computed once from
 * the cheapest part that fits at each step, and cached.
 */
let floorCache: { picks: Picks; price: number } | null = null;
export function cheapestBuild(): { picks: Picks; price: number } {
  if (floorCache) return floorCache;
  const picks: Partial<Picks> = {};
  for (const slot of PICK_ORDER) {
    if (slot === "fans") { picks.fans = fansForCase(picks.case ?? DEFAULT_PICKS.case); continue; }
    picks[slot] = (pickForSlot(slot, picks, false, 0) ?? CATALOG[slot][0]).id;
  }
  const complete = { ...DEFAULT_PICKS, ...picks } as Picks;
  floorCache = { picks: complete, price: buildNumbers(complete).price };
  return floorCache;
}

/**
 * Raise the case and the power supply just enough to carry what is in the
 * build. Only these two: nothing else in the machine constrains a part by
 * being cheap.
 *
 * Each is chosen against its own constraint rather than against a whole-build
 * check, because while both are too small each one alone still fails and
 * neither would ever be replaced.
 */
function liftSupporting(picks: Picks, quiet: boolean, headroom: number): Picks {
  let next = picks;
  let left = headroom;

  const gpu = part(next, "gpu");
  const board = part(next, "board");
  const currentCase = part(next, "case");
  if ((currentCase.clearance ?? 0) < (gpu.len ?? 0)
    || !(currentCase.supportedMotherboards ?? []).includes(board.formFactor ?? "")) {
    const roomy = CATALOG.case
      .filter(item => (item.clearance ?? 0) >= (gpu.len ?? 0))
      .filter(item => (item.supportedMotherboards ?? []).includes(board.formFactor ?? ""))
      .filter(item => item.price <= currentCase.price + left)
      .sort((a, b) => a.price - b.price)[0];
    if (roomy) {
      next = { ...next, case: roomy.id, fans: fansForCase(roomy.id) } as Picks;
      left -= roomy.price - currentCase.price;
    }
  }

  const required = requiredPower(next);
  const currentPsu = part(next, "psu");
  if ((currentPsu.watt ?? 0) < required) {
    const stronger = CATALOG.psu
      .filter(item => (item.watt ?? 0) >= required)
      .filter(item => item.price <= currentPsu.price + left)
      .sort((a, b) => a.price - b.price)[0];
    if (stronger) next = { ...next, psu: stronger.id } as Picks;
  }

  void quiet;
  return next;
}

export interface BuildProposal {
  picks: Picks;
  price: number;
  fps: number;
  watt: number;
  issues: string[];
  /**
   * Money left unspent, in US dollars. Negative when the cheapest machine
   * costs more. Named for what it is: PSU headroom is `powerReport.headroomW`.
   */
  budgetRemainingUSD: number;
  /** The most this proposal was allowed to cost. */
  cap: number;
  withinBudget: boolean;
  /** The least any working machine can cost, when the budget cannot be met. */
  cheapestPossible?: number;
  /** Slots that had to break their share to stay compatible. */
  overBudget: PcSlot[];
}

/**
 * A whole machine for a budget.
 *
 * The budget is a promise, so the total is capped ten per cent above what was
 * asked for and each slot reserves what the unfilled ones will cost before it
 * spends. What is left over afterwards goes back into the parts that move the
 * frame rate, again under the same cap. Deterministic: the same request always
 * returns the same machine, so an agent can explain its own suggestion.
 *
 * `targetFps` is where the resolution earns its keep. In the frame-rate model
 * a resolution is a plain multiplier, so it never changes which machine is
 * fastest — only the number it reaches. What it does change is how much
 * machine the shopper needs: 144 frames at 1080p is a far cheaper ask than 144
 * at 4K. Once the build clears the target the upgrades stop, and the rest of
 * the budget stays with the shopper.
 */
export function recommendBuild(budget: number, res: Resolution = "1440p", quiet = false, targetFps?: number): BuildProposal {
  const cap = budget * (1 + BUDGET_TOLERANCE);
  const share = BUDGET_SHARE[res] ?? BUDGET_SHARE["1440p"];
  const picks: Partial<Picks> = {};
  const overBudget: PcSlot[] = [];
  let spent = 0;

  for (let index = 0; index < PICK_ORDER.length; index += 1) {
    const slot = PICK_ORDER[index];
    if (slot === "fans") {
      picks.fans = fansForCase(picks.case ?? DEFAULT_PICKS.case);
      spent += partIn("fans", picks.fans)?.price ?? 0;
      continue;
    }
    // Leave enough on the table for every slot still to be filled.
    const reserved = PICK_ORDER.slice(index + 1).reduce((total, rest) => total + CHEAPEST[rest], 0);
    const ceiling = Math.min(budget * share[slot] * SHARE_STRETCH, cap - spent - reserved);
    const chosen = pickForSlot(slot, picks, quiet, ceiling);
    if (!chosen) { picks[slot] = DEFAULT_PICKS[slot]; continue; }
    if (chosen.price > ceiling) overBudget.push(slot);
    picks[slot] = chosen.id;
    spent += chosen.price;
  }

  let complete = { ...DEFAULT_PICKS, ...picks } as Picks;
  const spend = (build: Picks) => PICK_ORDER.reduce((total, slot) => total + part(build, slot).price, 0);

  /**
   * Downgrade pass. Reserving the cheapest listing per slot is only an
   * estimate — the cheapest part is not always a compatible one — so a slot
   * early in the order can still overshoot. This buys the promise back by
   * taking the dearest slot down a step until the cap holds, and it is what
   * makes "ten per cent over at most" true rather than intended.
   */
  for (let round = 0; round < PICK_ORDER.length * 2 && spend(complete) > cap; round += 1) {
    const dearest = [...PICK_ORDER]
      .filter(slot => slot !== "fans")
      .sort((a, b) => part(complete, b).price - part(complete, a).price);
    let reduced = false;
    for (const slot of dearest) {
      const current = part(complete, slot);
      const cheaper = fittingPool(slot, complete, quiet)
        .filter(product => product.price < current.price)
        .sort((a, b) => b.price - a.price)[0];
      if (!cheaper) continue;
      const next = { ...complete, [slot]: cheaper.id } as Picks;
      if (!buildFits(next)) continue;
      complete = next;
      reduced = true;
      break;
    }
    if (!reduced) break;
  }

  /**
   * Upgrade pass. It repeats until nothing more can be bought, so money freed
   * by a cheap case can still reach the graphics card; a single sweep left
   * whole budgets unspent.
   */
  const UPGRADABLE: PcSlot[] = ["gpu", "cpu", "ram", "storage"];
  /** Frames the shopper asked for; beyond this their money buys them nothing. */
  const enough = () => targetFps !== undefined && buildNumbers(complete, res).fps >= targetFps;
  for (let round = 0; round < UPGRADABLE.length * 2; round += 1) {
    let improved = false;
    for (const slot of UPGRADABLE) {
      // Storage is capacity, not pace, so it keeps going after the target.
      if (slot !== "storage" && enough()) continue;
      const measure = PERFORMANCE[slot]!;
      const current = part(complete, slot);
      const nowFps = buildNumbers(complete, res).fps;
      const ceiling = current.price + (cap - spend(complete));
      if (ceiling <= current.price) continue;
      /**
       * Candidates are not pre-filtered for fit here, unlike the first pass.
       * A bigger card outgrows the case and power supply that were bought at
       * their cheapest, and screening those cards out would leave the shopper
       * told their budget cannot buy a card their money plainly covers. The
       * supporting parts are lifted to carry it instead.
       */
      const candidates = slotPool(slot, quiet)
        .filter(product => product.price <= ceiling && measure(product) > measure(current));
      if (!candidates.length) continue;

      /**
       * Judged by the machine it produces, not by the part's own number. A
       * processor past the point where the frame-rate model stops rewarding it
       * is money the shopper spends for nothing, so only an upgrade that moves
       * the build is bought — and among equals, the cheapest.
       */
      let best: { picks: Picks; fps: number; price: number } | null = null;
      for (const product of candidates) {
        let next = { ...complete, [slot]: product.id } as Picks;
        if (!buildFits(next)) {
          next = liftSupporting(next, quiet, cap - spend(next));
          if (!buildFits(next)) continue;
        }
        const total = spend(next);
        if (total > cap) continue;
        const fps = buildNumbers(next, res).fps;
        const gains = slot === "storage" ? measure(product) > measure(current) : fps > nowFps;
        if (!gains) continue;
        if (!best || fps > best.fps || (fps === best.fps && total < best.price)) {
          best = { picks: next, fps, price: total };
        }
      }
      if (!best) continue;
      complete = best.picks;
      improved = true;
    }

    /**
     * Trim pass. The first pass buys a processor before the graphics card it
     * will drive exists, so it can pay for pace the card never asks for. This
     * takes each slot down to the cheapest part that holds the same frame
     * rate, and the money returns to the next upgrade round.
     */
    for (const slot of ["cpu", "ram"] as PcSlot[]) {
      const current = part(complete, slot);
      const fps = buildNumbers(complete, res).fps;
      const cheaper = slotPool(slot, quiet)
        .filter(product => product.price < current.price)
        .sort((a, b) => a.price - b.price)
        .find(product => {
          const next = { ...complete, [slot]: product.id } as Picks;
          return buildFits(next) && buildNumbers(next, res).fps >= fps;
        });
      if (!cheaper) continue;
      complete = { ...complete, [slot]: cheaper.id } as Picks;
      improved = true;
    }
    if (!improved) break;
  }

  // A stronger card can outgrow the power supply the first pass sized.
  const psu = pickForSlot("psu", complete, quiet, cap - spend(complete) + part(complete, "psu").price);
  if (psu && psu.id !== complete.psu) {
    const next = { ...complete, psu: psu.id } as Picks;
    // A power supply that keeps the build legal outranks the cap.
    if (buildFits(next) && (spend(next) <= cap || !buildFits(complete))) complete = next;
  }

  const numbers = buildNumbers(complete, res);
  const floor = cheapestBuild();
  return {
    picks: complete,
    price: numbers.price,
    fps: numbers.fps,
    watt: numbers.watt,
    issues: compatibilityIssues(complete),
    budgetRemainingUSD: budget - numbers.price,
    cap: Math.round(cap),
    withinBudget: numbers.price <= cap,
    ...(numbers.price > cap ? { cheapestPossible: floor.price } : {}),
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
  const measure = PERFORMANCE[slot] ?? ((product: Part) => product.price);
  const better = CATALOG[slot]
    .filter(product => product.id !== current.id && measure(product) > measure(current))
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
  const required = requiredPower(picks);
  return { headroomW: (psu.watt ?? 0) - draw, marginAboveRequiredW: (psu.watt ?? 0) - required, drawW: draw, requiredW: required, psuW: psu.watt ?? 0, psu: psu.name, ok: (psu.watt ?? 0) >= required };
}
