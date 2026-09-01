import { CATALOG, DEFAULT_PICKS, ORDER, partIn } from '../../data/catalog/catalog';
import { listingStock } from '../../data/catalog/listingStock';
import type { PcSlot, Picks } from '../../shared/lib/types';
import { compatibilityIssues } from './metrics';

export const BUILD_SLOTS = ORDER.map(item => item.slot) as PcSlot[];
export const bundledFans = (caseId: string) =>
  CATALOG.fans.find(pack => pack.id === `${caseId}::fans`)?.id ?? DEFAULT_PICKS.fans;

export class ShopError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export function selectedPicks(picks: Picks, chosen: PcSlot[]): Partial<Picks> {
  return Object.fromEntries(chosen.map(slot => [slot, picks[slot]]));
}

export function selectedPrice(picks: Picks, chosen: PcSlot[]) {
  return chosen.reduce((sum, slot) => sum + (partIn(slot, picks[slot])?.price ?? 0), 0);
}

/** The same orderability check is used by UI buttons, commands and checkout. */
export function buildBlocker(picks: Picks, chosen: PcSlot[], budget: number): ShopError | null {
  if (BUILD_SLOTS.some(slot => !chosen.includes(slot))) return new ShopError('build_incomplete', 'Choose every build slot first.');
  const issues = compatibilityIssues(picks);
  if (issues.length) return new ShopError('build_incompatible', issues[0]);
  const unavailable = BUILD_SLOTS.find(slot => !partIn(slot, picks[slot]) || listingStock(partIn(slot, picks[slot])!, slot) === 0);
  if (unavailable) return new ShopError('out_of_stock', `${unavailable} is unavailable. Choose an available part.`);
  if (selectedPrice(picks, chosen) > budget) return new ShopError('over_budget', 'Build exceeds the agreed budget. Change parts or explicitly update the budget.');
  return null;
}

export function requireQuantity(quantity: number, max = 5) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > max)
    throw new ShopError('invalid_quantity', `Use a whole quantity between 0 and ${max}.`);
}
