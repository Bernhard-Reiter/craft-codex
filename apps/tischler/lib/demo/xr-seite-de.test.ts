/**
 * Lienz-Demo, Punkte 7 und 5 der Analyse (Meister P3/P4):
 * - P3: /dovetail/xr ohne Headset zeigt keinen »nicht verfügbar«-Schirm, sondern
 *   einen ruhigen Hinweis »Im Headset öffnen« (de + en über i18n, nur Anzeige).
 * - P4: Oben »6 Schwalben«, unten »5 Pins« widersprach sich. Die Vorschauzeile
 *   zählt jetzt dieselben Schwalben, die die Szene zeichnet (xrParams).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const lies = (loc: string) =>
  JSON.parse(readFileSync(join(ROOT, "messages", loc, "xr.json"), "utf8"));
const seite = readFileSync(
  join(ROOT, "app", "[locale]", "dovetail", "xr", "page.tsx"),
  "utf8",
);

describe("P3: XR-Seite ohne Headset bleibt ruhig", () => {
  const de = lies("de");
  const en = lies("en");

  it("kein »nicht verfügbar« in den sichtbaren XR-Texten (de)", () => {
    expect(de.capability.unavailable).not.toMatch(/verfügbar/i);
    expect(de.fallback.title).not.toMatch(/verfügbar/i);
    expect(de.capability.unavailable).toMatch(/Im Headset öffnen/i);
    expect(de.fallback.title).toMatch(/Im Headset öffnen/);
  });

  it("kein »not available« in den sichtbaren XR-Texten (en)", () => {
    expect(en.capability.unavailable).not.toMatch(/available/i);
    expect(en.fallback.title).not.toMatch(/available/i);
    expect(en.capability.unavailable).toMatch(/open in a headset/i);
    expect(en.fallback.title).toMatch(/Open in a headset/);
  });

  it("technischer Grund erscheint nur, wenn ein Modus läuft", () => {
    // Ohne AR und VR kein »Grund: WebXR API not available« und kein »Detail: …«.
    expect(seite).toMatch(/\(support\.ar \|\| support\.vr\) && support\.reason &&/);
    expect(seite).toMatch(/<FallbackMessage \/>/);
  });
});

describe("P4: Schwalben oben und unten aus derselben Quelle", () => {
  it("Vorschauzeile zählt die gezeichneten Schwalben (xrParams)", () => {
    expect(seite).toMatch(/pins: xrParams\.pinCount/);
    expect(seite).toMatch(/ratio: xrParams\.ratio/);
    expect(seite).not.toMatch(/pins: params\.pinCount/);
  });

  it("gleiches Wort wie oben: Schwalben / tails", () => {
    expect(lies("de").preview).toMatch(/\{pins\} Schwalben/);
    expect(lies("de").preview).not.toMatch(/Pins/);
    expect(lies("en").preview).toMatch(/\{pins\} tails/);
  });
});
