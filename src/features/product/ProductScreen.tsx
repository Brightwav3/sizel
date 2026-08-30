import React from "react";
import type { Vals } from "../../shared/lib/types";
import "../../shared/styles/responsive.css";
import "./product.css";
import { RatingLine, Stars } from "../../shared/ui/Stars";
import { OptionPicker } from "../../shared/ui/OptionPicker";
import { ColorPicker } from "./ColorPicker";

/**
 * Product detail laid out the way a large electronics retailer does it: the
 * gallery on the left, and on the right a buy box that answers the buying
 * question in one column — brand, name, short description, stock, delivery,
 * price, action. Everything that is not part of that decision sits below.
 */
export const ProductScreen: React.FC<{ v: Vals }> = ({ v }) => {
  const selectedColor = v.pColorways.find((colorway: Vals) => colorway.id === v.pSelectedColorId) ?? v.pColorways[0];
  const [image, setImage] = React.useState(selectedColor?.imagePath ?? v.pImage);

  React.useEffect(() => {
    setImage(selectedColor?.imagePath ?? v.pImage);
  }, [v.pSku, v.pSelectedColorId, v.pImage]);

  return (
  <div className="t-page product-page">
    <div className="product-grid">
      <section className="product-gallery">
        <div className="product-gallery__main">
          {image ? <img src={image} alt={v.pName} /> : <span className="ms">image</span>}
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
        <h1>{v.pTitle}</h1>
        <RatingLine average={v.pRating.average} count={v.pRating.count} size={15}
          onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })} />

        <p className="product-buy__summary">{v.pBlurb}</p>

        <div className="product-buy__stock">
          <strong style={{ color: v.pStockFg }}>{v.pStock}</strong>
          <span><span className="ms">local_shipping</span>{v.pDelivery}</span>
        </div>

        <div className="product-buy__options">
          <ColorPicker key={`${v.pSku}:${v.pSelectedColorId ?? "default"}`} colorways={v.pColorways} selectedId={v.pSelectedColorId} onChange={colorway => {
            setImage(colorway.imagePath ?? v.pImage);
            v.pSelectColor(colorway.id);
          }} />
          <OptionPicker label="Storage" value={v.pStorageLabel} icon="sd_card" options={v.pStorageOptions} />
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

        <button type="button" className={`watch-button ${v.pWatched ? "is-on" : ""}`} onClick={v.pWatch} aria-pressed={v.pWatched}>
          <span className="ms">sound_detection_dog_barking</span>{v.pWatchLabel}
        </button>

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

    <section className="reviews" id="reviews" aria-label="Customer reviews">
      <div>
        <h2>Customer reviews</h2>
        <div className="reviews__score">
          <strong className="num">{v.pRating.average.toFixed(1)}</strong>
          <Stars value={v.pRating.average} size={18} />
          <small>{v.pRating.count} ratings</small>
          <div className="reviews__bars">
            {v.pRating.distribution.map((band: Vals) => (
              <div key={band.stars} className="reviews__bar">
                <span>{band.stars} ★</span>
                <i><b style={{ width: `${band.percent}%` }} /></i>
                <span className="num">{band.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h2>What buyers say</h2>
        <div className="reviews__list">
          {v.pReviews.map((review: Vals) => (
            <article key={review.id} className="review">
              <span className="review__avatar">{review.initials}</span>
              <div>
                <div className="review__head">
                  <strong>{review.author}</strong>
                  <Stars value={review.stars} size={12} />
                  <time>{review.date}</time>
                  {review.verified && (
                    <span className="review__verified"><span className="ms">verified</span>Verified purchase</span>
                  )}
                </div>
                <h3>{review.title}</h3>
                <p>{review.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  </div>
  );
};
