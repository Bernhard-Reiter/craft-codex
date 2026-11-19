import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ansichtAusSuche, blattAusSuche, bohrplanRueckweg, bohrplanRueckwegText, materialAnzeige, MesseStueckliste, schrittAusSpeicher, xrRueckweg } from "./MesseStueckliste";

vi.mock("next-intl", () => ({ useLocale: () => "de" }));

/** Druck der Messe-Stückliste: Maß bleibt in einer Zeile, damit Liste + VOAI-Vorschau auf 2 Seiten passen. */

afterEach(cleanup);

describe("MesseStueckliste Druck", () => {
  it("Maß-Zelle bricht im Druck nicht um (nowrap nur in @media print)", () => {
    const { container } = render(<MesseStueckliste />);
    const zellen = [...container.querySelectorAll("tbody td.ms-masszelle")];
    expect(zellen.length).toBeGreaterThan(0);
    expect(zellen.map((z) => z.textContent)).toContain("812 × 562 × 19");
    const css = [...container.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n");
    const druck = css.slice(css.indexOf("@media print"));
    expect(css.indexOf("@media print")).toBeGreaterThan(-1);
    expect(druck).toMatch(/\.ms-masszelle\s*\{\s*white-space:\s*nowrap;?\s*\}/);
    expect(druck).toMatch(/\.ms-tab\s*\{\s*font-size:\s*var\(--vi4-text-meta\);?\s*\}[\s\S]*\.ms-tab tr\s*\{\s*break-inside:\s*avoid;?\s*\}/);
    expect(css.slice(0, css.indexOf("@media print"))).not.toContain("ms-masszelle");
  });

  it("Verweis »Bohrplan Blatt n« ist ein Link auf genau dieses Blatt, der Bohrplan liest ?blatt=n", () => {
    const { container } = render(<MesseStueckliste />);
    const links = [...container.querySelectorAll<HTMLAnchorElement>("a.ms-blatt")];
    expect(links).toHaveLength(5);
    for (const a of links) {
      const n = a.textContent?.match(/Blatt (\d+) von 5/)?.[1];
      expect(a.getAttribute("href")).toBe(`/de/beschlag/bohrplan?vorlage=messe&blatt=${n}`);
    }
    expect([1, 2, 3, 4, 5].map((n) => blattAusSuche(`?vorlage=messe&blatt=${n}`, 5))).toEqual([0, 1, 2, 3, 4]);
    expect(["", "?blatt=0", "?blatt=6", "?blatt=x"].map((q) => blattAusSuche(q, 5))).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe("Rückweg Bohrplan -> Stückliste", () => {
  it("?ansicht=stueckliste öffnet nur bei der Messe-Vorlage die Stückliste, der Rückweg aus ?blatt=n führt dorthin", () => {
    expect(ansichtAusSuche("?vorlage=messe&ansicht=stueckliste")).toBe("stueckliste");
    expect(["", "?vorlage=messe", "?ansicht=stueckliste", "?vorlage=clip&ansicht=stueckliste"].map(ansichtAusSuche)).toEqual([
      "montage",
      "montage",
      "montage",
      "montage",
    ]);
    expect(bohrplanRueckweg("?vorlage=messe&blatt=3", 5, "de")).toBe("/de/beschlag?vorlage=messe&ansicht=stueckliste");
    expect(bohrplanRueckweg("?vorlage=messe", 5, "de")).toBe("/de/beschlag?vorlage=messe");
    expect(bohrplanRueckweg("?vorlage=messe&blatt=9", 5, "de")).toBe("/de/beschlag?vorlage=messe");
  });
});

describe("Montage-Schritt überlebt den Seitenwechsel (H3)", () => {
  it("schrittAusSpeicher nimmt nur ganze Zahlen 0..zahl-1, sonst Schritt 1", () => {
    expect([null, "", "abc", "-1", "6", "99", "2.5", "3", "0", "5"].map((r) => schrittAusSpeicher(r, 6))).toEqual([0, 0, 0, 0, 0, 0, 0, 3, 0, 5]);
  });
});

describe("Rückweg AR -> Desktop (Ziel 3, Kette am Stück)", () => {
  it("xrRueckweg hält nur die Messe-Vorlage, andere Beschläge gehen auf /beschlag", () => {
    expect(xrRueckweg("messe")).toBe("/beschlag?vorlage=messe");
    expect(["clip", "hawa", ""].map(xrRueckweg)).toEqual(["/beschlag", "/beschlag", "/beschlag"]);
  });
});

describe("Texte nennen das Ziel", () => {
  it("Menü-Text zum Rückweg und Überschrift der VOAI-Vorschau (G1, N3)", () => {
    expect([bohrplanRueckwegText("?vorlage=messe&blatt=3", 5), bohrplanRueckwegText("?vorlage=messe", 5), bohrplanRueckwegText("?blatt=9", 5)]).toEqual([
      "Zurück zur Stückliste",
      "Zurück zur Montage",
      "Zurück zur Montage",
    ]);
    const { container } = render(<MesseStueckliste />);
    const kopf = container.querySelector(".ms-voai summary")?.textContent ?? "";
    expect(kopf).toContain("Vorschau der Exportdatei");
    expect(container.textContent).not.toContain("das bekommt VOAI");
  });

  it("Material nur in der Anzeige als »Platte 19 mm roh«, auch in der Kanten-Position der Vorschau (A1 b1)", () => {
    expect(materialAnzeige("Demo-Träger 19 roh (synthetisch)")).toBe("Platte 19 mm roh");
    expect(materialAnzeige("Kante 19 mm · Demo-Träger 19 roh (synthetisch) · Annahme")).toBe("Kante 19 mm · Platte 19 mm roh · Annahme");
    expect(materialAnzeige("Eiche")).toBe("Eiche");
    expect(materialAnzeige(undefined)).toBeUndefined();
    const { container } = render(<MesseStueckliste />);
    expect(container.textContent ?? "").not.toMatch(/Demo-Träger|synthetisch/);
    expect(container.textContent ?? "").toContain("Platte 19 mm roh");
  });

  it("sichtbarer Text nennt weder Preis noch Angebot oder Kalkulation (Holper Szene 2/5, kein »kein Preis« = gratis)", () => {
    const { container } = render(<MesseStueckliste />);
    const fuss = [...container.querySelectorAll("p.ms-fuss")].map((p) => p.textContent ?? "");
    expect(fuss).toEqual([
      "Orange markiert = Annahme, noch nicht belegt.",
      "Die Datei enthält Teile und Maße.",
    ]);
    expect(container.textContent ?? "").not.toMatch(/preis|angebot|kalkulation/i);
  });
});
