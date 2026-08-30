import React from "react";
import { color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Icon } from "../primitives/Icon";

export const DeliveryCard: React.FC<{
  inStockLine: string;
  backorderLine: string;
  shipDate: string;
}> = ({ inStockLine, backorderLine, shipDate }) => (
  <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ fontSize: size.base, fontWeight: weight.medium }}>Delivery</div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: size.sm }}>
      <Icon name="check_circle" size={20} color={color.green500} />
      {inStockLine}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: size.sm }}>
      <Icon name="schedule" size={20} color={color.amber500} />
      {backorderLine}
    </div>
    <div style={{ fontSize: size.sm, color: text.secondary }}>
      Complete PC ships <span style={{ fontWeight: weight.medium, color: text.primary }}>{shipDate}</span>
    </div>
  </Card>
);
