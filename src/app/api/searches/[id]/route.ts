import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchInputSchema } from "@/lib/validation";

async function authorized() {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
  const parsed = searchInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_search", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.search.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "search_not_found" }, { status: 404 });
  const search = await prisma.search.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ search });
}
