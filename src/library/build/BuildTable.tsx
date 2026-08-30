import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";

export interface BuildRow {
  slot: string;
  icon: string;
  name: string;
  category: string;
  /** plain-language reason this part is in the build */
  note: string;
  noteTone?: "neutral" | "warning";
  price: string;
  badge?: string;
  onChange(): void;
}

const COLS = "64px minmax(0,1fr) 190px 96px 92px";

export const BuildTable: React.FC<{ rows: BuildRow[] }> = ({ rows }) => (
  <Card style={{ overflow: "hidden" }}>
    <div
      style={{
        display: "grid", gridTemplateColumns: COLS, gap: 14, alignItems: "center",
        background: color.gray50, padding: "10px 16px", fontSize: size.xs,
        color: text.tertiary, borderBottom: `1px solid ${border.subtle}`,
      }}
    >
      <div />
      <div>Part</div>
      <div>Why it's here</div>
      <div style={{ textAlign: "right" }}>Price</div>
      <div />
    </div>
    {rows.map(r => (
      <div
        key={r.slot}
        style={{
          display: "grid", gridTemplateColumns: COLS, gap: 14, alignItems: "center",
          padding: "12px 16px", borderBottom: `1px solid ${border.subtle}`,
          background: r.badge ? color.blue50 : color.gray0,
          transition: "background 140ms ease",
        }}
      >
        <Placeholder height={48} icon={r.icon} />
        <div>
          <div style={{ fontSize: size.base, fontWeight: weight.medium, display: "flex", alignItems: "center", gap: 7 }}>
            {r.name}
            {r.badge && (
              <span
                style={{
                  fontSize: size.xs, fontWeight: weight.medium, color: color.blue700,
                  background: color.gray0, padding: "1px 8px", borderRadius: 99,
                }}
              >
                {r.badge}
              </span>
            )}
          </div>
          <div style={{ fontSize: size.xs, color: text.secondary }}>{r.category}</div>
        </div>
        <div style={{ fontSize: size.xs, color: r.noteTone === "warning" ? color.amber600 : text.secondary }}>{r.note}</div>
        <div style={{ fontSize: size.base, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.price}</div>
        <div style={{ textAlign: "right" }}>
          <span
            onClick={r.onChange}
            style={{
              fontSize: size.xs, fontWeight: weight.medium, padding: "5px 12px", borderRadius: 99,
              border: `1px solid ${border.default}`, cursor: "pointer", background: color.gray0,
            }}
          >
            Change
          </span>
        </div>
      </div>
    ))}
  </Card>
);
