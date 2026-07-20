import { describe, expect, it } from "vitest";
import {
  contributionApiPayloadSchema,
  mapApiPayloadToContent,
  parseContributionApiPayload,
  sectionsToBodyMd,
  type ContributionApiPayload,
} from "./api-schema";
import { contributionContentSchema } from "./schema";

function validPayload(): Record<string, unknown> {
  return {
    source: "cody-studio",
    sourceSessionId: "studio-session-42",
    trade: "tischler",
    locale: "de-AT",
    visibility: "open_commons",
    license: "CC-BY-SA-4.0",
    title: "Schwalbenschwanz anreissen",
    topic: "zinken",
    sections: [
      { type: "procedure", markdown: "Zuerst das Werkstueck winklig hobeln und die Zinkenteilung anreissen." },
      { type: "warning", markdown: "Niemals gegen die Faser stemmen." },
    ],
    sources: [
      {
        id: "ev-1",
        type: "book",
        citation: "Fachkunde Holztechnik, 24. Auflage",
        page: 312,
      },
      { type: "web", citation: "Tischler-Fachartikel", url: "https://example.org/zinken" },
    ],
    authorName: "Testmeister",
    authorEmail: "meister@example.org",
    consents: {
      termsVersion: "2026-07",
      licenseAcceptedAt: "2026-07-20T10:00:00Z",
    },
  };
}

describe("contributionApiPayloadSchema", () => {
  it("accepts a valid payload (source cody-studio and api)", () => {
    expect(parseContributionApiPayload(validPayload()).ok).toBe(true);
    expect(parseContributionApiPayload({ ...validPayload(), source: "api" }).ok).toBe(true);
  });

  it("rejects unknown keys (strict contract)", () => {
    const r = parseContributionApiPayload({ ...validPayload(), sneaky: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join("\n")).toContain("sneaky");
  });

  it("rejects unknown keys in nested objects", () => {
    const p = validPayload();
    (p.consents as Record<string, unknown>).extra = true;
    expect(parseContributionApiPayload(p).ok).toBe(false);
  });

  it("rejects source 'web' — the web form is NOT an API client", () => {
    expect(parseContributionApiPayload({ ...validPayload(), source: "web" }).ok).toBe(false);
  });

  it("rejects javascript: and data: URLs in sources", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x"]) {
      const p = validPayload();
      p.sources = [{ citation: "boese Quelle", url }];
      const r = parseContributionApiPayload(p);
      expect(r.ok, url).toBe(false);
    }
  });

  it("rejects missing consents and invalid licenseAcceptedAt", () => {
    const noConsents = validPayload();
    delete noConsents.consents;
    expect(parseContributionApiPayload(noConsents).ok).toBe(false);

    const badDate = validPayload();
    badDate.consents = { termsVersion: "2026-07", licenseAcceptedAt: "gestern" };
    expect(parseContributionApiPayload(badDate).ok).toBe(false);
  });

  it("rejects empty sections/sources and a wrong license", () => {
    expect(parseContributionApiPayload({ ...validPayload(), sections: [] }).ok).toBe(false);
    expect(parseContributionApiPayload({ ...validPayload(), sources: [] }).ok).toBe(false);
    expect(parseContributionApiPayload({ ...validPayload(), license: "MIT" }).ok).toBe(false);
  });
});

describe("sectionsToBodyMd", () => {
  it("joins sections and prefixes warnings", () => {
    const payload = contributionApiPayloadSchema.parse(validPayload());
    const body = sectionsToBodyMd(payload.sections);
    expect(body).toContain("Zinkenteilung anreissen");
    expect(body).toContain("⚠️ Niemals gegen die Faser stemmen.");
    expect(body.split("\n\n")).toHaveLength(2);
    // Only the warning section gets the prefix:
    expect(body.startsWith("⚠️")).toBe(false);
  });
});

describe("mapApiPayloadToContent", () => {
  function parsed(overrides: Record<string, unknown> = {}): ContributionApiPayload {
    return contributionApiPayloadSchema.parse({ ...validPayload(), ...overrides });
  }

  it("maps to valid contributionContentSchema content", () => {
    const r = mapApiPayloadToContent(parsed());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // The result MUST satisfy the existing content schema (S1 pipeline unchanged):
    expect(contributionContentSchema.safeParse(r.content).success).toBe(true);
    expect(r.content.title).toBe("Schwalbenschwanz anreissen");
    expect(r.content.topic).toBe("zinken");
    expect(r.content.body_md).toContain("⚠️ Niemals gegen die Faser stemmen.");
    // Client metadata (id/type) is NOT persisted — existing source format only:
    expect(r.content.sources[0]).toEqual({
      citation: "Fachkunde Holztechnik, 24. Auflage",
      page: 312,
    });
    expect(r.content.sources[1]).toEqual({
      citation: "Tischler-Fachartikel",
      url: "https://example.org/zinken",
    });
  });

  it("defaults topic to 'allgemein' when omitted", () => {
    const p = validPayload();
    delete p.topic;
    const r = mapApiPayloadToContent(contributionApiPayloadSchema.parse(p));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.content.topic).toBe("allgemein");
  });

  it("fails when the joined body is too short for the content schema", () => {
    const r = mapApiPayloadToContent(
      parsed({ sections: [{ type: "note", markdown: "kurz" }] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join("\n")).toContain("content.body_md");
  });
});
