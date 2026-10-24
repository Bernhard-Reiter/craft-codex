import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(join(__dirname, "../app/_vi4/look.css"), "utf8");
const SCOPE = '[data-look="vi4"]';

/** Liefert alle Selektor-Listen (Text vor »{«) außer At-Regeln, auch in @media verschachtelt. */
export function selektoren(css: string): string[] {
  const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let kopf = "";
  for (const z of ohneKommentare) {
    if (z === "{") {
      const k = kopf.trim();
      if (!k.startsWith("@")) out.push(k);
      kopf = "";
    } else if (z === "}" || z === ";") {
      kopf = "";
    } else {
      kopf += z;
    }
  }
  return out.flatMap((k) => k.split(",").map((s) => s.trim())).filter(Boolean);
}

describe("app/_vi4/look.css bleibt im Scope", () => {
  const alle = selektoren(CSS);

  it("hat Regeln (Parser findet etwas)", () => {
    expect(alle.length).toBeGreaterThan(30);
  });

  it(`jeder Selektor beginnt mit ${SCOPE}`, () => {
    const ausserhalb = alle.filter((s) => !s.startsWith(SCOPE));
    expect(ausserhalb).toEqual([]);
  });

  it("keine globalen Ziele und kein !important", () => {
    expect(CSS).not.toMatch(/:root|(^|[\s,}])(html|body)\s*[{,]/);
    expect(CSS).not.toMatch(/!important/);
    expect(CSS).not.toMatch(/@import|@font-face/);
  });

  it("Gegenprobe: der Parser erkennt einen Selektor außerhalb des Scopes", () => {
    const kaputt = `${CSS}\n.cc-btn { color: red; }\n@media (min-width: 1px) { body { color: red; } }`;
    const ausserhalb = selektoren(kaputt).filter((s) => !s.startsWith(SCOPE));
    expect(ausserhalb).toEqual([".cc-btn", "body"]);
  });
});
