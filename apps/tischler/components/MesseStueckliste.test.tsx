import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MesseStueckliste } from "./MesseStueckliste";

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
});
