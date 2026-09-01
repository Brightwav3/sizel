import React from "react";
import { CATALOG } from "../../data/catalog/catalog";
import { money } from "../../entities/build/metrics";
import { FREE_SHIPPING_OVER, cartTotals } from "../../entities/cart/cartTotals";
import type { PcSlot } from "../../shared/lib/types";
import type { BuildContext } from "../../entities/build/buildContext";

/** `days` is the catalog's shipping lead time, so keep it numeric in shipping copy. */
const shippingLabel = (days: number) =>
  days === 0 ? "Ships today" : `Ships in ${days} day${days === 1 ? "" : "s"}`;

/** The shipping date is derived from the same lead time exposed by the tools. */
const shippingDateLabel = (app: BuildContext["app"], days: number) =>
  days === 0 ? "Ships today" : `Ships ${app.shipDate(days)}`;

export function buildCheckoutVals(context: BuildContext) {
  const { app, s, m, route, over, st } = context;
  const findPart = (line: { id: string; slot?: any }) =>
    line.slot ? CATALOG[line.slot as keyof typeof CATALOG]?.find(part => part.id === line.id) : undefined;

  /** Prices come from the cart entity, so this screen and the tools agree. */
  const totals = cartTotals(s.cart, m, s.picks);

  /** One row per cart line. A build is priced and shipped as a single unit. */
  const cartLines = totals.rows.map((row) => {
    const index = row.index;
    const line = s.cart[index];
    const part = line.kind === "product" ? findPart(line) : undefined;
    const days = row.days;
    const out = row.outOfStock;
    return {
      index,
      kind: line.kind,
      // A phone in the cart has to say which storage tier it is.
      name: row.name,
      brand: line.kind === "build" ? "Sizel assembly service" : part?.brand ?? "",
      note: line.kind === "build"
        ? [m.cpu.name, m.gpu.name, m.ram.name].join(" · ") + " · 6 more"
        : (part?.specs ?? []).slice(0, 3).join(" · "),
      image: line.kind === "build" ? m.gpu.imagePath : part?.imagePath,
      qty: line.qty,
      unitLabel: money(row.unit),
      totalLabel: money(row.total),
      stock: out ? "Out of stock" : `In stock · ${shippingLabel(days)}`,
      stockFg: out ? "var(--danger)" : days <= 2 ? "var(--green-600)" : "var(--amber-600)",
      editable: line.kind === "product",
      inc: () => app.setCartQty(index, line.qty + 1),
      dec: () => app.setCartQty(index, line.qty - 1),
      remove: () => app.removeCartLine(index),
      open: () => line.kind === "build"
        ? app.setState({ route: "builder" })
        : app.setState({ route: "product", productSlot: line.slot ?? "gpu", productId: line.id }),
    };
  });

  const { itemCount, subtotal, shipping, slowestDays: slowestLine } = totals;

  return {
      cartEmpty: s.cart.length === 0,
      cartFilled: s.cart.length > 0,
      cartLines,
      cartTitleSub: s.cart.length === 0 ? "Your cart is empty" : `${itemCount} item${itemCount === 1 ? "" : "s"}`,
      cartSubtotal: money(subtotal),
      cartShipping: shipping === 0 ? "Free" : money(shipping),
      cartShippingNote: shipping === 0 ? "Orders over $99 ship free" : `Free over $99 — add ${money(99 - subtotal)}`,
      cartTotal: money(subtotal + shipping),
      cartDeliveryLine: shippingDateLabel(app, slowestLine),
      clearCart: () => app.setState({ cart: [], toast: "Cart emptied" }, () => app.flash()),
      buildImage: m.gpu.imagePath,
      totalLabel: money(subtotal + shipping),

      steps: ["1 Delivery", "2 Payment", "3 Review"].map((l, i) => ({
        label: l,
        fg: i === s.step ? "var(--text-primary)" : "var(--text-tertiary)",
        fw: i === s.step ? 500 : 400,
        bg: i === s.step ? "#fff" : "transparent",
        sh: i === s.step ? "0 1px 3px rgba(41,41,41,.10)" : "none",
      })),
      stepTitle: st.title, stepCta: st.cta, stepFields: st.fields,
      stepNext: () => s.step < 2 ? app.setState({ step: s.step + 1 }) : app.setState({ toast: "Demo only — no payment taken and no order placed." }, () => app.flash()),
      stepBack: () => s.step > 0 ? app.setState({ step: s.step - 1 }) : app.go("cart"),
      restart: () => app.setState({ route: "home", cart: [], step: 0, lastChange: null }),
  };
}

