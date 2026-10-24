import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Startseite im VI4-Look (Stufe 2): Wrapper und look.css auf der Seite, kein
 * Signalgelb als fester Wert in der Seite und den Komponenten, die sie einbindet.
 * Die Kontraste der neuen Regeln rechnet lib/look-kontrast.test.ts nach.
 */
const lies = (pfad: string) => readFileSync(join(__dirname, "..", pfad), "utf8");

const SEITE = lies("app/[locale]/page.tsx");
const CSS = lies("app/_vi4/look.css");
const KOMPONENTEN = [
  "components/DemoResetButton.tsx",
  "components/SystemStatus.tsx",
  "components/SiteFooter.tsx",
  "components/SiteHeader.tsx",
  "components/DovetailMark.tsx",
];

/** Signalgelb des alten Looks als Zahl: Hex wie in lib/look-xr.test.ts, dazu #b58900 und die rgba-Formen aus globals.css. */
const GELB = /#(ffed00|ffd34d|f5c518|ffd400|e0bc00|b58900)\b|rgba?\(\s*(255,\s*212,\s*0|224,\s*188,\s*0)\b/i;

describe("Startseite im VI4-Look", () => {
  it("lädt look.css und hüllt alles in data-look=\"vi4\", Lienz-Knopf und Fußzeile inklusive", () => {
    expect(SEITE).toContain('import "../_vi4/look.css";');
    expect(SEITE).toMatch(/return \(\s*<div data-look="vi4" className="vi4-flaeche">/);
    const auf = SEITE.indexOf('<div data-look="vi4"');
    const zu = SEITE.lastIndexOf("</div>");
    for (const teil of ["<SystemStatus />", "<DemoResetButton />", "<SiteFooter />"]) {
      const i = SEITE.indexOf(teil);
      expect(i, teil).toBeGreaterThan(auf);
      expect(i, teil).toBeLessThan(zu);
    }
  });

  it("»Demo zurücksetzen« wischt weiter die craft-codex-Schlüssel und lädt neu", () => {
    const knopf = lies("components/DemoResetButton.tsx");
    expect(knopf).toContain('key.startsWith("craft-codex:")');
    expect(knopf).toContain("window.location.reload()");
  });

  it("die Seite nennt kein Signalgelb, auch nicht über --cc-yellow", () => {
    expect(SEITE).not.toMatch(GELB);
    expect(SEITE).not.toContain("--cc-yellow");
  });

  it.each(KOMPONENTEN)("%s enthält kein Signalgelb als festen Wert", (pfad) => {
    expect(lies(pfad)).not.toMatch(GELB);
  });

  it("look.css hat Regeln für die Gelb-Stellen der Startseite", () => {
    for (const sel of [".cc-mark", ".cc-card-num", ".cc-hl", ".cc-btn--dark", ".cc-btn--danger", ".cc-card--dark .cc-kicker", ".cc-card--dark .cc-hl", ".cc-footer a", ".cc-footer-claim em", ".cc-footer-meta", ".cc-footer :focus-visible"]) {
      expect(CSS, sel).toContain(`[data-look="vi4"] ${sel}`);
    }
  });

  it("look.css bringt keine neuen VI4-Werte mit (14: 11 Farben, 2 Radien, Kopfhöhe)", () => {
    const werte = [...CSS.matchAll(/--vi4-([a-z-]+):/g)].map((m) => m[1]);
    expect(werte).toHaveLength(14);
    expect(new Set(werte).size).toBe(14);
  });

  it("Gegenprobe: das Muster erkennt die alten Gelbwerte", () => {
    expect(GELB.test('fill="#FFD400"')).toBe(true);
    expect(GELB.test("box-shadow: 0 0 0 3px rgba(255, 212, 0, 0.25)")).toBe(true);
    expect(GELB.test("--color-accent-warm: #b58900;")).toBe(true);
    expect(GELB.test('fill="var(--cc-yellow)"')).toBe(false);
    expect(GELB.test('color="#2c4b7a"')).toBe(false);
  });
});
