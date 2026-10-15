import { describe, it, expect } from "vitest";
import {
  OPTIN_KEY,
  PROTOKOLL_KEY,
  PROTOKOLL_MAX,
  auswertung,
  exportiereProtokoll,
  istOptIn,
  ladeEintraege,
  loescheProtokoll,
  protokolliere,
  setzeOptIn,
  type Ablage,
} from "./protokoll";

function neueAblage(): Ablage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe("Lern-Protokoll", () => {
  it("ist standardmäßig AUS und speichert ohne Opt-in nichts", () => {
    const a = neueAblage();
    expect(istOptIn(a)).toBe(false);
    expect(protokolliere(a, { art: "schritt", schritt: "warum" })).toBe(false);
    expect(a.map.size).toBe(0);
  });

  it("speichert nach Opt-in nur Lernereignisse mit grober Minute", () => {
    const a = neueAblage();
    setzeOptIn(a, true);
    protokolliere(a, { art: "schritt", schritt: "warum" }, 1_000_000);
    protokolliere(a, { art: "frage", schritt: "warum", frageId: "warum-1", richtig: true }, 1_000_000 + 150_000);
    const e = ladeEintraege(a);
    expect(e).toHaveLength(2);
    expect(e[0]).toEqual({ art: "schritt", schritt: "warum", nr: 1, minuten: 0 });
    expect(e[1]!.minuten).toBe(3); // 2,5 min → 3
  });

  it("Export enthält keinen Zeitpunkt und keine Freitexte", () => {
    const a = neueAblage();
    setzeOptIn(a, true);
    protokolliere(a, { art: "hilfe", schritt: "saegen", stufe: 1 }, 1_700_000_000_000);
    const txt = exportiereProtokoll(a);
    expect(txt).not.toContain("1700000000000");
    expect(txt).not.toContain("zuletzt");
    expect(JSON.parse(txt).schema).toBe("craft-codex/zinken-protokoll/2");
  });

  it("Opt-out löscht das Protokoll sofort", () => {
    const a = neueAblage();
    setzeOptIn(a, true);
    protokolliere(a, { art: "schritt", schritt: "warum" });
    setzeOptIn(a, false);
    expect(a.map.has(OPTIN_KEY)).toBe(false);
    expect(a.map.has(PROTOKOLL_KEY)).toBe(false);
  });

  it("Löschen lässt den Opt-in stehen", () => {
    const a = neueAblage();
    setzeOptIn(a, true);
    protokolliere(a, { art: "schritt", schritt: "warum" });
    loescheProtokoll(a);
    expect(ladeEintraege(a)).toEqual([]);
    expect(istOptIn(a)).toBe(true);
  });

  it("ist nach oben begrenzt", () => {
    const a = neueAblage();
    setzeOptIn(a, true);
    for (let i = 0; i < PROTOKOLL_MAX + 5; i++) protokolliere(a, { art: "schritt", schritt: "warum" }, i);
    expect(ladeEintraege(a)).toHaveLength(PROTOKOLL_MAX);
  });

  it("übersteht kaputten Speicherinhalt und gesperrten Speicher", () => {
    const a = neueAblage();
    a.map.set(PROTOKOLL_KEY, "{kaputt");
    expect(ladeEintraege(a)).toEqual([]);
    const gesperrt: Ablage = {
      getItem: () => {
        throw new Error("gesperrt");
      },
      setItem: () => {
        throw new Error("gesperrt");
      },
      removeItem: () => {
        throw new Error("gesperrt");
      },
    };
    expect(istOptIn(gesperrt)).toBe(false);
    expect(() => setzeOptIn(gesperrt, true)).not.toThrow();
  });

  it("Auswertung zählt Fragen je Schritt", () => {
    const r = auswertung([
      { art: "frage", schritt: "warum", frageId: "warum-1", richtig: true, nr: 1, minuten: 0 },
      { art: "frage", schritt: "warum", frageId: "warum-2", richtig: false, nr: 2, minuten: 1 },
      { art: "schritt", schritt: "saegen", nr: 3, minuten: 0 },
    ]);
    expect(r.warum).toEqual({ richtig: 1, gesamt: 2 });
    expect(r.saegen).toBeUndefined();
  });
});
