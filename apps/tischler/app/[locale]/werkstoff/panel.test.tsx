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

describe("Werkstoff-Panel: der Auftrag bestimmt, welche Bretter es gibt", () => {
  it("zeigt Möbel und Revision aus dem Auftrag — und die vier Teile des Plans als Schaltflächen", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Se:links/ })).toBeTruthy();
    });
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/moebel_beispiel0001/);
    expect(text).toMatch(/Revision 3/);
    expect(screen.getAllByRole("button", { name: /^(Bo|Se):/ })).toHaveLength(4);
  });

  it("tippt der Handwerker auf »Se:links«, kommt die Karte des Plan-Teils, nicht eines Katalog-Bretts", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    const knopf = await waitFor(() => screen.getByRole("button", { name: /Se:links/ }));
    knopf.click();
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Teil teil_beispielse0links/);
    });
    // Die Bezeichnung kommt aus der Karte des Plan-Teils — der Test liest sie dort, statt sie
    // zu raten; ein Katalog-Brett hieße anders.
    const karte = JSON.parse(
      readFileSync(join(BUNDLE, "karten/teil_beispielse0links.json"), "utf8"),
    ) as { werkstueck: { bezeichnung: string } };
    expect(karte.werkstueck.bezeichnung.length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(karte.werkstueck.bezeichnung);
  });

  it("ohne Auftrag im Bundle: kein Brett, sondern der Satz, dass der Auftrag fehlt", async () => {
    vi.stubGlobal("fetch", stub((url, roh) => (url.endsWith("auftrag.json") ? null : roh)));
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Kein Auftrag/);
    });
    expect(screen.queryAllByRole("button", { name: /^(Bo|Se):/ })).toHaveLength(0);
  });
});
