import React from "react";
import { sx, useHover, type Vals } from "../sx";
import "../reviews.css";

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
    <div ref={holder} style={sx("position:relative;display:flex;align-items:center")}>
      <button type="button" aria-label="Watchdog" data-tip="Watchdog: price and stock alerts" data-tip-align="end" aria-expanded={open} onClick={() => setOpen(value => !value)}
        style={sx("position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;background:transparent;border:0;border-radius:8px;cursor:pointer")}>
        <span className="ms" style={sx(`font-size:20px;color:${alerts ? "var(--accent-active)" : "var(--text-secondary)"}`)}>{"sound_detection_dog_barking"}</span>
        {v.watchCount > 0 && (
          <span className="num" style={sx(`position:absolute;top:1px;right:1px;font-size:12px;font-weight:500;min-width:15px;height:15px;border-radius:99px;background:${alerts ? "var(--accent-active)" : "var(--gray-900)"};color:#fff;display:flex;align-items:center;justify-content:center;padding:0 4px`)}>{v.watchCount}</span>
        )}
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
                <small style={sx(item.hit ? "color:var(--green-600)" : "")}>{item.note}</small>
              </span>
              <button type="button" className="watch-item__drop" aria-label="Stop watching" data-tip="Stop watching" data-tip-align="end" onClick={item.drop}><span className="ms">close</span></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TopBar: React.FC<{ v: Vals }> = ({ v }) => {
  const saved = useHover("position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  const account = useHover("display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  const flag = useHover("display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  const cart = useHover("display:flex;align-items:center;gap:6px;height:36px;padding:0 10px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  return (
    <div className="topbar-grid" style={sx("position:sticky;top:0;z-index:20;min-height:56px;align-items:center;gap:16px;padding:0 20px;background:rgba(255,255,255,0.72);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--border-subtle)")}>
      <div onClick={v.goHome} style={sx("display:flex;align-items:center;gap:9px;cursor:pointer;width:auto") }>
        <img src="/rigsmith-logo/rigsmith-logo.png" alt="Rigsmith" style={sx("display:block;width:96px;height:auto;object-fit:contain")} />
      </div>
      <div className="topbar-search" style={sx("display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;height:36px;padding:0 12px;border:1px solid var(--border-default);border-radius:8px;background:#fff;color:var(--text-tertiary);font-size:13px")}>
        <span className="ms" style={sx("font-size:14px")}>search</span>
        <input aria-label="Search products" value={v.searchValue} onChange={v.searchChange} placeholder="Search parts, brands, or builds" style={sx("border:0;outline:0;background:transparent;color:var(--text-primary);font:inherit;min-width:0;width:100%;padding:0")} />
      </div>
      <div style={sx("grid-column:3;justify-self:end;display:flex;align-items:center;gap:4px")}>
        <WatchBell v={v} />
        <div {...account} data-tip="Your account" role="button" tabIndex={0}>
          <span className="ms" style={sx("font-size:20px;color:var(--text-secondary)")}>account_circle</span>
        </div>
        <div {...flag} data-tip="Language and currency" role="button" tabIndex={0}>
          <span style={sx("width:20px;height:14px;border-radius:2px;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--border-subtle)")}>
            <span style={sx("flex:1;background:#fff")}></span>
            <span style={sx("flex:1;background:#2C6EF5")}></span>
            <span style={sx("flex:1;background:#DC3B3B")}></span>
          </span>
        </div>
        <div onClick={v.goCart} {...cart} data-tip="Your cart" data-tip-align="end" role="button" tabIndex={0}>
          <span className="ms" style={sx("font-size:20px;color:var(--text-secondary)")}>shopping_bag</span>
          <span className="num" style={sx(`font-size:12px;font-weight:500;min-width:16px;height:16px;padding:0 5px;border-radius:99px;background:${v.cartDotBg};color:${v.cartDotFg};display:inline-flex;align-items:center;justify-content:center`)}>{v.cartCount}</span>
        </div>
      </div>
    </div>
  );
};
