import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { runCodex } from "./run-codex";
import { sendDigest } from "./email";
import { matchesSearch } from "./filters";
import { renderOffersDigest, type DigestGroup } from "./emails/render-offers-digest";

dotenv.config({ path: process.env.RADAR_ENV_FILE ?? ".env.local" });

const prisma = new PrismaClient();
const money = (cents: number | null) => cents === null ? "Consultar" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL es obligatorio para ejecutar el worker.");
  const searches = await prisma.search.findMany({ where: { active: true } });
  const newOffers: Array<{ searchTitle: string; title: string; retailer: string; price: string; unitPrice: string; size: string | null; quantity: number | null; reason: string; url: string }> = [];
  let totalCandidates = 0;
  let totalMatchingCandidates = 0;
  let failedSearches = 0;
  for (const search of searches) {
    const run = await prisma.run.create({ data: { searchId: search.id, status: "running" } });
    try {
      const candidates = await runCodex(search);
      const matchingCandidates = candidates.filter((candidate) => matchesSearch(search, candidate));
      totalCandidates += candidates.length;
      totalMatchingCandidates += matchingCandidates.length;
      let created = 0;
      for (const candidate of matchingCandidates) {
        const offer = await prisma.offer.upsert({ where: { searchId_url: { searchId: search.id, url: candidate.url } }, create: { searchId: search.id, title: candidate.title, url: candidate.url, retailer: candidate.retailer, priceCents: candidate.price === null ? null : Math.round(candidate.price * 100), unitPriceCents: candidate.unitPrice === null ? null : Math.round(candidate.unitPrice * 100), currency: candidate.currency, brand: candidate.brand, size: candidate.size, quantity: candidate.quantity, availability: candidate.availability, confidence: candidate.confidence, evidence: candidate.evidence, relevanceReason: candidate.relevanceReason }, update: { priceCents: candidate.price === null ? null : Math.round(candidate.price * 100), unitPriceCents: candidate.unitPrice === null ? null : Math.round(candidate.unitPrice * 100), availability: candidate.availability, evidence: candidate.evidence, relevanceReason: candidate.relevanceReason, lastSeenAt: new Date() } });
        if (offer.status === "new" && !offer.sentAt) { created++; newOffers.push({ searchTitle: search.title, title: offer.title, retailer: offer.retailer, price: money(offer.priceCents), unitPrice: money(offer.unitPriceCents), size: offer.size, quantity: offer.quantity, reason: offer.relevanceReason, url: offer.url }); }
      }
      await prisma.run.update({ where: { id: run.id }, data: { status: "completed", finishedAt: new Date(), candidates: candidates.length, newOffers: created } });
      console.log(`[${search.title}] candidatas: ${candidates.length} · válidas: ${matchingCandidates.length} · nuevas: ${created}`);
    } catch (error) {
      failedSearches++;
      await prisma.run.update({ where: { id: run.id }, data: { status: "failed", finishedAt: new Date(), errorMessage: error instanceof Error ? error.message : String(error) } });
      console.error(`[${search.title}] ERROR:`, error instanceof Error ? error.message : String(error));
    }
  }
  if (newOffers.length > 0) {
    const reviewDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(new Date());
    const subject = `Ofertas Radar · ${newOffers.length} novedad${newOffers.length === 1 ? "" : "es"} · ${reviewDate}`;
    const groups = newOffers.reduce<DigestGroup[]>((result, offer) => {
      const group = result.find((item) => item.searchTitle === offer.searchTitle);
      const digestOffer = { title: offer.title, retailer: offer.retailer, price: offer.price, unitPrice: offer.unitPrice, size: offer.size, quantity: offer.quantity, reason: offer.reason, url: offer.url };
      if (group) group.offers.push(digestOffer);
      else result.push({ searchTitle: offer.searchTitle, offers: [digestOffer] });
      return result;
    }, []);
    const { html, text } = await renderOffersDigest({ groups, generatedAt: new Date() });
    const delivery = await sendDigest(subject, html, text);
    console.log(`Digest enviado: ${delivery.id} · destinatarios: ${delivery.recipients}`);
    await prisma.offer.updateMany({ where: { url: { in: newOffers.map((offer) => offer.url) }, sentAt: null }, data: { sentAt: new Date() } });
  } else console.log("Sin ofertas nuevas: no se envió digest.");
  console.log(`Revisión completada: búsquedas=${searches.length} · candidatas=${totalCandidates} · válidas=${totalMatchingCandidates} · nuevas=${newOffers.length} · fallos=${failedSearches}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
