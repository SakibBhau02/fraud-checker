import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone } from "./phone";

describe("phone", () => {
  it("normalizes +88017 to 017", () => {
    expect(normalizePhone("+880 1712-345678")).toBe("01712345678");
  });
  it("accepts valid Grameenphone number", () => {
    expect(isValidPhone("01712345678")).toBe(true);
  });
  it("rejects short/invalid", () => {
    expect(isValidPhone("0123")).toBe(false);
    expect(isValidPhone("02123456789")).toBe(false);
  });
});
