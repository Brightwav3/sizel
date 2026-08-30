/**
 * Presentation-only retail labels for the demo storefront.
 *
 * The canonical catalog has no sale/new fields, so these labels live outside
 * the product records. Product IDs and canonical prices remain untouched.
 */
export type MerchandisingKind = "new" | "sale";

export const MERCHANDISING: Record<string, MerchandisingKind> = {
  "proseware-pulse-32gb-ddr5-6000": "new",
  "proseware-pulse-rgb-32gb-ddr5-6400": "sale",
  "proseware-pulse-pro-128gb-ddr5-6400": "new",
  "northwind-gx-5090-reference-edition": "new",
  "adventure-vision-360-lcd": "new",
  "contoso-phone-9-fold": "new",
  "adventure-go-oled": "new",
  "fabrikam-memory-16gb-ddr5-5600": "sale",
  "northwind-gx-5050": "sale",
  "tailspin-power-650-gold": "sale",
  "pear-phone-15-pro": "sale",
  "fourth-castle-castle-5": "sale",
};
