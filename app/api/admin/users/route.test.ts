import { describe, expect, it, vi } from "vitest";

let sessionRole: string | null = "superadmin";
vi.mock("next-auth", () => ({
  getServerSession: async () =>
    sessionRole ? { user: { email: "boss@x.com", role: sessionRole } } : null,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === "boss@x.com") return { id: "u0", email: "boss@x.com", role: "superadmin" };
        if (where.email === "dup@x.com") return { id: "u9", email: "dup@x.com", role: "member" };
        return null;
      }),
      findMany: async () => [],
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: "u1", ...data, createdAt: new Date() }),
    },
    apiKey: { deleteMany: async () => ({}) },
    checkHistory: { deleteMany: async () => ({}) },
  },
}));
import { DELETE, GET, POST } from "./route";
import { NextRequest } from "next/server";

describe("admin users API", () => {
  it("403 when not superadmin", async () => {
    sessionRole = "member";
    expect((await GET()).status).toBe(403);
    sessionRole = "superadmin";
  });
  it("400 on weak input", async () => {
    const req = new NextRequest("http://x/api/admin/users", { method: "POST", body: JSON.stringify({ name: "A", email: "a@x.com", password: "123", role: "member" }) });
    expect((await POST(req)).status).toBe(400);
  });
  it("409 on duplicate email", async () => {
    const req = new NextRequest("http://x/api/admin/users", { method: "POST", body: JSON.stringify({ name: "D", email: "dup@x.com", password: "secret1", role: "member" }) });
    expect((await POST(req)).status).toBe(409);
  });
  it("200 creates member", async () => {
    const req = new NextRequest("http://x/api/admin/users", { method: "POST", body: JSON.stringify({ name: "N", email: "n@x.com", password: "secret1", role: "member" }) });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).role).toBe("member");
  });
  it("DELETE refuses self-delete", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u0", email: "boss@x.com", role: "superadmin" } as never);
    const req = new NextRequest("http://x/api/admin/users?id=u0", { method: "DELETE" });
    expect((await DELETE(req)).status).toBe(400);
  });
});
