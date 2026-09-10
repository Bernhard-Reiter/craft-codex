/**
 * Das ausgelieferte Bundle muss in sich stimmen — auf JEDEM Klon, nicht nur dort, wo eine
 * lokale Datei zufällig liegt (Review craft#48, Cody #2: der Auftrag band ein Modell, das
 * .gitignore ausschloss; auf CI und Vercel zeigte die Seite 404 statt Möbel).
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Auftrag } from "./auftrag";

const BUNDLE = join(__dirname, "../../public/werkstoff-bundle");

describe("das ausgelieferte Werkstoff-Bundle stimmt in sich", () => {
  const auftrag = JSON.parse(readFileSync(join(BUNDLE, "auftrag.json"), "utf8")) as Auftrag;

  it("nennt der Auftrag ein Modell, liegt die Datei im Repo und trägt genau diesen Hash", () => {
    expect(auftrag.modell, "der Demo-Auftrag muss sein Modell nennen — sonst keine Szene").toBeDefined();
    const datei = join(BUNDLE, auftrag.modell!.datei);
    expect(existsSync(datei), `${auftrag.modell!.datei} fehlt im Bundle — .gitignore?`).toBe(true);
    const ist = createHash("sha256").update(readFileSync(datei)).digest("hex");
    expect(ist).toBe(auftrag.modell!.glb_sha256);
  });

  it("das ausgelieferte Modell ist das attestierte Fixture aus cody-cad#69 und bleibt repo-tauglich", () => {
    expect(auftrag.modell!.glb_sha256).toBe("418a4bea6bb2c01c546849f3e4950ae5c65890df1b9c2fbabb844d8fb991e95f");
    expect(statSync(join(BUNDLE, auftrag.modell!.datei)).size).toBeLessThan(250_000);
  });

  it("der ausgelieferte Auftrag trägt den Hinweis zum Demo-Plan — die Lücke ohne Bohrbild ist getragen, nicht weggeschnitten", () => {
    // R48b-6: das Bohrbild fehlt dem Demo-Plan mit Absicht (cody-cad#70). Der Satz muss im Bundle
    // stehen, sonst verliert ihn das nächste Bundle still. Gebaut mit cody-cad#73 `bauen --hinweis`.
    expect(auftrag.hinweise).toEqual(["Demo-Plan ohne Bohrbild — 104 Bohrungen gefiltert (cody-cad#70)"]);
  });

  it("jede Karte, die der Auftrag nennt, liegt im Bundle — und keine Lücke hat eine", () => {
    for (const t of auftrag.teile) expect(existsSync(join(BUNDLE, "karten", `${t.werkstueck_id}.json`)), t.schluessel).toBe(true);
    for (const l of auftrag.teile_ohne_karte) expect(existsSync(join(BUNDLE, "karten", `${l.werkstueck_id}.json`)), l.schluessel).toBe(false);
  });
});

/**
 * Der Gegenpin: dieselben Zahlen wie in cody-cad, auf dieser Seite der Naht.
 *
 * Am 06.09.2026 stand das ausgelieferte Bundle still schief: cody-cad#95 hatte
 * `ausgeschlossen[].art` in die Karten gebracht, und niemandem fiel es auf, weil der
 * `resolve_manifest_sha256` das Feld nicht deckt (das Manifest baut die Ausschlüsse ohne `art`).
 * Ein Hash, der nur die Hälfte des Ausgelieferten umfasst, fängt genau die Änderung nicht, die
 * durch die andere Hälfte geht.
 *
 * Deshalb hier dieselben Werte, die cody-cad pinnt:
 *   - der kanonische Auftrags-Hash (cody-cad: tests/test_demo_bundle_rezept.py)
 *   - die vier `karte_sha256` (cody-cad: tests/test_vollstaendigkeit_ableitungen.py)
 *   - die Formelversion, mit der die Manifeste gerechnet wurden
 *
 * Wer in cody-cad einen Pin nachzieht, ohne hier zu regenerieren, macht diese Tests rot; wer
 * hier von Hand ändert, weicht vom cody-cad-Pin ab. Erzeugt wird das Bundle mit
 * `python -m werkzeuge.demo_bundle --ausgabe <leerer ordner>` (cody-cad#97) — von Hand
 * editieren ist der Weg, den in einem Monat niemand mehr nachvollzieht.
 */

/** Kanonisches JSON wie `kern/gemeinsam/kanonisch.py`: Schlüssel sortiert, kompakt, UTF-8 roh. */
const kanonischerHash = (o: unknown): string => {
  const sortiert = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sortiert)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v as Record<string, unknown>)
              .sort()
              .map((k) => [k, sortiert((v as Record<string, unknown>)[k])]),
          )
        : v;
  return createHash("sha256").update(JSON.stringify(sortiert(o)), "utf8").digest("hex");
};

const AUFTRAG_PIN = "e55a2f50a0c6421fbbb9c0ab1ebcde915d7dc9fbd42754d5d3131f457dca59d2";

