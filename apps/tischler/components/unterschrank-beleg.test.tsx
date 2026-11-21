import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildMesseEtiketten,
  buildMesseStueckliste,
  buildVoaiStueckliste,
  bohrplanBlattVerweis,
  MESSE_BOHRPLAN_TEILE,
  MESSE_UNTERSCHRANK,
  sha256Hex,
} from "@craft-codex/core";
import { afterAll, describe, expect, it } from "vitest";
import { materialAnzeige, stuecklisteCsvText } from "./MesseStueckliste";
import { BLAETTER, LOCHREIHE } from "../lib/beschlag/bohrplan-blaetter";

/**
 * Unterschrank-Beleg 600 (1 Tür CLIP top, 1 Innenschubkasten MOVENTO): EIN
 * Durchlauf über alle Ausgaben zum selben Schrank. Stückliste, Etikett,
 * VOAI-Datei und Bohrplan-Blatt müssen dieselben Teile, Maße und Bohrungen
 * tragen. Etikett-Bohrtexte (ETIKETT_DATEN) und Blatt-Maße (BLAETTER) stehen
 * von Hand im Code; dieser Test zählt sie gegen die Layouts nach.
 * Mit BELEG_DIR schreibt er die Beleg-Mappe dorthin, sonst nichts. Keine Preise.
 */

const zeilen = buildMesseStueckliste();
const platten = zeilen.filter((z) => z.gruppe !== "Beschlag" && z.mass);
const beschlaege = zeilen.filter((z) => z.gruppe === "Beschlag");
const etiketten = buildMesseEtiketten(zeilen);
const voai = buildVoaiStueckliste(new Date("2026-11-19T00:00:00Z"));

type VoaiPos = {
  typ: string;
  menge: string;
  einheit: string;
  artikel_id: string | null;
  bezeichnung: string;
  masse_mm?: { laenge: string; breite: string; dicke: string };
};
const positionen = voai.inhalt.positionen as unknown as VoaiPos[];
const freiPlatten = positionen.filter((p) => p.typ === "freiposition" && p.masse_mm);

const zahlen = (mass: string) => mass.split(" × ").map(Number);
/** Teilname aus der VOAI-Bezeichnung »Teil (Annahme), Material«. */
const voaiTeil = (p: VoaiPos) => p.bezeichnung.split(", ")[0]!.replace(/ \(Annahme\)$/, "");

/** id-Präfix des Bohrpunkts -> Art wie auf dem Etikett. */
const ART: Record<string, string> = {
  topf: "Topf",
  schraube: "Schrauben",
  platte: "Montageplatte",
  movento: "MOVENTO-Schiene",
  oe6: "Ø6 für MOVENTO",
  t51: "Kupplung",
};

/** Bohrungen eines Blatts als »Art ×Anzahl«, gezählt aus dem Layout (+ Lochreihe). */
function bohrungenAusBlatt(b: (typeof BLAETTER)[number]): string[] {
  const n = new Map<string, number>();
  if (b.lochreihe) n.set("Lochreihe", LOCHREIHE.length);
  for (const p of b.layout.points) {
    const art = ART[p.id.split(".")[0]!] ?? `unbekannt:${p.id}`;
    n.set(art, (n.get(art) ?? 0) + 1);
  }
  return [...n].map(([art, k]) => `${art} ×${k}`).sort();
}

const etikettBohrungen = (teil: string) => {
  const e = etiketten.find((x) => x.teil === teil)!;
  return [...e.bohren, ...e.anreissen].filter((t) => t !== "keine Bohrung").sort();
};

