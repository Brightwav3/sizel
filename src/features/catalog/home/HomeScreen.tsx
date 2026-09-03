import React from "react";
import type { Vals } from "../../../shared/lib/types";
import { DEMO_TOOL_NAMES, TOOLS } from "../../../app/webmcp/tools";
import "./home.css";

const CatalogImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => (
  src ? <img className="catalog-image" src={src} alt={alt} /> : <span className="ms catalog-image-fallback">image</span>
);

const showcasePrompt = `https://sizel.vercel.app/

Hello, I want you to build me a PC for around $1500 for my son so he can play his favourite games like Counter-Strike 2, League of Legends or Cyberpunk so make sure it runs them well. Also find me a good phone, compare all the flagship phones between themselves, by reviews and specs. If the best possible product is unavailable at this moment, create a watchdog. Do it in the Codex-in-app browser and use webmcp.

Its a fictional storefront, pretend its real.`;

const webmcpGroups = [
  { label: "Shop", icon: "storefront", tools: ["search_products", "get_product", "get_reviews", "compare_products", "show_in_catalog"] },
  { label: "Build", icon: "construction", tools: ["begin_build", "list_compatible_parts", "set_build_components", "check_build_compatibility"] },
  { label: "Performance", icon: "speed", tools: ["estimate_performance", "compare_build_options"] },
  { label: "Cart and alerts", icon: "shopping_cart", tools: ["create_watchdog", "add_to_cart", "add_build_to_cart", "get_cart"] },
] as const;

/** The shop front: a catalog-led electronics store with the builder as its differentiator. */
export const HomeScreen: React.FC<{ v: Vals }> = ({ v }) => {
  const offers = v.promotions || [];
  const [offerIndex, setOfferIndex] = React.useState(0);
  const [promptCopied, setPromptCopied] = React.useState(false);
  const offerIndexRef = React.useRef(0);
  const promptCopiedTimer = React.useRef<number | null>(null);
  const webmcpDialog = React.useRef<HTMLDialogElement>(null);
  const webmcpTools = TOOLS.filter(tool => (DEMO_TOOL_NAMES as readonly string[]).includes(tool.name));

  const copyShowcasePrompt = React.useCallback(async () => {
    if (!navigator.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(showcasePrompt);
      setPromptCopied(true);
      if (promptCopiedTimer.current !== null) window.clearTimeout(promptCopiedTimer.current);
      promptCopiedTimer.current = window.setTimeout(() => setPromptCopied(false), 2200);
    } catch {
      setPromptCopied(false);
    }
  }, []);

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

  React.useEffect(() => () => {
    if (promptCopiedTimer.current !== null) window.clearTimeout(promptCopiedTimer.current);
  }, []);

  const offer = offers[offerIndex % Math.max(offers.length, 1)] || v.heroProduct;

  return (
  <div className="t-page home-page">
    <div className="home-lead">
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
        <button type="button" className="hero-rail__promise hero-rail__promise--tools" onClick={() => webmcpDialog.current?.showModal()} aria-haspopup="dialog">
          <span className="ms">terminal</span>
          <span><strong>WebMCP tools</strong><small>{webmcpTools.length} tools</small></span>
        </button>
      </aside>
      </section>
    </div>

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

    <dialog ref={webmcpDialog} className="webmcp-dialog" aria-labelledby="webmcp-dialog-title" onClick={event => { if (event.target === event.currentTarget) webmcpDialog.current?.close(); }}>
      <div className="webmcp-dialog__content">
        <button type="button" className="webmcp-dialog__close" aria-label="Close WebMCP tools" onClick={() => webmcpDialog.current?.close()}><span className="ms">close</span></button>
        <div className="webmcp-dialog__kicker"><span className="eyebrow">Agent access</span><span className="webmcp-dialog__live"><i />Stable demo registry</span></div>
        <div className="webmcp-dialog__heading">
          <div>
            <h2 id="webmcp-dialog-title">A direct line into the shop</h2>
            <p className="webmcp-dialog__intro">WebMCP gives an AI agent structured tools to search the catalog, build a PC, compare options and update the cart.</p>
          </div>
          <div className="webmcp-dialog__count"><strong className="num">{webmcpTools.length}</strong><span>tools exposed</span></div>
        </div>
        <div className="webmcp-dialog__showcase">
          <div className="webmcp-dialog__showcase-head">
            <div className="webmcp-dialog__showcase-title"><span className="eyebrow">Showcase</span><strong>Try a complete shopping brief</strong><span>Copy this into the in-app agent.</span></div>
          </div>
          <div className="webmcp-dialog__showcase-code">
            <button type="button" className={`webmcp-dialog__copy ${promptCopied ? "is-copied" : ""}`} aria-label={promptCopied ? "Prompt copied" : "Copy prompt"} title={promptCopied ? "Prompt copied" : "Copy prompt"} onClick={copyShowcasePrompt}>
              <span className="ms" aria-hidden="true">{promptCopied ? "check" : "content_copy"}</span>
            </button>
            <pre><code>{showcasePrompt}</code></pre>
          </div>
        </div>
        <div className="webmcp-dialog__status"><span className="webmcp-dialog__status-dot" /><span>Available when WebMCP is enabled</span><span className="num">{webmcpTools.length} stable tools</span></div>
        <div className="webmcp-dialog__groups">
          {webmcpGroups.map(group => {
            const tools = group.tools.map(name => webmcpTools.find(tool => tool.name === name)).filter(tool => tool !== undefined);
            return <section className="webmcp-dialog__group" key={group.label} aria-labelledby={`webmcp-group-${group.label.replaceAll(" ", "-").toLowerCase()}`}>
              <div className="webmcp-dialog__group-head"><span className="webmcp-dialog__group-icon ms">{group.icon}</span><h3 id={`webmcp-group-${group.label.replaceAll(" ", "-").toLowerCase()}`}>{group.label}</h3><span className="num">{tools.length}</span></div>
              <div className="webmcp-dialog__list">
                {tools.map(tool => <div className="webmcp-dialog__tool" key={tool.name}>
                  <span className="webmcp-dialog__tool-icon ms">{tool.readOnlyHint ? "visibility" : "bolt"}</span>
                  <div><code>{tool.name}</code><p>{tool.description}</p></div>
                  <span className="webmcp-dialog__badge">{tool.readOnlyHint ? "Read only" : "Action"}</span>
                </div>)}
              </div>
            </section>;
          })}
        </div>
        <p className="webmcp-dialog__note"><span className="ms">verified</span> The agent can only use the actions exposed by this shop. Simulation results are labeled and are not measured hardware tests.</p>
      </div>
    </dialog>
  </div>
  );
};
