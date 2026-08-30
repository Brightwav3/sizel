import React from "react";
import { size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { NumberPopIn } from "../primitives/NumberPopIn";

export interface ReadoutCardProps {
  label: string;
  value: string;
  note: string;
  noteColor?: string;
  /** animate the value on change (price, fps) */
  animate?: boolean;
}

export const ReadoutCard: React.FC<ReadoutCardProps> = ({ label, value, note, noteColor, animate }) => (
  <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 4 }}>
    <div style={{ fontSize: size.sm, color: text.secondary }}>{label}</div>
    {animate ? (
      <NumberPopIn value={value} />
    ) : (
      <div style={{ fontSize: size.display, fontWeight: weight.medium }}>{value}</div>
    )}
    <div style={{ fontSize: size.xs, color: noteColor ?? text.tertiary }}>{note}</div>
  </Card>
);
