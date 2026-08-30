import type { Part } from "../../shared/lib/types";
import { capacityLabel } from "../../data/catalog/storageVariants";

export type FacetDefinition = { id: string; label: string; get(product: Part): string | string[] | undefined };

const spec = (product: Part, ...path: string[]) => {
  let value: any = product.specifications;
  for (const key of path) value = value?.[key];
  return value;
};

/** Capacity as a shopper reads it, from whatever the specifications hold. */
const storageLabel = (value: unknown) => capacityLabel(Number(value));

const facetValue = (value: unknown) => value === undefined || value === null || value === "" ? undefined : String(value);
const facetBand = (value: unknown, low: number, high: number, unit: string) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return undefined;
  return number <= low ? `Up to ${low}${unit}` : number <= high ? `${low + 1}–${high}${unit}` : `${high + 1}${unit}+`;
};

export const FACETS: Record<string, FacetDefinition[]> = {
  gpu: [
    { id: "gpu-memory", label: "Graphics memory", get: p => facetValue(spec(p, "memory", "capacityGB") ? `${spec(p, "memory", "capacityGB")} GB` : undefined) },
    { id: "gpu-memory-type", label: "Memory type", get: p => facetValue(spec(p, "memory", "type")) },
    { id: "gpu-interface", label: "Card interface", get: p => facetValue(spec(p, "platform", "interface")) },
    { id: "gpu-power", label: "Board power", get: p => facetBand(spec(p, "power", "boardPowerW"), 150, 250, " W") },
    { id: "gpu-ray-tracing", label: "Ray tracing", get: p => spec(p, "gpu", "rayTracing") ? "Ray tracing" : "Standard rendering" },
  ],
  cpu: [
    { id: "cpu-socket", label: "CPU socket", get: p => p.socket },
    { id: "cpu-cores", label: "Core count", get: p => facetValue(spec(p, "cpu", "cores") ? `${spec(p, "cpu", "cores")} cores` : undefined) },
    { id: "cpu-architecture", label: "Architecture", get: p => facetValue(p.specifications?.architecture) },
    { id: "cpu-graphics", label: "Integrated graphics", get: p => spec(p, "graphics", "integrated") ? "Integrated graphics" : "No integrated graphics" },
  ],
  board: [
    { id: "board-socket", label: "CPU socket", get: p => p.socket },
    { id: "board-form-factor", label: "Form factor", get: p => p.formFactor },
    { id: "board-memory", label: "Memory type", get: p => p.memoryType },
    { id: "board-wireless", label: "Wireless networking", get: p => spec(p, "networking", "wifi") ? "Wi-Fi" : "No Wi-Fi" },
    { id: "board-storage", label: "Storage support", get: p => p.storageInterfaces },
  ],
  ram: [
    { id: "ram-type", label: "Memory type", get: p => p.memoryType },
    { id: "ram-capacity", label: "Capacity", get: p => facetValue(spec(p, "memory", "capacityGB") ? `${spec(p, "memory", "capacityGB")} GB` : undefined) },
    { id: "ram-speed", label: "Memory speed", get: p => facetValue(spec(p, "memory", "speedMTs") ? `${spec(p, "memory", "speedMTs")} MT/s` : undefined) },
    { id: "ram-modules", label: "Module count", get: p => facetValue(spec(p, "memory", "modules") ? `${spec(p, "memory", "modules")} module${spec(p, "memory", "modules") === 1 ? "" : "s"}` : undefined) },
  ],
  storage: [
    { id: "storage-interface", label: "Interface", get: p => p.storageInterface },
    { id: "storage-capacity", label: "Capacity", get: p => facetValue(spec(p, "storage", "capacityGB") ? `${Number(spec(p, "storage", "capacityGB")) >= 1000 ? Number(spec(p, "storage", "capacityGB")) / 1000 + " TB" : spec(p, "storage", "capacityGB") + " GB"}` : undefined) },
    { id: "storage-form-factor", label: "Form factor", get: p => facetValue(spec(p, "storage", "formFactor")) },
    { id: "storage-protocol", label: "Protocol", get: p => facetValue(spec(p, "storage", "protocol")) },
  ],
  cooler: [
    { id: "cooler-type", label: "Cooler type", get: p => facetValue(spec(p, "cooling", "type")) },
    { id: "cooler-sockets", label: "Socket support", get: p => p.supportedSockets },
    { id: "cooler-capacity", label: "Cooling capacity", get: p => facetBand(spec(p, "cooling", "coolingCapacityW"), 180, 250, " W") },
    { id: "cooler-rgb", label: "Lighting", get: p => spec(p, "features", "rgb") ? "RGB" : "No RGB" },
  ],
  psu: [
    { id: "psu-wattage", label: "Wattage", get: p => facetBand(spec(p, "power", "wattageW"), 650, 850, " W") },
    { id: "psu-efficiency", label: "Efficiency", get: p => facetValue(spec(p, "power", "efficiency")) },
    { id: "psu-form-factor", label: "Form factor", get: p => p.formFactor },
    { id: "psu-modular", label: "Modular cabling", get: p => spec(p, "physical", "modular") ? "Modular" : "Non-modular" },
  ],
  case: [
    { id: "case-type", label: "Case type", get: p => facetValue(spec(p, "chassis", "type")) },
    { id: "case-motherboards", label: "Motherboard support", get: p => p.supportedMotherboards },
    { id: "case-gpu-clearance", label: "GPU clearance", get: p => facetBand(p.clearance, 300, 400, " mm") },
    { id: "case-cooler-clearance", label: "Cooler clearance", get: p => facetBand(spec(p, "cpuCooler", "maxHeightMm"), 150, 180, " mm") },
    { id: "case-front", label: "Front panel", get: p => facetValue(spec(p, "physical", "frontPanel")) },
  ],
  phones: [
    { id: "phone-display", label: "Display type", get: p => facetValue(spec(p, "display", "type")) },
    { id: "phone-storage", label: "Storage", get: p => facetValue(storageLabel(spec(p, "storage", "capacityGB"))) },
    { id: "phone-network", label: "Mobile network", get: p => facetValue(spec(p, "connectivity", "cellular")) },
    { id: "phone-durability", label: "Water resistance", get: p => facetValue(spec(p, "durability", "waterResistance")) },
    { id: "phone-wireless", label: "Wireless charging", get: p => spec(p, "battery", "wirelessCharging") ? "Wireless charging" : "No wireless charging" },
  ],
  consoles: [
    { id: "console-form-factor", label: "Console type", get: p => facetValue(spec(p, "physical", "formFactor")) },
    { id: "console-resolution", label: "Maximum resolution", get: p => facetValue(spec(p, "output", "maxResolution")) },
    { id: "console-storage", label: "Storage", get: p => facetValue(storageLabel(spec(p, "hardware", "storageGB"))) },
    { id: "console-drive", label: "Optical drive", get: p => spec(p, "media", "opticalDrive") ? "Disc drive" : "Digital only" },
    { id: "console-ray-tracing", label: "Ray tracing", get: p => spec(p, "output", "rayTracing") ? "Ray tracing" : "Standard rendering" },
  ],
};

export const FIT_FACET_IDS: Record<string, string[]> = {
  gpu: ["gpu-interface", "gpu-power"],
  cpu: ["cpu-socket"],
  board: ["board-socket", "board-form-factor", "board-memory"],
  ram: ["ram-type", "ram-modules"],
  storage: ["storage-interface", "storage-form-factor"],
  cooler: ["cooler-type", "cooler-sockets"],
  psu: ["psu-wattage", "psu-form-factor"],
  case: ["case-motherboards", "case-gpu-clearance", "case-cooler-clearance"],
};

