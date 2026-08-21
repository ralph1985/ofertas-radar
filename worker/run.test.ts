import { describe, expect, it } from "vitest";
import { matchesSearch } from "./filters";

const search = { size: "Talla 2", minimumQuantity: 40, maxPriceCents: 2200 };

describe("hard offer filters", () => {
  it("accepts an available matching offer", () => {
    expect(matchesSearch(search, { title: "Pañales talla 2 · 44 ud.", size: null, quantity: 44, price: 18.99, availability: "available" })).toBe(true);
  });

  it("rejects the wrong size, missing price, and unavailable offers", () => {
    expect(matchesSearch(search, { title: "Pañales talla 4 · 44 ud.", size: null, quantity: 44, price: 18.99, availability: "available" })).toBe(false);
    expect(matchesSearch(search, { title: "Pañales talla 2 · 44 ud.", size: null, quantity: 44, price: null, availability: "available" })).toBe(false);
    expect(matchesSearch(search, { title: "Pañales talla 2 · 44 ud.", size: null, quantity: 44, price: 18.99, availability: "unknown" })).toBe(false);
  });
});
