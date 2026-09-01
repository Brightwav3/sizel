import type { Resolution } from './metrics';
import type { PcSlot } from '../../shared/lib/types';

/** The slots a completed PC allocates money to, in the order shown to agents. */
export const BUDGET_SLOTS: PcSlot[] = [
  'cpu', 'gpu', 'board', 'ram', 'storage', 'cooler', 'psu', 'case', 'fans',
];

/** Optional shopper supplied percentages. Omitted slots share the remainder. */
export type BudgetShares = Partial<Record<PcSlot, number>>;

/**
 * Resolution-aware defaults. These are planning hints, not hard per-part caps:
 * compatibility and the exact whole-build budget always win.
 */
export const DEFAULT_BUDGET_SHARES: Record<Resolution, Record<PcSlot, number>> = {
  '1080p': { gpu: 0.30, cpu: 0.22, board: 0.10, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.06, cooler: 0.06, fans: 0.03 },
  '1440p': { gpu: 0.36, cpu: 0.17, board: 0.09, ram: 0.08, storage: 0.08, psu: 0.07, case: 0.06, cooler: 0.06, fans: 0.03 },
  '4K': { gpu: 0.45, cpu: 0.13, board: 0.08, ram: 0.07, storage: 0.07, psu: 0.06, case: 0.05, cooler: 0.06, fans: 0.03 },
};

export type BudgetSharesValidation =
  | { valid: true; shares: BudgetShares }
  | { valid: false; message: string };

/** Validate the small JSON object accepted by begin_build. */
export function validateBudgetShares(input: unknown): BudgetSharesValidation {
  if (input === undefined) return { valid: true, shares: {} };
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, message: 'budgetShares must be an object mapping PC slots to percentages.' };
  }

  const shares: BudgetShares = {};
  let total = 0;
  for (const [slot, value] of Object.entries(input)) {
    if (!BUDGET_SLOTS.includes(slot as PcSlot)) {
      return { valid: false, message: `Unknown budget slot ${slot}. Use a PC build slot.` };
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
      return { valid: false, message: `Budget share for ${slot} must be a number from 0 to 100.` };
    }
    shares[slot as PcSlot] = value;
    total += value;
  }
  if (total > 100.000001) {
    return { valid: false, message: 'Budget shares cannot add up to more than 100 percent.' };
  }
  return { valid: true, shares };
}

export interface BudgetPlanRow {
  slot: PcSlot;
  sharePct: number;
  budgetUSD: number;
  source: 'shopper' | 'default';
}

export interface BudgetPlan {
  source: 'shopper' | 'resolution_default';
  shares: Record<PcSlot, number>;
  rows: BudgetPlanRow[];
}

/**
 * Turn explicit percentages into usable slot allowances. If the shopper gives
 * only CPU and GPU shares, the unassigned remainder follows the resolution
 * defaults instead of becoming an accidental zero-dollar allowance.
 */
export function budgetPlan(
  budget: number,
  resolution: Resolution,
  requested: BudgetShares = {},
): BudgetPlan {
  const defaults = DEFAULT_BUDGET_SHARES[resolution] ?? DEFAULT_BUDGET_SHARES['1440p'];
  const customEntries = Object.entries(requested);
  const customTotal = customEntries.reduce((sum, [, value]) => sum + (value ?? 0) / 100, 0);
  const unspecified = BUDGET_SLOTS.filter(slot => requested[slot] === undefined);
  const defaultRemainder = unspecified.reduce((sum, slot) => sum + defaults[slot], 0);
  const remainder = Math.max(0, 1 - customTotal);
  const shares = Object.fromEntries(BUDGET_SLOTS.map(slot => {
    if (requested[slot] !== undefined) return [slot, requested[slot]! / 100];
    const weight = defaultRemainder > 0 ? defaults[slot] / defaultRemainder : 0;
    return [slot, remainder * weight];
  })) as Record<PcSlot, number>;

  const source = customEntries.length ? 'shopper' : 'resolution_default';
  const rows: BudgetPlanRow[] = BUDGET_SLOTS.map(slot => ({
    slot,
    sharePct: Math.round(shares[slot] * 1000) / 10,
    budgetUSD: Math.round(budget * shares[slot]),
    source: requested[slot] === undefined ? 'default' : 'shopper',
  }));
  // Keep the displayed percentages additive after rounding to one decimal.
  // The underlying fractional shares remain untouched for calculations.
  const displayedTotal = rows.reduce((sum, row) => sum + row.sharePct, 0);
  const last = rows[rows.length - 1];
  if (last) last.sharePct = Math.round((last.sharePct + (100 - displayedTotal)) * 10) / 10;
  return { source, shares, rows };
}
