import React from "react";
import { sx, type Vals } from "../sx";
import "../cart.css";

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
                <span style={sx(`color:${line.stockFg}`)}>{line.stock}</span>
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
  <div className="t-page" style={sx("padding:32px 36px 40px;max-width:960px;display:flex;flex-direction:column;gap:18px")}>
    <div style={sx("display:flex;align-items:center;gap:16px")}>
      <div style={sx("font-size:24px;font-weight:500")}>Checkout</div>
      <div style={sx("flex:1")}></div>
      <div style={sx("display:flex;align-items:center;gap:4px;padding:3px;background:var(--gray-100);border-radius:99px")}>
        {v.steps.map((s: Vals, i: number) => (
          <span key={i} style={sx(`font-size:13px;padding:5px 12px;border-radius:99px;color:${s.fg};font-weight:${s.fw};background:${s.bg};box-shadow:${s.sh};transition:background 200ms var(--page-slide-ease),color 200ms var(--page-slide-ease)`)}>{s.label}</span>
        ))}
      </div>
    </div>
    <div style={sx("display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start")}>
      <div className="card" style={sx("padding:20px;display:flex;flex-direction:column;gap:14px")}>
        <div style={sx("font-size:14px;font-weight:500")}>{v.stepTitle}</div>
        <div style={sx("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
          {v.stepFields.map((f: Vals, i: number) => (
            <div key={i} style={sx(`grid-column:${f.span};height:36px;border:1px solid var(--border-default);border-radius:8px;display:flex;align-items:center;padding:0 12px;font-size:13px;color:var(--text-tertiary);transition:border-color 140ms ease`)}>{f.label}</div>
          ))}
        </div>
        <div style={sx("display:flex;gap:8px;margin-top:2px")}>
          <div className="pill ghostb" onClick={v.stepBack}>Back</div>
          <div className="pill dark" onClick={v.stepNext}>{v.stepCta}</div>
        </div>
      </div>
      <div className="card" style={sx("padding:16px;display:flex;flex-direction:column;gap:10px")}>
        <div style={sx("display:flex;gap:12px")}>
          <div className="ph" style={sx("width:56px;height:56px")}>{v.buildImage ? <img className="catalog-image" src={v.buildImage} alt="Selected graphics card" /> : <span className="ms" style={sx("font-size:20px")}>image</span>}</div>
          <div style={sx("font-size:13px")}><div style={sx("font-weight:500")}>Quiet 1440p gaming PC</div><div style={sx("color:var(--text-secondary)")}>9 parts</div></div>
        </div>
        <div style={sx("height:1px;background:var(--border-subtle)")}></div>
        <div style={sx("display:flex;justify-content:space-between;align-items:baseline")}><span style={sx("font-size:14px;font-weight:500")}>Total</span><span className="num" style={sx("font-size:24px;font-weight:500")}>{v.totalLabel}</span></div>
        <div style={sx("font-size:12px;color:var(--text-tertiary);line-height:1.5")}>Arrives {v.shipLabel}. Free returns within 30 days.</div>
      </div>
    </div>
  </div>
);

/** Order confirmation. */
export const DoneScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page" style={sx("padding:100px 36px;display:flex;flex-direction:column;align-items:center;gap:14px")}>
    <span className="ms" style={sx("font-size:20px;color:var(--success)")}>check_circle</span>
    <div style={sx("font-size:24px;font-weight:500")}>Your PC is on the way</div>
    <div style={sx("font-size:13px;color:var(--text-secondary)")}>Order 48-2291 · arrives {v.shipLabel} · {v.totalLabel}</div>
    <div style={sx("display:flex;gap:8px;margin-top:6px")}>
      <div className="pill ghostb" onClick={v.goHome}>Back to shop</div>
      <div className="pill dark" onClick={v.restart}>Start another build</div>
    </div>
  </div>
);
