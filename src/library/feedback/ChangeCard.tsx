import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Pill } from "../primitives/Pill";
import { Placeholder } from "../primitives/Placeholder";

export interface Delta { label: string; value: string; tone: "good" | "neutral" | "warning" }

/**
 * Every swap produces one of these: what changed, and the three numbers that
 * moved. Undo is always available.
 */
export const ChangeCard: React.FC<{
  open: boolean;
  icon: string;
  title: string;
  deltas: Delta[];
  onUndo(): void;
  onKeep(): void;
}> = ({ open, icon, title, deltas, onUndo, onKeep }) => (
  <div className="t-panel-slide" data-open={open ? "true" : "false"}>
    <Card borderColor={border.default} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(41,41,41,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Placeholder height={40} width={40} icon={icon} />
        <div style={{ fontSize: size.sm, lineHeight: 1.45 }}>{title}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: size.sm }}>
        {deltas.map(d => (
          <div key={d.label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: text.secondary }}>{d.label}</span>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                color: d.tone === "good" ? color.green600 : d.tone === "warning" ? color.amber600 : text.secondary,
              }}
            >
              {d.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Pill variant="ghost" height={32} style={{ flex: 1, fontSize: size.sm }} onClick={onUndo}>Undo</Pill>
        <Pill height={32} style={{ flex: 1, fontSize: size.sm }} onClick={onKeep}>Keep</Pill>
      </div>
    </Card>
  </div>
);
