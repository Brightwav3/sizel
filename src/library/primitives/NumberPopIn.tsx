import React from "react";
import { motion } from "../tokens";

/**
 * transitions.dev "number pop-in": each character enters independently and the
 * last two digits stagger. Remount by key to replay.
 */
export const NumberPopIn: React.FC<{
  value: string;
  fontSize?: number;
  color?: string;
}> = ({ value, fontSize = 24, color }) => {
  const chars = value.split("");
  return (
    <span
      key={value}
      className="t-digit-group"
      style={{
        display: "inline-flex", alignItems: "baseline",
        fontSize, fontWeight: 500, fontVariantNumeric: "tabular-nums", color,
      }}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          className="t-digit"
          data-stagger={i === chars.length - 2 ? "1" : i === chars.length - 1 ? "2" : undefined}
          style={{
            display: "inline-block",
            animation: `t-digit-pop-in ${motion.digitDur} ${motion.digitEase} both`,
          }}
        >
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
};
