import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { runCodex } from "./run-codex";
import { sendDigest } from "./email";
import { matchesSearch } from "./filters";

dotenv.config({ path: process.env.RADAR_ENV_FILE ?? ".env.local" });

const prisma = new PrismaClient();
const money = (cents: number | null) => cents === null ? "Consultar" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL es obligatorio para ejecutar el worker.");
  const searches = await prisma.search.findMany({ where: { active: true } });
  const newOffers: Array<{ title: string; retailer: string; price: string; unitPrice: string; reason: string; url: string }> = [];
  for (const search of searches) {
    const run = await prisma.run.create({ data: { searchId: search.id, status: "running" } });
    try {
      const candidates = await runCodex(search);
      const matchingCandidates = candidates.filter((candidate) => matchesSearch(search, candidate));
      let created = 0;
      for (const candidate of matchingCandidates) {
        const offer = await prisma.offer.upsert({ where: { searchId_url: { searchId: search.id, url: candidate.url } }, create: { searchId: search.id, title: candidate.title, url: candidate.url, retailer: candidate.retailer, priceCents: candidate.price === null ? null : Math.round(candidate.price * 100), unitPriceCents: candidate.unitPrice === null ? null : Math.round(candidate.unitPrice * 100), currency: candidate.currency, brand: candidate.brand, size: candidate.size, quantity: candidate.quantity, availability: candidate.availability, confidence: candidate.confidence, evidence: candidate.evidence, relevanceReason: candidate.relevanceReason }, update: { priceCents: candidate.price === null ? null : Math.round(candidate.price * 100), unitPriceCents: candidate.unitPrice === null ? null : Math.round(candidate.unitPrice * 100), availability: candidate.availability, evidence: candidate.evidence, relevanceReason: candidate.relevanceReason, lastSeenAt: new Date() } });
        if (offer.status === "new" && !offer.sentAt) { created++; newOffers.push({ title: offer.title, retailer: offer.retailer, price: money(offer.priceCents), unitPrice: money(offer.unitPriceCents), reason: offer.relevanceReason, url: offer.url }); }
      }
      await prisma.run.update({ where: { id: run.id }, data: { status: "completed", finishedAt: new Date(), candidates: candidates.length, newOffers: created } });
    } catch (error) {
      await prisma.run.update({ where: { id: run.id }, data: { status: "failed", finishedAt: new Date(), errorMessage: error instanceof Error ? error.message : String(error) } });
      console.error(`[${search.title}]`, error);
    }
  }
  if (newOffers.length > 0) {
    const subject = `Ofertas Radar · ${newOffers.length} novedad${newOffers.length === 1 ? "" : "es"}`;
    const text = newOffers.map((offer) => `${offer.title}\n${offer.retailer} · ${offer.price} · ${offer.unitPrice}/ud.\n${offer.reason}\n${offer.url}`).join("\n\n");
    const html = `<div style="font-family:Arial,sans-serif;max-width:680px"><h1>Ofertas Radar</h1><p>${newOffers.length} novedades encontradas.</p>${newOffers.map((offer) => `<article><h2>${escapeHtml(offer.title)}</h2><p><strong>${escapeHtml(offer.price)}</strong> · ${escapeHtml(offer.unitPrice)}/ud. · ${escapeHtml(offer.retailer)}</p><p>${escapeHtml(offer.reason)}</p><p><a href="${escapeHtml(offer.url)}">Ver oferta</a></p></article>`).join("")}<small>Comprueba precio y disponibilidad antes de comprar.</small></div>`;
    const delivery = await sendDigest(subject, html, text);
    console.log(`Digest enviado: ${delivery.id}`);
    await prisma.offer.updateMany({ where: { url: { in: newOffers.map((offer) => offer.url) }, sentAt: null }, data: { sentAt: new Date() } });
  } else console.log("Sin ofertas nuevas.");
}

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
