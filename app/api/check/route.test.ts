import { describe, expect, it, vi } from "vitest";
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { email: "t@example.com" } }),
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: null }),
}));
vi.mock("@/lib/parcelvai", () => ({
  fetchFraudData: async () => ({ phone: "01712345678", operator: "GP", total: 10, delivered: 8, cancelled: 2, successRate: 80, riskLevel: "safe", labelBn: "নিরাপদ", recommendation: "OK", couriers: [], raw: {} }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    checkHistory: {
      findFirst: async () => null,
      create: async (a: unknown) => a,
      count: vi.fn(async () => 0),
    },
    appSetting: { findUnique: async () => null },
    user: { findUnique: async () => ({ id: "u1", role: "member" }) },
  },
}));
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/check", () => {
  it("rejects bad phone with 400", async () => {
    const req = new NextRequest("http://x/api/check", { method: "POST", body: JSON.stringify({ phone: "0123" }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
  it("429 when daily quota over", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.checkHistory.count).mockResolvedValueOnce(50);
    const req = new NextRequest("http://x/api/check", { method: "POST", body: JSON.stringify({ phone: "01712345678" }) });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
  it("200 with quota remaining", async () => {
    const req = new NextRequest("http://x/api/check", { method: "POST", body: JSON.stringify({ phone: "01712345678" }) });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).quota.remaining).toBe(49);
  });
});
