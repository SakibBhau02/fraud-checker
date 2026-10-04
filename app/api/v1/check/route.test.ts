import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/check", () => ({
  BadPhoneError: class BadPhoneError extends Error {},
  runFraudCheck: vi.fn(async () => ({ phone: "01712345678", total: 10, delivered: 8, cancelled: 2, successRate: 80, riskLevel: "safe", couriers: [], partial: false, cached: false, checkedAt: new Date().toISOString() })),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findUnique: async ({ where }: { where: { keyHash: string } }) =>
        where.keyHash === "goodhash" ? { id: "k1", userId: "u1", revoked: false } : null,
      update: async () => ({}),
    },
  },
}));
vi.mock("@/lib/apikey", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apikey")>();
  return { ...mod, hashApiKey: (k: string) => (k === "fk_good" ? "goodhash" : "badhash") };
});
import { POST } from "./route";
import { NextRequest } from "next/server";

function req(key: string | null, phone: unknown) {
  const headers: Record<string, string> = {};
  if (key) headers["x-api-key"] = key;
  return new NextRequest("http://x/api/v1/check", { method: "POST", headers, body: JSON.stringify({ phone }) });
}

describe("POST /api/v1/check", () => {
  it("401 without key", async () => {
    expect((await POST(req(null, "01712345678"))).status).toBe(401);
  });
  it("401 with bad key", async () => {
    expect((await POST(req("fk_bad", "01712345678"))).status).toBe(401);
  });
  it("400 with bad phone on good key", async () => {
    const { runFraudCheck } = await import("@/lib/check");
    vi.mocked(runFraudCheck).mockRejectedValueOnce(new (await import("@/lib/check")).BadPhoneError("x"));
    expect((await POST(req("fk_good", "0123"))).status).toBe(400);
  });
  it("200 with good key + phone", async () => {
    const res = await POST(req("fk_good", "01712345678"));
    expect(res.status).toBe(200);
    expect((await res.json()).phone).toBe("01712345678");
  });
});
