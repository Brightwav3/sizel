import React from "react";
import { ProductCard, type ProductCardProps } from "./ProductCard";

/** auto-fit so the grid gives way instead of squeezing columns. */
export const ProductGrid: React.FC<{ items: (ProductCardProps & { id: string })[] }> = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(196px,1fr))", gap: 14 }}>
    {items.map(({ id, ...p }) => <ProductCard key={id} {...p} />)}
  </div>
);
