import React from "react";
import type { Vals } from "../../../shared/lib/types";
import "./home.css";

const CatalogImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => (
  src ? <img className="catalog-image" src={src} alt={alt} /> : <span className="ms catalog-image-fallback">image</span>
);

/** The shop front: a catalog-led electronics store with the builder as its differentiator. */
export const HomeScreen: React.FC<{ v: Vals }> = ({ v }) => {
  const offers = v.promotions || [];
  const [offerIndex, setOfferIndex] = React.useState(0);
  const offerIndexRef = React.useRef(0);

  const showOffer = React.useCallback((nextIndex: number) => {
    if (offers.length < 1) return;
    const next = nextIndex % offers.length;
    offerIndexRef.current = next;
    setOfferIndex(next);
  }, [offers.length]);

  React.useEffect(() => {
    if (offers.length < 2) return;
    const timer = window.setInterval(() => showOffer((offerIndexRef.current + 1) % offers.length), 6500);
    return () => window.clearInterval(timer);
  }, [offers.length, showOffer]);

  const offer = offers[offerIndex % Math.max(offers.length, 1)] || v.heroProduct;

  return (
  <div className="t-page home-page">
    <nav className="home-quick-categories" aria-label="Popular categories">
      {v.homeCategories.slice(0, 6).map((category: Vals) => (
        <button key={category.name} onClick={category.go}>
          <span className="iconbox"><span className="ms">{category.icon}</span></span>
          <span><strong>{category.name}</strong><small>{category.count} products</small></span>
          <span className="ms">arrow_forward</span>
        </button>
      ))}
    </nav>

    <section className="hero">
      <div className="hero-banner">
        <div className="hero-banner__track" style={{ transform: `translateX(-${offerIndex * 100}%)` }}>
          {(offers.length ? offers : [offer]).map((slide: Vals, index: number) => (
            <div className="hero-banner__slide" key={slide.name} aria-hidden={index !== offerIndex}>
              <div className="hero-banner__copy">
                <span className="hero-banner__eyebrow">{slide.heroEyebrow}</span>
                <h1>{slide.heroTitle}</h1>
                <p>{slide.copy}</p>
                <div className="hero-banner__actions">
                  <button type="button" className="hero-banner__cta" tabIndex={index === offerIndex ? 0 : -1} onClick={slide.heroGo}>{slide.heroCta}</button>
                  <button type="button" className="hero-banner__alt" tabIndex={index === offerIndex ? 0 : -1} onClick={slide.heroSecondaryGo}>{slide.heroSecondaryLabel}</button>
                </div>
                <div className="hero-banner__stats">
                  {(slide.heroStats || []).map((stat: Vals) => (
                    <span key={stat.label}><strong className="num">{stat.value}</strong>{stat.label}</span>
                  ))}
                </div>
              </div>
              <button type="button" className="hero-banner__art" tabIndex={index === offerIndex ? 0 : -1} onClick={slide.go} aria-label={`Open ${slide.name}`}>
                <CatalogImage src={slide.image} alt={slide.name} />
                <span className="hero-banner__tag">
                  <small>{slide.brand}</small>
                  <strong className="num">{slide.price}</strong>
                  <em>{slide.availability}</em>
                </span>
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="hero-banner__nav is-prev" data-tip="Previous offer" data-tip-place="top"
          aria-label="Previous offer" onClick={() => showOffer((offerIndex + offers.length - 1) % Math.max(offers.length, 1))}>
          <span className="ms">chevron_left</span>
        </button>
        <button type="button" className="hero-banner__nav is-next" data-tip="Next offer" data-tip-place="top"
          aria-label="Next offer" onClick={() => showOffer(offerIndex + 1)}>
          <span className="ms">chevron_right</span>
        </button>

        <div className="hero-banner__dots">
          {offers.map((item: Vals, index: number) => (
            <button key={item.name} type="button" className={index === offerIndex ? "is-on" : ""}
              aria-label={`Show ${item.label}`} aria-current={index === offerIndex} onClick={() => showOffer(index)} />
          ))}
        </div>
      </div>

      <aside className="hero-rail" aria-label="More offers">
        <div className="hero-rail__promise">
          <span className="ms">local_shipping</span>
          <span><strong>Free delivery over $99</strong><small>Ordered before 4pm ships today</small></span>
        </div>
        {offers.filter((_: Vals, index: number) => index !== offerIndex).slice(0, 2).map((item: Vals) => (
          <button key={item.name} type="button" className="hero-rail__card" onClick={item.go}>
            <span className="hero-rail__shot"><CatalogImage src={item.image} alt={item.name} /></span>
            <span className="hero-rail__copy">
              <small>{item.label === item.name ? item.brand : item.label}</small>
              <strong>{item.name}</strong>
              <em className="num">{item.price}</em>
            </span>
            <span className="ms">arrow_forward</span>
          </button>
        ))}
        <div className="hero-rail__promise hero-rail__promise--returns">
          <span className="ms">assignment_return</span>
          <span><strong>30-day returns</strong><small>Easy returns on every order</small></span>
        </div>
      </aside>
    </section>

    <section className="home-section">
      <div className="home-section__head">
        <h2>Brands in the catalog</h2>
        <span className="home-section__note">{v.catalogCount} products from {v.brandCount} fictional brands</span>
      </div>
      <div className="brand-ribbon" aria-label="Sizel brands">
        <div className="brand-ribbon__track">
          {[0, 1].map(set => (
            <div className="brand-ribbon__set" key={set} aria-hidden={set === 1}>
              {v.brandRibbon.map((brand: Vals) => (
                <button className="brand-ribbon__item" key={`${set}-${brand.name}`} onClick={brand.go} tabIndex={set === 1 ? -1 : 0}>
                  <img src={brand.logo} alt={set === 1 ? "" : `${brand.name} logo`} />
                  <span>{brand.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="home-section">
      <div className="home-section__head">
        <h2>Promotions and new arrivals</h2>
        <span className="home-section__note">A reason to look beyond PC parts</span>
      </div>
      <div className="home-grid-3">
        {v.promotions.map((p: Vals, i: number) => (
          <button type="button" key={i} className="card prod promo-card" onClick={p.go}>
            <div className="ph"><CatalogImage src={p.image} alt={p.name} /></div>
            <div className="home-card__body">
              <div className="eyebrow">{p.label}</div>
              <div className="home-card__name">{p.name}</div>
              <div className="promo-card__copy">{p.copy}</div>
              <div className="home-card__foot">
                <span className="promo-card__link">Shop {p.label.toLowerCase()} <span className="ms home-card__arrow">arrow_forward</span></span>
                <span className="num home-card__price">{p.price}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>

    <section className="home-section">
      <div className="home-section__head">
        <h2>Shop by department</h2>
        <span className="home-section__note">Start with what you need</span>
      </div>
      <div className="home-grid-3">
        {v.homeDepartments.map((d: Vals) => (
          <button key={d.id} className="card dept-card" onClick={d.go}>
            <span className="iconbox"><span className="ms">{d.icon}</span></span>
            <span className="dept-card__copy">
              <span className="dept-card__name">{d.name}</span>
              <span className="dept-card__blurb">{d.blurb}</span>
              <span className="dept-card__count">{d.count} products <span className="ms home-card__arrow">arrow_forward</span></span>
            </span>
          </button>
        ))}
      </div>
    </section>

    <section className="home-section">
      <div className="home-section__head">
        <h2>Featured products</h2>
        <span className="home-section__note">Selected from the real catalog</span>
        <span className="home-section__spacer" />
        <button className="text-button" onClick={v.goCategory}>View all</button>
      </div>
      <div className="home-grid-4">
        {v.bestOf.map((b: Vals, i: number) => (
          <button type="button" key={i} className="card prod feature-card" onClick={b.go}>
            <div className="ph"><CatalogImage src={b.image} alt={b.name} /></div>
            <div className="home-card__body">
              <div className="feature-card__award" style={{ "--award-fg": b.awardFg } as React.CSSProperties}>{b.award}</div>
              <div className="feature-card__name">{b.name}</div>
              <div className="feature-card__why">{b.why}</div>
              <div className="home-card__foot">
                <span className="num home-card__price">{b.price}</span>
                <span className="feature-card__picks">{b.picks}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>

    <section className="home-split">
      <div className="card home-starts">
        <div>
          <h2>Popular starting points</h2>
          <p>Jump straight to the categories builders compare most.</p>
        </div>
        <div className="home-starts__chips">
          {v.homeCategories.map((c: Vals) => (
            <button key={c.name} className="pill ghostb home-starts__chip" onClick={c.go}>
              <span className="ms">{c.icon}</span>
              <span>{c.name}</span>
              <span className="home-starts__chip-count">{c.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card home-why">
        <div className="eyebrow">Why Sizel</div>
        <div className="home-why__point"><span className="ms">verified</span><span>Every PC part is checked against the rest of your build.</span></div>
        <div className="home-why__point"><span className="ms">inventory_2</span><span>Stock and delivery dates shown before you order.</span></div>
        <div className="home-why__point"><span className="ms">photo_library</span><span>Real photos and full specifications on every product.</span></div>
      </div>
    </section>
  </div>
);
};
