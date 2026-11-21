/**
 * huelle.js ohne symbole.json (404 oder offline): Die Hülle lehnt nie ab. Menü und Werkfläche bleiben bedienbar,
 * die Einträge stehen als Text da, ohne Fragezeichen-Symbol und ohne Warnung je Verb. Dazu genau ein console.error
 * und einmal die Meldung »Symbole nicht geladen« als eigenes Element in der Leiste, die Meldung der Seite bleibt.
 * Vorbild: huelle-abbau.test.tsx (huelle.js per new Function in jsdom, fetch-Stub VOR dem Laden, weil bereit beim Laden entsteht).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const VI4 = join(__dirname, "../../../public/vi4-design");
const MELDUNG = "Symbole nicht geladen";

type Teil = { stand: () => void; abbau: () => void };
type Huelle = { baue: (c: unknown) => Promise<Teil>; menue: (c: unknown) => Promise<Teil> };

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.body.className = "";
});

/** Lädt huelle.js mit dem gegebenen fetch, baut Leiste und Werkfläche wie eine Seite (mit eigener Meldung). */
async function lade(fetchStub: () => Promise<unknown>) {
  document.body.innerHTML = '<div id="m"></div><div id="w"></div><div id="b"></div><span id="seite-meldung">Seite meldet</span>';
  vi.stubGlobal("fetch", fetchStub);
  const fehler = vi.spyOn(console, "error").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  new Function(readFileSync(join(VI4, "huelle.js"), "utf8"))();
  const H = (window as unknown as { VI4Huelle: Huelle }).VI4Huelle;
  const m = await H.menue({
    ziel: "#m",
    name: { titel: "Montage" },
    meldung: ["#seite-meldung"],
    menues: { datei: [{ t: "Speichern", tun: () => {} }] },
  });
  const h = await H.baue({
    wurzel: "#w",
    buehne: "#b",
    links: [{ knoepfe: [{ id: "messen", verb: "messen", wort: "Messen" }] }],
    rechts: [],
  });
  return { m, h, fehler, warn };
}

const symbole = () => JSON.parse(readFileSync(join(VI4, "symbole.json"), "utf8"));

describe("VI4-Hülle ohne symbole.json (A1-A3)", () => {
  for (const [fall, stub] of [
    ["404", async () => ({ ok: false, status: 404, json: async () => { throw new SyntaxError("Unexpected token <"); } })],
    ["fetch lehnt ab (offline)", async () => { throw new TypeError("Failed to fetch"); }],
  ] as const) {
    it(`${fall}: menue() und baue() lehnen nicht ab, Text statt Symbol, eine Meldung, ein console.error`, async () => {
      const { m, h, fehler, warn } = await lade(stub);

      // Einträge als Text da, Werkfläche und Menü bedienbar
      expect(document.querySelector('#w .vi4-knopf[data-vi4="messen"] .vi4-wort')?.textContent).toContain("Messen");
      const datei = document.querySelector<HTMLButtonElement>('#m [data-m="datei"]')!;
      expect(datei.textContent).toBe("Datei");
      datei.click();
      expect([...document.querySelectorAll(".vi4-m-liste .vi4-m-eintrag")].map((e) => e.textContent)).toContain("Speichern");
      // Kein Fragezeichen-Symbol, keine Warnung je Verb, genau ein console.error
      expect(document.body.innerHTML).not.toContain("ph-question");
      expect(warn).not.toHaveBeenCalled();
      expect(fehler).toHaveBeenCalledTimes(1);

      // Meldung einmal als eigenes Element, die Meldung der Seite bleibt daneben
      const ort = document.querySelector("#m .vi4-m-meldung")!;
      expect([...ort.children].filter((e) => e.textContent === MELDUNG)).toHaveLength(1);
      expect(ort.querySelector("#seite-meldung")?.textContent).toBe("Seite meldet");

      m.abbau();
      h.abbau();
    });
  }

  it("Gegenprobe: symbole.json da -> Symbole, keine Meldung, kein console.error", async () => {
    const j = symbole();
    const { m, h, fehler } = await lade(async () => ({ ok: true, status: 200, json: async () => j }));
    expect(document.querySelector('#w .vi4-knopf[data-vi4="messen"] .vi4-sym i')?.className).toContain(`ph-${j.verben.messen.web}`);
    expect(document.body.textContent).not.toContain(MELDUNG);
    expect(document.querySelector("#m .vi4-m-meldung #seite-meldung")?.textContent).toBe("Seite meldet");
    expect(fehler).not.toHaveBeenCalled();
    m.abbau();
    h.abbau();
  });
});
