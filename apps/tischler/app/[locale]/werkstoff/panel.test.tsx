/**
 * Die Anzeigebedingung, nicht nur die Ladefunktion.
 *
 * Der Unterschied hat uns bei der Manifestprüfung eine Runde gekostet: `ladeDatengrenze` war
 * geprüft, `{grenze && …}` nicht — und genau dort entscheidet sich, ob der Handwerker den Satz
 * je sieht. Ein Wert, der geladen und nicht gezeigt wird, ist so gut wie nicht geladen
 * (Beobachtung Cody #2 an craft#44).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Werkstoffseite from "./page";

const BUNDLE = join(__dirname, "../../../public/werkstoff-bundle");

/** fetch über das echte Bundle; `aenderung` darf eine Antwort verbiegen oder wegnehmen. */
function stub(aenderung?: (url: string, roh: string) => string | null) {
  return vi.fn(async (url: string) => {
    const pfad = join(BUNDLE, String(url).replace("/werkstoff-bundle/", ""));
    if (!existsSync(pfad)) return { ok: false, status: 404 } as Response;
    const roh = readFileSync(pfad, "utf8");
    const inhalt = aenderung ? aenderung(String(url), roh) : roh;
    if (inhalt === null) return { ok: false, status: 404 } as Response;
    return { ok: true, status: 200, json: async () => JSON.parse(inhalt) } as Response;
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Werkstoff-Panel: die Grenzaussage am Werkstück", () => {
  it("zeigt beide Sätze — was entfernt wurde UND wie weit die Zusage reicht", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    // Der zweite Satz ist der wichtigere: ohne ihn hält jemand die Grenze für dichter.
    await waitFor(() => {
      expect(screen.getByText(/Feldname/i)).toBeTruthy();
    });
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Betriebsdaten|Einkaufspreise|Lieferantenpreise/i);
    expect(text).toMatch(/Feldname/i);
  });

  it("schweigt, wenn das Bundle keine Grenzaussage trägt", async () => {
    // Kein beruhigender Satz ohne Beleg — und kein Fehler, der die Karte verdeckt.
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => (url.includes("entfernt.json") ? null : roh)),
    );
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Werkstück|Werkstoff/i);
    });
    expect(document.body.textContent ?? "").not.toMatch(/Feldname/i);
  });
});
