import { cookies } from "next/headers";
import { LoginForm } from "@/components/LoginForm";
import { RadarDashboard } from "@/components/RadarDashboard";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { demoSearches } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import type { Search } from "@/lib/types";

export default async function Home() {
  const cookieStore = await cookies();
  const authenticated = isValidSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!authenticated) return <LoginForm />;

  const searches: Search[] = process.env.DATABASE_URL
    ? (await prisma.search.findMany({ orderBy: { updatedAt: "desc" } })).map((search) => ({ ...search, maxPriceCents: search.maxPriceCents, updatedAt: search.updatedAt.toISOString() }))
    : demoSearches;
  return <RadarDashboard initialSearches={searches} demoMode={!process.env.DATABASE_URL} />;
}
