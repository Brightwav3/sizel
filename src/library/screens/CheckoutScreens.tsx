import React from "react";
import { sx, type Vals } from "../sx";

/** Cart: the build as one line item, delivery, and the summary. */
export const CartScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page" style={sx("padding:32px 36px 40px;max-width:960px;display:flex;flex-direction:column;gap:18px")}>
    <div>
      <div style={sx("font-size:24px;font-weight:500")}>Your cart</div>
      <div style={sx("font-size:13px;color:var(--text-secondary);margin-top:3px")}>{v.cartSub}</div>
    </div>
    {v.cartEmpty && (
      <div className="card" style={sx("padding:48px;display:flex;flex-direction:column;align-items:center;gap:12px;background:var(--gray-50)")}>
        <span className="ms" style={sx("font-size:20px;color:var(--text-tertiary)")}>shopping_bag</span>
        <div style={sx("font-size:13px;color:var(--text-secondary)")}>Nothing here yet.</div>
        <div className="pill dark" onClick={v.goBuilder}>Go to my build</div>
      </div>
    )}
    {v.cartFilled && (
      <>
        <div className="card" style={sx("padding:16px;display:flex;gap:16px")}>
          <div className="ph" style={sx("width:128px;height:128px")}>{v.buildImage ? <img className="catalog-image" src={v.buildImage} alt="Selected graphics card" /> : <span className="ms" style={sx("font-size:20px")}>image</span>}</div>
          <div style={sx("flex:1;display:flex;flex-direction:column;gap:8px")}>
            <div style={sx("font-size:14px;font-weight:500")}>Quiet 1440p gaming PC</div>
            <div style={sx("font-size:13px;color:var(--text-secondary);line-height:1.5")}>{v.cartParts}</div>
            <div style={sx("display:flex;gap:6px;flex-wrap:wrap")}>
              <span style={sx("font-size:12px;padding:2px 8px;border-radius:99px;background:var(--success-soft);color:var(--green-600);font-weight:500")}>Assembled and tested</span>
              <span style={sx("font-size:12px;padding:2px 8px;border-radius:99px;background:var(--surface-sunken);color:var(--text-secondary)")}>2-year warranty</span>
            </div>
            <div onClick={v.goBuilder} style={sx("font-size:13px;color:var(--text-accent);cursor:pointer")}>Edit build</div>
          </div>
          <div style={sx("text-align:right;display:flex;flex-direction:column;gap:4px")}>
            <div className="num" style={sx("font-size:24px;font-weight:500")}>{v.totalLabel}</div>
            <div style={sx("font-size:12px;color:var(--text-tertiary)")}>Assembly included</div>
            <div onClick={v.clearCart} style={sx("font-size:12px;color:var(--text-accent);cursor:pointer;margin-top:6px")}>Remove</div>
          </div>
        </div>
        <div style={sx("display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start")}>
          <div className="card" style={sx("padding:16px;display:flex;flex-direction:column;gap:10px")}>
            <div style={sx("font-size:14px;font-weight:500")}>Delivery</div>
            <div style={sx("display:flex;align-items:center;gap:8px;font-size:13px")}><span className="ms" style={sx("font-size:20px;color:var(--success)")}>check_circle</span>{v.stockLine}</div>
            <div style={sx("display:flex;align-items:center;gap:8px;font-size:13px")}><span className="ms" style={sx("font-size:20px;color:var(--amber-500)")}>schedule</span>{v.backorderLine}</div>
            <div style={sx("font-size:13px;color:var(--text-secondary)")}>Complete PC ships <span style={sx("font-weight:500;color:var(--text-primary)")}>{v.shipLabel}</span></div>
          </div>
          <div className="card" style={sx("padding:16px;display:flex;flex-direction:column;gap:10px")}>
            <div style={sx("display:flex;justify-content:space-between;font-size:13px")}><span style={sx("color:var(--text-secondary)")}>Parts</span><span className="num">{v.totalLabel}</span></div>
            <div style={sx("display:flex;justify-content:space-between;font-size:13px")}><span style={sx("color:var(--text-secondary)")}>Assembly</span><span>Included</span></div>
            <div style={sx("display:flex;justify-content:space-between;font-size:13px")}><span style={sx("color:var(--text-secondary)")}>Shipping</span><span>Free</span></div>
            <div style={sx("height:1px;background:var(--border-subtle)")}></div>
            <div style={sx("display:flex;justify-content:space-between;align-items:baseline")}><span style={sx("font-size:14px;font-weight:500")}>Total</span><span className="num" style={sx("font-size:24px;font-weight:500")}>{v.totalLabel}</span></div>
            <div className="pill dark" onClick={v.goCheckout} style={sx("height:44px")}>Checkout</div>
          </div>
        </div>
      </>
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
