import React from "react";
import { border, color, motion, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Pill } from "../primitives/Pill";
import { Icon } from "../primitives/Icon";

export interface FloatingRow { name: string; price: string; done: boolean }

export interface FloatingBuildCardProps {
  open: boolean;
  title: string;
  count: string;
  rows: FloatingRow[];
  rest: string;
  spent: string;
  remaining: string;
  cta: string;
  onOpen(): void;
}

/**
 * Persistent build summary that follows you around the shop. Starts collapsed as
 * a 52px pill in the bottom-right, drag by the header, clamped to the viewport.
 */
export const FloatingBuildCard: React.FC<FloatingBuildCardProps> = ({
  open, title, count, rows, rest, spent, remaining, cta, onOpen,
}) => {
  const [collapsed, setCollapsed] = React.useState(true);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const point = pos ?? {
    x: Math.max(288, window.innerWidth - 76),
    y: Math.max(8, window.innerHeight - 76),
  };

  const drag = (e: React.PointerEvent) => {
    e.preventDefault();
    const box = boxRef.current!;
    const r = box.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY, x0 = r.left, y0 = r.top;
    const move = (ev: PointerEvent) =>
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - box.offsetWidth - 8, x0 + ev.clientX - startX)),
        y: Math.max(8, Math.min(window.innerHeight - box.offsetHeight - 8, y0 + ev.clientY - startY)),
      });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const expand = () => {
    setCollapsed(false);
    setPos(p => ({
      x: Math.max(288, Math.min(p?.x ?? Infinity, window.innerWidth - 312)),
      y: Math.max(8, Math.min(p?.y ?? Infinity, window.innerHeight - 240)),
    }));
  };

  return (
    <div
      ref={boxRef}
      className="t-panel-slide"
      data-open={open ? "true" : "false"}
      style={{ position: "fixed", left: 0, top: 0, transform: `translate(${point.x}px,${point.y}px)`, zIndex: 25 }}
    >
      {collapsed ? (
        <div
          onPointerDown={drag}
          onDoubleClick={expand}
          style={{
            width: 52, height: 52, borderRadius: 99, background: color.gray900, color: color.gray0,
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            boxShadow: "0 8px 24px rgba(41,41,41,.22)", cursor: "grab",
          }}
        >
          <Icon name="construction" size={20} />
          <span
            onClick={expand}
            style={{
              position: "absolute", top: -2, right: -4, minWidth: 20, height: 20, padding: "0 5px",
              borderRadius: 99, background: color.gray0, color: color.gray900,
              border: `1px solid ${border.default}`, fontSize: size.xs, fontWeight: weight.medium,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count}
          </span>
        </div>
      ) : (
        <Card borderColor={border.default} style={{ width: 296, boxShadow: "0 8px 24px rgba(41,41,41,.12)", overflow: "hidden" }}>
          <div
            onPointerDown={drag}
            style={{
              padding: "12px 14px", display: "flex", alignItems: "center", gap: 8,
              borderBottom: `1px solid ${border.subtle}`, cursor: "grab", userSelect: "none",
            }}
          >
            <Icon name="drag_indicator" size={14} color={color.gray400} />
            <div style={{ fontSize: size.sm, fontWeight: weight.medium, flex: 1 }}>{title}</div>
            <div style={{ fontSize: size.xs, color: text.tertiary, fontVariantNumeric: "tabular-nums" }}>{count}</div>
            <Icon name="open_in_full" size={14} color={text.tertiary} style={{ cursor: "pointer" }} />
            <Icon name="remove" size={14} color={text.tertiary} style={{ cursor: "pointer" }} />
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {rows.map(r => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: size.sm, color: r.done ? text.primary : color.blue700 }}>
                <Icon name={r.done ? "check" : "radio_button_checked"} size={14} color={r.done ? color.green500 : color.blue500} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                <span style={{ fontSize: size.xs, color: text.secondary, fontVariantNumeric: "tabular-nums" }}>{r.price}</span>
              </div>
            ))}
            <div style={{ fontSize: size.xs, color: text.tertiary, paddingLeft: 22 }}>{rest}</div>
          </div>
          <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${border.subtle}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: size.sm, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{spent}</div>
              <div style={{ fontSize: size.xs, color: text.secondary, fontVariantNumeric: "tabular-nums" }}>{remaining}</div>
            </div>
            <Pill height={28} style={{ fontSize: size.xs, padding: "0 12px" }} onClick={onOpen}>{cta}</Pill>
          </div>
        </Card>
      )}
    </div>
  );
};
