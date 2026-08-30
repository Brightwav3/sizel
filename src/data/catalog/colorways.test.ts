import { describe, expect, it } from "vitest";
import type { Part } from "../../shared/lib/types";
import { colorwaysFor } from "./colorways";

describe("colourway image paths", () => {
  it("uses the canonical device id for derived storage listings", () => {
    const variant: Part = {
      id: "pear-phone-16e::256gb",
      variantOf: "pear-phone-16e",
      brand: "Pear",
      name: "Pear Phone 16e 256 GB",
      price: 699,
      days: 2,
      tag: "Phone",
    };

    expect(colorwaysFor(variant, "phones")[0].imagePath).toBe(
      "/catalog/images/colorways/pear/pear-phone-16e/midnight.png",
    );
  });
});
