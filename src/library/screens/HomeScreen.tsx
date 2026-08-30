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

    <section className="card offer-hero" style={sx("padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-3);background:var(--surface-sunken)")}>
      <div className={`offer-hero__frame ${animationPhase ? "offer-slide-a" : "offer-slide-b"}`} style={sx("display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:var(--space-8);align-items:center")}>
      <div style={sx("display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-3);padding-left:var(--space-4)")}>
        <div className="eyebrow">{offer.heroEyebrow}</div>
        <h1 style={sx("margin:0;max-width:560px;font-size:var(--text-2xl);font-weight:var(--weight-medium);line-height:var(--leading-tight);letter-spacing:var(--tracking)")}>{offer.heroTitle}</h1>
        <p style={sx("margin:0;max-width:520px;font-size:var(--text-base);line-height:var(--leading-normal);color:var(--text-secondary)")}>{offer.copy}</p>
        <div style={sx("display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-2)")}>
          <button className="pill dark" onClick={offer.heroGo}>{offer.heroCta}</button>
          <button className="pill ghostb" onClick={offer.heroSecondaryGo}>{offer.heroSecondaryLabel}</button>
        </div>
        <div style={sx("display:flex;flex-wrap:wrap;gap:var(--space-5);margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-secondary)")}>
          {(offer.heroStats || []).map((stat: Vals) => <span key={stat.label}><strong style={sx("color:var(--text-primary);font-weight:var(--weight-medium)")}>{stat.value}</strong> {stat.label}</span>)}
        </div>
      </div>
      <div className="card" onClick={offer.go} style={sx("padding:var(--space-3);display:flex;flex-direction:column;gap:var(--space-2);background:var(--gray-0);cursor:pointer;box-shadow:var(--shadow-card)")}>
        <div style={sx("display:flex;align-items:center;justify-content:space-between;padding:0 var(--space-1)")}>
          <span className="eyebrow">{offer.label}</span>
          <span className="ms" style={sx("font-size:var(--text-base);color:var(--text-tertiary)")}>arrow_outward</span>
        </div>
        <div className="ph" style={sx("height:168px;background:var(--gray-0)")}><CatalogImage src={offer.image} alt={offer.name} /></div>
        <div style={sx("display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-4);padding:0 var(--space-1) var(--space-1)")}>
          <div style={sx("min-width:0")}>
            <div style={sx("font-size:var(--text-sm);color:var(--text-secondary)")}>{offer.brand}</div>
            <div style={sx("font-size:var(--text-base);font-weight:var(--weight-medium);overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{offer.name}</div>
            <div style={sx("font-size:var(--text-sm);color:var(--text-secondary);margin-top:var(--space-1)")}>{offer.availability}</div>
          </div>
          <div className="num" style={sx("font-size:var(--text-base);font-weight:var(--weight-medium);white-space:nowrap")}>{offer.price}</div>
        </div>
        <div style={sx("display:flex;align-items:center;padding:0 var(--space-1) var(--space-1)")}>
          <span style={sx("font-size:var(--text-sm);color:var(--text-accent)")}>{offer.kind === "service" ? "Explore service" : "View offer"} <span className="ms" style={sx("font-size:var(--text-sm);vertical-align:-2px")}>arrow_forward</span></span>
        </div>
      </div>
      </div>
      <div style={sx("grid-column:1 / -1;display:flex;justify-content:center;align-items:center;padding-top:var(--space-1)")}>
        <div className="offer-hero__dots" style={sx(`position:relative;display:flex;align-items:center;gap:var(--space-2);width:${Math.max(20, (offers.length - 1) * 14 + 20)}px;height:6px`)}>
          <span aria-hidden="true" style={sx(`position:absolute;z-index:2;top:-1px;left:0;width:20px;height:8px;border-radius:var(--radius-pill);background:var(--accent-active);pointer-events:none;transform:translateX(${offerIndex * 14}px);transition:transform 420ms cubic-bezier(0.22,1,0.36,1)`)} />
          {offers.map((item: Vals, index: number) => <button key={item.name} aria-label={`Show ${item.label}`} aria-current={index === offerIndex} onClick={() => showOffer(index)} style={sx(`position:relative;z-index:1;width:6px;height:6px;flex:0 0 6px;padding:0;border:0;border-radius:var(--radius-pill);background:${index === offerIndex ? "transparent" : "var(--gray-500)"};cursor:pointer`)} />)}
        </div>
      </div>
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
      <div style={sx("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-4)")}>
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
      <div style={sx("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-4)")}>
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
      <div style={sx("display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--space-4)")}>
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

    <section style={sx("display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:var(--space-4);align-items:stretch")}>
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
        <div style={sx("display:flex;align-items:flex-start;gap:var(--space-3)")}><span className="ms" style={sx("color:var(--success);font-size:var(--text-base)")}>inventory_2</span><span style={sx("font-size:var(--text-sm);line-height:var(--leading-normal)")}>Stock and delivery details come from the local catalog.</span></div>
        <div style={sx("display:flex;align-items:flex-start;gap:var(--space-3)")}><span className="ms" style={sx("color:var(--success);font-size:var(--text-base)")}>photo_library</span><span style={sx("font-size:var(--text-sm);line-height:var(--leading-normal)")}>Product cards use the canonical generated product photography.</span></div>
      </div>
    </section>
  </div>
);
};
