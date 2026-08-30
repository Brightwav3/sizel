import React from "react";
import { border, color, size, surface, text, weight } from "../tokens";
import { Eyebrow } from "../primitives/SpecChip";
import { Toggle } from "../primitives/Toggle";
import { Icon } from "../primitives/Icon";

export interface FilterState {
  use: string;
  maxPrice: number;
  brand: string;
  sort: "popular" | "price" | "perf";
  stockOnly: boolean;
  fitOnly: boolean;
}

export interface FilterPanelProps {
  open: boolean;
  showUseFilter: boolean;
  brands: { label: string; value: string; count: number }[];
  value: FilterState;
  onChange(patch: Partial<FilterState>): void;
}

const USES = ["1080p gaming", "1440p gaming", "4K gaming"];
const SORTS: { id: FilterState["sort"]; label: string }[] = [
  { id: "popular", label: "Most popular" },
  { id: "price", label: "Price, low to high" },
  { id: "perf", label: "Performance" },
];

/** Lives in the sidebar under the catalog; revealed with the panel transition. */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  open, showUseFilter, brands, value, onChange,
}) => (
  <div className="t-panel-slide" data-open={open ? "true" : "false"} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ height: 1, background: border.subtle }} />
    <Eyebrow style={{ padding: "0 10px" }}>Filters</Eyebrow>

    {showUseFilter && (
      <Group label="Good for">
        {USES.map(u => (
          <Check key={u} label={u} on={value.use === u} onClick={() => onChange({ use: value.use === u ? "any" : u })} />
        ))}
      </Group>
    )}

    <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: size.sm }}>
        <span style={{ color: text.secondary }}>Max price</span>
        <span style={{ fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>
          {"$" + value.maxPrice.toLocaleString("en-US")}
        </span>
      </div>
      <input
        type="range" min={300} max={1100} step={10} value={value.maxPrice}
        onChange={e => onChange({ maxPrice: Number(e.target.value) })}
        style={{ width: "100%", accentColor: color.gray900 }}
      />
    </div>

    <Group label="Brand">
      {brands.map(b => (
        <Check
          key={b.value}
          label={b.label}
          meta={String(b.count)}
          on={value.brand === b.value}
          onClick={() => onChange({ brand: b.value })}
        />
      ))}
    </Group>

    <Group label="Sort by">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {SORTS.map(o => (
          <div
            key={o.id}
            onClick={() => onChange({ sort: o.id })}
            style={{
              fontSize: size.sm, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
              background: value.sort === o.id ? surface.active : "transparent",
              color: value.sort === o.id ? text.primary : text.secondary,
              fontWeight: value.sort === o.id ? weight.medium : weight.regular,
              transition: "background 140ms ease",
            }}
          >
            {o.label}
          </div>
        ))}
      </div>
    </Group>

    <Row label="In stock only">
      <Toggle on={value.stockOnly} onChange={() => onChange({ stockOnly: !value.stockOnly })} />
    </Row>
    <Row label="Only what fits">
      <Toggle on={value.fitOnly} onChange={() => onChange({ fitOnly: !value.fitOnly })} />
    </Row>
  </div>
);

const Group: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ fontSize: size.sm, color: text.secondary }}>{label}</div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: size.sm }}>
    <span style={{ color: text.secondary }}>{label}</span>
    {children}
  </div>
);

const Check: React.FC<{ label: string; meta?: string; on: boolean; onClick(): void }> = ({ label, meta, on, onClick }) => (
  <div
    onClick={onClick}
    style={{ display: "flex", gap: 8, alignItems: "center", fontSize: size.sm, color: text.secondary, cursor: "pointer" }}
  >
    <span
      style={{
        width: 15, height: 15, borderRadius: 4, display: "inline-flex",
        alignItems: "center", justifyContent: "center",
        background: on ? color.gray900 : color.gray0,
        border: `1px solid ${on ? color.gray900 : border.default}`,
        color: color.gray0, transition: "background 140ms ease",
      }}
    >
      {on && <Icon name="check" size={14} style={{ fontSize: 12 }} />}
    </span>
    <span style={{ flex: 1 }}>{label}</span>
    {meta && <span style={{ fontSize: size.xs, color: text.tertiary, fontVariantNumeric: "tabular-nums" }}>{meta}</span>}
  </div>
);
