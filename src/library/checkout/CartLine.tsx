import React from "react";
import { color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";

export interface CartLineProps {
  title: string;
  /** the build's parts as one readable run */
  parts: string;
  badges: string[];
  total: string;
  onEdit(): void;
  onRemove(): void;
}

/** A whole build is ONE line item — never nine rows of parts. */
export const CartLine: React.FC<CartLineProps> = ({ title, parts, badges, total, onEdit, onRemove }) => (
  <Card style={{ padding: 16, display: "flex", gap: 16 }}>
    <Placeholder height={128} width={128} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: size.base, fontWeight: weight.medium }}>{title}</div>
      <div style={{ fontSize: size.sm, color: text.secondary, lineHeight: 1.5 }}>{parts}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {badges.map((b, i) => (
          <span
            key={b}
            style={{
              fontSize: size.xs, padding: "2px 8px", borderRadius: 99,
              background: i === 0 ? color.green50 : color.gray100,
              color: i === 0 ? color.green600 : text.secondary,
              fontWeight: i === 0 ? weight.medium : weight.regular,
            }}
          >
            {b}
          </span>
        ))}
      </div>
      <div onClick={onEdit} style={{ fontSize: size.sm, color: text.accent, cursor: "pointer" }}>Edit build</div>
    </div>
    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: size.display, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{total}</div>
      <div style={{ fontSize: size.xs, color: text.tertiary }}>Assembly included</div>
      <div onClick={onRemove} style={{ fontSize: size.xs, color: text.accent, cursor: "pointer", marginTop: 6 }}>Remove</div>
    </div>
  </Card>
);