describe("Unterschrank-Beleg 600: Stückliste = Etikett = VOAI = Bohrplan", () => {
  it("V1 Teile: 11 Plattenteile, je ein Etikett und eine VOAI-Position", () => {
    expect(platten).toHaveLength(11);
    expect(etiketten.map((e) => e.teil)).toEqual(platten.map((z) => z.teil));
    for (const e of etiketten) expect(zeilen[e.pos - 1]!.teil).toBe(e.teil);
    expect(freiPlatten.map(voaiTeil).sort()).toEqual(platten.map((z) => z.teil).sort());
    // VOAI-Reihenfolge (nach position_ref) = Reihenfolge der Stückliste, dann 1 Kante in Metern.
    const ohneKante = positionen.filter((p) => p.einheit !== "m");
    expect(ohneKante.map((p) => (p.typ === "artikel" ? p.artikel_id : voaiTeil(p)))).toEqual(
      zeilen.map((z) => (z.gruppe === "Beschlag" ? `blum:${z.artikel}` : z.teil)),
    );
    expect(positionen).toHaveLength(platten.length + beschlaege.length + 1);
    expect(positionen.filter((p) => p.einheit === "m")).toHaveLength(1);
  });

  // V2 vergleicht Ausgaben derselben Quelle (fängt Drift in Etikett- und VOAI-Bau);
  // die echten Querproben über getrennt gepflegte Zahlen sind V3, V4 und V5.
  it("V2 Maße in mm: Stückliste = Etikett = VOAI masse_mm, Schubkasten = Vorlage", () => {
    for (const z of platten) {
      const [l, b, s] = zahlen(z.mass);
      expect([l, b, s].every((x) => Number.isFinite(x) && x! > 0)).toBe(true);
      expect(zahlen(etiketten.find((e) => e.teil === z.teil)!.mass)).toEqual([l, b, s]);
      const m = freiPlatten.find((p) => voaiTeil(p) === z.teil)!.masse_mm!;
      expect([m.laenge, m.breite, m.dicke].map(Number)).toEqual([l, b, s]);
    }
    for (const t of MESSE_UNTERSCHRANK.schubkastenTeile) {
      const [, name, mass] = /^(.+?) (\d.*)$/.exec(t)!;
      expect(zahlen(zeilen.find((z) => z.teil === `Schubkasten-${name}`)!.mass)).toEqual(zahlen(mass!));
    }
  });

  it("V3 Bohrungen je Teil: Etikett = gezählt aus dem Bohrplan-Layout", () => {
    for (const b of BLAETTER) expect(etikettBohrungen(b.name), b.name).toEqual(bohrungenAusBlatt(b));
    // Seite rechts trägt die Lochreihe wie links, aber keine Montageplatte (Tür links).
    expect(etikettBohrungen("Seite Rechts")).toContain(`Lochreihe ×${LOCHREIHE.length}`);
    expect(etikettBohrungen("Seite Rechts").some((t) => t.startsWith("Montageplatte"))).toBe(false);
    const ohne = etiketten.filter((e) => !(MESSE_BOHRPLAN_TEILE as readonly string[]).includes(e.teil));
    expect(ohne).toHaveLength(6);
    for (const e of ohne) {
      expect(e.bohren, e.teil).toEqual(["keine Bohrung"]);
      expect(e.anreissen, e.teil).toEqual([]);
    }
  });

  it("V4 Blatt = Teil: Maße wie Stückliste, faceWidth = Blattbreite, Löcher im Teil, Verweis stimmt", () => {
    expect(BLAETTER.map((b) => b.name)).toEqual([...MESSE_BOHRPLAN_TEILE]);
    for (const [i, b] of BLAETTER.entries()) {
      const [l, br] = zahlen(zeilen.find((z) => z.teil === b.name)!.mass);
      expect([b.breite, b.hoehe].sort((x, y) => x - y), b.name).toEqual([l!, br!].sort((x, y) => x - y));
      expect(b.layout.faceWidth, b.name).toBe(b.breite);
      const raus = b.layout.points.filter((p) => !(p.x > 0 && p.x < b.breite && p.y > 0 && p.y < b.hoehe));
      expect(raus.map((p) => p.id), b.name).toEqual([]);
      if (b.lochreihe) {
        expect(LOCHREIHE.every((q) => q.x > 0 && q.x < b.breite && q.y > 0 && q.y < b.hoehe), b.name).toBe(true);
      }
      expect(bohrplanBlattVerweis(b.name)).toBe(`Bohrplan Blatt ${i + 1} von ${BLAETTER.length}`);
    }
  });

  it("V5 Beschläge: Blum-Artikel in Stückliste = VOAI = Layout", () => {
    expect(beschlaege).toHaveLength(4);
    const artikel = positionen.filter((p) => p.typ === "artikel");
    for (const z of beschlaege) {
      const p = artikel.find((x) => x.artikel_id === `blum:${z.artikel}`);
      expect(p, z.artikel ?? "").toBeDefined();
      expect([p!.einheit, p!.menge]).toEqual(["stk", String(z.anzahl)]);
      expect(BLAETTER.some((b) => b.layout.article.includes(z.artikel!)), z.artikel ?? "").toBe(true);
    }
    expect(artikel).toHaveLength(4);
  });

  it("Mappe ohne Preis und Betrag; Material-Text in VOAI vorhanden", () => {
    for (const z of platten) {
      const vp = freiPlatten.find((p) => voaiTeil(p) === z.teil)!;
      expect(vp.bezeichnung, z.teil).toContain(z.material);
      // GELB: VOAI trägt den Material-Rohtext, Etikett und CSV die Anzeige (Bernhard entscheidet).
      if (materialAnzeige(z.material) !== z.material) console.warn(`GELB Material-Text ${z.teil}: VOAI »${z.material}«, Etikett »${materialAnzeige(z.material)}«`);
    }
    for (const [name, text] of Object.entries(mappe())) {
      expect(/preis|€|\bEUR\b|\b\d{1,3}(\.\d{3})*,\d{2}\b/i.test(text), name).toBe(false);
    }
  });
});

