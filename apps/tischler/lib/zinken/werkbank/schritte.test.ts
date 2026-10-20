import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { getZinkenLehrgangCorpus } from "../../rag/corpus/zinken-lehrgang-corpus";
import {
  WERKBANK_KAMERAS,
  WERKBANK_SCHRITT_IDS,
  WERKBANK_SCHRITTE_DE,
  type WerkbankSchritt,
} from "./schritte";
import { WERKBANK_SCHRITTE_EN } from "./schritte.en";

/**
 * Werkbank S1 (Zeichnung b v8, Abschnitt 1 + 5 »Daten«): genau 3 Schritte,
 * kurz ≤ 2 Sätze, 1–3 Kriterien, jede quelle im Lehrgang-Korpus, de/en
 * gleiche IDs. Jeder Test prüft zuerst »genau 3«, damit ein leerer Datensatz
 * nie still grün wird.
 * Fix #74: bezugsflaeche zeigt noch keine Anrisslinie (die Grundlinie wird erst
 * im Schritt grundlinie gerissen, lehrgang.ts »anzeichnen«), die IDs kommen aus
 * WERKBANK_SCHRITT_IDS, die Daten sind tief readonly, AnrissLayer steht in lib.
 */

const REIHE = ["bezugsflaeche", "grundlinie", "pruefen"];
const ANRISSLINIEN = new Set(["baseline", "flanks", "tails", "wastes", "divisions"]);
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function quelle(pfad: string): string {
  return readFileSync(resolve(APP, pfad), "utf8");
}

/** Alle .ts/.tsx-Dateien unter `ordner` (rekursiv), als Pfad relativ zur App. */
function tsDateien(ordner: string): string[] {
  return readdirSync(resolve(APP, ordner), { withFileTypes: true }).flatMap((e) => {
    const pfad = `${ordner}/${e.name}`;
    if (e.isDirectory()) return tsDateien(pfad);
    return /\.tsx?$/.test(e.name) ? [pfad] : [];
  });
}

/**
 * Modulpfade einer Datei, die in den UI-Ordner components/ zeigen: import/export … from, import type,
 * import "…", import(…) und require(…), mit "…" und '…'. Relative Pfade und der Alias @/ werden
 * auf die App aufgelöst, Pakete zählen nicht.
 */
