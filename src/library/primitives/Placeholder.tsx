import React from "react";
import { border, color, radius, size } from "../tokens";
import { Icon } from "./Icon";

/** Stands in for product photography until real assets land. */
export const Placeholder: React.FC<{
  height?: number | string;
  width?: number | string;
  icon?: string;
  flush?: boolean;
  style?: React.CSSProperties;
}> = ({ height = 108, width, icon = "image", flush, style }) => (
  <div
    style={{
      height, width,
      background: color.gray100,
      border: flush ? "none" : `1px solid ${border.subtle}`,
      borderBottom: flush ? `1px solid ${border.subtle}` : undefined,
      borderRadius: flush ? 0 : radius.nav,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: color.gray400, fontSize: size.xs,
      ...style,
    }}
  >
    <Icon name={icon} size={20} />
  </div>
);
