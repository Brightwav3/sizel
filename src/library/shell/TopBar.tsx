import React from "react";
import { createPortal } from "react-dom";
import type { Vals } from "../types";
import "../reviews.css";
import "./topbar.css";

/** Frosted 56px bar, spanning sidebar and workspace both. */
const WatchBell: React.FC<{ v: Vals }> = ({ v }) => {
  const [open, setOpen] = React.useState(false);
  const holder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => { if (!holder.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const alerts = v.watchItems.filter((item: Vals) => item.hit).length;
  return (
    <div ref={holder} className="watchbell" data-alerts={alerts > 0}>
      <button type="button" className="watchbell__button" aria-label="Watchdog" data-tip="Watchdog: price and stock alerts" data-tip-align="end" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span className="ms">{"sound_detection_dog_barking"}</span>
        {v.watchCount > 0 && <span className="num watchbell__count">{v.watchCount}</span>}
      </button>
      {open && (
        <div className="watch-panel">
          <h3>Watchdog</h3>
          <p>{v.watchCount ? "We will flag these here when something changes." : "Watch a product and any change shows up here. Nothing leaves this device."}</p>
          {v.watchItems.map((item: Vals) => (
            <div key={item.id} className="watch-item">
              <span className="watch-item__image">{item.image ? <img src={item.image} alt="" /> : <span className="ms">image</span>}</span>
              <span className="watch-item__copy">
                <button type="button" onClick={() => { setOpen(false); item.open(); }}>{item.name}</button>
                <small data-hit={Boolean(item.hit)}>{item.note}</small>
              </span>
              <button type="button" className="watch-item__drop" aria-label="Stop watching" data-tip="Stop watching" data-tip-align="end" onClick={item.drop}><span className="ms">close</span></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchBox: React.FC<{ v: Vals }> = ({ v }) => {
  const [open, setOpen] = React.useState(false);
  const holder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  const search = (query: string) => {
    v.runSearch(query);
    setOpen(false);
  };

  return (
    <>
      {open && createPortal(
        <button type="button" className="search-page-scrim" aria-label="Close search suggestions" onClick={() => setOpen(false)} />,
        document.body,
      )}
      {open && <button type="button" className="search-scrim" aria-label="Close search suggestions" onClick={() => setOpen(false)} />}
      <div ref={holder} className={`topbar-search-wrap ${open ? "is-open" : ""}`}>
        <div className="topbar-search">
          <span className="ms">search</span>
          <input
            aria-label="Search products"
            aria-expanded={open}
            aria-controls="search-flyout"
            value={v.searchValue}
            onChange={v.searchChange}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={(event) => { if (event.key === "Enter") search(v.searchValue); }}
            placeholder="Search parts, brands, or builds"
          />
          {v.searchValue && <button type="button" className="topbar-search__clear" aria-label="Clear search" onClick={() => v.searchChange({ target: { value: "" } })}><span className="ms">close</span></button>}
        </div>

        {open && (
          <section id="search-flyout" className="search-flyout" aria-label="Search suggestions">
            <div className="search-flyout__section">
              <span className="eyebrow">Recent searches</span>
              <div className="search-recent" role="list">
                {v.recentSearches.map((query: string) => (
                  <button key={query} type="button" role="listitem" onClick={() => search(query)}>
                    <span className="ms">history</span>{query}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-flyout__section search-flyout__section--products">
              <span className="eyebrow">Recommended products</span>
              <div className="search-products">
                {v.searchRecommendations.map((product: Vals) => (
                  <button key={`${product.id}-${product.name}`} type="button" onClick={() => { setOpen(false); product.go(); }}>
                    <span>{product.image ? <img src={product.image} alt="" /> : <span className="ms">image</span>}</span>
                    <strong>{product.name}</strong>
                    <span className="ms">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export const TopBar: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="topbar topbar-grid">
    <div className="topbar__logo" onClick={v.goHome}>
      <img src="/rigsmith-logo/rigsmith-logo.png" alt="Rigsmith" />
    </div>
    <SearchBox v={v} />
    <div className="topbar-actions">
      <WatchBell v={v} />
      <div className="topbar__action topbar__action--icon" data-tip="Your account" role="button" tabIndex={0}>
        <span className="ms">account_circle</span>
      </div>
      <div className="topbar__action topbar__action--icon" data-tip="Language and currency" role="button" tabIndex={0}>
        <span className="topbar__flag" role="img" aria-label="United States" />
      </div>
      <div className="topbar__action topbar__action--cart" onClick={v.goCart} data-tip="Your cart" data-tip-align="end" role="button" tabIndex={0}>
        <span className="ms">shopping_bag</span>
        <span
          className="num topbar__cart-count"
          style={{ "--cart-dot-bg": v.cartDotBg, "--cart-dot-fg": v.cartDotFg } as React.CSSProperties}
        >{v.cartCount}</span>
      </div>
    </div>
  </div>
);
