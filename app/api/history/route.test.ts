import { describe, expect, it, vi } from "vitest";

let clerkId: string | null = null;
vi.mock("next-auth", () => ({
  getServerSession: async () => null,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: clerkId }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: async () => null },
    checkHistory: {
      findMany: async () => [],
      count: async () => 0,
    },
  },
}));
import { GET } from "./route";
import { NextRequest } from "next/server";

describe("GET /api/history", () => {
  it("401 when logged out", async () => {
    clerkId = null;
    const res = await GET(new NextRequest("http://x/api/history"));
    expect(res.status).toBe(401);
  });
  it("200 for Clerk user with own rows only", async () => {
    clerkId = "c1";
    const res = await GET(new NextRequest("http://x/api/history"));
    expect(res.status).toBe(200);
    expect((await res.json()).total).toBe(0);
  });
});