/** Inhalt der Beleg-Mappe (Dateiname -> Text). */
function mappe(): Record<string, string> {
  const zeile = (z: (typeof platten)[number]) => {
    const blatt = BLAETTER.find((b) => b.name === z.teil);
    const vi = positionen.indexOf(freiPlatten.find((p) => voaiTeil(p) === z.teil)!) + 1;
    const gelb = materialAnzeige(z.material) !== z.material;
    const bohr = etikettBohrungen(z.teil).join(", ") || "keine Bohrung";
    return `| ${z.teil} | ${z.mass} | ${bohr} | ${blatt ? bohrplanBlattVerweis(z.teil) : "–"} | ${vi} | ${gelb ? "gelb: Material-Text" : "grün"} |`;
  };
  const md = [
    "# Beleg Unterschrank 600 · 1 Tür CLIP top · 1 Innenschubkasten MOVENTO",
    "",
    "| Teil | Maß L × B × S mm | Bohrungen (Etikett = Bohrplan) | Blatt | VOAI-Pos. | Stand |",
    "|---|---|---|---|---|---|",
    ...platten.map(zeile),
    "",
    `Beschläge: ${beschlaege.map((z) => `${z.artikel} ×${z.anzahl}`).join(", ")}`,
    `VOAI-Datei: ${voai.schema}, Revision ${voai.inhalt.revision}, inhalt_sha256 ${voai.inhalt_sha256}`,
    "",
  ].join("\n");
  return {
    "stueckliste.csv": "\uFEFF" + stuecklisteCsvText(),
    "voai-stueckliste.json": JSON.stringify(voai, null, 2) + "\n",
    "etiketten.json": JSON.stringify(etiketten, null, 2) + "\n",
    "beleg.md": md,
  };
}

/** Irgendein Test in der Suite (rekursiv) rot? */
type Knoten = { result?: { state?: string }; tasks?: readonly Knoten[] };
const rot = (k: Knoten): boolean => k.result?.state === "fail" || (k.tasks ?? []).some(rot);

/** Mappe nur mit BELEG_DIR und nur, wenn kein Beleg-Test rot war. */
afterAll((suite) => {
  const ziel = process.env.BELEG_DIR;
  if (!ziel || rot(suite as unknown as Knoten)) return;
  mkdirSync(ziel, { recursive: true });
  const dateien = Object.entries(mappe());
  for (const [n, t] of dateien) writeFileSync(join(ziel, n), t);
  writeFileSync(join(ziel, "sha256.txt"), dateien.map(([n, t]) => `${sha256Hex(t)}  ${n}`).join("\n") + "\n");
});
