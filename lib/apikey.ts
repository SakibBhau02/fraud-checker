import { createHash, randomBytes } from "crypto";

export function generateApiKey(): { key: string; prefix: string } {
  const key = "fk_" + randomBytes(24).toString("hex");
  return { key, prefix: key.slice(-4) };
}
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
export function extractApiKey(headers: Headers): string | null {
  const direct = headers.get("x-api-key");
  if (direct) return direct.trim();
  const auth = headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}
