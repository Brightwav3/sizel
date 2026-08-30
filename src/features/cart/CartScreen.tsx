import React from "react";
// ADR 0005: cart route UI is owned by the cart feature.
// docs/decisions/0005-feature-first-source-layout.md
import type { Vals } from "../../shared/lib/types";
import "./cart.css";

/**
 * Cart: line items on the left, the order summary pinned on the right — the
 * layout an electronics shop uses. A configured PC is one line among the rest,
 * not the point of the page.
 */
export const CartScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page page-pad cart-page">
    <header className="cart-head">
      <h1>Your cart</h1>
      <span>{v.cartTitleSub}</span>
      {v.cartFilled && <button type="button" className="cart-clear" onClick={v.clearCart}>Empty cart</button>}
    </header>

    {v.cartEmpty ? (
      <div className="cart-empty">
        <span className="ms">shopping_bag</span>
        <strong>Your cart is empty</strong>
        <p>Browse the catalog, or put a machine together in the PC configurator.</p>
        <div className="cart-empty__actions">
          <button type="button" className="pill dark" onClick={v.goCategory}>Browse the catalog</button>
          <button type="button" className="pill ghostb" onClick={v.goBuilder}>Open the configurator</button>
        </div>
      </div>
    ) : (
      <div className="cart-layout">
        <section className="cart-lines" aria-label="Cart items">
          {v.cartLines.map((line: Vals) => (
            <article key={line.index} className="cart-line">
              <button type="button" className="cart-line__image" onClick={line.open}>
                {line.image ? <img src={line.image} alt="" /> : <span className="ms">image</span>}
              </button>
              <div className="cart-line__copy">
                <small>{line.brand}</small>
                <button type="button" className="cart-line__name" onClick={line.open}>{line.name}</button>
                <p>{line.note}</p>
                <span className="cart-line__stock" style={{ color: line.stockFg }}>{line.stock}</span>
              </div>
              <div className="cart-line__qty">
                {line.editable ? (
                  <div className="qty-stepper">
                    <button type="button" onClick={line.dec} aria-label="Decrease quantity" data-tip="One fewer"><span className="ms">remove</span></button>
                    <span className="num">{line.qty}</span>
                    <button type="button" onClick={line.inc} aria-label="Increase quantity" data-tip="One more"><span className="ms">add</span></button>
                  </div>
                ) : <span className="cart-line__single">1 unit</span>}
                <button type="button" className="cart-line__remove" onClick={line.remove}>Remove</button>
              </div>
              <div className="cart-line__price">
                <strong className="num">{line.totalLabel}</strong>
                {line.qty > 1 && <small className="num">{line.unitLabel} each</small>}
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd className="num">{v.cartSubtotal}</dd></div>
            <div><dt>Delivery</dt><dd>{v.cartShipping}</dd></div>
          </dl>
          <p className="cart-summary__note">{v.cartShippingNote}</p>
          <div className="cart-summary__total"><span>Total</span><strong className="num">{v.cartTotal}</strong></div>
          <button type="button" className="pill dark cart-summary__cta" onClick={v.goCheckout}>Continue to checkout</button>
          <button type="button" className="cart-summary__back" onClick={v.goCategory}>Keep shopping</button>
          <ul className="cart-summary__facts">
            <li><span className="ms">local_shipping</span>{v.cartDeliveryLine}</li>
            <li><span className="ms">assignment_return</span>30-day returns</li>
            <li><span className="ms">verified_user</span>2-year warranty on every product</li>
          </ul>
        </aside>
      </div>
    )}
  </div>
);
