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
 *
 * Neu gesetzt am 06.10.2026 für alle acht Byte-Pins: Datenstand main 10c3f98c, #549/#414. Das Bundle ist ganz neu
 * aus dem Erzeuger (Wortlaut »Bauteil« aus cody-cad#548, Werkstoff-Datenstand seit cody-cad#414).
 */
const BYTE_PINS: Record<string, Record<string, string>> = {
  karten: {
    teil_beispielbo0oben: "a5cebe0521fc99a488cdba78adfcbb1af013f5a7547e3e3fc1287fff3196a8c5",
    teil_beispielbo0unten: "20f57ff813fdfc281faebe65cc62a20daf2ac48407425f45f3c7dd9a823cec3e",
    teil_beispielse0links: "89656c9ce0809f7965344f5c33382017fd764addd1f13bc1081704abd9538e42",
    teil_beispielse0rechts: "483c9151cfce3cebf20fe287284826625217a0cb7096171fd69d3b9c7f1530db",
  },
  manifeste: {
    teil_beispielbo0oben: "06595fde652eff25649012ee9d0269dc1b7c0bfb1ef73d190de79023bec12f6b",
    teil_beispielbo0unten: "e3daf6b62ba7a338cfc5c05fdf669e4bed104208b6844a3739e2b0ae0a2b5261",
    teil_beispielse0links: "f9f75b9e085c0d129995ae875a9efcc41b68ded3b55cfaf4e0d398e88255ce0c",
    teil_beispielse0rechts: "3246cac8af5e3dae35bcf457e2f58adfa558df4f8d2343ad5757db4bc7c83bae",
  },
};
// cody-cad#164 hob die Version: der Belagleim steht jetzt als FEHLT im Gewicht.
const FORMELVERSION = "werkstoff-ableitung/3";
// Neu gesetzt am 06.10.2026 für alle vier karte_sha256: Datenstand main 10c3f98c, #549/#414.
const KARTEN_PINS: Record<string, string> = {
  teil_beispielbo0oben: "d37d38cd997f6a4481c417874a76151b52f69f6442c87c96d343f00b54fca86b",
  teil_beispielbo0unten: "84f5014305effab1eeefdc079bae177d02c5e1832c96f4373f954c6ca2e76bd9",
  teil_beispielse0links: "d14de5133aad7ccc60e0a6c2c96eb94b59fbfafca5541a4e141aff09cbf41328",
  teil_beispielse0rechts: "6949f817e206c2a116585097ddd417213f34f0ed18c9f93aeeaace396f968717",
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
