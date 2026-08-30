import React from "react";
import { border, radius, color, shadow } from "../tokens";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** interactive cards lift 1–2px and gain a shadow on hover */
  interactive?: boolean;
  borderColor?: string;
  background?: string;
}

export const Card: React.FC<CardProps> = ({
  interactive, borderColor, background, style, children, ...rest
}) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      {...rest}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${hover && interactive ? border.default : borderColor ?? border.subtle}`,
        borderRadius: radius.card,
        background: background ?? color.gray0,
        cursor: interactive ? "pointer" : undefined,
        transform: hover && interactive ? "translateY(-2px)" : undefined,
        boxShadow: hover && interactive ? "0 6px 18px rgba(41,41,41,.09)" : undefined,
        transition: "box-shadow 200ms cubic-bezier(0.22,1,0.36,1), transform 200ms cubic-bezier(0.22,1,0.36,1), border-color 140ms ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
