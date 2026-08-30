import React from "react";
import { color, size, text } from "../tokens";
import { Card } from "../primitives/Card";
import { Icon } from "../primitives/Icon";

export const CompatibilityNote: React.FC<{ ok: boolean; text: string }> = ({ ok, text: body }) => (
  <Card background={ok ? color.gray0 : color.red50} style={{ padding: 16, display: "flex", gap: 10 }}>
    <Icon name={ok ? "check_circle" : "error"} size={20} color={ok ? color.green500 : color.red500} />
    <div style={{ fontSize: size.sm, color: text.secondary, lineHeight: 1.5 }}>{body}</div>
  </Card>
);
