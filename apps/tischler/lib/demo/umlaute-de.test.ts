/**
 * Lienz-Demo, Punkt 3: Sichtbare deutsche Texte schreiben Umlaute aus (ä/ö/ü/ß),
 * nicht "ae/oe/ue/ss". Ein Tischlermeister liest "Streichmass" oder "saege" als Tippfehler.
 *
 * Geprüft werden alle Werte in messages/de/*.json (keine Schlüssel) und die fest
 * verdrahteten Beispielfragen in den drei Dateien, die sie anzeigen.
 * Der Wortlaut der Beispielfragen ist kein Cache-Schlüssel: der TTS-Cache hasht den
 * gesprochenen Antworttext (lib/voice/tts-cache.ts), und der lokale RAG transliteriert
 * Umlaute vor dem Suchen (lib/rag/local-rag.ts).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(__dirname, "..", "..");

// Bewusst eine feste Wortliste statt "ae|oe|ue" (sonst Fehlalarm bei "neue", "Feuer").
const ERSATZ =
  /\b\w*(fuer|ueber|saeg|pruef|schaerf|staerk|laeuf|laeng|zurueck|waehl|spaeter|hoehe|haelt|streichmass|flaeche|reiss)\w*\b/i;

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

describe("Umlaute in sichtbaren deutschen Texten", () => {
  it("messages/de: kein Wert mit ae/oe/ue/ss-Ersatzschreibung", () => {
    const dir = join(APP, "messages", "de");
    const funde: string[] = [];
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
      const out: Array<[string, string]> = [];
      werte(JSON.parse(readFileSync(join(dir, f), "utf8")), f, out);
      for (const [p, v] of out) {
        const m = v.match(ERSATZ);
        if (m) funde.push(`${p}: ${m[0]}`);
      }
    }
    expect(funde).toEqual([]);
  });

  it("Beispielfragen in voice, XR-Werkzeugleiste und XR-Seite mit Umlauten", () => {
    const dateien = [
      "app/[locale]/voice/page.tsx",
      "components/XRToolbar.tsx",
      "app/[locale]/dovetail/xr/page.tsx",
    ];
    const funde: string[] = [];
    for (const d of dateien) {
      const src = readFileSync(join(APP, d), "utf8");
      for (const m of src.matchAll(/"([^"\n]* [^"\n]*)"/g)) {
        const hit = m[1]!.match(ERSATZ);
        if (hit) funde.push(`${d}: ${m[1]}`);
      }
    }
    expect(funde).toEqual([]);
  });
});
