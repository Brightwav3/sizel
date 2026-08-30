import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Pill } from "../primitives/Pill";

export interface StepField { label: string; full?: boolean }

export interface StepFlowProps {
  steps: string[];
  current: number;
  title: string;
  fields: StepField[];
  cta: string;
  onBack(): void;
  onNext(): void;
}

/** Segmented step indicator + the current step's fields. Three steps, no more. */
export const StepFlow: React.FC<StepFlowProps> = ({
  steps, current, title, fields, cta, onBack, onNext,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: size.display, fontWeight: weight.medium }}>Checkout</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 3, background: color.gray100, borderRadius: 99 }}>
        {steps.map((s, i) => (
          <span
            key={s}
            style={{
              fontSize: size.sm, padding: "5px 12px", borderRadius: 99,
              background: i === current ? color.gray0 : "transparent",
              color: i === current ? text.primary : text.tertiary,
              fontWeight: i === current ? weight.medium : weight.regular,
              boxShadow: i === current ? "0 1px 3px rgba(41,41,41,.10)" : undefined,
              transition: "background 200ms cubic-bezier(0.22,1,0.36,1), color 200ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>

    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: size.base, fontWeight: weight.medium }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {fields.map(f => (
          <div
            key={f.label}
            style={{
              gridColumn: f.full ? "1 / -1" : "auto",
              height: 36, border: `1px solid ${border.default}`, borderRadius: 8,
              display: "flex", alignItems: "center", padding: "0 12px",
              fontSize: size.sm, color: text.tertiary, transition: "border-color 140ms ease",
            }}
          >
            {f.label}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <Pill variant="ghost" onClick={onBack}>Back</Pill>
        <Pill onClick={onNext}>{cta}</Pill>
      </div>
    </Card>
  </div>
);