/**
 * Byte-Pins über die ausgelieferten Dateien — die zweite Frage.
 *
 * `karte_sha256` im Test mit dem Pin zu vergleichen prüft nur die NOTE, die sich die Datei
 * selbst gibt: wer einen Wert in der Karte ändert und das Feld stehen lässt, kommt durch
 * (nachgestellt am 06.09.: Gewicht 14,352 → 14,353, Feld unangetastet, 8/8 grün).
 *
 * Nachrechnen wie beim Auftrag geht hier NICHT. `karte_sha256` ist der kanonische Hash der
 * Karte, und die trägt 16 ganzzahlige Fliesskommazahlen je Datei (`"auftrag_g_m2": 120.0`).
 * Python schreibt `120.0`, `JSON.stringify` schreibt `120` — dieselbe Karte, zwei Hashes. Der
 * Kanonisierungs-Zeuge weiter unten fängt das nicht, weil der Auftrag keine solchen Zahlen hat.
 *
 * Also der Umweg über die Bytes: er beantwortet nicht »hat cody-cad das so gerechnet«
 * (das tut der `karte_sha256`-Vergleich), sondern »ist es noch das, was ausgeliefert wurde«.
 * Beim nächsten Regen werden diese Zahlen vom Erzeugnis abgelesen, nicht nachgezogen.
 */
const BYTE_PINS: Record<string, Record<string, string>> = {
  karten: {
    teil_beispielbo0oben: "4d7d793ce7922ce22cfb80ae10d096a1375c535f4a5cffb7004d82037989aba1",
    teil_beispielbo0unten: "ad16648e4b73276dfcb6c71a311d6d4f8ab5c143771d2c9db98bee32536c2baa",
    teil_beispielse0links: "0c8774a24e5b8353352abcf51b2fc479b43b5f140feed09558658be5a965a2ec",
    teil_beispielse0rechts: "80931182ce1b1a55abf05daee5fa3c6d026b0845130f74f722db1a4a13ef84e0",
  },
  manifeste: {
    teil_beispielbo0oben: "bdef93d5d287323668de31fbc5514b0a946769d4d1d2dbcdd5b36f71a2d65063",
    teil_beispielbo0unten: "e836b928f8a959c51fd1d701bfcbbe6447537d22e050cf9226d96a581793491d",
    teil_beispielse0links: "af59429e8faa8b0c26b02825b2a0cbf153619331e09d57a57b4f835f87804a37",
    teil_beispielse0rechts: "91a913bf6d227bc9d2311b48e0d24de0b9754733376d7467a0bd4dd6982bffda",
  },
};
// cody-cad#164 hob die Version: der Belagleim steht jetzt als FEHLT im Gewicht.
const FORMELVERSION = "werkstoff-ableitung/3";
const KARTEN_PINS: Record<string, string> = {
  teil_beispielbo0oben: "e9b200cda5b91d1b51264968038266fab47d77e637934616cdbd2a58066dc793",
  teil_beispielbo0unten: "2bcef5e594a3bde3a62bf1b89aa6c8f549c40e455f5c41dfed7b1b58ef51fcc5",
  teil_beispielse0links: "57a70d194f5a0742f874faf5df535b93eccf2f7f99520f4e41fb3c9fc77eddaf",
  teil_beispielse0rechts: "126c6f1e863a7a890b94ff9b2c70505dc0fd6f0f632a6dd9c11a2aca728952f9",
};

describe("das Bundle stammt aus dem Erzeuger, den cody-cad pinnt", () => {
  const auftrag = JSON.parse(readFileSync(join(BUNDLE, "auftrag.json"), "utf8")) as Auftrag;

  it("die JS-Kanonisierung ist dieselbe wie die in cody-cad — sonst pinnen wir zwei Dinge", () => {
    // Gegenprobe für den Nachbau selbst: kompakt, Schlüssel sortiert, kein Escaping von Umlauten.
    expect(kanonischerHash({ b: 1, a: "ä—" })).toBe(
      createHash("sha256").update('{"a":"ä—","b":1}', "utf8").digest("hex"),
    );
  });

  it("der ausgelieferte Auftrag ist der, den cody-cad erzeugt", () => {
    expect(
      kanonischerHash(auftrag),
      "Auftrag weicht ab — Bundle mit `python -m werkzeuge.demo_bundle` neu erzeugen, nicht den Pin nachziehen",
    ).toBe(AUFTRAG_PIN);
  });

  it("jede Karte trägt den Fingerabdruck, den cody-cad pinnt", () => {
    for (const [id, soll] of Object.entries(KARTEN_PINS)) {
      const karte = JSON.parse(readFileSync(join(BUNDLE, "karten", `${id}.json`), "utf8"));
      expect(karte.karte_sha256, id).toBe(soll);
    }
    expect(Object.keys(KARTEN_PINS).sort()).toEqual(auftrag.teile.map((t) => t.werkstueck_id).sort());
  });

  it("Karten und Manifeste sind Byte für Byte die ausgelieferten — nicht nur ihrer eigenen Auskunft nach", () => {
    for (const [ordner, pins] of Object.entries(BYTE_PINS)) {
      for (const [id, soll] of Object.entries(pins)) {
        const roh = readFileSync(join(BUNDLE, ordner, `${id}.json`));
        expect(
          createHash("sha256").update(roh).digest("hex"),
          `${ordner}/${id}.json von Hand geändert? Bundle mit \`python -m werkzeuge.demo_bundle\` neu erzeugen`,
        ).toBe(soll);
      }
    }
  });

  it("die Manifeste sind mit der Formelversion gerechnet, die dieses Bundle behauptet", () => {
    for (const t of auftrag.teile) {
      const m = JSON.parse(readFileSync(join(BUNDLE, "manifeste", `${t.werkstueck_id}.json`), "utf8"));
      expect(m.formelversion, t.werkstueck_id).toBe(FORMELVERSION);
    }
  });
});
