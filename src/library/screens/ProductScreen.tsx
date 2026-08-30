import React from "react";
import type { Vals } from "../sx";
import "../responsive.css";
import "../product.css";

/**
 * Product detail laid out the way a large electronics retailer does it: the
 * gallery on the left, and on the right a buy box that answers the buying
 * question in one column — brand, name, short description, stock, delivery,
 * price, action. Everything that is not part of that decision sits below.
 */
export const ProductScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page product-page">
    <div className="product-grid">
      <section className="product-gallery">
        <div className="product-gallery__main">
          {v.pImage ? <img src={v.pImage} alt={v.pName} /> : <span className="ms">image</span>}
        </div>
        {v.pIsGpu && (
          <div className="product-panel">
            <div className="product-panel__head">
              <strong>How well will it play?</strong>
              <small>estimated from catalog specs</small>
            </div>
            <div className="product-fps">
              {v.pFpsCards.map((f: Vals, i: number) => (
                <div key={i} className="product-fps__card">
                  <span>{f.res}</span>
                  <strong className="num">{f.fps}</strong>
                </div>
              ))}
            </div>
            <p>Averages across the current Rigsmith performance model.</p>
          </div>
        )}
      </section>

      <aside className="product-buy" aria-label="Purchase">
        <button type="button" className="product-buy__brand" onClick={v.pAllFromBrand}>All from {v.pBrand}</button>
        <h1>{v.pBrand} {v.pModel}</h1>

        <p className="product-buy__summary">{v.pBlurb}</p>

        <div className="product-buy__stock">
          <strong style={{ color: v.pStockFg }}>{v.pStock}</strong>
          <span><span className="ms">local_shipping</span>{v.pDelivery}</span>
        </div>

        <div className="product-buy__price">
          <strong className="num">{v.pPrice}</strong>
          <small>Includes VAT · <span className="num">{v.pPriceExVat}</span> excl. VAT</small>
        </div>

        <div className="product-buy__actions">
          <button type="button" className="product-buy__cta" onClick={v.pAddToCart}>
            <span className="ms">shopping_bag</span>{v.pActionLabel}
          </button>
          {v.pBuildActionShow !== "none" && (
            <button type="button" className="product-buy__alt" onClick={v.pAddToBuild}>
              <span className="ms">construction</span>{v.pBuildActionLabel}
            </button>
          )}
        </div>

        <div className="product-buy__fit" style={{ background: v.pFitBg, display: v.pFitShow }}>
          <span className="ms" style={{ color: v.pFitFg }}>{v.pFitIcon}</span>
          <p>{v.pFitText}</p>
        </div>

        <ul className="product-buy__facts">
          <li><span className="ms">qr_code_2</span>Code <span className="num">{v.pSku}</span></li>
          <li><span className="ms">assignment_return</span>30-day returns</li>
          <li><span className="ms">verified_user</span>2-year warranty</li>
        </ul>
      </aside>
    </div>

    <section className="product-detail">
      <div className="product-detail__main">
        <h2>About this product</h2>
        <p>{v.pBlurb}</p>
        <h2>Specifications</h2>
        <dl className="product-specs">
          {v.pFacts.map((f: Vals, i: number) => (
            <div key={i}><dt>{f.k}</dt><dd>{f.v}</dd></div>
          ))}
        </dl>
      </div>
      <div className="product-detail__tags">
        <h2>At a glance</h2>
        <div>
          {v.pSpecs.map((spec: string, i: number) => <span key={i}>{spec}</span>)}
        </div>
      </div>
    </section>
  </div>
);
