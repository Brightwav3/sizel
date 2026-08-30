import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";

export interface NewsItem { when: string; text: string; tag: string; tone: "good" | "neutral" | "accent"; onClick(): void }

export const NewsStrip: React.FC<{ items: NewsItem[] }> = ({ items }) => (
  <Card style={{ padding: 0, display: "flex", alignItems: "stretch", overflow: "hidden" }}>
    <div
      style={{
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 8,
        background: color.gray900, color: color.gray0, fontSize: size.xs,
        fontWeight: weight.medium, letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 99, background: color.green500 }} />
      News
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", overflowX: "auto", minWidth: 0 }}>
      {items.map(n => (
        <div
          key={n.text}
          onClick={n.onClick}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
            borderRight: `1px solid ${border.subtle}`, whiteSpace: "nowrap", cursor: "pointer",
          }}
        >
          <span style={{ fontSize: size.xs, color: text.tertiary, fontVariantNumeric: "tabular-nums" }}>{n.when}</span>
          <span style={{ fontSize: size.sm }}>{n.text}</span>
          <span
            style={{
              fontSize: size.xs, fontWeight: weight.medium,
              color: n.tone === "good" ? color.green600 : n.tone === "accent" ? color.blue700 : text.tertiary,
            }}
          >
            {n.tag}
          </span>
        </div>
      ))}
    </div>
  </Card>
);
