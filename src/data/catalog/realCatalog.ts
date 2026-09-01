// ADR 0003: canonical devices are expanded into storefront variants here.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
// ADR 0005: catalog adaptation and listing data live in src/data/catalog.
// docs/decisions/0005-feature-first-source-layout.md
import productsJson from "../../../public/catalog/products.json";
import type { Catalog, CategoryMeta, Dept, Part, PcSlot, Slot } from "../../shared/lib/types";
import { MERCHANDISING } from "./merchandising";
import { storageVariants } from "./storageVariants";

type JsonRecord = Record<string, any>;
type RawProduct = {
  id: string;
  category: string;
  brand: string;
  name: string;
  model: string;
  description: string;
  specifications: JsonRecord;
  image_path: string;
  image_url: string;
  demo_price_cents: number;
  currency: string;
  availability: string;
};

/** Canonical product records. The UI consumes this adapter, never a copied mock catalog. */
export const PRODUCTS = productsJson as RawProduct[];

const realCategoryFor = {
  gpu: "gpu",
  cpu: "cpu",
  ram: "ram",
  motherboard: "board",
  "cpu-cooler": "cooler",
  psu: "psu",
  storage: "storage",
  "pc-case": "case",
  smartphone: "phones",
  console: "consoles",
} as const;

type RealCategory = keyof typeof realCategoryFor;

const asNumber = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const asStringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const stockFor = (product: RawProduct) => product.availability === "out_of_stock" ? 0 : asNumber(product.specifications.catalog_stock, 1);
const daysFor = (product: RawProduct) => product.availability === "out_of_stock" ? 8 : 2;
const imageFor = (product: RawProduct) => `/catalog/${product.image_path.replaceAll("\\", "/")}`;
const firstTag = (product: RawProduct) => {
  const tag = asStringArray(product.specifications.tags)[0];
  return tag ? tag.replace(/(^|-)([a-z])/g, (_, dash, letter) => `${dash}${letter.toUpperCase()}`) : "Catalog pick";
};
const noteFor = (product: RawProduct) => product.description.includes(" - ") ? product.description.split(" - ").slice(1).join(" - ") : product.description;

