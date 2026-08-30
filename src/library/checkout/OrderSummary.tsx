import React from "react";
import { border, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Pill } from "../primitives/Pill";

export interface SummaryLine { label: string; value: string }

export const OrderSummary: React.FC<{
  lines: SummaryLine[];
  total: string;
  cta?: string;
  footnote?: string;
  onCta?(): void;
}> = ({ lines, total, cta, footnote, onCta }) => (
  <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
    {lines.map(l => (
      <div key={l.label} style={{ display: "flex", justifyContent: "space-between", fontSize: size.sm }}>
        <span style={{ color: text.secondary }}>{l.label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{l.value}</span>
      </div>
    ))}
    <div style={{ height: 1, background: border.subtle }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: size.base, fontWeight: weight.medium }}>Total</span>
      <span style={{ fontSize: size.display, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{total}</span>
    </div>
    {cta && <Pill height={44} onClick={onCta}>{cta}</Pill>}
    {footnote && <div style={{ fontSize: size.xs, color: text.tertiary, lineHeight: 1.5 }}>{footnote}</div>}
  </Card>
);
