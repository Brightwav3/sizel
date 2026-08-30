import React from "react";
import { radius, size, surface, text, weight } from "../tokens";
import { Icon } from "../primitives/Icon";

export interface SideItemProps {
  icon: string;
  label: string;
  meta?: string;
  active?: boolean;
  onClick(): void;
}

export const SideItem: React.FC<SideItemProps> = ({ icon, label, meta, active, onClick }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
        borderRadius: radius.nav, fontSize: size.sm, cursor: "pointer",
        background: active ? surface.active : hover ? surface.hover : "transparent",
        color: active ? text.primary : text.secondary,
        fontWeight: active ? weight.medium : weight.regular,
        transition: "background 140ms ease, color 140ms ease",
      }}
    >
      <Icon name={icon} size={14} color={active ? text.secondary : text.tertiary} />
      <span style={{ flex: 1 }}>{label}</span>
      {meta && (
        <span style={{ fontSize: size.xs, color: text.tertiary, fontVariantNumeric: "tabular-nums" }}>{meta}</span>
      )}
    </div>
  );
};
