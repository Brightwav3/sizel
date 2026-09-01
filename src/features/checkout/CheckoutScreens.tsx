import React from "react";
import type { Vals } from "../../shared/lib/types";
import "./checkout.css";

/** Three steps in one card, with the order summary pinned alongside. */
export const CheckoutScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page checkout-page">
    <header className="checkout-head">
      <h1>Checkout preview</h1>
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
      <form className="card checkout-form" onSubmit={event => { event.preventDefault(); v.stepNext(); }} noValidate>
        <div className="checkout-form__notice"><span className="ms">info</span><p>Demo checkout. Use any realistic values — nothing is sent or saved and no payment is taken.</p></div>
        <div className="checkout-form__title">{v.stepTitle}</div>
        <div className="checkout-fields">
          {v.stepFields.map((f: Vals) => f.readOnly ? (
            <div key={f.id} className="checkout-field checkout-field--readonly" style={{ "--field-span": f.span } as React.CSSProperties}>
              <span className="ms">check</span>{f.label}
            </div>
          ) : (
            <label key={f.id} className={`checkout-field-wrap ${f.error ? "has-error" : ""}`} style={{ "--field-span": f.span } as React.CSSProperties}>
              <span className="checkout-field-label">{f.label}<em aria-label="Required">*</em></span>
              <input
                id={`checkout-${f.id}`}
                type={f.type ?? "text"}
                inputMode={f.inputMode}
                autoComplete={f.autocomplete}
                value={f.value}
                onChange={event => v.checkoutFieldChange(f.id, event.target.value)}
                required
                aria-invalid={Boolean(f.error)}
                aria-describedby={f.error ? `checkout-${f.id}-error` : undefined}
              />
              {f.error && <small id={`checkout-${f.id}-error`} className="checkout-field-error"><span className="ms">error</span>{f.error}</small>}
            </label>
          ))}
        </div>
        {v.stepErrors.length > 0 && <p className="checkout-form__error" role="alert"><span className="ms">error</span>Complete the required fields before continuing.</p>}
        <div className="checkout-actions">
          <button type="button" className="pill ghostb" onClick={v.stepBack}>Back</button>
          <button type="submit" className="pill dark">{v.stepCta}</button>
        </div>
      </form>
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
        <div className="checkout-summary__note">Ships {v.shipLabel}. Free returns within 30 days.</div>
      </div>
    </div>
  </div>
);

/** Order confirmation. */
export const DoneScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page done-page">
    <span className="ms done-page__tick">check_circle</span>
    <div className="done-page__eyebrow">Demo order confirmed</div>
    <h1>Thanks — your order is ready.</h1>
    <div className="done-page__order">Order <strong className="num">{v.demoOrderId}</strong></div>
    <div className="done-page__meta">This is a demo confirmation. No payment was taken and nothing will be shipped.</div>
    <div className="done-page__actions">
      <button type="button" className="pill ghostb" onClick={v.goHome}>Back to shop</button>
      <button type="button" className="pill dark" onClick={v.restart}>Start another build</button>
    </div>
  </div>
);
