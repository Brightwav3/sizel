import type { Part, Slot } from "../types";

/**
 * Colourways for phones and consoles.
 *
 * The canonical catalog has no colour data and the photography shows one
 * finish, so a colour is presentation only: picking one does not change the
 * product, the price or the code. It exists so the buy box asks the two
 * questions a phone shop actually asks — which colour, which storage — and it
 * is kept out of the catalog adapter for exactly that reason.
 *
 * Storage is the opposite: a real, separate listing. See `storageVariants.ts`.
 */

export interface Colorway {
  id: string;
  name: string;
  /** Swatch fill. Two stops means a two-tone finish. */
  hex: string;
  hex2?: string;
  imagePath?: string;
}

const BRAND_SLUGS: Record<string, string> = {
  Pear: "pear",
  Litware: "litware",
  Contoso: "contoso",
  "Fourth Castle": "fourth-castle",
  "Y-Ball": "y-ball",
  "Adventure Works": "adventure-works",
};

const PALETTES: Record<string, Colorway[]> = {
  Pear: [
    { id: "midnight", name: "Midnight Black", hex: "#1C1C1E" },
    { id: "silver-frost", name: "Silver Frost", hex: "#D8D9DC" },
    { id: "deep-ocean", name: "Deep Ocean Blue", hex: "#20416B" },
    { id: "desert-titanium", name: "Desert Titanium", hex: "#B49B7F" },
    { id: "rose-gold", name: "Rose Gold", hex: "#E6BDB0" },
  ],
  Litware: [
    { id: "phantom-graphite", name: "Phantom Graphite", hex: "#3A3A3C" },
    { id: "titanium-silver", name: "Titanium Silver", hex: "#C9CACE" },
    { id: "cobalt-blue", name: "Cobalt Blue", hex: "#2B4FA2" },
    { id: "mint-haze", name: "Mint Haze", hex: "#B8D8C4" },
    { id: "lavender-grey", name: "Lavender Grey", hex: "#B8AFC9" },
  ],
  Contoso: [
    { id: "obsidian", name: "Obsidian", hex: "#232326" },
    { id: "porcelain", name: "Porcelain", hex: "#EDE7DD" },
    { id: "bay-blue", name: "Bay Blue", hex: "#7FA8C9" },
    { id: "hazel-green", name: "Hazel Green", hex: "#8C9B7A" },
    { id: "peony-pink", name: "Peony Pink", hex: "#E4A9B8" },
  ],
  "Fourth Castle": [
    { id: "glacier-white", name: "Glacier White", hex: "#F2F3F5" },
    { id: "midnight-black", name: "Midnight Black", hex: "#1B1B1D" },
    { id: "cosmic-red", name: "Cosmic Red", hex: "#8E2230" },
  ],
  "Y-Ball": [
    { id: "robot-white", name: "Robot White", hex: "#F4F5F6" },
    { id: "carbon-black", name: "Carbon Black", hex: "#212123" },
    { id: "velocity-green", name: "Velocity Green", hex: "#3F8F4F" },
  ],
  "Adventure Works": [
    { id: "neon-duo", name: "Neon Red & Blue", hex: "#D63B33", hex2: "#2C6EF5" },
    { id: "charcoal", name: "Charcoal", hex: "#2A2A2C" },
    { id: "turquoise", name: "Turquoise", hex: "#3FA9A0" },
    { id: "pastel-pink", name: "Pastel Pink", hex: "#EEB4C4" },
  ],
};

/** The finishes this device is offered in. Empty for anything but phones and consoles. */
export function colorwaysFor(product: Part, slot: Slot): Colorway[] {
  if (slot !== "phones" && slot !== "consoles") return [];
  const brand = product.brand ?? "";
  const slug = BRAND_SLUGS[brand];
  return (PALETTES[brand] ?? []).map(colorway => ({
    ...colorway,
    imagePath: slug
      ? `/catalog/images/colorways/${slug}/${product.id}/${colorway.id}.png`
      : undefined,
  }));
}
