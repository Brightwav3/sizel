import React from "react";
import { color, motion, radius } from "../tokens";

export const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <span
    onClick={onChange}
    style={{
      width: 34, height: 20, borderRadius: radius.pill, position: "relative",
      display: "inline-block", cursor: "pointer",
      background: on ? color.gray900 : color.gray300,
      transition: "background 140ms ease",
    }}
  >
    <span
      style={{
        position: "absolute", top: 2, left: on ? 16 : 2, width: 16, height: 16,
        borderRadius: radius.pill, background: color.gray0,
        transition: `left 160ms ${motion.slideEase}`,
      }}
    />
  </span>
);
