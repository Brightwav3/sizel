import React from "react";
import { sx, type Vals } from "../sx";
import "../sidebar.css";

/**
 * A working e-shop filter column: dense rows, every option carrying its result
 * count, groups open by default, long lists trimmed to five with a "more" link.
 * Options that would empty the list stay visible but disabled, so the shopper
 * can see what the catalog does not have.
 */
export const FilterPanel: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="filter-panel t-panel-slide t-panel-collapse" data-open={v.filtersOpen}>
    <div className="filter-panel__head">
      <span>Filter results</span>
      <span className="num">{v.visibleCount}</span>
    </div>

    {v.activeFilterChips.length > 0 && (
      <div className="filter-active">
        {v.activeFilterChips.map((chip: Vals, i: number) => (
          <button key={i} type="button" className="filter-chip" onClick={chip.clear} data-tip="Remove this filter">
            {chip.label}<span className="ms">close</span>
          </button>
        ))}
      </div>
    )}

    <FilterGroup label="Price">
      <div className="filter-price">
        <RangeSlider min={0} max={2200} step={20} lower={v.minPrice} upper={v.maxPrice} onLowerChange={v.setMinPrice} onUpperChange={v.setMaxPrice} />
        <div className="filter-price__fields">
          <span className="num">{v.minPriceLabel}</span>
          <em>–</em>
          <span className="num">{v.maxPriceLabel}</span>
        </div>
      </div>
      {v.priceBands.map((band: Vals) => (
        <Check key={band.label} label={band.label} count={band.count} on={band.on} disabled={band.count === "0" && !band.on} onClick={band.go} />
      ))}
    </FilterGroup>

    {v.fitFilterShow !== "none" && (
      <FilterGroup label="Compatibility">
        <button type="button" className={`filter-fit ${v.fitOnlyOn ? "is-on" : ""}`} onClick={v.toggleFitOnly} aria-pressed={v.fitOnlyOn}>
          <span className="ms">extension</span>
          <span><strong>{v.fitOnlyLabel}</strong><small>{v.fitOnlyCount} of {v.poolCount} compatible</small></span>
          <span className={`filter-switch ${v.fitOnlyOn ? "is-on" : ""}`}><i /></span>
        </button>
      </FilterGroup>
    )}

    <FilterGroup label="Availability">
      {v.availabilityFilters.map((f: Vals) => (
        <Check key={f.id} label={f.label} count={f.count} on={f.on} disabled={f.count === "0" && !f.on} onClick={f.go} />
      ))}
    </FilterGroup>

    {v.gpuFilterDisplay !== "none" && (
      <FilterGroup label="Good for">
        {v.useFilters.map((f: Vals, i: number) => <Check key={i} label={f.label} on={Boolean(f.mark)} onClick={f.go} />)}
      </FilterGroup>
    )}

    <FilterGroup label="Brand">
      <FacetList options={v.brandFilters} />
    </FilterGroup>

    {v.facetGroups.map((facet: Vals) => (
      <FilterGroup key={facet.id} label={facet.label}>
        <FacetList options={facet.options} />
      </FilterGroup>
    ))}

    {v.anyFilter && <button type="button" className="filter-reset" onClick={v.clearFilters}>Clear selected filters</button>}
  </div>
);

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="filter-group">
    <div className="filter-group__head">{label}</div>
    <div className="filter-group__body">{children}</div>
  </div>
);

/** Long option lists trim to five, always keeping whatever is already ticked. */
const FacetList: React.FC<{ options: Vals[] }> = ({ options }) => {
  const [expanded, setExpanded] = React.useState(false);
  const selected = options.filter(option => option.mark);
  const visible = expanded
    ? options
    : Array.from(new Map([...options.slice(0, 5), ...selected].map(option => [option.label, option])).values());
  return (
    <>
      {visible.map(option => (
        <Check key={option.label} label={option.label} count={option.count} on={Boolean(option.mark)} disabled={option.count === "0" && !option.mark} onClick={option.go} />
      ))}
      {options.length > 5 && (
        <button type="button" className="filter-more" onClick={() => setExpanded(value => !value)}>
          {expanded ? "Show less" : `${options.length - 5} more`}
        </button>
      )}
    </>
  );
};

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

const Check: React.FC<{ label: string; count?: string; on: boolean; disabled?: boolean; onClick(): void }> = ({ label, count, on, disabled, onClick }) => (
  <button type="button" className={`filter-check ${on ? "is-on" : ""}`} onClick={onClick} disabled={disabled} aria-pressed={on}>
    <span className="ms filter-check__box">{on ? "check" : ""}</span>
    <span className="filter-check__label">{label}</span>
    {count !== undefined && <span className="num filter-check__count">({count})</span>}
  </button>
);
