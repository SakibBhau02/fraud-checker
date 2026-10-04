import { describe, expect, it } from "vitest";
import { extractApiKey, generateApiKey, hashApiKey } from "./apikey";

describe("apikey", () => {
  it("generates fk_ key with prefix", () => {
    const k = generateApiKey();
    expect(k.key.startsWith("fk_")).toBe(true);
    expect(k.prefix.length).toBe(4);
  });
  it("hash is deterministic sha256", () => {
    expect(hashApiKey("fk_abc")).toBe(hashApiKey("fk_abc"));
    expect(hashApiKey("fk_abc")).not.toBe(hashApiKey("fk_abd"));
  });
  it("extracts from x-api-key header", () => {
    const h = new Headers({ "x-api-key": "fk_test123" });
    expect(extractApiKey(h)).toBe("fk_test123");
  });
  it("extracts from Bearer token", () => {
    const h = new Headers({ authorization: "Bearer fk_test123" });
    expect(extractApiKey(h)).toBe("fk_test123");
  });
  it("returns null when missing", () => {
    expect(extractApiKey(new Headers())).toBeNull();
  });
});
