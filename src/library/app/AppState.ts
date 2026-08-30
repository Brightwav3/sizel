// ADR 0003: productColorId owns the selected derived colour listing.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
import { RES } from "../data/metrics";
import type { CartLine, PcSlot, Picks, Route, Slot, Watchdog } from "../types";

// ADR 0002: AppState is the single owner of the active PC build.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
export interface AppState {
  route: Route; productId: string; productColorId: string | null; category: Slot; productSlot: Slot;
  catalogOpen: boolean; dept: string; openDept: string | null;
  /** The active build. Every slot always holds a part, so metrics stay defined. */
  picks: Picks;
  /** Slots the shopper (or an agent) explicitly chose; the rest are defaults. */
  chosen: PcSlot[];
  builderSlot: PcSlot; builderSearch: string;
  /** Configurator: hide parts that clash with what is already chosen. */
  builderCompatibleOnly: boolean;
  /** Configurator facet filters, kept apart from the catalog's own. */
  builderFacets: Record<string, string[]>;
  cornerMin: boolean; cornerX: number | null; cornerY: number | null;
  budget: number; target: number; res: keyof typeof RES; quiet: boolean;
  /** Only parts that slot into the current build without an issue. */
  fitOnly: boolean;
  /** Only listings that ship within two days. */
  fastShip: boolean;
  minPrice: number; maxPrice: number; useFilter: string; brand: string;
  facetFilters: Record<string, string[]>;
  sort: string; stockOnly: boolean; onSale: boolean; search: string;
  recentSearches: string[];
  lastChange: { icon: string; title: string; deltas: { k: string; v: string; fg: string }[] } | null;
  prev: Picks | null;
  /** Real cart lines — products and, at most once, the assembled build. */
  cart: CartLine[];
  /** Products the shopper is watching for stock or a price drop. */
  watchdogs: Watchdog[];
  step: number; toast: string | null; saved: number;
}
