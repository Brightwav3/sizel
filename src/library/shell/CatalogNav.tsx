import React from "react";
import { CAT_ICON, CAT_META } from "../data/catalog";
import type { Slot } from "../types";
import { size, text } from "../tokens";
import { Eyebrow } from "../primitives/SpecChip";
import { SideItem } from "./SideItem";

export interface CatalogNavProps {
  /** the category being browsed, if any */
  active?: Slot | null;
  /** true while a category page is open and the list should fold down to it */
  collapsed: boolean;
  onSelect(slot: Slot): void;
  onExpand(): void;
}

/**
 * Catalog list. Opening a category folds the other eight away so the filter
 * panel below has room to grow.
 */
export const CatalogNav: React.FC<CatalogNavProps> = ({ active, collapsed, onSelect, onExpand }) => {
  const slots = Object.keys(CAT_META) as Slot[];
  const shown = collapsed && active ? slots.filter(s => s === active) : slots;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
        <Eyebrow style={{ flex: 1 }}>Catalog</Eyebrow>
        {collapsed && (
          <span onClick={onExpand} style={{ fontSize: size.xs, color: text.accent, cursor: "pointer" }}>
            All {slots.length}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {shown.map(slot => (
          <SideItem
            key={slot}
            icon={CAT_ICON[slot]}
            label={CAT_META[slot].name}
            meta={String(CAT_META[slot].count)}
            active={active === slot}
            onClick={() => onSelect(slot)}
          />
        ))}
      </div>
    </div>
  );
};
