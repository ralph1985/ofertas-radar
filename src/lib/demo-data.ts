import type { Offer, Search } from "./types";

export const demoSearches: Search[] = [
  {
    id: "demo-1",
    title: "Pañales talla 4 · buena compra",
    prompt: "Busca pañales talla 4 para uso diario, con buena relación entre precio y unidades. Prioriza ofertas reales y disponibles.",
    category: "pañales",
    size: "Talla 4",
    brand: null,
    minimumQuantity: 40,
    maxPriceCents: 2200,
    preferredStores: ["Amazon", "Carrefour", "Mercadona"],
    active: true,
    updatedAt: "Hoy, 08:12",
  },
  {
    id: "demo-2",
    title: "Pañales premium sin perfume",
    prompt: "Encuentra pañales sin perfume, suaves para piel sensible y con envío razonable a España.",
    category: "pañales",
    size: "Talla 4",
    brand: "Indiferente",
    minimumQuantity: 30,
    maxPriceCents: 2800,
    preferredStores: ["Dodot", "Amazon"],
    active: false,
    updatedAt: "Ayer, 19:40",
  },
];

export const demoOffers: Offer[] = [
  {
    id: "offer-1",
    title: "Dodot Sensitive Talla 4 — 52 unidades",
    retailer: "Amazon",
    priceCents: 1899,
    unitPriceCents: 37,
    size: "Talla 4",
    quantity: 52,
    relevanceReason: "Queda por debajo de tu máximo y mejora el precio por pañal habitual.",
    url: "https://example.com/oferta-dodot-sensitive",
    status: "new",
  },
  {
    id: "offer-2",
    title: "Pañales Carrefour Baby Talla 4 — 44 unidades",
    retailer: "Carrefour",
    priceCents: 1499,
    unitPriceCents: 34,
    size: "Talla 4",
    quantity: 44,
    relevanceReason: "La mejor relación precio por unidad entre las novedades verificadas.",
    url: "https://example.com/oferta-carrefour-baby",
    status: "new",
  },
];
