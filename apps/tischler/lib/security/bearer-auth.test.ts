import { describe, expect, it } from "vitest";
import { checkBearerAuth } from "./bearer-auth";

const TOKEN = "ccapi_0123456789abcdef0123456789abcdef0123456789abcdef";

describe("checkBearerAuth", () => {
  it("accepts the correct token", async () => {
    await expect(checkBearerAuth(`Bearer ${TOKEN}`, TOKEN)).resolves.toBe("ok");
  });

  it("rejects a wrong token", async () => {
    await expect(checkBearerAuth("Bearer ccapi_wrong", TOKEN)).resolves.toBe("unauthorized");
  });

  it("rejects missing or non-Bearer headers", async () => {
    await expect(checkBearerAuth(null, TOKEN)).resolves.toBe("unauthorized");
    await expect(checkBearerAuth(undefined, TOKEN)).resolves.toBe("unauthorized");
    await expect(checkBearerAuth("", TOKEN)).resolves.toBe("unauthorized");
    await expect(checkBearerAuth(`Basic ${TOKEN}`, TOKEN)).resolves.toBe("unauthorized");
    await expect(checkBearerAuth("Bearer ", TOKEN)).resolves.toBe("unauthorized");
  });

  it("fails CLOSED when no token is configured — even with a matching header", async () => {
    await expect(checkBearerAuth(`Bearer ${TOKEN}`, undefined)).resolves.toBe("unconfigured");
    await expect(checkBearerAuth(`Bearer ${TOKEN}`, "")).resolves.toBe("unconfigured");
  });
});
