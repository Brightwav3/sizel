import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";
import { SpecChip } from "../primitives/SpecChip";

export interface ProductCardProps {
  name: string;
  brand: string;
  /** one plain-language sentence: what you get, not what it is */
  description: string;
  specs: string[];
  price: string;
  stock: string;
  stockTone?: "neutral" | "warning";
  tag?: string;
  tagTone?: "neutral" | "accent" | "value";
  selected?: boolean;
  cta: string;
  onOpen(): void;
  onAdd(): void;
}

/**
 * Commercial listing card: photo, name, one-line description, three spec chips,
 * price with delivery, and an add action. Sized for a 196px minimum column.
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  name, brand, description, specs, price, stock, stockTone = "neutral",
  tag, tagTone = "neutral", selected, cta, onOpen, onAdd,
}) => {
  const tagColor =
    tagTone === "accent" ? color.blue700 : tagTone === "value" ? color.green600 : text.tertiary;
  return (
    <Card
      interactive
      onClick={onOpen}
      borderColor={selected ? color.blue500 : undefined}
      style={{ overflow: "hidden", minWidth: 0, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Placeholder flush height={108} />
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <div style={{ fontSize: size.xs, fontWeight: weight.medium, color: tagColor, flex: 1 }}>{tag}</div>
          <div style={{ fontSize: size.xs, color: text.tertiary }}>{brand}</div>
        </div>
        <div style={{ fontSize: size.sm, fontWeight: weight.medium, lineHeight: 1.35 }}>{name}</div>
        <div style={{ fontSize: size.xs, color: text.secondary, lineHeight: 1.45 }}>{description}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {specs.map(s => <SpecChip key={s}>{s}</SpecChip>)}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 36, paddingTop: 2 }}>
          <span style={{ fontSize: size.base, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{price}</span>
          <span style={{ fontSize: size.xs, color: stockTone === "warning" ? color.amber600 : text.tertiary }}>{stock}</span>
        </div>
        <div
          onClick={e => { e.stopPropagation(); onAdd(); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", height: 36, minHeight: 36,
            textAlign: "center", fontSize: size.xs, fontWeight: weight.medium,
            padding: "0 12px", borderRadius: 99, border: `1px solid ${border.default}`,
            background: color.gray0, cursor: "pointer", transition: "background 140ms ease",
          }}
        >
          {cta}
        </div>
      </div>
    </Card>
  );
};
