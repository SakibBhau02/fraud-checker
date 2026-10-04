import { describe, expect, it, vi } from "vitest";
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { email: "t@example.com" } }),
}));
vi.mock("@/lib/parcelvai", () => ({
  fetchFraudData: async () => ({ phone: "01712345678", operator: "GP", total: 10, delivered: 8, cancelled: 2, successRate: 80, riskLevel: "safe", labelBn: "নিরাপদ", recommendation: "OK", couriers: [], raw: {} }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { checkHistory: { findFirst: async () => null, create: async (a: unknown) => a }, appSetting: { findUnique: async () => null } },
}));
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/check", () => {
  it("rejects bad phone with 400", async () => {
    const req = new NextRequest("http://x/api/check", { method: "POST", body: JSON.stringify({ phone: "0123" }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
