import { NextResponse } from "next/server";
import { COOKIE_NAME, makeSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { key?: string } | null;
  if (!body?.key || body.key !== (process.env.RADAR_ACCESS_KEY ?? "")) return NextResponse.json({ error: "invalid_key" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, makeSessionToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
