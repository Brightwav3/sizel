import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";
import { Pill } from "../primitives/Pill";

export interface CompareColumn { name: string; tag: string; selected?: boolean }
export interface CompareRow { label: string; values: string[]; ok: boolean[] }

/**
 * Three candidates side by side, every number computed against the current
 * build rather than shown as a raw spec.
 */
export const ComparisonTable: React.FC<{
  columns: CompareColumn[];
  rows: CompareRow[];
  onChoose(index: number): void;
}> = ({ columns, rows, onChoose }) => (
  <Card style={{ display: "grid", gridTemplateColumns: `200px repeat(${columns.length},minmax(0,1fr))`, fontSize: size.sm, overflow: "hidden" }}>
    <div style={{ padding: "16px 14px" }} />
    {columns.map(c => (
      <div
        key={c.name}
        style={{
          padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8,
          background: c.selected ? color.blue50 : color.gray0,
        }}
      >
        <Placeholder height={104} style={{ background: color.gray0 }} />
        <div style={{ fontWeight: weight.medium }}>{c.name}</div>
        <div style={{ fontSize: size.xs, fontWeight: weight.medium, color: c.selected ? color.blue700 : text.tertiary }}>{c.tag}</div>
      </div>
    ))}

    {rows.map(r => (
      <React.Fragment key={r.label}>
        <div style={{ padding: "12px 14px", color: text.secondary, borderTop: `1px solid ${border.subtle}` }}>{r.label}</div>
        {r.values.map((v, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px", borderTop: `1px solid ${border.subtle}`,
              background: columns[i].selected ? color.blue50 : undefined,
              color: r.ok[i] ? text.primary : color.amber600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {v}
          </div>
        ))}
      </React.Fragment>
    ))}

    <div style={{ borderTop: `1px solid ${border.subtle}` }} />
    {columns.map((c, i) => (
      <div key={c.name} style={{ padding: 14, borderTop: `1px solid ${border.subtle}`, background: c.selected ? color.blue50 : undefined }}>
        {c.selected ? (
          <span style={{ fontSize: size.sm, color: text.tertiary }}>In your build</span>
        ) : (
          <Pill height={32} style={{ width: "100%", fontSize: size.sm }} onClick={() => onChoose(i)}>Use this</Pill>
        )}
      </div>
    ))}
  </Card>
);