function toPart(product: RawProduct, slot: Exclude<Slot, "fans">): Part {
  const s = product.specifications;
  const base: Part = {
    id: product.id,
    name: product.name,
    model: product.model,
    brand: product.brand,
    price: product.demo_price_cents / 100,
    days: daysFor(product),
    tag: product.availability === "out_of_stock" ? "Unavailable" : firstTag(product),
    stock: stockFor(product),
    low: stockFor(product) > 0 && stockFor(product) <= 5 ? stockFor(product) : undefined,
    merchandising: MERCHANDISING[product.id],
    note: noteFor(product),
    blurb: product.description,
    description: product.description,
    imagePath: imageFor(product),
    realCategory: product.category,
    availability: product.availability,
    specifications: s,
    specs: [],
  };

  if (slot === "cpu") {
    base.socket = s.platform?.socket;
    base.cpuPowerW = asNumber(s.power?.maxW, asNumber(s.power?.baseW, 65));
    base.score = Math.round(asNumber(s.cpu?.cores, 4) * 8 + asNumber(s.cpu?.boostClockGHz, 3) * 8);
    base.specs = [
      `${asNumber(s.cpu?.cores, 0)} cores`,
      `${asNumber(s.cpu?.threads, 0)} threads`,
      base.socket ?? "Socket unspecified",
    ];
  }
  if (slot === "gpu") {
    base.watt = asNumber(s.power?.boardPowerW);
    base.len = asNumber(s.dimensions?.lengthMm);
    base.fps = Math.round(asNumber(s.gpu?.boostClockMHz, 2000) / 25 + asNumber(s.memory?.capacityGB, 8) * 2);
    base.noise = asNumber(s.acoustics?.noiseDb, 32);
    base.good = asStringArray(s.tags).some(tag => tag.includes("4k")) ? "Great for 4K" : "Great for 1440p";
    base.specs = [
      `${asNumber(s.memory?.capacityGB, 0)} GB ${s.memory?.type ?? "memory"}`,
      `${base.watt} W`,
      `${base.len} mm`,
    ];
  }
  if (slot === "board") {
    base.socket = s.platform?.socket;
    base.formFactor = s.platform?.formFactor;
    base.memoryType = s.memory?.type;
    base.storageInterfaces = [
      ...(asNumber(s.storage?.m2Slots) > 0 ? ["M.2", "NVMe", "PCIe"] : []),
      ...(asNumber(s.storage?.sataPorts) > 0 ? ["SATA"] : []),
    ];
    base.specs = [base.formFactor ?? "Board", base.memoryType ?? "Memory unspecified", base.socket ?? "Socket unspecified"];
  }
  if (slot === "ram") {
    base.memoryType = s.memory?.type;
    base.score = Math.round(asNumber(s.memory?.speedMTs, 4800) / 60);
    base.specs = [
      `${asNumber(s.memory?.capacityGB, 0)} GB`,
      base.memoryType ?? "Memory unspecified",
      `${asNumber(s.memory?.speedMTs, 0)} MT/s`,
    ];
  }
  if (slot === "storage") {
    base.storageInterface = s.storage?.interface;
    base.score = Math.round(asNumber(s.performance?.sequentialReadMBs, 3000) / 60);
    base.specs = [
      `${Math.round(asNumber(s.storage?.capacityGB, 0) / 1000)} TB`,
      s.storage?.interface ?? "Interface unspecified",
      s.storage?.protocol ?? "Storage",
    ];
  }
  if (slot === "cooler") {
    base.supportedSockets = asStringArray(s.compatibility?.supportedSockets);
    base.noise = Math.round(27 + asNumber(s.cooling?.maxRpm, 1800) / 1000);
    base.specs = [
      s.cooling?.type ?? "Cooler",
      `${asNumber(s.cooling?.coolingCapacityW, 0)} W capacity`,
      base.supportedSockets.join(" / ") || "Socket unspecified",
    ];
  }
  if (slot === "psu") {
    base.watt = asNumber(s.power?.wattageW);
    base.formFactor = s.physical?.formFactor;
    base.specs = [base.watt + " W", s.power?.efficiency ?? "Efficiency unspecified", base.formFactor ?? "PSU"];
  }
  if (slot === "case") {
    base.clearance = asNumber(s.gpu?.maxLengthMm);
    base.supportedMotherboards = asStringArray(s.chassis?.supportedMotherboards);
    base.specs = [
      `${base.clearance} mm GPU`,
      base.supportedMotherboards.join(" / ") || "Board unspecified",
      `${asNumber(s.cpuCooler?.maxHeightMm, 0)} mm cooler`,
    ];
  }
  if (slot === "phones" || slot === "consoles") {
    const tags = asStringArray(s.tags);
    base.specs = tags.slice(0, 3).map(tag => tag.replace(/(^|-)([a-z])/g, (_, dash, letter) => `${dash}${letter.toUpperCase()}`));
  }
  return base;
}

const productsFor = (category: RealCategory) => PRODUCTS.filter(product => product.category === category).map(product => toPart(product, realCategoryFor[category]));

/**
 * Phones and handheld consoles are sold at several storage capacities, one
 * listing each. Home consoles ship with a fixed drive, so they are left alone.
 */
const handheld = (part: Part) => (part.specifications?.hardware as JsonRecord | undefined)?.storageType === "Flash";
const withStorageTiers = (parts: Part[], slot: Slot, only: (part: Part) => boolean = () => true) =>
  parts.flatMap(part => only(part) ? storageVariants(part, slot) : [part]);
const caseParts = productsFor("pc-case");
const fanParts: Part[] = caseParts.map(part => {
  const includedFans = asNumber((part.specifications?.cooling as JsonRecord | undefined)?.includedFans, 0);
  return {
    ...part,
    id: `${part.id}::fans`,
    name: `${part.name} included fans`,
    price: 0,
    tag: "Included",
    note: `${includedFans} fans included with the case`,
    specs: [`${includedFans} fans`, "Included", "Case airflow"],
  };
});

export const CATALOG: Catalog = {
  gpu: productsFor("gpu"),
  cpu: productsFor("cpu"),
  board: productsFor("motherboard"),
  ram: productsFor("ram"),
  storage: productsFor("storage"),
  cooler: productsFor("cpu-cooler"),
  psu: productsFor("psu"),
  case: caseParts,
  fans: fanParts,
  phones: withStorageTiers(productsFor("smartphone"), "phones"),
  consoles: withStorageTiers(productsFor("console"), "consoles", handheld),
};

const count = (slot: Slot) => slot === "fans" ? CATALOG[slot].length : CATALOG[slot].filter(part => !part.id.endsWith("::fans")).length;

