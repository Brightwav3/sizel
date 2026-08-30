import { RES } from "../data/metrics";
import type { PcSlot, Picks, Route, Slot } from "../types";

// ADR 0002: AppState is the single owner of the active PC build.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
export interface AppState {
  route: Route; pickerSlot: PcSlot | null; productId: string; category: Slot; productSlot: Slot;
  catalogOpen: boolean; dept: string; openDept: string | null;
  picks: Picks; gStep: number; gDone: PcSlot[];
  builderSlot: PcSlot; builderSearch: string;
  cornerMin: boolean; cornerX: number | null; cornerY: number | null;
  budget: number; target: number; res: keyof typeof RES; quiet: boolean;
  fitOnly: boolean; minPrice: number; maxPrice: number; useFilter: string; brand: string;
  facetFilters: Record<string, string[]>;
  sort: string; stockOnly: boolean; onSale: boolean; search: string;
  lastChange: { icon: string; title: string; deltas: { k: string; v: string; fg: string }[] } | null;
  prev: Picks | null; inCart: boolean; step: number; toast: string | null; saved: number; scrolled: boolean;
}
