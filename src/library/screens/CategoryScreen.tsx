import React from "react";
import { sx, useHover, type Vals } from "../sx";
import { RatingLine } from "../shell/Stars";

/** Category listing: crumb header, brand tiles, inline sorts and chips, product grid. */
export const CategoryScreen: React.FC<{ v: Vals }> = ({ v }) => v.departmentOverview ? <DepartmentOverview v={v} /> : (
  <div className="t-page" style={sx("padding:20px 24px 96px;display:flex;flex-direction:column;gap:14px")}>
    <div style={sx("display:flex;align-items:flex-end;gap:16px")}>
      <div>
        <nav aria-label="Breadcrumb" style={sx("display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:12px;color:var(--text-tertiary)")}>
          {v.crumbs.map((crumb: Vals, index: number) => <React.Fragment key={crumb.label}>
            {index > 0 && <span aria-hidden="true">/</span>}
            <button type="button" onClick={crumb.go} aria-current={crumb.current ? "page" : undefined} style={sx(`padding:0;color:${crumb.current ? "var(--text-primary)" : "var(--text-tertiary)"};background:transparent;border:0;font:inherit;cursor:pointer;text-decoration:${crumb.current ? "none" : "underline"};text-underline-offset:3px`)}>{crumb.label}</button>
          </React.Fragment>)}
        </nav>
        <div style={sx("font-size:20px;font-weight:500")}>{v.catName}</div>
        <div style={sx("font-size:13px;color:var(--text-secondary);margin-top:3px")}>{v.catSub}</div>
      </div>
      <div style={sx("flex:1")}></div>
    </div>
    <div style={sx(`display:${v.brandRowShow};flex-direction:column;gap:8px`)}>
      <div style={sx("display:flex;align-items:center;gap:10px")}>
        <div className="eyebrow">{v.subcatLabel}</div>
        <div style={sx("flex:1;height:1px;background:var(--border-strong)")}></div>
      </div>
      <div style={sx("display:flex;flex-wrap:wrap;gap:8px")}>
        {v.subcats.map((c: Vals, i: number) => (
          <div key={i} className="card prod" onClick={c.go} style={sx(`padding:8px 12px;display:flex;align-items:center;gap:8px;min-width:156px;background:${c.bg};border-color:${c.bd}`)}>
            <img src={c.logo} alt={`${c.name} logo`} className="brand-tile-logo" />
            <div style={sx("display:flex;flex-direction:column;gap:1px")}>
              <div style={sx(`font-size:13px;font-weight:500;color:${c.fg}`)}>{c.name}</div>
              <div className="num" style={sx("font-size:12px;color:var(--text-tertiary)")}>{c.count} products</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div style={sx(`display:${v.brandBackShow};align-items:center;gap:8px`)}>
      <span onClick={v.brandClear} style={sx("display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--text-accent);cursor:pointer")}><span className="ms" style={sx("font-size:14px")}>arrow_back</span>All brands in {v.catNameLower}</span>
    </div>

    <div style={sx("display:flex;align-items:center;gap:10px")}>
      <div className="eyebrow">{v.gridLabel}</div>
      <div style={sx("flex:1;height:1px;background:var(--border-strong)")}></div>
      <div className="num" style={sx("font-size:12px;color:var(--text-tertiary)")}>{v.catSub}</div>
    </div>

    <div style={sx("display:flex;align-items:center;gap:8px;flex-wrap:wrap")}>
      <div style={sx("display:flex;gap:3px;padding:3px;background:var(--gray-100);border-radius:99px")}>
        {v.inlineSorts.map((o: Vals, i: number) => (
          <div key={i} onClick={o.go} style={sx(`font-size:13px;padding:5px 13px;border-radius:99px;cursor:pointer;background:${o.bg};color:${o.fg};font-weight:${o.fw};box-shadow:${o.sh};transition:background 200ms var(--page-slide-ease),color 200ms var(--page-slide-ease)`)}>{o.label}</div>
        ))}
      </div>
      <div style={sx("width:1px;height:24px;background:var(--border-strong)")}></div>
      {v.inlineChips.map((c: Vals, i: number) => (
        <div key={i} onClick={c.go} style={sx(`display:flex;align-items:center;gap:6px;font-size:13px;font-weight:${c.fw};padding:6px 13px;border-radius:99px;cursor:pointer;background:${c.bg};color:${c.fg};border:1px solid ${c.bd};transition:background 140ms ease,border-color 140ms ease`)}>
          <span className="ms" style={sx(`font-size:14px;display:${c.iconShow}`)}>{c.icon}</span>{c.label}
        </div>
      ))}
      <div style={sx("flex:1")}></div>
      {v.anyFilter && (
        <span onClick={v.clearFilters} style={sx("font-size:13px;color:var(--text-accent);cursor:pointer")}>Clear filters</span>
      )}
    </div>

    <div className="catalog-grid">
      {v.gpuCards.map((g: Vals, i: number) => <ProductCard key={i} g={g} />)}
    </div>
    {v.hiddenNote && (
      <div className="card" style={sx("background:var(--gray-50);padding:14px 16px;display:flex;align-items:center;gap:12px")}>
        <span className="ms" style={sx("font-size:20px;color:var(--text-tertiary)")}>visibility_off</span>
        <div style={sx("font-size:13px;color:var(--text-secondary)")}>{v.hiddenNote}</div>
        <div style={sx("flex:1")}></div>
        <span onClick={v.clearFilters} style={sx("font-size:13px;color:var(--text-accent);cursor:pointer")}>Clear filters</span>
      </div>
    )}
  </div>
);

const DepartmentOverview: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page" style={sx("padding:32px 36px 160px;display:flex;flex-direction:column;gap:var(--space-8)")}>
    <header>
      <div className="eyebrow">Department</div>
      <h1 style={sx("margin:var(--space-1) 0 0;font-size:var(--text-2xl);font-weight:var(--weight-medium)")}>{v.deptName}</h1>
    </header>
    <div className="catalog-grid">
      {v.departmentCards.map((product: Vals, index: number) => <ProductCard key={`${product.name}-${index}`} g={product} />)}
    </div>
  </div>
);

/** Listing card: state badge, one sentence, up to three chips, price, add action. */
export const ProductCard: React.FC<{ g: Vals }> = ({ g }) => {
  const add = useHover(`display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-width:0;height:44px;min-height:44px;padding:0 8px;text-align:center;white-space:nowrap;font-size:var(--text-xs);font-weight:var(--weight-medium);border-radius:var(--radius-nav);border:1px solid var(--border-default);background:${g.addBg};color:${g.addFg};cursor:pointer;transition:background 140ms ease`, "background:var(--surface-hover)");
  return (
    <div className="card prod" onClick={g.go} style={sx(`overflow:hidden;min-width:0;height:100%;border-radius:var(--radius-nav);border-color:${g.bd};display:flex;flex-direction:column`)}>
      <div style={sx("position:relative")}>
        <div className="ph" style={sx(`aspect-ratio:16 / 10;background:var(--surface-card);border:none;border-radius:0;border-bottom:1px solid var(--border-subtle);opacity:${g.dim}`)}>{g.image ? <img className="catalog-image" src={g.image} alt={g.name} /> : <span className="ms" style={sx("font-size:20px")}>image</span>}</div>
        <span style={sx(`display:${g.stateShow};position:absolute;top:8px;left:8px;align-items:center;font-size:12px;font-weight:500;letter-spacing:0.4px;text-transform:uppercase;padding:2px 8px;border-radius:var(--radius-xs);background:${g.stateBg};color:var(--text-inverse)`)}>{g.state}</span>
      </div>
      <div style={sx(`padding:10px;display:flex;flex-direction:column;gap:4px;flex:1;opacity:${g.dim}`)}>
        <div style={sx("display:flex;align-items:center;gap:6px;min-height:16px")}>
          <RatingLine average={g.rating.average} count={g.rating.count} size={13} />
          <span style={sx("flex:1")}></span>
          <button type="button" aria-label={g.watched ? "Stop the watchdog" : "Set a watchdog"} data-tip={g.watched ? "Stop watching this product" : "Watch for price and stock changes"} data-tip-align="end" aria-pressed={g.watched}
            onClick={(event) => { event.stopPropagation(); g.watch(); }}
            style={sx(`display:inline-flex;padding:0;background:transparent;border:0;cursor:pointer;color:${g.watched ? "var(--accent-active)" : "var(--text-tertiary)"}`)}>
            <span className="ms" style={sx("font-size:16px")}>{"sound_detection_dog_barking"}</span>
          </button>
        </div>
        <div style={sx("font-size:13px;font-weight:500;line-height:1.35")}>{g.name}</div>
        {g.inBuild && <div style={sx("font-size:11px;font-weight:500;color:var(--accent-active)")}>In your build</div>}
        <div style={sx("font-size:12px;color:var(--text-secondary);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden")}>{g.desc}</div>
        <div style={sx("display:flex;flex-wrap:wrap;gap:4px")}>
          {g.specs.map((sp: string, i: number) => (
            <span key={i} style={sx("font-size:12px;padding:1px 7px;border-radius:4px;background:var(--surface-sunken);color:var(--text-secondary)")}>{sp}</span>
          ))}
        </div>
        <div style={sx("flex:1")}></div>
      </div>
      <div style={sx("display:grid;grid-template-columns:minmax(88px,1fr) minmax(84px,1fr);gap:var(--space-1);padding:0 10px 10px;align-items:stretch")}>
        <div style={sx(`width:100%;height:44px;min-width:0;border:${g.pricePanelBorder};border-radius:var(--radius-nav);background:${g.pricePanelBg};overflow:hidden;display:flex;flex-direction:column;align-items:stretch;font-variant-numeric:tabular-nums`)}>
          {g.priceKind !== "standard" && <div style={sx(`display:flex;align-items:center;justify-content:center;width:100%;height:18px;min-height:18px;padding:0 6px;background:${g.priceHeaderBg};color:${g.priceHeaderFg};font-size:var(--text-xs);font-weight:var(--weight-medium);line-height:1;letter-spacing:0.35px;text-align:center;text-transform:uppercase;white-space:nowrap`)}>{g.priceHeader}</div>}
          <div className="num" style={sx(`display:flex;align-items:center;justify-content:center;flex:1;min-height:0;width:100%;padding:0 6px;font-size:19px;font-weight:var(--weight-medium);color:${g.priceFg};text-align:center;white-space:nowrap;line-height:1`)}>{g.price}</div>
        </div>
        <div onClick={g.add} {...add}><span className="ms" style={sx("font-size:16px")}>shopping_bag</span>{g.cta}</div>
        <div style={sx(`grid-column:1 / -1;text-align:center;font-size:var(--text-xs);font-weight:var(--weight-medium);color:${g.stockFg};padding-top:2px`)}>{g.stock}</div>
      </div>
    </div>
  );
};
