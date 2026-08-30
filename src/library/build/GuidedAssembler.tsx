import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";
import { Pill } from "../primitives/Pill";
import { Icon } from "../primitives/Icon";
import { Eyebrow } from "../primitives/SpecChip";

export interface TrackSegment { label: string; state: "done" | "current" | "todo" }
export interface SlotEntry {
  category: string;
  icon: string;
  /** installed name, "choosing", or "suggested: …" */
  name: string;
  state: "done" | "current" | "todo";
  onClick(): void;
}
export interface AssemblerOption {
  name: string;
  note: string;
  noteTone: "good" | "warning" | "bad" | "neutral";
  price: string;
  tag: string;
  selected?: boolean;
  onPick(): void;
}

export interface GuidedAssemblerProps {
  stepNumber: number;
  stepCount: number;
  title: string;
  help: string;
  spent: string;
  budget: string;
  track: TrackSegment[];
  slots: SlotEntry[];
  options: AssemblerOption[];
  footer: { fps: string; noise: string; arrives: string };
  compatibility: { ok: boolean; text: string };
  onBack(): void;
  onKeepSuggested(): void;
  onExit(): void;
}

/** Full-screen guided pass: progress track, slot list, option tray. */
export const GuidedAssembler: React.FC<GuidedAssemblerProps> = ({
  stepNumber, stepCount, title, help, spent, budget, track, slots, options,
  footer, compatibility, onBack, onKeepSuggested, onExit,
}) => (
  <div className="t-page" style={{ position: "fixed", inset: 0, zIndex: 30, background: color.gray0, display: "flex", flexDirection: "column", overflow: "auto" }}>
    <div style={{ padding: "16px 32px", borderBottom: `1px solid ${border.subtle}`, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: color.gray900, color: color.gray0, fontSize: size.xs, fontWeight: weight.medium, display: "flex", alignItems: "center", justifyContent: "center" }}>R</div>
        <div style={{ fontSize: size.base, fontWeight: weight.medium }}>Guided build</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        {track.map(t => (
          <div key={t.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                height: 4, borderRadius: 99,
                background: t.state === "current" ? color.blue500 : t.state === "done" ? color.gray900 : color.gray200,
                transition: "background 200ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <div
              style={{
                fontSize: size.xs,
                color: t.state === "current" ? color.blue700 : t.state === "done" ? text.primary : text.tertiary,
                fontWeight: t.state === "todo" ? weight.regular : weight.medium,
              }}
            >
              {t.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: size.sm, color: text.secondary, fontVariantNumeric: "tabular-nums" }}>{spent} of {budget}</div>
      <Icon name="close_fullscreen" size={20} color={text.secondary} style={{ cursor: "pointer" }} />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "420px minmax(0,1fr)", flex: 1 }}>
      <div style={{ borderRight: `1px solid ${border.subtle}`, padding: 32, background: color.gray50, display: "flex", flexDirection: "column", gap: 16 }}>
        <Eyebrow>Slots</Eyebrow>
        <Card borderColor={border.default} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {slots.map(s => (
            <div
              key={s.category}
              onClick={s.onClick}
              style={{
                border: `1px ${s.state === "done" ? "solid" : "dashed"} ${s.state === "done" ? color.gray900 : s.state === "current" ? color.blue500 : border.default}`,
                borderRadius: 8, padding: "11px 12px",
                background: s.state === "done" ? color.gray50 : s.state === "current" ? color.blue50 : color.gray0,
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                transition: "background 140ms ease",
              }}
            >
              <Icon name={s.icon} size={14} color={s.state === "current" ? color.blue700 : s.state === "done" ? text.primary : text.tertiary} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: size.xs, color: text.tertiary }}>{s.category}</div>
                <div
                  style={{
                    fontSize: size.sm, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    color: s.state === "current" ? color.blue700 : s.state === "done" ? text.primary : text.tertiary,
                    fontWeight: s.state === "todo" ? weight.regular : weight.medium,
                  }}
                >
                  {s.name}
                </div>
              </div>
            </div>
          ))}
        </Card>
        <Card style={{ padding: 16, display: "flex", gap: 10 }}>
          <Icon name={compatibility.ok ? "check_circle" : "error"} size={20} color={compatibility.ok ? color.green500 : color.red500} />
          <div style={{ fontSize: size.sm, color: text.secondary, lineHeight: 1.5 }}>{compatibility.text}</div>
        </Card>
      </div>

      <section style={{ padding: "32px 36px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Eyebrow>Step {stepNumber} of {stepCount}</Eyebrow>
          <div style={{ fontSize: size.display, fontWeight: weight.medium, marginTop: 4 }}>{title}</div>
          <div style={{ fontSize: size.sm, color: text.secondary, marginTop: 4, maxWidth: 520 }}>{help}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {options.map(o => (
            <Card
              key={o.name}
              interactive
              onClick={o.onPick}
              borderColor={o.selected ? color.blue500 : undefined}
              style={{ overflow: "hidden" }}
            >
              <Placeholder flush height={150} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 7, background: o.selected ? color.blue50 : color.gray0 }}>
                <div style={{ fontSize: size.xs, fontWeight: weight.medium, color: o.selected ? color.blue700 : text.tertiary }}>{o.tag}</div>
                <div style={{ fontSize: size.base, fontWeight: weight.medium }}>{o.name}</div>
                <div
                  style={{
                    fontSize: size.sm,
                    color: o.noteTone === "good" ? color.green600 : o.noteTone === "warning" ? color.amber600 : o.noteTone === "bad" ? color.red600 : text.secondary,
                  }}
                >
                  {o.note}
                </div>
                <div style={{ fontSize: size.display, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{o.price}</div>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${border.subtle}`, paddingTop: 18, display: "flex", alignItems: "center", gap: 24 }}>
          <Stat label="Frame rate" value={footer.fps} />
          <Stat label="Noise" value={footer.noise} />
          <Stat label="Arrives" value={footer.arrives} />
          <div style={{ flex: 1 }} />
          <Pill variant="ghost" onClick={onBack}>Back</Pill>
          <Pill variant="ghost" onClick={onKeepSuggested}>Keep suggested</Pill>
        </div>
      </section>
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: size.xs, color: text.tertiary }}>{label}</div>
    <div style={{ fontSize: size.base, fontWeight: weight.medium }}>{value}</div>
  </div>
);
