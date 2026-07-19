import { describe, it, expect } from "vitest";
import {
  contributionContentSchema,
  contributionSubmitSchema,
} from "./schema";

const validContent = {
  title: "Schwalbenschwanz sauber anreissen",
  body_md:
    "Zuerst das Streichmass auf Brettstaerke einstellen, dann die Grundlinie umlaufend anreissen.",
  topic: "anreissen",
  sources: [{ citation: "Eigene Werkstattpraxis, 30 Jahre Meisterbetrieb" }],
};

const validSubmit = {
  content: validContent,
  trade: "tischler",
  locale: "de-AT",
  visibility: "open_commons",
  license_type: "CC-BY-SA-4.0",
  license_accepted: true,
  terms_version: "2026-07",
} as const;

describe("contributionContentSchema", () => {
  it("accepts a valid content payload", () => {
    const res = contributionContentSchema.safeParse(validContent);
    expect(res.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const res = contributionContentSchema.safeParse({
      ...validContent,
      title: "",
    });
    expect(res.success).toBe(false);
  });

  it("rejects whitespace-only title (trimmed)", () => {
    const res = contributionContentSchema.safeParse({
      ...validContent,
      title: "   ",
    });
    expect(res.success).toBe(false);
  });

  it("rejects missing sources", () => {
    const res = contributionContentSchema.safeParse({
      ...validContent,
      sources: [],
    });
    expect(res.success).toBe(false);
  });

  it("rejects a source with invalid url", () => {
    const res = contributionContentSchema.safeParse({
      ...validContent,
      sources: [{ citation: "Fachbuch Holzverbindungen", url: "not-a-url" }],
    });
    expect(res.success).toBe(false);
  });
});

describe("contributionSubmitSchema", () => {
  it("accepts a valid submit payload", () => {
    const res = contributionSubmitSchema.safeParse(validSubmit);
    expect(res.success).toBe(true);
  });

  it("rejects when license is not accepted (false)", () => {
    const res = contributionSubmitSchema.safeParse({
      ...validSubmit,
      license_accepted: false,
    });
    expect(res.success).toBe(false);
  });

  it("rejects when license acceptance is missing", () => {
    const { license_accepted: _omitted, ...rest } = validSubmit;
    const res = contributionSubmitSchema.safeParse(rest);
    expect(res.success).toBe(false);
  });

  it("rejects a wrong license type (MIT is a software license)", () => {
    const res = contributionSubmitSchema.safeParse({
      ...validSubmit,
      license_type: "MIT",
    });
    expect(res.success).toBe(false);
  });

  it("rejects non-open-commons visibility", () => {
    const res = contributionSubmitSchema.safeParse({
      ...validSubmit,
      visibility: "tenant_private",
    });
    expect(res.success).toBe(false);
  });

  it("rejects an empty title inside the submit payload", () => {
    const res = contributionSubmitSchema.safeParse({
      ...validSubmit,
      content: { ...validContent, title: "" },
    });
    expect(res.success).toBe(false);
  });
});
