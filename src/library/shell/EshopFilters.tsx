import React from "react";
import { sx, type Vals } from "../sx";
import "../sidebar.css";

/** Compact, collapsible filter groups keep the listing sidebar usable at every viewport height. */
export const FilterPanel: React.FC<{ v: Vals }> = ({ v }) => {
  const [open, setOpen] = React.useState({ use: false, price: true, brand: false, sort: false, options: true, fit: true, specs: true });
  const toggle = (group: keyof typeof open) => setOpen(current => ({ ...current, [group]: !current[group] }));

  return (
    <div className="t-panel-slide t-panel-collapse" data-open={v.filtersOpen} style={sx("display:flex;flex-direction:column;gap:10px;flex-shrink:0")}>
      <div style={sx("margin:0 -16px;height:1px;background:var(--border-strong)")}></div>
      <div className="sidebar-section-heading" style={sx("padding:0 10px;display:flex;align-items:baseline;gap:8px")}>
        <div className="eyebrow">Filter results</div>
        <span style={sx("flex:1")}></span>
        {v.anyFilter && <button className="sidebar-clear" onClick={v.clearFilters}>Clear all</button>}
      </div>

      <FilterGroup label="Good for" open={open.use} onToggle={() => toggle("use")} display={v.gpuFilterDisplay}>
        {v.useFilters.map((f: Vals, i: number) => <Check key={i} label={f.label} mark={f.mark} bg={f.bg} bd={f.bd} onClick={f.go} />)}
      </FilterGroup>

      <FilterGroup label="Price" open={open.price} onToggle={() => toggle("price")}>
        <div style={sx("display:flex;flex-direction:column;gap:7px;padding:0 10px var(--space-3)")}>
          <div style={sx("display:flex;justify-content:space-between;font-size:var(--text-sm)")}><span style={sx("color:var(--text-secondary)")}>Price range</span><span className="num" style={sx("font-weight:var(--weight-medium)")}>{v.minPriceLabel} – {v.maxPriceLabel}</span></div>
          <RangeSlider min={0} max={2200} step={20} lower={v.minPrice} upper={v.maxPrice} onLowerChange={v.setMinPrice} onUpperChange={v.setMaxPrice} />
        </div>
      </FilterGroup>

      <FilterGroup label="Brand" open={open.brand} onToggle={() => toggle("brand")}>
        <div style={sx("display:flex;flex-direction:column;gap:8px;padding:0 10px var(--space-3)")}>
          {v.brandFilters.map((b: Vals, i: number) => <Check key={i} label={b.label} meta={b.count} mark={b.mark} bg={b.bg} bd={b.bd} onClick={b.go} />)}
        </div>
      </FilterGroup>

      <FilterGroup label="Sort by" open={open.sort} onToggle={() => toggle("sort")}>
        <div style={sx("display:flex;flex-direction:column;gap:2px;padding:0 10px var(--space-3)")}>
          {v.sortOptions.map((o: Vals, i: number) => <div key={i} onClick={o.go} style={sx(`font-size:var(--text-sm);padding:6px 8px;border-radius:var(--radius-nav);cursor:pointer;background:${o.bg};color:${o.fg};font-weight:${o.fw};transition:background 140ms ease`)}>{o.label}</div>)}
        </div>
      </FilterGroup>

      <FilterGroup label="Availability" open={open.options} onToggle={() => toggle("options")}>
        <div style={sx("display:flex;flex-direction:column;gap:12px;padding:0 10px var(--space-3)")}>
          <ToggleRow label="In stock only" onClick={v.toggleStock} bg={v.stockBg} x={v.stockX} />
        </div>
      </FilterGroup>

      <FilterGroup label="Fit" open={open.fit} onToggle={() => toggle("fit")} display={v.fitFilterDisplay}>
        <div style={sx("display:flex;flex-direction:column;gap:var(--space-2);padding:0 10px var(--space-3)")}>
          {v.fitFilters.map((facet: Vals) => <FacetBlock key={facet.id} facet={facet} />)}
        </div>
      </FilterGroup>

      <FilterGroup label="Technical specifications" open={open.specs} onToggle={() => toggle("specs")} display={v.specFilterDisplay}>
        <div style={sx("display:flex;flex-direction:column;gap:var(--space-2);padding:0 10px var(--space-3)")}>
          {v.specFilters.map((facet: Vals) => <FacetBlock key={facet.id} facet={facet} />)}
        </div>
      </FilterGroup>
    </div>
  );
};

