import React from "react";
import { sx, type Vals } from "../sx";
import "../home.css";

const CatalogImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => (
  src ? <img className="catalog-image" src={src} alt={alt} /> : <span className="ms" style={sx("font-size:var(--text-2xl);color:var(--text-tertiary)")}>image</span>
);

/** The shop front: a catalog-led electronics store with the builder as its differentiator. */
export const HomeScreen: React.FC<{ v: Vals }> = ({ v }) => {
  const offers = v.promotions || [];
  const [offerIndex, setOfferIndex] = React.useState(0);
  const [animationPhase, setAnimationPhase] = React.useState(false);
  const offerIndexRef = React.useRef(0);

  const showOffer = React.useCallback((nextIndex: number) => {
    if (offers.length < 1) return;
    const next = nextIndex % offers.length;
    offerIndexRef.current = next;
    setOfferIndex(next);
    setAnimationPhase(phase => !phase);
  }, [offers.length]);

  React.useEffect(() => {
    if (offers.length < 2) return;
    const timer = window.setInterval(() => showOffer((offerIndexRef.current + 1) % offers.length), 6500);
    return () => window.clearInterval(timer);
  }, [offers.length, showOffer]);

  const offer = offers[offerIndex % Math.max(offers.length, 1)] || v.heroProduct;

  return (
  <div className="t-page" style={sx("padding:var(--space-6) var(--space-8) var(--space-16);display:flex;flex-direction:column;gap:var(--space-8)")}>
    <div style={sx("padding:var(--space-3) var(--space-5);display:flex;align-items:center;gap:var(--space-4);background:var(--surface-inverse);color:var(--text-inverse);border:1px solid var(--surface-inverse);border-radius:var(--radius-xs)")}>
      <span className="ms" style={sx("font-size:var(--text-base);color:var(--success)")}>local_shipping</span>
      <span style={sx("font-size:var(--text-sm);font-weight:var(--weight-medium)")}>Free delivery on orders over $99</span>
      <span style={sx("font-size:var(--text-sm);color:var(--gray-300)")}>·</span>
      <span style={sx("font-size:var(--text-sm);color:var(--gray-300)")}>30-day returns</span>
      <span style={sx("flex:1")}></span>
      <span style={sx("font-size:var(--text-sm);color:var(--gray-300)")}>{v.catalogCount} products from {v.brandCount} fictional brands</span>
    </div>

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
        <div className={`hero-banner__slide ${animationPhase ? "offer-slide-a" : "offer-slide-b"}`}>
          <div className="hero-banner__copy">
            <span className="hero-banner__eyebrow">{offer.heroEyebrow}</span>
            <h1>{offer.heroTitle}</h1>
            <p>{offer.copy}</p>
            <div className="hero-banner__actions">
              <button type="button" className="hero-banner__cta" onClick={offer.heroGo}>{offer.heroCta}</button>
              <button type="button" className="hero-banner__alt" onClick={offer.heroSecondaryGo}>{offer.heroSecondaryLabel}</button>
            </div>
            <div className="hero-banner__stats">
              {(offer.heroStats || []).map((stat: Vals) => (
                <span key={stat.label}><strong className="num">{stat.value}</strong>{stat.label}</span>
              ))}
            </div>
          </div>
          <button type="button" className="hero-banner__art" onClick={offer.go} aria-label={`Open ${offer.name}`}>
            <CatalogImage src={offer.image} alt={offer.name} />
            <span className="hero-banner__tag">
              <small>{offer.brand}</small>
              <strong className="num">{offer.price}</strong>
              <em>{offer.availability}</em>
            </span>
          </button>
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
        <div className="hero-rail__promise">
          <span className="ms">local_shipping</span>
          <span><strong>Free delivery over $99</strong><small>Ordered before 4pm ships today</small></span>
        </div>
      </aside>
    </section>

    <section style={sx("display:flex;flex-direction:column;gap:var(--space-5)")}>
      <div style={sx("display:flex;align-items:baseline;gap:var(--space-3)")}>
        <h2 style={sx("margin:0;font-size:var(--text-2xl);font-weight:var(--weight-medium)")}>Brands in the catalog</h2>
        <span style={sx("font-size:var(--text-sm);color:var(--text-secondary)")}>Fictional hardware, phones and consoles</span>
      </div>
      <div className="brand-ribbon" aria-label="Rigsmith brands">
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

    <section style={sx("display:flex;flex-direction:column;gap:var(--space-5)")}>
      <div style={sx("display:flex;align-items:baseline;gap:var(--space-3)")}>
        <h2 style={sx("margin:0;font-size:var(--text-2xl);font-weight:var(--weight-medium)")}>Promotions and new arrivals</h2>
        <span style={sx("font-size:var(--text-sm);color:var(--text-secondary)")}>A reason to look beyond PC parts</span>
      </div>
      <div className="home-grid-3">
        {v.promotions.map((p: Vals, i: number) => (
          <article key={i} className="card prod" onClick={p.go} style={sx("overflow:hidden;cursor:pointer;background:var(--gray-0)")}>
            <div className="ph" style={sx("height:150px;border:none;border-radius:0;border-bottom:1px solid var(--border-subtle);background:var(--gray-0)")}><CatalogImage src={p.image} alt={p.name} /></div>
            <div style={sx("padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2)")}>
              <div className="eyebrow">{p.label}</div>
              <div style={sx("font-size:var(--text-base);font-weight:var(--weight-medium)")}>{p.name}</div>
              <div style={sx("min-height:39px;font-size:var(--text-sm);line-height:var(--leading-normal);color:var(--text-secondary)")}>{p.copy}</div>
              <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:var(--space-3);margin-top:var(--space-3)")}>
                <span style={sx("font-size:var(--text-sm);color:var(--text-accent)")}>Shop {p.label.toLowerCase()} <span className="ms" style={sx("font-size:var(--text-sm);vertical-align:-2px")}>arrow_forward</span></span>
                <span className="num" style={sx("font-size:var(--text-base);font-weight:var(--weight-medium)")}>{p.price}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section style={sx("display:flex;flex-direction:column;gap:var(--space-5)")}>
      <div style={sx("display:flex;align-items:baseline;gap:var(--space-3)")}>
        <h2 style={sx("margin:0;font-size:var(--text-2xl);font-weight:var(--weight-medium)")}>Shop by department</h2>
        <span style={sx("font-size:var(--text-sm);color:var(--text-secondary)")}>Start with what you need</span>
      </div>
      <div className="home-grid-3">
        {v.homeDepartments.map((d: Vals) => (
          <button key={d.id} className="card" onClick={d.go} style={sx("padding:var(--space-6);display:flex;align-items:center;gap:var(--space-4);text-align:left;cursor:pointer;background:var(--gray-0)")}>
            <span className="iconbox" style={sx("width:48px;height:48px;flex:0 0 48px;background:var(--surface-sunken);color:var(--text-primary)")}><span className="ms" style={sx("font-size:var(--text-2xl)")}>{d.icon}</span></span>
            <span style={sx("min-width:0;display:flex;flex-direction:column;gap:var(--space-1)")}>
              <span style={sx("font-size:var(--text-base);font-weight:var(--weight-medium)")}>{d.name}</span>
              <span style={sx("font-size:var(--text-sm);line-height:var(--leading-normal);color:var(--text-secondary)")}>{d.blurb}</span>
              <span style={sx("font-size:var(--text-sm);color:var(--text-accent);margin-top:var(--space-1)")}>{d.count} products <span className="ms" style={sx("font-size:var(--text-sm);vertical-align:-2px")}>arrow_forward</span></span>
            </span>
          </button>
        ))}
      </div>
    </section>

    <section style={sx("display:flex;flex-direction:column;gap:var(--space-5)")}>
      <div style={sx("display:flex;align-items:baseline;gap:var(--space-3)")}>
        <h2 style={sx("margin:0;font-size:var(--text-2xl);font-weight:var(--weight-medium)")}>Featured products</h2>
        <span style={sx("font-size:var(--text-sm);color:var(--text-secondary)")}>Selected from the real catalog</span>
        <span style={sx("flex:1")}></span>
        <button className="text-button" onClick={v.goCategory}>View all</button>
      </div>
      <div className="home-grid-4">
        {v.bestOf.map((b: Vals, i: number) => (
          <article key={i} className="card prod" onClick={b.go} style={sx("overflow:hidden;cursor:pointer;background:var(--gray-0)")}>
            <div className="ph" style={sx("height:180px;border:none;border-radius:0;border-bottom:1px solid var(--border-subtle);background:var(--gray-0)")}><CatalogImage src={b.image} alt={b.name} /></div>
            <div style={sx("padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2)")}>
              <div style={sx(`font-size:var(--text-xs);font-weight:var(--weight-medium);color:${b.awardFg}`)}>{b.award}</div>
              <div style={sx("font-size:var(--text-base);font-weight:var(--weight-medium);line-height:var(--leading-normal)")}>{b.name}</div>
              <div style={sx("min-height:40px;font-size:var(--text-sm);line-height:var(--leading-normal);color:var(--text-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden")}>{b.why}</div>
              <div style={sx("display:flex;align-items:baseline;justify-content:space-between;gap:var(--space-3);margin-top:var(--space-3)")}>
                <span className="num" style={sx("font-size:var(--text-base);font-weight:var(--weight-medium)")}>{b.price}</span>
                <span style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>{b.picks}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="home-split">
      <div className="card" style={sx("padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-5)")}>
        <div>
          <h2 style={sx("margin:0;font-size:var(--text-base);font-weight:var(--weight-medium)")}>Popular starting points</h2>
          <p style={sx("margin:var(--space-2) 0 0;font-size:var(--text-sm);color:var(--text-secondary)")}>Jump straight to the categories builders compare most.</p>
        </div>
        <div style={sx("display:flex;flex-wrap:wrap;gap:var(--space-3)")}>
          {v.homeCategories.map((c: Vals) => (
            <button key={c.name} className="pill ghostb" onClick={c.go} style={sx("display:inline-flex;align-items:center;gap:var(--space-2)")}>
              <span className="ms" style={sx("font-size:var(--text-base)")}>{c.icon}</span>
              <span>{c.name}</span>
              <span style={sx("color:var(--text-tertiary)")}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card" style={sx("padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-4);background:var(--surface-sunken)")}>
        <div className="eyebrow">Why Rigsmith</div>
        <div style={sx("display:flex;align-items:flex-start;gap:var(--space-3)")}><span className="ms" style={sx("color:var(--success);font-size:var(--text-base)")}>verified</span><span style={sx("font-size:var(--text-sm);line-height:var(--leading-normal)")}>Every PC part is checked against the rest of your build.</span></div>
        <div style={sx("display:flex;align-items:flex-start;gap:var(--space-3)")}><span className="ms" style={sx("color:var(--success);font-size:var(--text-base)")}>inventory_2</span><span style={sx("font-size:var(--text-sm);line-height:var(--leading-normal)")}>Stock and delivery dates shown before you order.</span></div>
        <div style={sx("display:flex;align-items:flex-start;gap:var(--space-3)")}><span className="ms" style={sx("color:var(--success);font-size:var(--text-base)")}>photo_library</span><span style={sx("font-size:var(--text-sm);line-height:var(--leading-normal)")}>Real photos and full specifications on every product.</span></div>
      </div>
    </section>
  </div>
);
};
