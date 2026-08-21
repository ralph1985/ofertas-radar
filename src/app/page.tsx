import { cookies } from "next/headers";
import { LoginForm } from "@/components/LoginForm";
import { RadarDashboard } from "@/components/RadarDashboard";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { demoOffers, demoSearches } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import type { Offer, Search } from "@/lib/types";

export default async function Home() {
  const cookieStore = await cookies();
  const authenticated = isValidSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!authenticated) return <LoginForm />;

  const searches: Search[] = process.env.DATABASE_URL
    ? (await prisma.search.findMany({ orderBy: { updatedAt: "desc" } })).map((search) => ({ ...search, maxPriceCents: search.maxPriceCents, updatedAt: search.updatedAt.toISOString() }))
    : demoSearches;
  const offers: Offer[] = process.env.DATABASE_URL
    ? (await prisma.offer.findMany({ where: { status: { not: "discarded" } }, orderBy: { lastSeenAt: "desc" }, take: 10 })).map((offer) => ({ ...offer, status: offer.status as Offer["status"] }))
    : demoOffers;
  return <RadarDashboard initialSearches={searches} initialOffers={offers} demoMode={!process.env.DATABASE_URL} />;
}
