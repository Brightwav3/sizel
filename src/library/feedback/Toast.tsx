import React from "react";
import { color, size, weight } from "../tokens";

/** transitions.dev toast: rises, unblurs, settles. Single line, centre-bottom. */
export const Toast: React.FC<{ message: string | null }> = ({ message }) => (
  <div
    className={message ? "t-toast is-open" : "t-toast"}
    style={{
      position: "fixed", bottom: 24, left: "50%", marginLeft: -132, width: 264,
      justifyContent: "center", background: color.gray900, color: color.gray0,
      padding: "11px 18px", borderRadius: 99, fontSize: size.sm, fontWeight: weight.medium,
      boxShadow: "0 8px 24px rgba(41,41,41,.24)", zIndex: 40, display: "flex",
      pointerEvents: "none",
    }}
  >
    {message ?? ""}
  </div>
);
