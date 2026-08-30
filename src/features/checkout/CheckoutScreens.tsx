import React from "react";
import type { Vals } from "../../shared/lib/types";
import "./checkout.css";

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
