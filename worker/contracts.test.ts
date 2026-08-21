import { describe, expect, it } from "vitest";
import { parseCodexResponse } from "./contracts";

describe("Codex output contract", () => {
  it("accepts valid candidates", () => {
    const result = parseCodexResponse(JSON.stringify({ candidates: [{ title: "Pañales", url: "https://example.com/p", retailer: "Tienda", price: 12, currency: "EUR", unitPrice: 0.3, brand: null, size: "Talla 4", quantity: 40, availability: "available", expiresAt: null, evidence: ["Precio visible"], relevanceReason: "Encaja", confidence: "high" }] }));
    expect(result.candidates).toHaveLength(1);
  });

  it("rejects candidates without evidence", () => {
    expect(() => parseCodexResponse(JSON.stringify({ candidates: [{ title: "Pañales", url: "https://example.com/p", retailer: "Tienda", price: 12, currency: "EUR", unitPrice: null, brand: null, size: null, quantity: null, availability: "available", expiresAt: null, evidence: [], relevanceReason: "Encaja", confidence: "high" }] }))).toThrow();
  });

  it("normalizes aliases and textual values returned by Codex", () => {
    const result = parseCodexResponse(JSON.stringify({ candidates: [{ name: "Pañales talla 2", link: "https://tienda.example/panales", store: "Tienda Ejemplo", price_eur: "14,99 €", units: "40", stock: "disponible", details: "Precio visible en la ficha" }] }));
    expect(result.candidates[0]).toMatchObject({ title: "Pañales talla 2", retailer: "Tienda Ejemplo", price: 14.99, quantity: 40, availability: "available", evidence: ["Precio visible en la ficha"], currency: "EUR" });
  });
});
