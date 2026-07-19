import { describe, expect, it } from "vitest";
import { checkBasicAuth } from "./basic-auth";

function header(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

const USER = "meister";
const PASS = "korrekt-und-lang-genug";

describe("checkBasicAuth", () => {
  it("accepts correct credentials", async () => {
    await expect(checkBasicAuth(header(USER, PASS), USER, PASS)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    await expect(checkBasicAuth(header(USER, "falsch"), USER, PASS)).resolves.toBe(false);
  });

  it("rejects a wrong user", async () => {
    await expect(checkBasicAuth(header("eindringling", PASS), USER, PASS)).resolves.toBe(false);
  });

  it("rejects a missing header", async () => {
    await expect(checkBasicAuth(null, USER, PASS)).resolves.toBe(false);
    await expect(checkBasicAuth(undefined, USER, PASS)).resolves.toBe(false);
    await expect(checkBasicAuth("", USER, PASS)).resolves.toBe(false);
  });

  it("rejects non-Basic schemes and malformed base64", async () => {
    await expect(checkBasicAuth("Bearer abc", USER, PASS)).resolves.toBe(false);
    await expect(checkBasicAuth("Basic !!!not-base64!!!", USER, PASS)).resolves.toBe(false);
    // decodes fine but has no ":" separator
    const noColon = `Basic ${Buffer.from("nur-user-ohne-doppelpunkt").toString("base64")}`;
    await expect(checkBasicAuth(noColon, USER, PASS)).resolves.toBe(false);
  });

  it("fails CLOSED when env credentials are missing — even with a matching header", async () => {
    await expect(checkBasicAuth(header(USER, PASS), undefined, undefined)).resolves.toBe(false);
    await expect(checkBasicAuth(header(USER, PASS), USER, undefined)).resolves.toBe(false);
    await expect(checkBasicAuth(header(USER, PASS), undefined, PASS)).resolves.toBe(false);
    await expect(checkBasicAuth(header("", ""), "", "")).resolves.toBe(false);
  });

  it("handles passwords containing colons (split at FIRST colon only)", async () => {
    const tricky = "pass:mit:doppelpunkten";
    await expect(checkBasicAuth(header(USER, tricky), USER, tricky)).resolves.toBe(true);
  });
});
