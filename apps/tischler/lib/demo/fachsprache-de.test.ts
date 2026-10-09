/**
 * Lienz-Demo, Punkt 4: Keine Entwicklerwörter in sichtbaren deutschen Texten.
 * Ein Tischlermeister im Publikum soll "Stimme", "Schritt", "Ansicht" lesen, nicht
 * "Server-TTS", "Beat", "Mode", "localStorage" oder Befehlszeilen.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(__dirname, "..", "..");

const JARGON =
  /Template|Server-TTS|ELEVENLABS|tts:cache|\bCache\b|\bModes?\b|\bBeats?\b|Enter [AV]R|chrome:\/\/|localStorage|WebXR-Emulator/;

function werte(
  node: unknown,
  pfad: string,
  out: Array<[string, string]>,
): void {
  if (typeof node === "string") out.push([pfad, node]);
  else if (Array.isArray(node))
    node.forEach((v, i) => werte(v, `${pfad}[${i}]`, out));
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) werte(v, `${pfad}.${k}`, out);
}

describe("Fachsprache statt Entwicklerwörter (DE)", () => {
  it("messages/de: kein Wert mit Entwicklerwort", () => {
    const dir = join(APP, "messages", "de");
    const funde: string[] = [];
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
      const out: Array<[string, string]> = [];
      werte(JSON.parse(readFileSync(join(dir, f), "utf8")), f, out);
      for (const [p, v] of out) {
        const m = v.match(JARGON);
        if (m) funde.push(`${p}: ${m[0]}`);
      }
    }
    expect(funde).toEqual([]);
  });

  it("XR-Seite: AR/VR-Knöpfe kommen aus den Übersetzungen, nicht fest auf Englisch", () => {
    const src = readFileSync(
      join(APP, "app/[locale]/dovetail/xr/page.tsx"),
      "utf8",
    );
    expect(src.match(/>\s*Enter [AV]R\s*</g) ?? []).toEqual([]);
  });
});
