import React from "react";

/**
 * The prototype styles every element with an inline CSS declaration string.
 * Components in this library carry those strings verbatim — byte for byte — so
 * `sx` parses one into the object React wants instead of us retyping it as
 * camelCase keys and losing the ability to diff against the prototype.
 */
export function sx(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;
    out[prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  return out as React.CSSProperties;
}

/**
 * The prototype's `style-hover="…"` attribute: the same declaration string,
 * applied while the pointer is over the element.
 */
export function useHover(base: string, hover: string) {
  const [over, setOver] = React.useState(false);
  return {
    style: sx(over ? base + ";" + hover : base),
    onMouseEnter: () => setOver(true),
    onMouseLeave: () => setOver(false),
  };
}

/** Every region takes the derived value bag the prototype's renderVals() returns. */
export type Vals = Record<string, any>;
