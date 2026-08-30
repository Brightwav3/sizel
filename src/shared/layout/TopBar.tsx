import React from "react";
import type { Vals } from "../lib/types";
import { SearchBox } from "../../features/search/SearchBox";
import "../../features/product/reviews.css";
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

export const TopBar: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="topbar topbar-grid">
    <div className="topbar__logo" onClick={v.goHome}>
      <img src="/rigsmith-logo/rigsmith-logo.webp" alt="Rigsmith" />
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
