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
    teil_beispielbo0oben: "6f9de347ef26464bd93a3f61423bfa39d5fe29a0b10012c3fc4d7be95dc4d187",
    teil_beispielbo0unten: "09f29010a5e03b334e315e9370b2ad69006ea7b9e14875d2b16727527d3b1033",
    teil_beispielse0links: "284b8c25aeb7b5acf5fbcf4d4bc775f54fb731ba51b1c181f6e76cd72504b643",
    teil_beispielse0rechts: "adab94054fac79317cb0b61a78c4be45db3a5389eb9aa17262e28ec2f4e920eb",
  },
  manifeste: {
    teil_beispielbo0oben: "053161405d1691a273f1edc1923830c6c91a4f0377c05d15c2001f7678f0ba19",
    teil_beispielbo0unten: "a34282f7969de57da3ea81094312f37d8e78dbf760a3d4eddc1f2a5870d9dac3",
    teil_beispielse0links: "971df70a85757872df4142f382844270c368a2a7f71fe3466034d2120e47f803",
    teil_beispielse0rechts: "471efa1a1fdeef4049ffc70c580a93746d6e8bac72b7128579a1218abc0ee58a",
  },
};
const FORMELVERSION = "werkstoff-ableitung/2";
const KARTEN_PINS: Record<string, string> = {
  teil_beispielbo0oben: "f9c51cea0b096f2c9b35ee99d914eb98a33933df81edc15a212a0a357e8f4111",
  teil_beispielbo0unten: "7225f59026b7b1871a3864ddd2b358280741d236db1cb05380bcf55df5fa43e6",
  teil_beispielse0links: "cb640e737ada140a72b624d5a21d1dbaca7bf1d61b7c8c802b2e92838e15ff3a",
  teil_beispielse0rechts: "0cf68a9fb27ecc1ee02a2d2edd56999587d480602d890c1e5ea4b0300c242f80",
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
