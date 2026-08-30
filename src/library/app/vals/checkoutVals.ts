import React from "react";
import { CATALOG } from "../../data/catalog";
import { money } from "../../data/metrics";
import { productTitle } from "../../domain/queries";
import type { PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildCheckoutVals(context: BuildContext) {
  const { app, s, m, route, over, st } = context;
  const findPart = (line: { id: string; slot?: any }) =>
    line.slot ? CATALOG[line.slot as keyof typeof CATALOG]?.find(part => part.id === line.id) : undefined;

  /** One row per cart line. A build is priced and shipped as a single unit. */
  const cartLines = s.cart.map((line, index) => {
    const part = line.kind === "product" ? findPart(line) : undefined;
    const unit = line.kind === "build" ? m.price : part?.price ?? 0;
    const days = line.kind === "build" ? m.days : part?.days ?? 0;
    const out = line.kind === "product" && part?.stock === 0;
    return {
      index,
      kind: line.kind,
      // A phone in the cart has to say which storage tier it is.
      name: line.kind === "build" ? "Custom PC build" : part ? productTitle(part, line.slot) : "Product",
      brand: line.kind === "build" ? "Rigsmith assembly service" : part?.brand ?? "",
      note: line.kind === "build"
        ? [m.cpu.name, m.gpu.name, m.ram.name].join(" · ") + " · 6 more"
        : (part?.specs ?? []).slice(0, 3).join(" · "),
      image: line.kind === "build" ? m.gpu.imagePath : part?.imagePath,
      qty: line.qty,
      unitLabel: money(unit),
      totalLabel: money(unit * line.qty),
      stock: out ? "Out of stock" : days <= 2 ? "In stock · ships tomorrow" : `Ships in ${days} days`,
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

  const itemCount = s.cart.reduce((total, line) => total + line.qty, 0);
  const subtotal = cartLines.reduce((total, line) => total + Number(line.totalLabel.replace(/[^0-9.]/g, "")), 0);
  const shipping = subtotal >= 99 || subtotal === 0 ? 0 : 6;
  const slowestLine = cartLines.length ? Math.max(...s.cart.map((line, index) => {
    const part = line.kind === "product" ? findPart(line) : undefined;
    return line.kind === "build" ? m.days : part?.days ?? 0;
  })) : 0;

  return {
      cartEmpty: s.cart.length === 0,
      cartFilled: s.cart.length > 0,
      cartLines,
      cartTitleSub: s.cart.length === 0 ? "Your cart is empty" : `${itemCount} item${itemCount === 1 ? "" : "s"}`,
      cartSubtotal: money(subtotal),
      cartShipping: shipping === 0 ? "Free" : money(shipping),
      cartShippingNote: shipping === 0 ? "Orders over $99 ship free" : `Free over $99 — add ${money(99 - subtotal)}`,
      cartTotal: money(subtotal + shipping),
      cartDeliveryLine: slowestLine <= 2 ? "Everything ships tomorrow" : `Complete order ships ${app.shipDate(slowestLine)}`,
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
      stepNext: () => s.step < 2 ? app.setState({ step: s.step + 1 }) : app.setState({ route: "done" }),
      stepBack: () => s.step > 0 ? app.setState({ step: s.step - 1 }) : app.go("cart"),
      restart: () => app.setState({ route: "home", cart: [], step: 0, lastChange: null }),
  };
}

