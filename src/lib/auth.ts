import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "radar_session";

function secret() {
  return process.env.RADAR_SESSION_SECRET ?? "development-only-secret";
}

export function makeSessionToken() {
  const payload = `${Date.now()}.${process.env.RADAR_ACCESS_KEY ?? ""}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [timestamp, accessKey, signature] = parts;
  if (!timestamp || !signature || Date.now() - Number(timestamp) > 1000 * 60 * 60 * 24 * 30) return false;
  const expected = createHmac("sha256", secret()).update(`${timestamp}.${accessKey}`).digest("hex");
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature)) && accessKey === (process.env.RADAR_ACCESS_KEY ?? "");
}

export { COOKIE_NAME };
