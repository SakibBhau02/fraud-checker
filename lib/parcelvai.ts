import { isValidPhone } from "./phone";

export type RiskLevel = "safe" | "moderate" | "high_risk";
export interface ParsedFraud {
  phone: string; operator: string; total: number; delivered: number;
  cancelled: number; successRate: number; riskLevel: RiskLevel;
  labelBn: string; recommendation: string;
  couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[];
  raw: unknown;
}
export class UpstreamError extends Error {
  code: "UPSTREAM_AUTH" | "UPSTREAM_LIMIT" | "UPSTREAM_TIMEOUT" | "UPSTREAM_BAD";
  status: number;
  constructor(code: UpstreamError["code"], status: number, msg: string) { super(msg); this.code = code; this.status = status; }
}
function mapRisk(level: string, rate: number): RiskLevel {
  if (level === "high_risk") return "high_risk";
  if (level === "low_risk" || level === "safe") return "safe";
  if (rate >= 80) return "safe";
  if (rate >= 50) return "moderate";
  return "high_risk";
}
function sessionFromEnv(): { session: string; did: string } {
  const session = process.env.PARCELVAI_SESSION ?? "";
  const did = process.env.PARCELVAI_DID ?? "";
  if (!session) throw new UpstreamError("UPSTREAM_AUTH", 500, "PARCELVAI_SESSION missing");
  return { session, did };
}
export async function fetchFraudData(phone: string): Promise<ParsedFraud> {
  if (!isValidPhone(phone)) throw new UpstreamError("UPSTREAM_BAD", 400, "invalid phone");
  const { session, did } = sessionFromEnv();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  let res: Response;
  try {
    res = await fetch(`https://parcelvai.com/api/fraud-check?phone=${encodeURIComponent(phone)}`, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://parcelvai.com/", Accept: "application/json", Cookie: `bd_session=${session}; _bdd_did=${did}; _bdd_registered=1` },
      signal: ctrl.signal, cache: "no-store",
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") throw new UpstreamError("UPSTREAM_TIMEOUT", 504, "upstream timeout");
    throw new UpstreamError("UPSTREAM_BAD", 502, "upstream fetch failed");
  } finally { clearTimeout(t); }
  if (res.status === 401 || res.status === 403) throw new UpstreamError("UPSTREAM_AUTH", res.status, "session expired");
  if (res.status === 429) throw new UpstreamError("UPSTREAM_LIMIT", 429, "rate limited");
  if (!res.ok) throw new UpstreamError("UPSTREAM_BAD", res.status, "upstream bad status");
  const j = (await res.json()) as Record<string, unknown>;
  const summary = j.summary as { totalOrders: number; deliveredOrders: number; cancelledOrders: number; deliveryRate: number };
  const risk = j.risk as { level: string; labelBn?: string; label?: string; recommendation?: string };
  const couriers = (j.couriers as { id: string; name?: string; displayName?: string; total: number; delivered: number; cancelled: number; deliveryRate: number }[] ?? []).map((c) => ({
    id: c.id, name: c.displayName ?? c.name ?? c.id, total: c.total, delivered: c.delivered, cancelled: c.cancelled, rate: c.deliveryRate,
  }));
  return {
    phone, operator: (j.operator as string) ?? "", total: summary.totalOrders, delivered: summary.deliveredOrders,
    cancelled: summary.cancelledOrders, successRate: summary.deliveryRate,
    riskLevel: mapRisk(risk.level, summary.deliveryRate),
    labelBn: (risk.labelBn as string) ?? (risk.label as string) ?? "",
    recommendation: (risk.recommendation as string) ?? "",
    couriers, raw: j,
  };
}
export function maskPhone(p: string): string { return p.slice(0, 3) + "****" + p.slice(7); }
