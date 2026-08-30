import React from "react";
import type { Vals } from "../types";
import "../cart.css";
import "../checkout.css";

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

/** Three steps in one card, with the order summary pinned alongside. */
export const CheckoutScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page checkout-page">
    <header className="checkout-head">
      <h1>Checkout</h1>
      <div className="checkout-head__spacer" />
      <div className="checkout-steps">
        {v.steps.map((s: Vals, i: number) => (
          <span
            key={i}
            className="checkout-steps__step"
            style={{ "--step-bg": s.bg, "--step-fg": s.fg, "--step-weight": s.fw, "--step-shadow": s.sh } as React.CSSProperties}
          >{s.label}</span>
        ))}
      </div>
    </header>
    <div className="checkout-layout">
      <div className="card checkout-form">
        <div className="checkout-form__title">{v.stepTitle}</div>
        <div className="checkout-fields">
          {v.stepFields.map((f: Vals, i: number) => (
            <div key={i} className="checkout-field" style={{ "--field-span": f.span } as React.CSSProperties}>{f.label}</div>
          ))}
        </div>
        <div className="checkout-actions">
          <div className="pill ghostb" onClick={v.stepBack}>Back</div>
          <div className="pill dark" onClick={v.stepNext}>{v.stepCta}</div>
        </div>
      </div>
      <div className="card checkout-summary">
        <div className="checkout-summary__build">
          <div className="ph">{v.buildImage ? <img className="catalog-image" src={v.buildImage} alt="Selected graphics card" /> : <span className="ms">image</span>}</div>
          <div className="checkout-summary__copy">
            <div className="checkout-summary__name">Quiet 1440p gaming PC</div>
            <div className="checkout-summary__parts">9 parts</div>
          </div>
        </div>
        <div className="checkout-summary__rule" />
        <div className="checkout-summary__total">
          <span>Total</span>
          <span className="num checkout-summary__amount">{v.totalLabel}</span>
        </div>
        <div className="checkout-summary__note">Arrives {v.shipLabel}. Free returns within 30 days.</div>
      </div>
    </div>
  </div>
);

/** Order confirmation. */
export const DoneScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page done-page">
    <span className="ms done-page__tick">check_circle</span>
    <h1>Your PC is on the way</h1>
    <div className="done-page__meta">Order 48-2291 · arrives {v.shipLabel} · {v.totalLabel}</div>
    <div className="done-page__actions">
      <div className="pill ghostb" onClick={v.goHome}>Back to shop</div>
      <div className="pill dark" onClick={v.restart}>Start another build</div>
    </div>
  </div>
);
