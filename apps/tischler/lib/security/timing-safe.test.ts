import { describe, expect, it } from "vitest";
import { constantTimeEqual, sha256, timingSafeEqualStrings } from "./timing-safe";

describe("constantTimeEqual", () => {
  it("compares equal and differing byte arrays", () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([]), new Uint8Array([]))).toBe(true);
  });
});

describe("sha256", () => {
  it("returns a stable 32-byte digest", async () => {
    const a = await sha256("craft-codex");
    const b = await sha256("craft-codex");
    expect(a.length).toBe(32);
    expect(constantTimeEqual(a, b)).toBe(true);
  });
});

describe("timingSafeEqualStrings", () => {
  it("matches equal strings and rejects different ones", async () => {
    await expect(timingSafeEqualStrings("tok", "tok")).resolves.toBe(true);
    await expect(timingSafeEqualStrings("tok", "tak")).resolves.toBe(false);
    // Different lengths never leak via early exit (digests are fixed-size).
    await expect(timingSafeEqualStrings("short", "much-longer-token")).resolves.toBe(false);
    await expect(timingSafeEqualStrings("", "")).resolves.toBe(true);
  });
});
