import React from "react";
import { size, text, weight } from "../tokens";
import { Pill } from "../primitives/Pill";
import { Icon } from "../primitives/Icon";

export const CategoryHeader: React.FC<{
  name: string;
  shownCount: number;
  totalCount: number;
  blurb: string;
  onCompare(): void;
}> = ({ name, shownCount, totalCount, blurb, onCompare }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
    <div>
      <div style={{ fontSize: size.xs, color: text.tertiary, marginBottom: 4 }}>Parts / {name}</div>
      <div style={{ fontSize: size.display, fontWeight: weight.medium }}>{name}</div>
      <div style={{ fontSize: size.sm, color: text.secondary, marginTop: 3 }}>
        {shownCount} shown of {totalCount} products · {blurb}
      </div>
    </div>
    <div style={{ flex: 1 }} />
    <Pill variant="ghost" onClick={onCompare}>
      <Icon name="table_rows" size={14} color={text.secondary} />
      Compare against my build
    </Pill>
  </div>
);
