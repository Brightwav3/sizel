import React from "react";
import { border, color, size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";
import { Pill } from "../primitives/Pill";
import { Icon } from "../primitives/Icon";

export interface Fact { k: string; v: string }

export interface ProductDetailProps {
  categoryName: string;
  brand: string;
  model: string;
  name: string;
  price: string;
  stock: string;
  stockTone: "ok" | "warning";
  facts: Fact[];
  blurb: string;
  fps?: { res: string; fps: string }[];
  fit: { ok: boolean; text: string };
  onBack(): void;
  onAddToBuild(): void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  categoryName, brand, model, name, price, stock, stockTone,
  facts, blurb, fps, fit, onBack, onAddToBuild,
}) => (
  <div className="t-page" style={{ padding: "32px 36px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ fontSize: size.xs, color: text.tertiary }}>
      <span onClick={onBack} style={{ cursor: "pointer", color: text.accent }}>{categoryName}</span> / {name}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 36, maxWidth: 1160 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Placeholder height={340} />
        <div style={{ display: "flex", gap: 10 }}>
          <Placeholder height={76} width={76} />
          <Placeholder height={76} width={76} />
          <Placeholder height={76} width={76} />
        </div>
        {fps && fps.length > 0 && (
          <div style={{ borderTop: `1px solid ${border.subtle}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: size.base, fontWeight: weight.medium }}>Expected frame rates</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {fps.map(f => (
                <Card key={f.res} style={{ padding: 16 }}>
                  <div style={{ fontSize: size.xs, color: text.tertiary }}>{f.res}</div>
                  <div style={{ fontSize: size.display, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{f.fps}</div>
                </Card>
              ))}
            </div>
            <div style={{ fontSize: size.xs, color: text.tertiary }}>Averages across popular games at high settings.</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: size.sm, color: text.secondary }}>{brand}</div>
          <div style={{ fontSize: size.display, fontWeight: weight.medium, lineHeight: 1.25, marginTop: 2 }}>{model}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: size.display, fontWeight: weight.medium, fontVariantNumeric: "tabular-nums" }}>{price}</span>
          <span style={{ fontSize: size.sm, color: stockTone === "ok" ? color.green600 : color.amber600 }}>{stock}</span>
        </div>
        <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 9, fontSize: size.sm }}>
          {facts.map(f => (
            <div key={f.k} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: text.secondary }}>{f.k}</span>
              <span style={{ fontWeight: weight.medium }}>{f.v}</span>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Pill height={44} onClick={onAddToBuild}>Put this in my build</Pill>
          <Pill height={44} variant="ghost" onClick={onBack}>Keep looking</Pill>
        </div>
        <Card
          background={fit.ok ? color.gray50 : color.red50}
          style={{ padding: 16, display: "flex", gap: 10 }}
        >
          <Icon name={fit.ok ? "check_circle" : "error"} size={20} color={fit.ok ? color.green500 : color.red500} />
          <div style={{ fontSize: size.sm, color: text.secondary, lineHeight: 1.5 }}>{fit.text}</div>
        </Card>
        <div style={{ fontSize: size.sm, color: text.secondary, lineHeight: 1.6 }}>{blurb}</div>
      </div>
    </div>
  </div>
);
