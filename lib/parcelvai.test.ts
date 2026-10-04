import { describe, expect, it, vi } from "vitest";
import { fetchFraudData } from "./parcelvai";

const sample = {
  success: true, phone: "01712345678", operator: "Grameenphone",
  summary: { totalOrders: 413, deliveredOrders: 228, cancelledOrders: 185, deliveryRate: 55 },
  risk: { level: "high_risk", labelBn: "উচ্চ ঝুঁকি (High Risk)", recommendation: "অগ্রিম চার্জ নিন।" },
  couriers: [{ id: "pathao", name: "Pathao", displayName: "Pathao Courier", status: "success", total: 397, delivered: 221, cancelled: 176, deliveryRate: 56 }],
};

describe("fetchFraudData", () => {
  it("parses upstream into slim DTO", async () => {
    process.env.PARCELVAI_SESSION = "test-session";
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(sample), { status: 200 }));
    const out = await fetchFraudData("01712345678");
    expect(out.total).toBe(413);
    expect(out.riskLevel).toBe("high_risk");
    expect(out.couriers[0].id).toBe("pathao");
    vi.unstubAllGlobals();
  });
  it("throws UpstreamAuth on 401", async () => {
    process.env.PARCELVAI_SESSION = "test-session";
    vi.stubGlobal("fetch", async () => new Response("unauthorized", { status: 401 }));
    await expect(fetchFraudData("01712345678")).rejects.toMatchObject({ code: "UPSTREAM_AUTH" });
    vi.unstubAllGlobals();
  });
});
