import { describe, it, expect } from "vitest";
import { getZinkenLehrgangCorpus } from "../../rag/corpus/zinken-lehrgang-corpus";
import {
  WERKBANK_KAMERAS,
  WERKBANK_SCHRITTE_DE,
  type WerkbankSchritt,
} from "./schritte";
import { WERKBANK_SCHRITTE_EN } from "./schritte.en";

/**
 * Werkbank S1 (Zeichnung b v8, Abschnitt 1 + 5 »Daten«): genau 3 Schritte,
 * kurz ≤ 2 Sätze, 1–3 Kriterien, jede quelle im Lehrgang-Korpus, de/en
 * gleiche IDs. Jeder Test prüft zuerst »genau 3«, damit ein leerer Datensatz
 * nie still grün wird.
 */

const REIHE = ["bezugsflaeche", "grundlinie", "pruefen"];
const ANRISSLINIEN = new Set(["baseline", "flanks", "tails", "wastes", "divisions"]);

function drei(liste: readonly WerkbankSchritt[]): readonly WerkbankSchritt[] {
  expect(liste).toHaveLength(3);
  return liste;
}

/** Sätze zählen: Satzende . ! ? … gefolgt von Leerraum oder Textende. */
function saetze(text: string): number {
  return text
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .filter((s) => s.length > 0).length;
}

function texte(s: WerkbankSchritt): string[] {
  return [
    s.kurz,
    s.handgriff,
    s.warum,
    ...s.kriterien,
    s.hilfen.beobachten,
    s.hilfen.hinweis,
    s.hilfen.teilschritt,
    s.hilfen.erklaerung,
  ];
}

const SPRACHEN = [
  ["de", () => WERKBANK_SCHRITTE_DE],
  ["en", () => WERKBANK_SCHRITTE_EN],
] as const;

describe("Werkbank S1 — Schritte (Daten)", () => {
  it("hat genau 3 Schritte in der Reihenfolge bezugsflaeche → grundlinie → pruefen", () => {
    expect(drei(WERKBANK_SCHRITTE_DE).map((s) => s.id)).toEqual(REIHE);
  });

  it.each(SPRACHEN)("%s: kurz hat 1–2 Sätze, handgriff genau einen", (_l, liste) => {
    for (const s of drei(liste())) {
      expect(saetze(s.kurz), `${s.id} kurz`).toBeGreaterThanOrEqual(1);
      expect(saetze(s.kurz), `${s.id} kurz`).toBeLessThanOrEqual(2);
      expect(saetze(s.handgriff), `${s.id} handgriff`).toBe(1);
    }
  });

  it.each(SPRACHEN)("%s: 1–3 Kriterien je Schritt, keines leer", (_l, liste) => {
    for (const s of drei(liste())) {
      expect(s.kriterien.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.kriterien.length, s.id).toBeLessThanOrEqual(3);
      for (const k of s.kriterien) expect(k.trim().length, s.id).toBeGreaterThan(5);
    }
  });

  it.each(SPRACHEN)("%s: warum und alle vier Hilfestufen sind gefüllt", (_l, liste) => {
    for (const s of drei(liste())) {
      expect(s.warum.trim().length, s.id).toBeGreaterThan(10);
      expect(Object.keys(s.hilfen).sort()).toEqual(
        ["beobachten", "erklaerung", "hinweis", "teilschritt"],
      );
      for (const h of Object.values(s.hilfen)) expect(h.trim().length, s.id).toBeGreaterThan(5);
    }
  });

  it.each(SPRACHEN)("%s: jede quelle existiert im Lehrgang-Korpus, mindestens eine je Schritt", (l, liste) => {
    const ids = new Set(getZinkenLehrgangCorpus(l).map((d) => d.id));
    for (const s of drei(liste())) {
      expect(s.quellen.length, s.id).toBeGreaterThanOrEqual(1);
      for (const q of s.quellen) expect(ids.has(q), `${s.id} → ${q}`).toBe(true);
    }
  });

  it("de/en: gleiche IDs, Reihenfolge, kamera, marker, quellen und sicherheit", () => {
    const de = drei(WERKBANK_SCHRITTE_DE);
    const en = drei(WERKBANK_SCHRITTE_EN);
    de.forEach((d, i) => {
      const e = en[i]!;
      expect(e.id).toBe(d.id);
      expect(e.kamera).toBe(d.kamera);
      expect(e.marker).toEqual(d.marker);
      expect(e.quellen).toEqual(d.quellen);
      expect(e.sicherheit).toBe(d.sicherheit);
    });
  });

  it("en ist übersetzt (kurz, handgriff, warum je Schritt anders als de)", () => {
    const de = drei(WERKBANK_SCHRITTE_DE);
    const en = drei(WERKBANK_SCHRITTE_EN);
    de.forEach((d, i) => {
      const e = en[i]!;
      expect(e.kurz).not.toBe(d.kurz);
      expect(e.handgriff).not.toBe(d.handgriff);
      expect(e.warum).not.toBe(d.warum);
    });
  });

  it("kamera aus der festen Liste, marker sind Anrisslinien, grundlinie zeigt baseline", () => {
    const de = drei(WERKBANK_SCHRITTE_DE);
    for (const s of de) {
      expect(WERKBANK_KAMERAS, s.id).toContain(s.kamera);
      expect(s.marker.length, s.id).toBeGreaterThanOrEqual(1);
      for (const m of s.marker) expect(ANRISSLINIEN.has(m), `${s.id} → ${m}`).toBe(true);
    }
    expect(de.find((s) => s.id === "grundlinie")?.marker).toContain("baseline");
  });

  it("Sicherheitskarte steht genau vor Schritt grundlinie", () => {
    const mit = drei(WERKBANK_SCHRITTE_DE).filter((s) => s.sicherheit === true);
    expect(mit.map((s) => s.id)).toEqual(["grundlinie"]);
  });

  it.each(SPRACHEN)(
    "%s: Auflage S1 — kein Brillen-/AR-Text in den Schritten (AR-Satz nur aus messages, bis S0 alt)",
    (_l, liste) => {
      for (const s of drei(liste())) {
        for (const t of texte(s)) {
          expect(t, s.id).not.toMatch(/brille|headset|\bAR\b|ar-regel|ar rule|\bquest\b/i);
        }
      }
    },
  );
});
