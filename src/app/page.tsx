import { cookies } from "next/headers";
import { LoginForm } from "@/components/LoginForm";
import { RadarDashboard } from "@/components/RadarDashboard";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { demoOffers, demoSearches } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import type { Offer, Search } from "@/lib/types";

const OFFERS_PER_PAGE = 10;

export default async function Home({ searchParams }: { searchParams: Promise<{ signalsPage?: string }> }) {
  const cookieStore = await cookies();
  const authenticated = isValidSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!authenticated) return <LoginForm />;

  const params = await searchParams;
  const requestedPage = Number.parseInt(params.signalsPage ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const searches: Search[] = process.env.DATABASE_URL
    ? (await prisma.search.findMany({ orderBy: { updatedAt: "desc" } })).map((search) => ({ ...search, maxPriceCents: search.maxPriceCents, updatedAt: search.updatedAt.toISOString() }))
    : demoSearches;
  const offerWhere = { status: { not: "discarded" } };
  let offers: Offer[] = demoOffers;
  let offersTotal = demoOffers.length;
  if (process.env.DATABASE_URL) {
    offersTotal = await prisma.offer.count({ where: offerWhere });
    const offersPageCount = Math.max(1, Math.ceil(offersTotal / OFFERS_PER_PAGE));
    const validPage = Math.min(page, offersPageCount);
    offers = (await prisma.offer.findMany({ where: offerWhere, orderBy: { lastSeenAt: "desc" }, skip: (validPage - 1) * OFFERS_PER_PAGE, take: OFFERS_PER_PAGE })).map((offer) => ({ ...offer, status: offer.status as Offer["status"] }));
  }
  const offersPageCount = Math.max(1, Math.ceil(offersTotal / OFFERS_PER_PAGE));
  const offersPage = Math.min(page, offersPageCount);
  return <RadarDashboard initialSearches={searches} initialOffers={offers} offersPage={offersPage} offersPageCount={offersPageCount} offersTotal={offersTotal} demoMode={!process.env.DATABASE_URL} />;
}
