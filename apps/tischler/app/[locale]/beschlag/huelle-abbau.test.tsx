/**
 * huelle.js abbau(): Die VI4-Hülle meldet beim Verlassen der Seite alles ab, was sie an document/window gehängt hat.
 * Grund: Die AR-Seite geht per Next-Link ohne Neuladen zurück zur Montage; ohne abbau() bleiben die alten
 * Tasten-Handler hängen (Esc schaltet dann Karten der neuen Seite, »/« klickt in einen abgehängten Knoten).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const VI4 = join(__dirname, "../../../public/vi4-design");
const SEITEN = ["page.tsx", "xr/page.tsx", "bohrplan/page.tsx", "etiketten/page.tsx"];

type Teil = { stand: () => void; abbau: () => void };
type Eintrag = [EventTarget, string, EventListenerOrEventListenerObject, boolean];
const fang = (o: boolean | AddEventListenerOptions | undefined) => (typeof o === "object" ? !!o.capture : !!o);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.body.className = "";
});

describe("VI4-Hülle abbau() (Bau-Wort 5)", () => {
  it("menue() und baue() melden ihre Listener an document/window und den Beobachter wieder ab", async () => {
    document.body.innerHTML = '<div id="m"></div><div id="w"></div><div id="b"></div><div id="beo"></div>';
    const symbole = JSON.parse(readFileSync(join(VI4, "symbole.json"), "utf8"));
    // ok: true, sonst liefe der Test seit A1 still über den Fallback ohne Symbole (huelle-symbole.test.tsx).
    vi.stubGlobal("fetch", async () => ({ ok: true, status: 200, json: async () => symbole }));
    const fehler = vi.spyOn(console, "error");
    const an: Eintrag[] = [];
    const ab: Eintrag[] = [];
    for (const ziel of [document, window] as EventTarget[]) {
      const add = ziel.addEventListener.bind(ziel);
      const rem = ziel.removeEventListener.bind(ziel);
      vi.spyOn(ziel, "addEventListener").mockImplementation((t, f, o) => {
        an.push([ziel, t, f!, fang(o)]);
        add(t, f, o);
      });
      vi.spyOn(ziel, "removeEventListener").mockImplementation((t, f, o) => {
        ab.push([ziel, t, f!, fang(o)]);
        rem(t, f, o);
      });
    }
    const los = vi.spyOn(MutationObserver.prototype, "disconnect");

    new Function(readFileSync(join(VI4, "huelle.js"), "utf8"))();
    const H = (window as unknown as { VI4Huelle: { baue: (c: unknown) => Promise<Teil>; menue: (c: unknown) => Promise<Teil> } }).VI4Huelle;
    const m = await H.menue({ ziel: "#m", beobachte: ["#beo"] });
    const h = await H.baue({ wurzel: "#w", buehne: "#b", links: [], rechts: [], beobachte: ["#beo"] });

    // Gegenprobe Fallback: Symbole geladen -> keine Meldung, kein console.error
    expect(document.body.textContent).not.toContain("Symbole nicht geladen");
    expect(fehler).not.toHaveBeenCalled();
    // document keydown (baue), document pointerdown + window keydown in der Fangphase + window resize (menue)
    expect(an.map(([z, t, , f]) => `${z === window ? "window" : "document"} ${t}${f ? " fang" : ""}`).sort()).toEqual(
      ["document keydown", "document pointerdown", "window keydown fang", "window resize"],
    );
    document.body.classList.add("vi4-links-auf");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(document.body.classList.contains("vi4-links-auf")).toBe(false); // vor abbau: Esc schließt die Karte

    m.abbau();
    h.abbau();
    for (const [z, t, f, c] of an) {
      expect(ab.some(([z2, t2, f2, c2]) => z2 === z && t2 === t && f2 === f && c2 === c)).toBe(true);
    }
    expect(los).toHaveBeenCalledTimes(2);
    document.body.classList.add("vi4-links-auf");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(document.body.classList.contains("vi4-links-auf")).toBe(true); // nach abbau: kein alter Handler mehr
  });

  it("alle 4 Beschlag-Seiten rufen abbau() von Leiste und Werkfläche beim Verlassen", () => {
    for (const s of SEITEN) {
      const q = readFileSync(join(__dirname, s), "utf8");
      expect(q, s).toContain("const abbauListe = abbauen.current;");
      expect(q, s).toContain("abbauListe.splice(0).forEach((f) => f());");
      expect(q.match(/merke\([mh]\);/g), s).toHaveLength(2);
    }
  });

  it("wer die Seite verlässt, bevor menue()/baue() fertig sind, baut sofort ab statt zu merken (PM-GELB)", () => {
    for (const s of SEITEN) {
      const q = readFileSync(join(__dirname, s), "utf8");
      expect(q, s).toContain("const verlassen = useRef(false);");
      expect(q, s).toContain("verlassen.current = false;"); // beim Einrichten (StrictMode baut zweimal auf)
      expect(q, s).toContain("verlassen.current = true;"); // im Aufräumen
      expect(q, s).toMatch(/if \(verlassen\.current\) t\.abbau\(\);\s+else abbauen\.current\.push\(t\.abbau\);/);
    }
  });
});
