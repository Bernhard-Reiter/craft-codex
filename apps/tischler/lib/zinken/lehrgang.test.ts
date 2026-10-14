import { describe, it, expect } from "vitest";
import { LEHRGANG_DE } from "./lehrgang";
import { LEHRGANG_EN } from "./lehrgang.en";
import { SCHRITT_IDS, type LehrgangSchritt } from "./lehrgang-typen";
import { getLehrgang } from "./lehrgang-index";

describe("Zinken-Lehrgang — Aufbau", () => {
  it("hat die sechs Schritte in der Lehrbuch-Reihenfolge", () => {
    expect(LEHRGANG_DE.map((s) => s.id)).toEqual([...SCHRITT_IDS]);
    expect(LEHRGANG_DE.map((s) => s.nr)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(LEHRGANG_DE.map((s) => [s.id, s] as const))(
    "%s: jeder Schritt hat Ziel, Werkzeug, Vormachen, Nachmachen, Kontrollpunkt, Fehler, Sicherheit, Fragen",
    (_id, s: LehrgangSchritt) => {
      expect(s.ziel.length).toBeGreaterThan(20);
      expect(s.werkzeug.length).toBeGreaterThan(0);
      expect(s.vormachen.length).toBeGreaterThanOrEqual(3);
      expect(s.nachmachen.length).toBeGreaterThanOrEqual(3);
      expect(s.kontrollpunkt.length).toBeGreaterThanOrEqual(2);
      expect(s.fehler.length).toBeGreaterThanOrEqual(1);
      expect(s.sicherheit.length).toBeGreaterThanOrEqual(1);
      expect(s.fragen.length).toBeGreaterThanOrEqual(2);
      for (const f of s.fragen) {
        expect(f.richtig).toBeGreaterThanOrEqual(0);
        expect(f.richtig).toBeLessThan(f.antworten.length);
        expect(f.erklaerung.length).toBeGreaterThan(20);
      }
    },
  );

  it("Frage-ids sind eindeutig", () => {
    const ids = LEHRGANG_DE.flatMap((s) => s.fragen.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Sägen und Stemmen: Regel »keine Brille beim Sägen/Stemmen« steht in der Sicherheit", () => {
    for (const id of ["saegen", "stemmen"] as const) {
      const s = LEHRGANG_DE.find((x) => x.id === id)!;
      expect(s.sicherheit.some((t) => /Brille/.test(t))).toBe(true);
    }
  });

  it("die Schräge 1:6 wird NICHT als 10–14° ausgegeben", () => {
    const s = LEHRGANG_DE.find((x) => x.id === "aufteilung")!;
    const text = JSON.stringify(s);
    expect(text).toMatch(/9,5/);
    expect(text).not.toMatch(/1:6 \(10/);
  });
});

describe("Zinken-Lehrgang — Parität DE/EN", () => {
  it("gleiche Schritte, gleiche Längen, gleiche Lösungen", () => {
    expect(LEHRGANG_EN).toHaveLength(LEHRGANG_DE.length);
    LEHRGANG_DE.forEach((de, i) => {
      const en = LEHRGANG_EN[i]!;
      expect(en.id).toBe(de.id);
      expect(en.nr).toBe(de.nr);
      expect(en.szene).toEqual(de.szene);
      expect(en.werkzeug).toHaveLength(de.werkzeug.length);
      expect(en.vormachen).toHaveLength(de.vormachen.length);
      expect(en.nachmachen).toHaveLength(de.nachmachen.length);
      expect(en.kontrollpunkt).toHaveLength(de.kontrollpunkt.length);
      expect(en.fehler).toHaveLength(de.fehler.length);
      expect(en.sicherheit).toHaveLength(de.sicherheit.length);
      expect(en.fragen.map((f) => [f.id, f.richtig, f.antworten.length])).toEqual(
        de.fragen.map((f) => [f.id, f.richtig, f.antworten.length]),
      );
    });
  });

  it("EN ist wirklich übersetzt (kein deutscher Titel übrig)", () => {
    LEHRGANG_DE.forEach((de, i) => {
      expect(LEHRGANG_EN[i]!.titel).not.toBe(de.titel);
      expect(LEHRGANG_EN[i]!.ziel).not.toBe(de.ziel);
    });
  });

  it("getLehrgang wählt nach Sprache", () => {
    expect(getLehrgang("de")).toBe(LEHRGANG_DE);
    expect(getLehrgang("en")).toBe(LEHRGANG_EN);
  });
});
