import React from "react";
import { sx, useHover, type Vals } from "../sx";

/** Category listing: crumb header, brand tiles, inline sorts and chips, product grid. */
export const CategoryScreen: React.FC<{ v: Vals }> = ({ v }) => v.departmentOverview ? <DepartmentOverview v={v} /> : (
  <div className="t-page" style={sx("padding:32px 36px 280px;display:flex;flex-direction:column;gap:20px")}>
    <div style={sx("display:flex;align-items:flex-end;gap:16px")}>
      <div>
        <div style={sx("font-size:12px;color:var(--text-tertiary);margin-bottom:4px")}>{v.crumb}</div>
        <div style={sx("font-size:24px;font-weight:500")}>{v.catName}</div>
        <div style={sx("font-size:13px;color:var(--text-secondary);margin-top:3px")}>{v.catSub} · {v.catBlurb}</div>
      </div>
      <div style={sx("flex:1")}></div>
      <div className="pill ghostb" onClick={v.goCompare} style={sx(`display:${v.compareShow}`)}><span className="ms" style={sx("font-size:14px;color:var(--text-secondary)")}>table_rows</span>Compare against my build</div>
    </div>
    <div style={sx(`display:${v.brandRowShow};flex-direction:column;gap:12px`)}>
      <div style={sx("display:flex;align-items:center;gap:10px")}>
        <div className="eyebrow">{v.subcatLabel}</div>
        <div style={sx("flex:1;height:1px;background:var(--border-strong)")}></div>
      </div>
      <div style={sx("display:flex;flex-wrap:wrap;gap:10px")}>
        {v.subcats.map((c: Vals, i: number) => (
          <div key={i} className="card prod" onClick={c.go} style={sx(`padding:10px 14px;display:flex;align-items:center;gap:10px;min-width:180px;background:${c.bg};border-color:${c.bd}`)}>
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

    <div style={sx("display:grid;grid-template-columns:repeat(auto-fill,minmax(224px,1fr));gap:var(--space-4)")}>
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
      <p style={sx("margin:var(--space-1) 0 0;color:var(--text-secondary);font-size:var(--text-sm)")}>{v.departmentCards.length} products across the whole department</p>
    </header>
    <div style={sx("display:grid;grid-template-columns:repeat(auto-fill,minmax(224px,1fr));gap:var(--space-4)")}>
      {v.departmentCards.map((product: Vals, index: number) => <ProductCard key={`${product.name}-${index}`} g={product} />)}
    </div>
  </div>
);

/** Listing card: state badge, one sentence, up to three chips, price, add action. */
export const ProductCard: React.FC<{ g: Vals }> = ({ g }) => {
  const add = useHover(`display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-width:0;height:52px;min-height:52px;padding:0 8px;text-align:center;white-space:nowrap;font-size:var(--text-xs);font-weight:var(--weight-medium);border-radius:var(--radius-nav);border:1px solid var(--border-default);background:${g.addBg};color:${g.addFg};cursor:pointer;transition:background 140ms ease`, "background:var(--surface-hover)");
  return (
    <div className="card prod" onClick={g.go} style={sx(`overflow:hidden;min-width:0;height:100%;border-radius:var(--radius-nav);border-color:${g.bd};display:flex;flex-direction:column`)}>
      <div style={sx("position:relative")}>
        <div className="ph" style={sx(`aspect-ratio:16 / 10;background:var(--surface-card);border:none;border-radius:0;border-bottom:1px solid var(--border-subtle);opacity:${g.dim}`)}>{g.image ? <img className="catalog-image" src={g.image} alt={g.name} /> : <span className="ms" style={sx("font-size:20px")}>image</span>}</div>
        <span style={sx(`display:${g.stateShow};position:absolute;top:8px;left:8px;align-items:center;font-size:12px;font-weight:500;letter-spacing:0.4px;text-transform:uppercase;padding:2px 8px;border-radius:var(--radius-xs);background:${g.stateBg};color:var(--text-inverse)`)}>{g.state}</span>
      </div>
      <div style={sx(`padding:12px;display:flex;flex-direction:column;gap:6px;flex:1;opacity:${g.dim}`)}>
        <div style={sx("display:flex;align-items:baseline;gap:6px")}>
          <div style={sx(`font-size:12px;font-weight:500;color:${g.tagFg};flex:1`)}>{g.tag}</div>
          <div style={sx("font-size:12px;color:var(--text-tertiary)")}>{g.brand}</div>
        </div>
        <div style={sx("font-size:13px;font-weight:500;line-height:1.35")}>{g.name}</div>
        <div style={sx("font-size:12px;color:var(--text-secondary);line-height:1.45")}>{g.desc}</div>
        <div style={sx("display:flex;flex-wrap:wrap;gap:4px")}>
          {g.specs.map((sp: string, i: number) => (
            <span key={i} style={sx("font-size:12px;padding:1px 7px;border-radius:4px;background:var(--surface-sunken);color:var(--text-secondary)")}>{sp}</span>
          ))}
        </div>
        <div style={sx("flex:1")}></div>
      </div>
      <div style={sx("display:grid;grid-template-columns:minmax(88px,.85fr) minmax(100px,1.15fr);gap:var(--space-1);padding:0 12px 12px;align-items:stretch")}>
        <div style={sx(`width:100%;height:52px;min-width:0;border:${g.pricePanelBorder};border-radius:var(--radius-nav);background:${g.pricePanelBg};overflow:hidden;display:flex;flex-direction:column;justify-content:center`)}>
          {g.priceKind !== "standard" && <div style={sx(`width:100%;padding:4px 8px;background:${g.priceHeaderBg};color:${g.priceHeaderFg};font-size:var(--text-xs);font-weight:var(--weight-medium);letter-spacing:0.45px;text-align:center;text-transform:uppercase;white-space:nowrap`)}>{g.priceHeader}</div>}
          <div className="num" style={sx(`padding:${g.priceKind === "standard" ? "0" : "5px 8px"};font-size:var(--text-2xl);font-weight:var(--weight-medium);color:${g.priceFg};text-align:center;white-space:nowrap;line-height:1`)}>{g.price}</div>
        </div>
        <div onClick={g.add} {...add}><span className="ms" style={sx("font-size:16px")}>shopping_bag</span>{g.cta}</div>
        <div style={sx(`grid-column:1 / -1;text-align:center;font-size:var(--text-xs);font-weight:var(--weight-medium);color:${g.stockFg};padding-top:2px`)}>{g.stock}</div>
      </div>
    </div>
  );
};
