import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchInputSchema } from "@/lib/validation";

async function authorized() {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!await authorized()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ searches: [] });
  return NextResponse.json({ searches: await prisma.search.findMany({ orderBy: { updatedAt: "desc" } }) });
}

export async function POST(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const parsed = searchInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_search", details: parsed.error.flatten() }, { status: 400 });
  const search = await prisma.search.create({ data: parsed.data });
  return NextResponse.json({ search }, { status: 201 });
}
