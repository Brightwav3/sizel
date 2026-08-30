import React from "react";
import { OptionPicker } from "./OptionPicker";
import type { Colorway } from "../data/colorways";

/**
 * Colour is chosen on the page and nowhere else: the catalog has one record
 * and one photograph per device, so a finish has no listing of its own yet.
 * The selection lives here rather than in app state for that reason — nothing
 * downstream can act on it.
 */
export const ColorPicker: React.FC<{ colorways: Colorway[] }> = ({ colorways }) => {
  const [chosen, setChosen] = React.useState(0);
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
        pick: () => setChosen(index),
      }))}
    />
  );
};