export const DEPTS: Dept[] = [
  { id: "pc", name: "PC parts", icon: "memory", cats: ["gpu", "cpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"] },
  { id: "phone", name: "Phones", icon: "smartphone", cats: ["phones"] },
  { id: "gaming", name: "Gaming", icon: "sports_esports", cats: ["consoles"] },
];

const categoryNames: Record<Slot, string> = {
  gpu: "Graphics cards", cpu: "Processors", board: "Motherboards", ram: "Memory", storage: "Storage",
  cooler: "CPU cooling", psu: "Power supplies", case: "PC cases", fans: "Case fans",
  phones: "Smartphones", consoles: "Consoles",
};

export const CAT_META: Record<Slot, CategoryMeta> = Object.fromEntries(
  (Object.keys(CATALOG) as Slot[]).map(slot => [slot, { name: categoryNames[slot], count: count(slot), blurb: `Real ${categoryNames[slot].toLowerCase()} from the canonical Sizel catalog.` }]),
) as Record<Slot, CategoryMeta>;

export const CAT_ICON: Record<Slot, string> = {
  gpu: "videogame_asset", cpu: "memory", board: "developer_board", ram: "view_week", storage: "save",
  cooler: "ac_unit", psu: "power", case: "dns", fans: "mode_fan", phones: "smartphone", consoles: "sports_esports",
};

export const ORDER: { slot: PcSlot; cat: string; icon: string; label: string }[] = [
  { slot: "cpu", cat: "Processor", icon: "memory", label: "processor" },
  { slot: "gpu", cat: "Graphics card", icon: "videogame_asset", label: "graphics card" },
  { slot: "board", cat: "Motherboard", icon: "developer_board", label: "motherboard" },
  { slot: "ram", cat: "Memory", icon: "view_week", label: "memory kit" },
  { slot: "storage", cat: "Storage", icon: "save", label: "drive" },
  { slot: "cooler", cat: "Cooler", icon: "ac_unit", label: "cooler" },
  { slot: "psu", cat: "Power supply", icon: "power", label: "power supply" },
  { slot: "case", cat: "Case", icon: "dns", label: "case" },
  { slot: "fans", cat: "Case fans", icon: "mode_fan", label: "fan pack" },
];

export const SPECS: Record<Slot, (p: Part) => string[]> = Object.fromEntries(
  (Object.keys(CATALOG) as Slot[]).map(slot => [slot, (part: Part) => part.specs ?? []]),
) as Record<Slot, (p: Part) => string[]>;

export const DESCS: Record<Slot, (p: Part) => string> = Object.fromEntries(
  (Object.keys(CATALOG) as Slot[]).map(slot => [slot, (part: Part) => part.description ?? part.note ?? CAT_META[slot].blurb]),
) as Record<Slot, (p: Part) => string>;

const compatible = <T extends Part>(items: T[], predicate: (item: T) => boolean) => items.find(predicate) ?? items[0];
const defaultCpu = compatible(CATALOG.cpu, part => part.socket === "LGA1851");
const defaultBoard = compatible(CATALOG.board, part => part.socket === defaultCpu.socket);
const defaultGpu = compatible(CATALOG.gpu, part => (part.len ?? 0) <= 390);
const defaultRam = compatible(CATALOG.ram, part => part.memoryType === defaultBoard.memoryType);
const defaultStorage = compatible(CATALOG.storage, part => (defaultBoard.storageInterfaces ?? []).some(type => (part.storageInterface ?? "").includes(type)));
const defaultCooler = compatible(CATALOG.cooler, part => part.supportedSockets?.includes(defaultCpu.socket ?? "") === true);
const defaultPsu = compatible(CATALOG.psu, part => (part.watt ?? 0) >= (defaultGpu.watt ?? 0) + (defaultCpu.cpuPowerW ?? 65) + 80);
const defaultCase = compatible(CATALOG.case, part => part.supportedMotherboards?.includes(defaultBoard.formFactor ?? "") === true && (part.clearance ?? 0) >= (defaultGpu.len ?? 0));
const defaultFans = compatible(CATALOG.fans, part => part.id === `${defaultCase.id}::fans`);

export const DEFAULT_PICKS = {
  cpu: defaultCpu.id,
  gpu: defaultGpu.id,
  board: defaultBoard.id,
  ram: defaultRam.id,
  storage: defaultStorage.id,
  cooler: defaultCooler.id,
  psu: defaultPsu.id,
  case: defaultCase.id,
  fans: defaultFans.id,
} as const;

export const getProductById = (id: string) => PRODUCTS.find(product => product.id === id);
