import React from "react";
import { radius, size, surface, text } from "../tokens";

/** 4px-radius tag — the tight corner reserved for chips. */
export const SpecChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: size.xs, padding: "1px 7px", borderRadius: radius.chip,
      background: surface.sunken, color: text.secondary,
    }}
  >
    {children}
  </span>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      fontSize: size.xs, letterSpacing: "0.6px", textTransform: "uppercase",
      color: text.tertiary, ...style,
    }}
  >
    {children}
  </div>
);
