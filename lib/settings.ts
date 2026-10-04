import { prisma } from "./prisma";
export async function parcelvaiSession(): Promise<{ session: string; did: string }> {
  try {
    const [s, d] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "parcelvai_session" } }),
      prisma.appSetting.findUnique({ where: { key: "parcelvai_did" } }),
    ]);
    const session = s?.value || process.env.PARCELVAI_SESSION || "";
    const did = d?.value || process.env.PARCELVAI_DID || "";
    return { session, did };
  } catch {
    return { session: process.env.PARCELVAI_SESSION || "", did: process.env.PARCELVAI_DID || "" };
  }
}
