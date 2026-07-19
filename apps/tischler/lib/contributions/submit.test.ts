import { describe, expect, it } from "vitest";
import {
  buildSubmitPayload,
  parseContributionSubmit,
  TERMS_VERSION,
  type SubmitFormInput,
} from "./submit";

function validForm(): SubmitFormInput {
  return {
    title: "Schwalbenschwanz sauber anreißen",
    body_md:
      "Erst das Streichmaß auf Brettstärke einstellen, dann von der Bezugskante anreißen.",
    topic: "zinken",
    sources: [{ citation: "Fachkunde Holztechnik, 24. Auflage", url: "", page: "" }],
    licenseAccepted: true,
  };
}

describe("buildSubmitPayload + parseContributionSubmit (server action validation)", () => {
  it("accepts a valid form and stamps the fixed fields", () => {
    const parsed = parseContributionSubmit(buildSubmitPayload(validForm()));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.trade).toBe("tischler");
    expect(parsed.data.visibility).toBe("open_commons");
    expect(parsed.data.license_type).toBe("CC-BY-SA-4.0");
    expect(parsed.data.license_accepted).toBe(true);
    expect(parsed.data.terms_version).toBe(TERMS_VERSION);
  });

  it("REJECTS when the license checkbox is not ticked (hard gate)", () => {
    const parsed = parseContributionSubmit(
      buildSubmitPayload({ ...validForm(), licenseAccepted: false }),
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.join(" ")).toContain("license_accepted");
  });

  it("rejects a too-short title and too-short body", () => {
    expect(
      parseContributionSubmit(buildSubmitPayload({ ...validForm(), title: "ab" })).ok,
    ).toBe(false);
    expect(
      parseContributionSubmit(buildSubmitPayload({ ...validForm(), body_md: "kurz" })).ok,
    ).toBe(false);
  });

  it("rejects when no source remains", () => {
    const parsed = parseContributionSubmit(
      buildSubmitPayload({ ...validForm(), sources: [{ citation: " ", url: "", page: "" }] }),
    );
    expect(parsed.ok).toBe(false);
  });

  it("rejects an invalid source url but accepts an omitted one", () => {
    const bad = validForm();
    bad.sources = [{ citation: "Meisterkurs 2024", url: "nicht-eine-url", page: "" }];
    expect(parseContributionSubmit(buildSubmitPayload(bad)).ok).toBe(false);

    const good = validForm();
    good.sources = [{ citation: "Meisterkurs 2024", url: "", page: "" }];
    expect(parseContributionSubmit(buildSubmitPayload(good)).ok).toBe(true);
  });

  it("parses page numbers and drops empty/invalid ones", () => {
    const form = validForm();
    form.sources = [
      { citation: "Fachbuch", url: "https://example.org/doc", page: "42" },
      { citation: "Norm", url: "", page: "keine-zahl" },
    ];
    const payload = buildSubmitPayload(form) as {
      content: { sources: Array<{ page?: number; url?: string }> };
    };
    expect(payload.content.sources[0]).toMatchObject({ page: 42, url: "https://example.org/doc" });
    expect(payload.content.sources[1]!.page).toBeUndefined();
    expect(payload.content.sources[1]!.url).toBeUndefined();
    expect(parseContributionSubmit(payload).ok).toBe(true);
  });

  it("rejects entirely malformed input (not an object / wrong literals)", () => {
    expect(parseContributionSubmit(null).ok).toBe(false);
    expect(parseContributionSubmit("string").ok).toBe(false);
    const tampered = buildSubmitPayload(validForm()) as Record<string, unknown>;
    tampered.visibility = "tenant_private";
    expect(parseContributionSubmit(tampered).ok).toBe(false);
    const wrongLicense = buildSubmitPayload(validForm()) as Record<string, unknown>;
    wrongLicense.license_type = "MIT";
    expect(parseContributionSubmit(wrongLicense).ok).toBe(false);
  });
});