const FilterGroup: React.FC<{ label: string; open: boolean; onToggle(): void; children: React.ReactNode; detail?: string; display?: string }> = ({ label, open, onToggle, children, detail, display }) => (
  <div style={sx(`display:${display === "none" ? "none" : "flex"};flex-direction:column;border-top:1px solid var(--border-subtle)`)}>
    <button onClick={onToggle} aria-expanded={open} style={sx("display:flex;align-items:center;gap:var(--space-2);width:100%;padding:var(--space-3) var(--space-2) var(--space-2);border:0;background:transparent;color:var(--text-primary);font:inherit;font-size:var(--text-sm);text-align:left;cursor:pointer")}>
      <span style={sx("font-weight:var(--weight-medium)")}>{label}</span>
      {detail && <span style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>{detail}</span>}
      <span style={sx("flex:1")}></span>
      <span className="ms" style={sx(`font-size:var(--text-base);color:var(--text-tertiary);transform:rotate(${open ? "180deg" : "0deg"});transition:transform 180ms ease`)}>expand_more</span>
    </button>
    {open && children}
  </div>
);

const RangeSlider: React.FC<{ min: number; max: number; step: number; lower: number; upper: number; onLowerChange(e: React.ChangeEvent<HTMLInputElement>): void; onUpperChange(e: React.ChangeEvent<HTMLInputElement>): void }> = ({ min, max, step, lower, upper, onLowerChange, onUpperChange }) => {
  const lowerPercent = ((lower - min) / (max - min)) * 100;
  const upperPercent = ((upper - min) / (max - min)) * 100;
  return (
    <div className="range-slider" aria-label="Price range">
      <div className="range-slider__track" />
      <div className="range-slider__fill" style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }} />
      <input aria-label="Minimum price" type="range" min={min} max={max} step={step} value={lower} onChange={onLowerChange} style={{ zIndex: lower === upper ? 5 : 3 }} />
      <input aria-label="Maximum price" type="range" min={min} max={max} step={step} value={upper} onChange={onUpperChange} style={{ zIndex: 4 }} />
    </div>
  );
};

const Check: React.FC<{ label: string; meta?: string; mark?: string; bg: string; bd: string; onClick(): void }> = ({ label, meta, mark, bg, bd, onClick }) => (
  <div onClick={onClick} style={sx("display:flex;gap:var(--space-2);align-items:center;font-size:var(--text-sm);color:var(--text-secondary);cursor:pointer")}>
    <span className="ms" style={sx(`width:15px;height:15px;border-radius:var(--radius-xs);font-size:var(--text-xs);display:inline-flex;align-items:center;justify-content:center;background:${bg};border:1px solid ${bd};color:var(--text-inverse);transition:background 140ms ease`)}>{mark}</span>
    <span style={sx("flex:1")}>{label}</span>
    {meta && <span className="num" style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>{meta}</span>}
  </div>
);

const ToggleRow: React.FC<{ label: string; onClick(): void; bg: string; x: string; display?: string }> = ({ label, onClick, bg, x, display }) => (
  <div style={sx(`display:${display || "flex"};align-items:center;justify-content:space-between;font-size:var(--text-sm)`)}>
    <span style={sx("color:var(--text-secondary)")}>{label}</span>
    <span role="switch" aria-label={label} onClick={onClick} style={sx(`width:34px;height:20px;border-radius:var(--radius-pill);background:${bg};position:relative;display:inline-block;cursor:pointer;transition:background 140ms ease`)}><span style={sx(`position:absolute;top:2px;left:${x};width:16px;height:16px;border-radius:var(--radius-pill);background:var(--gray-0);transition:left 160ms var(--page-slide-ease)`)}></span></span>
  </div>
);

const FacetBlock: React.FC<{ facet: Vals }> = ({ facet }) => {
  const [expanded, setExpanded] = React.useState(false);
  const selected = facet.options.filter((option: Vals) => option.mark);
  const visible = expanded ? facet.options : Array.from(new Map([...facet.options.slice(0, 4), ...selected].map((option: Vals) => [option.label, option])).values());
  return (
    <div style={sx("padding:var(--space-2) 0 var(--space-3);border-bottom:1px solid var(--border-subtle)")}>
      <div style={sx("display:flex;align-items:baseline;gap:var(--space-2);padding-bottom:var(--space-2)")}>
        <span style={sx("font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--text-primary)")}>{facet.label}</span>
      </div>
      <div style={sx("display:flex;flex-direction:column;gap:8px")}>
        {visible.map((option: Vals) => <Check key={option.label} label={option.label} mark={option.mark} bg={option.bg} bd={option.bd} onClick={option.go} />)}
      </div>
      {facet.options.length > 4 && <button className="sidebar-more" onClick={() => setExpanded(value => !value)}>{expanded ? "Show less" : `Show ${facet.options.length - 4} more`}</button>}
    </div>
  );
};

