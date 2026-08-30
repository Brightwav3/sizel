// ADR 0002: one owner per domain rule — this one owns what checkout asks for.
// docs/decisions/0002-single-build-state-and-domain-view-models.md

/** What a field wants, so a tool can say it without naming a value. */
export type FieldKind = "delivery" | "payment" | "confirmation";

export interface CheckoutField {
  label: string;
  /** Grid placement for the screen. Tools ignore it. */
  span: string;
}

export interface CheckoutStep {
  id: string;
  title: string;
  cta: string;
  kind: FieldKind;
  fields: CheckoutField[];
}

/**
 * The three checkout steps and the fields each one asks for.
 *
 * The screen renders these and the WebMCP tools describe them, so an agent can
 * tell the shopper what to have ready without either side inventing a field.
 * Nothing here lets a tool fill one in: entering personal or payment details
 * is the shopper's own step, and no tool writes to it.
 */
export const CHECKOUT_STEPS: CheckoutStep[] = [
  {
    id: "delivery",
    title: "Where should it go?",
    cta: "Continue to payment",
    kind: "delivery",
    fields: [
      { label: "Full name", span: "auto" },
      { label: "Phone", span: "auto" },
      { label: "Street address", span: "1 / -1" },
      { label: "City", span: "auto" },
      { label: "Postcode", span: "auto" },
    ],
  },
  {
    id: "payment",
    title: "How would you like to pay?",
    cta: "Review order",
    kind: "payment",
    fields: [
      { label: "Card number", span: "1 / -1" },
      { label: "Expiry", span: "auto" },
      { label: "Security code", span: "auto" },
    ],
  },
  {
    id: "review",
    title: "Everything look right?",
    cta: "Place order",
    kind: "confirmation",
    fields: [
      { label: "Quiet 1440p gaming PC, 9 parts", span: "1 / -1" },
      { label: "Assembled and tested", span: "1 / -1" },
    ],
  },
];

export const checkoutStepAt = (step: number) => CHECKOUT_STEPS[Math.min(Math.max(step, 0), CHECKOUT_STEPS.length - 1)];
