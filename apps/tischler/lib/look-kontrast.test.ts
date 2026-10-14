import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** WCAG 2.x: relative Leuchtdichte und Kontrastverhältnis. */
export function leuchtdichte(hex: string): number {
  const h = hex.replace("#", "");
  const kanal = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(0) + 0.7152 * kanal(2) + 0.0722 * kanal(4);
}
export function kontrast(a: string, b: string): number {
  const la = leuchtdichte(a);
  const lb = leuchtdichte(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Die Werte kommen aus look.css selbst, damit eine Farbänderung dort diesen Test trifft.
const CSS = readFileSync(join(__dirname, "../app/_vi4/look.css"), "utf8");
const T: Record<string, string> = {};
for (const m of CSS.matchAll(/--vi4-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
  if (m[1] && m[2]) T[m[1]] = m[2];
}
/** Wert aus look.css; fehlt er, scheitert der Test laut statt mit undefined zu rechnen. */
function wert(k: string): string {
  const v = T[k];
  if (!v) throw new Error(`--vi4-${k} fehlt in look.css`);
  return v;
}

const TEXT = 4.5; // 1.4.3
const UI = 3; // 1.4.11

describe("VI4-Kontraste (WCAG 2.2 AA)", () => {
  it("alle benötigten Werte stehen in look.css", () => {
    for (const k of ["brand", "brand-hover", "brand-dark", "surface", "light", "border", "ink", "ink-soft", "ink-mute", "paper", "sage"]) {
      expect(T[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it.each([
    ["ink", "paper", TEXT, "Fließtext"],
    ["ink", "surface", TEXT, "Text auf Karten"],
    ["ink", "light", TEXT, "Text auf Auswahl / Markierung"],
    ["ink-soft", "paper", TEXT, "Sekundärtext"],
    ["ink-soft", "surface", TEXT, "Sekundärtext auf Karten, deaktivierter Button"],
    ["ink-soft", "light", TEXT, "Sekundärtext auf Auswahl"],
    ["brand", "paper", TEXT, "Links, Button-Text"],
    ["brand", "surface", TEXT, "Button-Text beim Hover"],
    ["brand", "light", TEXT, "aktiver Nav-Eintrag"],
    ["paper", "brand", TEXT, "Primär-Button, gewählter Tab"],
    ["paper", "brand-hover", TEXT, "Primär-Button Hover"],
    ["paper", "brand-dark", TEXT, "Primär-Button gedrückt"],
    ["brand", "paper", UI, "Fokusring (mit Abstand auf Papier), Button-Rahmen"],
    ["ink-mute", "paper", UI, "Rahmen von Eingabefeldern und Tabs"],
    ["sage", "paper", UI, "»richtig«-Balken"],
  ] as const)("%s auf %s ≥ %s (%s)", (vorne, hinten, min, _wozu) => {
    expect(kontrast(wert(vorne), wert(hinten))).toBeGreaterThanOrEqual(min);
  });

  it("bekannte Grenzen bleiben Grenzen: border nur dekorativ, ink-mute kein Text auf surface", () => {
    expect(kontrast(wert("border"), wert("paper"))).toBeLessThan(UI);
    expect(kontrast(wert("ink-mute"), wert("surface"))).toBeLessThan(TEXT);
    // Darum: --cc-muted zeigt im Scope auf ink-soft, nicht auf ink-mute.
    expect(CSS).toMatch(/--cc-muted:\s*var\(--vi4-ink-soft\)/);
  });

  it("Rechenkern stimmt (Schwarz/Weiß = 21:1)", () => {
    expect(kontrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});
