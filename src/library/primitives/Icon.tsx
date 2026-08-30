import React from "react";

/** Material Symbols Outlined, 14px in nav / 20px in content — those two sizes only. */
export interface IconProps {
  name: string;
  size?: 14 | 20;
  color?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color, style }) => (
  <span
    className="ms"
    style={{
      fontFamily: "'Material Symbols Outlined'",
      fontWeight: 400,
      fontStyle: "normal",
      lineHeight: 1,
      WebkitFontSmoothing: "antialiased",
      fontSize: size,
      color,
      ...style,
    }}
  >
    {name}
  </span>
);
