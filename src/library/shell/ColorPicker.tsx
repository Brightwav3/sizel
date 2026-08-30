import React from "react";
import { OptionPicker } from "./OptionPicker";
import type { Colorway } from "../data/colorways";

// ADR 0003: colour identifies a derived storefront listing and is URL-owned.
// docs/decisions/0003-storefront-variants-live-in-the-adapter.md
export const ColorPicker: React.FC<{
  colorways: Colorway[];
  selectedId?: string | null;
  onChange?: (colorway: Colorway) => void;
}> = ({ colorways, selectedId, onChange }) => {
  const initial = Math.max(0, colorways.findIndex(colorway => colorway.id === selectedId));
  const [chosen, setChosen] = React.useState(initial);
  if (colorways.length < 2) return null;
  const active = colorways[chosen] ?? colorways[0];
  return (
    <OptionPicker
      label="Colour"
      value={active.name}
      swatch={{ hex: active.hex, hex2: active.hex2 }}
      options={colorways.map((colorway, index) => ({
        id: colorway.id,
        label: colorway.name,
        note: "In stock",
        selected: index === chosen,
        pick: () => {
          setChosen(index);
          onChange?.(colorway);
        },
      }))}
    />
  );
};
