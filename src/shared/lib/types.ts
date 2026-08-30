/** Build slots — the nine parts a PC is assembled from. */
export type PcSlot =
  | "board" | "cpu" | "gpu" | "cooler" | "ram" | "storage" | "psu" | "case" | "fans";

/** Everything else the shop sells. */
export type ConsumerSlot =
  | "phones" | "consoles";

export type Slot = PcSlot | ConsumerSlot;

export type DeptId = "pc" | "phone" | "gaming";

export interface Dept {
  id: DeptId;
  name: string;
  icon: string;
  cats: Slot[];
}

export interface Part {
  id: string;
  name: string;
  price: number;
  days: number;
  tag: string;
  model?: string;
  brand?: string;
  note?: string;
  meaning?: string;
  blurb?: string;
  description?: string;
  imagePath?: string;
  realCategory?: string;
  availability?: string;
  specifications?: Record<string, unknown>;
  /** struck-through former price — drives the "Sale" badge */
  was?: number;
  /** 0 means out of stock */
  stock?: number;
  /** units left — drives the "Only n left" badge */
  low?: number;
  /** presentation-only storefront treatment, never part of the catalog record */
  merchandising?: "new" | "sale";
  /** consumer categories carry their spec chips inline */
  specs?: string[];
  /** storage tiers of one device: the canonical product id they all share */
  variantOf?: string;
  /** the capacity this listing is, e.g. "256 GB" */
  variantLabel?: string;
  /** graphics cards */
  fps?: number;
  good?: string;
  len?: number;
  watt?: number;
  noise?: number;
  /** processors + memory */
  score?: number;
  /** cases */
  clearance?: number;
  /** compatibility facts derived from the canonical product specifications */
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  supportedSockets?: string[];
  supportedMotherboards?: string[];
  storageInterfaces?: string[];
  storageInterface?: string;
  cpuPowerW?: number;
}

/** One line in the cart: a catalog product, or the assembled PC as a unit. */
export interface CartLine {
  kind: "product" | "build";
  /** Product id, or "build" for the assembled machine. */
  id: string;
  slot?: Slot;
  qty: number;
}

/** A product the shopper asked to be told about. */
export interface Watchdog {
  productId: string;
  slot: Slot;
  /** What to watch: the product coming back, or its price falling. */
  kind: "availability" | "price";
  /** Price at the moment the watch was created, for a "cheaper than" check. */
  priceAtWatch: number;
}

export type Catalog = Record<Slot, Part[]>;
export type Picks = Record<PcSlot, string>;

export interface CategoryMeta {
  name: string;
  count: number;
  blurb: string;
}

export interface Metrics {
  price: number;
  fps: number;
  noise: number;
  days: number;
  draw: number;
  fits: boolean;
  issues: string[];
}

export type Route =
  | "home" | "category" | "product" | "builder"
  | "cart" | "checkout" | "done";

/**
 * The derived value bag a screen renders. `buildVals` composes it from the
 * domain view-models; every region reads it and never the app state directly.
 */
export type Vals = Record<string, any>;