function uiImporte(datei: string, text: string): string[] {
  const muster = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(["'])([^"'\n]+)\1/g;
  return [...text.matchAll(muster)]
    .flatMap((m) => (m[2] === undefined ? [] : [m[2]]))
    .filter((modul) => {
      const ziel = modul.startsWith("@/")
        ? modul.slice(2)
        : modul.startsWith(".")
          ? relative(APP, resolve(APP, dirname(datei), modul))
          : null;
      return ziel !== null && (ziel === "components" || ziel.startsWith("components/"));
    });
}

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
      // Fix #74: bezugsflaeche darf marker [] haben (noch nichts gerissen), eigener Test unten.
      if (s.id !== "bezugsflaeche") expect(s.marker.length, s.id).toBeGreaterThanOrEqual(1);
      for (const m of s.marker) expect(ANRISSLINIEN.has(m), `${s.id} → ${m}`).toBe(true);
    }
    expect(de.find((s) => s.id === "grundlinie")?.marker).toContain("baseline");
  });

  it.each(SPRACHEN)(
    "%s: bezugsflaeche zeigt noch keine Anrisslinie, die Grundlinie kommt erst mit Schritt grundlinie",
    (_l, liste) => {
      const schritte = drei(liste());
      expect(schritte.find((s) => s.id === "bezugsflaeche")?.marker).toEqual([]);
      expect(schritte.find((s) => s.id === "grundlinie")?.marker).toContain("baseline");
      expect(schritte.find((s) => s.id === "pruefen")?.marker).toContain("baseline");
    },
  );

  it("WERKBANK_SCHRITT_IDS ist die eine Liste der IDs, de und en tragen genau diese in dieser Reihenfolge", () => {
    expect(WERKBANK_SCHRITT_IDS).toEqual(REIHE);
    expect(drei(WERKBANK_SCHRITTE_DE).map((s) => s.id)).toEqual([...WERKBANK_SCHRITT_IDS]);
    expect(drei(WERKBANK_SCHRITTE_EN).map((s) => s.id)).toEqual([...WERKBANK_SCHRITT_IDS]);
  });

  it("Daten sind tief readonly: Schreiben an Schritt, Listen und hilfen ist ein Typfehler (greift unter tsc)", () => {
    // Nie aufgerufen: vitest schreibt nichts, tsc prüft jede Zeile (@ts-expect-error muss greifen).
    const _schreiben = (s: WerkbankSchritt, liste: readonly WerkbankSchritt[]): void => {
      // @ts-expect-error id ist readonly
      s.id = "pruefen";
      // @ts-expect-error kurz ist readonly
      s.kurz = "";
      // @ts-expect-error kamera ist readonly
      s.kamera = "schraeg";
      // @ts-expect-error marker ist readonly
      s.marker = [];
      // @ts-expect-error die marker-Liste ist readonly
      s.marker.push("baseline");
      // @ts-expect-error kriterien ist readonly
      s.kriterien = [];
      // @ts-expect-error hilfen ist readonly
      s.hilfen = { ...s.hilfen };
      // @ts-expect-error hilfen.erklaerung ist readonly
      s.hilfen.erklaerung = "";
      // @ts-expect-error sicherheit ist readonly
      s.sicherheit = true;
      // @ts-expect-error die Schrittliste ist readonly
      liste.pop();
    };
    expect(drei(WERKBANK_SCHRITTE_DE)).toHaveLength(3);
    expect(drei(WERKBANK_SCHRITTE_EN)).toHaveLength(3);
  });

  it("das Schichten-Muster findet UI-Importe in jeder Form und nur diese", () => {
    const x = "lib/zinken/x.ts";
    for (const zeile of [
      'import type { A } from "../../components/AnrissFlat";',
      "import type { A } from '../../components/AnrissFlat';",
      'import { B } from "@/components/B";',
      "export { C } from '@/components/C';",
      'import "../../components/seiteneffekt";',
      "const d = await import('../../components/D');",
      'const e = require("../../components/E");',
    ]) {
      expect(uiImporte(x, zeile), zeile).toHaveLength(1);
    }
    for (const zeile of [
      'import type { AnrissLayer } from "./anriss-layer";',
      'import { D } from "./components/eigenes-lib-modul";',
      'import { E } from "@react-three/drei";',
      "// siehe components/AnrissFlat.tsx",
      'const pfad = quelle("components/AnrissFlat.tsx");',
    ]) {
      expect(uiImporte(x, zeile), zeile).toEqual([]);
    }
  });

  it("lib hängt nicht an der UI: keine Datei unter lib/ importiert aus components/", () => {
    const dateien = tsDateien("lib");
    expect(dateien.length).toBeGreaterThan(100);
    expect(dateien).toEqual(
      expect.arrayContaining([
        "lib/zinken/lehrgang-typen.ts",
        "lib/zinken/werkbank/schritte.ts",
        "lib/zinken/werkbank/schritte.en.ts",
        "lib/zinken/werkbank/meister-stufen.ts",
      ]),
    );
    // Diese Datei trägt eingerückt die Probezeilen des Musters, von ihr zählen nur die Zeilen ohne Einrückung.
    const eigen = relative(APP, fileURLToPath(import.meta.url));
    expect(dateien).toContain(eigen);
    const text = (d: string) =>
      d === eigen ? quelle(d).split("\n").filter((z) => !/^\s/.test(z)).join("\n") : quelle(d);
    const treffer = dateien.flatMap((d) => uiImporte(d, text(d)).map((modul) => `${d} → ${modul}`));
    expect(treffer).toEqual([]);
    expect(quelle("lib/zinken/werkbank/schritte.ts")).toMatch(
      /import type \{ AnrissLayer \} from "\.\.\/anriss-layer";/,
    );
    expect(quelle("lib/zinken/anriss-layer.ts")).toMatch(/export type AnrissLayer =/);
    const flat = quelle("components/AnrissFlat.tsx");
    expect(flat).toMatch(/import type \{ AnrissLayer \} from "\.\.\/lib\/zinken\/anriss-layer";/);
    expect(flat).toMatch(/export type \{ AnrissLayer \};/);
    expect(flat).not.toMatch(/export type AnrissLayer =/);
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
