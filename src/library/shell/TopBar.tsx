import React from "react";
import { sx, useHover, type Vals } from "../sx";

/** Frosted 56px bar, spanning sidebar and workspace both. */
export const TopBar: React.FC<{ v: Vals }> = ({ v }) => {
  const saved = useHover("position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  const account = useHover("display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  const flag = useHover("display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  const cart = useHover("display:flex;align-items:center;gap:6px;height:36px;padding:0 10px;border-radius:8px;cursor:pointer;transition:background 140ms ease", "background:var(--surface-hover)");
  return (
    <div style={sx("position:sticky;top:0;z-index:20;height:56px;display:grid;grid-template-columns:minmax(160px,1fr) minmax(280px,420px) minmax(160px,1fr);align-items:center;gap:16px;padding:0 20px;background:rgba(255,255,255,0.72);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--border-subtle)")}>
      <div onClick={v.goHome} style={sx("display:flex;align-items:center;gap:9px;cursor:pointer;width:auto") }>
        <img src="/rigsmith-logo/rigsmith-logo.png" alt="Rigsmith" style={sx("display:block;width:96px;height:auto;object-fit:contain")} />
      </div>
      <div style={sx("grid-column:2;display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;height:36px;padding:0 12px;border:1px solid var(--border-default);border-radius:8px;background:#fff;color:var(--text-tertiary);font-size:13px")}>
        <span className="ms" style={sx("font-size:14px")}>search</span>
        <input aria-label="Search products" value={v.searchValue} onChange={v.searchChange} placeholder="Search parts, brands, or builds" style={sx("border:0;outline:0;background:transparent;color:var(--text-primary);font:inherit;min-width:0;width:100%;padding:0")} />
      </div>
      <div style={sx("grid-column:3;justify-self:end;display:flex;align-items:center;gap:4px")}>
        <div {...saved}>
          <span className="ms" style={sx("font-size:20px;color:var(--text-secondary)")}>favorite</span>
          <span className="num" style={sx("position:absolute;top:1px;right:1px;font-size:12px;font-weight:500;min-width:15px;height:15px;border-radius:99px;background:var(--gray-900);color:#fff;display:flex;align-items:center;justify-content:center;padding:0 4px")}>{v.savedCount}</span>
        </div>
        <div {...account}>
          <span className="ms" style={sx("font-size:20px;color:var(--text-secondary)")}>account_circle</span>
        </div>
        <div {...flag}>
          <span style={sx("width:20px;height:14px;border-radius:2px;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--border-subtle)")}>
            <span style={sx("flex:1;background:#fff")}></span>
            <span style={sx("flex:1;background:#2C6EF5")}></span>
            <span style={sx("flex:1;background:#DC3B3B")}></span>
          </span>
        </div>
        <div onClick={v.goCart} {...cart}>
          <span className="ms" style={sx("font-size:20px;color:var(--text-secondary)")}>shopping_bag</span>
          <span className="num" style={sx(`font-size:12px;font-weight:500;min-width:16px;height:16px;padding:0 5px;border-radius:99px;background:${v.cartDotBg};color:${v.cartDotFg};display:inline-flex;align-items:center;justify-content:center`)}>{v.cartCount}</span>
        </div>
      </div>
    </div>
  );
};
