import React from "react";
import { border, color, radius, size, weight } from "../tokens";

export type PillVariant = "dark" | "ghost";

export interface PillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PillVariant;
  height?: number;
}

/** One dark pill per view is the primary action. Everything else is a ghost. */
export const Pill: React.FC<PillProps> = ({
  variant = "dark", height = 36, style, children, ...rest
}) => {
  const [press, setPress] = React.useState(false);
  const skin =
    variant === "dark"
      ? { background: color.gray900, color: color.gray0, border: `1px solid ${color.gray900}` }
      : { background: color.gray0, color: color.gray900, border: `1px solid ${border.default}` };
  return (
    <div
      {...rest}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        height, padding: "0 18px", borderRadius: radius.pill,
        fontSize: size.base, fontWeight: weight.medium,
        cursor: "pointer", userSelect: "none",
        transform: press ? "scale(0.97)" : undefined,
        transition: "background 140ms ease, border-color 140ms ease, transform 80ms ease",
        ...skin, ...style,
      }}
    >
      {children}
    </div>
  );
};
