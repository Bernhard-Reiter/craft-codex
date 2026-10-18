import { describe, it, expect } from "vitest";
import * as P from "./protokoll";
import * as I from "./lehrgang-index";

/**
 * P1 · alte Schritt-Ids im Lern-Protokoll und in Links (T10, D8).
 * Alte Ids (holz, aufteilung, anreissen) werden NUR beim Lesen auf die neuen
 * umgeschrieben (holz/aufteilung → warum, anreissen → anzeichnen). In der
 * Ablage bleibt alles, wie es war; ihre Kennung bleibt /1. Der Export trägt
 * /2 und zählt die verworfenen Einträge einer lesbaren Ablage (`verworfen`).
 */

function neueAblage(): P.Ablage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const ALT = {
  schema: P.PROTOKOLL_SCHEMA,
  zuletzt: 1_000_000,
  eintraege: [
    { art: "schritt", schritt: "holz", nr: 1, minuten: 0 },
    { art: "frage", schritt: "aufteilung", frageId: "aufteilung-1", richtig: true, nr: 2, minuten: 1 },
    { art: "frage", schritt: "anreissen", frageId: "anreissen-1", richtig: false, nr: 3, minuten: 1 },
    { art: "frage", schritt: "saegen", frageId: "saegen-1", richtig: true, nr: 4, minuten: 2 },
    { art: "schritt", schritt: "gibtsnicht", nr: 5, minuten: 0 },
  ],
};

function mitAltbestand() {
  const a = neueAblage();
  a.setItem(P.OPTIN_KEY, "ja");
  a.setItem(P.PROTOKOLL_KEY, JSON.stringify(ALT));
  return a;
}

describe("P1 · Protokoll liest alte Schritt-Ids (T10)", () => {
  it("normalisiereSchritt bildet alte Ids ab, neue bleiben, Unbekanntes → undefined", () => {
    const f = (P as Record<string, unknown>).normalisiereSchritt as ((s: string) => string | undefined) | undefined;
    expect(typeof f, "normalisiereSchritt fehlt in protokoll.ts").toBe("function");
    if (typeof f !== "function") return;
    expect(["holz", "aufteilung", "anreissen", "saegen", "stemmen", "passen", "warum", "anzeichnen", "kontrolle", "x"].map(f)).toEqual([
      "warum",
      "warum",
      "anzeichnen",
      "saegen",
      "stemmen",
      "passen",
      "warum",
      "anzeichnen",
      "kontrolle",
      undefined,
    ]);
  });

  it("ladeEintraege liefert nur neue Ids, Unbekanntes fällt weg", () => {
    const e = P.ladeEintraege(mitAltbestand());
    expect(e.map((x) => [x.nr, x.schritt])).toEqual([
      [1, "warum"],
      [2, "warum"],
      [3, "anzeichnen"],
      [4, "saegen"],
    ]);
  });

  it("auswertung zählt unter den neuen Ids", () => {
    expect(P.auswertung(P.ladeEintraege(mitAltbestand()))).toEqual({
      warum: { richtig: 1, gesamt: 1 },
      anzeichnen: { richtig: 0, gesamt: 1 },
      saegen: { richtig: 1, gesamt: 1 },
    });
  });

  it("Export: neue Ids unter eigener Kennung /2, Ablage-Kennung bleibt /1", () => {
    const ex = JSON.parse(P.exportiereProtokoll(mitAltbestand())) as { schema: string; eintraege: { schritt: string; frageId?: string }[] };
    expect(ex.schema).toBe("craft-codex/zinken-protokoll/2");
    expect(P.PROTOKOLL_SCHEMA).toBe("craft-codex/zinken-protokoll/1");
    expect(ex.eintraege.map((x) => x.schritt)).toEqual(["warum", "warum", "anzeichnen", "saegen"]);
    // frageId bleibt bewusst unverändert (Umbenennung = Folge-Issue)
    expect(ex.eintraege.map((x) => x.frageId)).toEqual([undefined, "aufteilung-1", "anreissen-1", "saegen-1"]);
  });

  it("Export zählt verworfene Einträge einer lesbaren Ablage (verworfen)", () => {
    const a = neueAblage();
    a.setItem(P.OPTIN_KEY, "ja");
    a.setItem(P.PROTOKOLL_KEY, JSON.stringify({ ...ALT, eintraege: [...ALT.eintraege, null, { art: "schritt", schritt: "x", nr: 6, minuten: 0 }] }));
    const ex = JSON.parse(P.exportiereProtokoll(a)) as { verworfen: number; eintraege: unknown[] };
    expect(ex.eintraege).toHaveLength(4);
    expect(ex.verworfen).toBe(3); // gibtsnicht, null, x
    const sauber = JSON.parse(P.exportiereProtokoll(neueAblage())) as { verworfen: number };
    expect(sauber.verworfen).toBe(0);
  });

  it("ein alter /1-Eintrag in der Ablage bleibt ladbar und wird als /2 exportiert", () => {
    const a = neueAblage();
    a.setItem(P.OPTIN_KEY, "ja");
    a.setItem(
      P.PROTOKOLL_KEY,
      JSON.stringify({ schema: "craft-codex/zinken-protokoll/1", zuletzt: 5, eintraege: [{ art: "schritt", schritt: "anreissen", nr: 1, minuten: 0 }] }),
    );
    expect(P.ladeEintraege(a)).toEqual([{ art: "schritt", schritt: "anzeichnen", nr: 1, minuten: 0 }]);
    const ex = JSON.parse(P.exportiereProtokoll(a)) as { schema: string; verworfen: number };
    expect([ex.schema, ex.verworfen]).toEqual(["craft-codex/zinken-protokoll/2", 0]);
  });

  it("nur beim Lesen umschreiben: die Ablage behält die alten Ids, auch nach einem neuen Eintrag", () => {
    const a = mitAltbestand();
    P.ladeEintraege(a);
    P.exportiereProtokoll(a);
    expect(P.protokolliere(a, { art: "schritt", schritt: "kontrolle" } as P.ProtokollEreignis, 2_000_000)).toBe(true);
    const roh = JSON.parse(a.map.get(P.PROTOKOLL_KEY)!) as { schema: string; eintraege: { schritt: string }[] };
    expect(roh.schema).toBe(P.PROTOKOLL_SCHEMA);
    expect(roh.eintraege.map((x) => x.schritt)).toEqual(["holz", "aufteilung", "anreissen", "saegen", "gibtsnicht", "kontrolle"]);
  });
});

describe("P1 · alte Links ?schritt=… (T10)", () => {
  it("schrittAusQuery: alte Ids auf neue, Unbekanntes auf den ersten Eintrag", () => {
    expect(I.schrittAusQuery("anreissen")).toBe("anzeichnen");
    expect(I.schrittAusQuery("holz")).toBe("warum");
    expect(I.schrittAusQuery("aufteilung")).toBe("warum");
    expect(I.schrittAusQuery("saegen")).toBe("saegen");
    expect(I.schrittAusQuery("x")).toBe("warum");
    expect(I.schrittAusQuery(null)).toBe("warum");
  });
});
