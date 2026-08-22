import { describe, expect, it } from "vitest";
import { renderOffersDigest } from "./render-offers-digest";

describe("offers digest email", () => {
  it("renders grouped offers with summary, metadata and CTA", async () => {
    const { html, text } = await renderOffersDigest({
      generatedAt: new Date("2026-08-22T08:30:00.000Z"),
      groups: [{
        searchTitle: "Pañales talla 2 & piel sensible",
        offers: [{
          title: "Pañales <ahora> talla 2",
          retailer: "Tienda Ejemplo",
          price: "18,99 €",
          unitPrice: "0,43 €",
          size: "Talla 2",
          quantity: 44,
          reason: "Cumple los filtros y está disponible.",
          url: "https://example.com/oferta?a=1&b=2",
        }],
      }],
    });

    expect(html).toContain("Lo que merece la pena revisar");
    expect(html).toContain("Pañales &lt;ahora&gt; talla 2");
    expect(html).toContain("18,99 €");
    expect(html).toContain("44 uds.");
    expect(html).toContain("Ver oferta");
    expect(html).toContain("https://example.com/oferta?a=1&amp;b=2");
    expect(text).toContain("Pañales <ahora> talla 2");
    expect(text).toContain("https://example.com/oferta?a=1&b=2");
  });

  it("does not add a unit suffix when unit price is unavailable", async () => {
    const { html, text } = await renderOffersDigest({
      generatedAt: new Date("2026-08-22T08:30:00.000Z"),
      groups: [{
        searchTitle: "Oferta sin precio unitario",
        offers: [{
          title: "Producto",
          retailer: "Tienda",
          price: "Consultar",
          unitPrice: "Consultar",
          size: null,
          quantity: null,
          reason: "Revisa el precio en la tienda.",
          url: "https://example.com/producto",
        }],
      }],
    });

    expect(html).not.toContain("Consultar/ud.");
    expect(text).toContain("OFERTA SIN PRECIO UNITARIO");
  });
});
