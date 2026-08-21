import { z } from "zod";

export const offerCandidateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  retailer: z.string().min(1),
  price: z.number().nonnegative().nullable(),
  currency: z.literal("EUR"),
  unitPrice: z.number().nonnegative().nullable(),
  brand: z.string().nullable(),
  size: z.string().nullable(),
  quantity: z.number().int().positive().nullable(),
  availability: z.enum(["available", "unknown", "unavailable"]),
  expiresAt: z.string().nullable(),
  evidence: z.array(z.string().min(1)).min(1),
  relevanceReason: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
});

export const codexResponseSchema = z.object({
  candidates: z.array(offerCandidateSchema),
});

export type OfferCandidate = z.infer<typeof offerCandidateSchema>;

function stringValue(value: unknown, fallback: string | null = null) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s/g, "");
  if (!clean) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const match = normalized.replace(/[^0-9.-]/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function retailerFromUrl(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "Tienda desconocida"; }
}

function availabilityValue(value: unknown) {
  if (value === true) return "available" as const;
  if (value === false) return "unavailable" as const;
  const normalized = String(value ?? "unknown").toLowerCase();
  if (/available|disponible|stock|in stock/.test(normalized)) return "available" as const;
  if (/unavailable|agotado|out of stock|sin stock/.test(normalized)) return "unavailable" as const;
  return "unknown" as const;
}

function evidenceValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => stringValue(item)).filter((item): item is string => Boolean(item));
  const text = stringValue(value);
  return text ? [text] : [];
}

function normalizeCandidate(value: unknown) {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const url = stringValue(item.url ?? item.link ?? item.sourceUrl, "") ?? "";
  return {
    title: stringValue(item.title ?? item.name ?? item.product, "Oferta sin título"),
    url,
    retailer: stringValue(item.retailer ?? item.store ?? item.merchant ?? item.shop, retailerFromUrl(url)),
    price: numberValue(item.price ?? item.priceEur ?? item.price_eur ?? item.totalPrice),
    currency: "EUR",
    unitPrice: numberValue(item.unitPrice ?? item.unit_price ?? item.pricePerUnit ?? item.price_per_unit),
    brand: stringValue(item.brand),
    size: stringValue(item.size ?? item.diaperSize),
    quantity: numberValue(item.quantity ?? item.units ?? item.count),
    availability: availabilityValue(item.availability ?? item.stock),
    expiresAt: stringValue(item.expiresAt ?? item.expiry),
    evidence: evidenceValue(item.evidence ?? item.source ?? item.details),
    relevanceReason: stringValue(item.relevanceReason ?? item.reason ?? item.summary, "Resultado encontrado por Codex"),
    confidence: (stringValue(item.confidence, "medium") ?? "medium").toLowerCase(),
  };
}

export function parseCodexResponse(text: string) {
  const jsonStart = Math.min(...[text.indexOf("{"), text.indexOf("[")].filter((index) => index >= 0));
  const jsonEnd = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (!Number.isFinite(jsonStart) || jsonEnd <= jsonStart) throw new Error("Codex no devolvió JSON.");
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as unknown;
  const candidates = Array.isArray(parsed) ? parsed : ((parsed as Record<string, unknown>).candidates ?? (parsed as Record<string, unknown>).offers ?? (parsed as Record<string, unknown>).results);
  if (!Array.isArray(candidates)) throw new Error("Codex no devolvió una lista de candidatos.");
  return codexResponseSchema.parse({ candidates: candidates.map(normalizeCandidate) });
}
