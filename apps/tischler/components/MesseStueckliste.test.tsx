import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { blattAusSuche, MesseStueckliste } from "./MesseStueckliste";

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
