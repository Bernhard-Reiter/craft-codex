import { describe, it, expect } from "vitest";
import { buildVoaiStueckliste, jcs, sha256Hex, VOAI_REVISION, VOAI_SCHEMA } from "./voai-uebergabe.js";

/** Golden-Vektor aus voai-waas contracts/stueckliste/2/fixtures/ok-freiposition-manuell-werkstoff-null.json */
const GOLDEN_INHALT = {
  projekt_ref: "0f1e2d3c-4b5a-4000-8000-000000000002",
  liste_ref: "0f1e2d3c-4b5a-4000-8000-00000000b003",
  revision: 1,
  positionen: [
    {
      position_ref: "bbbbbbbb-0000-4000-8000-000000000020",
      typ: "freiposition",
      artikel_id: null,
      bezeichnung: "Zuschnitt Demo-Platte 19 mm, manuell erfasst",
      menge: "1.25",
      einheit: "m2",
      masse_mm: { laenge: "1250", breite: "1000", dicke: "19" },
      katalog_snapshot_sha256: null,
      herkunft: { art: "manuell" },
      programm: null,
      werkstoff: null,
    },
  ],
};
const GOLDEN_SHA = "5a06e30ec6f0cf61f08d9ce4b5bf0a1ae4fb8b406477eb65abc82700ffccf0a1";

// Regeln aus contracts/stueckliste/2/stueckliste.schema.json (nur gelesen).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DEZ = /^([1-9][0-9]{0,11}(\.[0-9]{0,5}[1-9])?|0\.[0-9]{0,5}[1-9])$/;
const ARTIKEL = /^[a-z0-9][a-z0-9-]{1,40}:[A-Za-z0-9][A-Za-z0-9._/-]{0,60}$/;
const POS_KEYS = [
  "artikel_id", "bezeichnung", "einheit", "herkunft", "katalog_snapshot_sha256",
  "masse_mm", "menge", "position_ref", "programm", "typ", "werkstoff",
];
const VERBOTEN = /"(preis|price|tenant|mandant|kunde|customer|client|user|benutzer|email|adresse|address|telefon|phone|geometr|kommando|command|verlauf|history)/i;

describe("Übergabe an VOAI (stueckliste/2)", () => {
  it("SHA-256 + JCS treffen den Golden-Vektor aus dem VOAI-Vertrag", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex(jcs({ schema: VOAI_SCHEMA, inhalt: GOLDEN_INHALT }))).toBe(GOLDEN_SHA);
  });

  it("Datei hält die Vertragsregeln ein, ohne Preise", () => {
    const d = buildVoaiStueckliste(new Date("2026-11-18T09:00:00.123Z"));
    expect(Object.keys(d).sort()).toEqual(["export", "inhalt", "inhalt_sha256", "schema"]);
    expect(d.export.erzeugt_am).toBe("2026-11-18T09:00:00Z");
    expect(d.inhalt.projekt_ref).toMatch(UUID);
    const refs = d.inhalt.positionen.map((p) => p.position_ref);
    expect(refs).toEqual([...refs].sort());
    expect(new Set(refs).size).toBe(refs.length);
    for (const p of d.inhalt.positionen) {
      expect(p.position_ref).toMatch(UUID);
      expect(p.menge).toMatch(DEZ);
      expect(["stk", "satz", "m"]).toContain(p.einheit);
      expect(POS_KEYS).toEqual(expect.arrayContaining(Object.keys(p)));
      if (p.typ === "artikel") expect(p.artikel_id).toMatch(ARTIKEL);
      else expect(p.artikel_id).toBeNull();
      if (p.masse_mm) Object.values(p.masse_mm).forEach((v) => expect(v).toMatch(DEZ));
    }
    expect(JSON.stringify(d)).not.toMatch(VERBOTEN);
    expect(d.inhalt_sha256).toBe(sha256Hex(jcs({ schema: d.schema, inhalt: d.inhalt })));
  });

  it("16 Positionen: 11 Plattenteile wie die Mappe + 1 Kante + 4 Blum-Artikel (keine Schubkastenfront)", () => {
    const pos = buildVoaiStueckliste().inhalt.positionen;
    expect(pos).toHaveLength(16);
    expect(pos.filter((p) => p.typ === "artikel").map((p) => p.artikel_id)).toEqual([
      "blum:173L6100", "blum:71B3550", "blum:766H5000S", "blum:T51.7601",
    ]);
  });

  it("Blum-Artikel alle in stk, damit VOAI sie bepreist", () => {
    const art = buildVoaiStueckliste().inhalt.positionen.filter((p) => p.typ === "artikel");
    expect(art.map((p) => p.einheit)).toEqual(["stk", "stk", "stk", "stk"]);
  });

  it("jedes Plattenteil hat masse_mm mit Länge, Breite, Dicke > 0", () => {
    const frei = buildVoaiStueckliste().inhalt.positionen.filter((p) => p.typ === "freiposition" && p.einheit === "stk");
    expect(frei).toHaveLength(11);
    for (const p of frei) {
      expect(p.masse_mm, p.bezeichnung ?? "").toBeDefined();
      for (const k of ["laenge", "breite", "dicke"] as const) {
        expect(p.masse_mm![k]).toMatch(/^[1-9]\d*$/);
      }
    }
  });

  it("Mengen für VOAI ohne Preis: Einheit je Gruppe, Werkstoff-Aufbau, Kante in Metern (wie cody-cad)", () => {
    const pos = buildVoaiStueckliste().inhalt.positionen;
    const kurz = (p: (typeof pos)[number]) => (p.bezeichnung ?? "").split(",")[0]!.split(" · ")[0]!;
    const zeile = pos.map((p) => [kurz(p), p.einheit, p.menge, p.werkstoff?.aufbau.id ?? "-",
      p.herkunft.art === "regel" ? p.herkunft.regel_ref : "manuell"].join(" | "));
    expect(zeile.filter((z) => z.includes("demo-aufbau-19")).sort()).toEqual([
      "Boden Oben | stk | 1 | demo-aufbau-19 | korpus-zuschnitt/1",
      "Boden Unten | stk | 1 | demo-aufbau-19 | korpus-zuschnitt/1",
      "Rückwand | stk | 1 | demo-aufbau-19 | korpus-zuschnitt/1",
      "Seite Links | stk | 1 | demo-aufbau-19 | korpus-zuschnitt/1",
      "Seite Rechts | stk | 1 | demo-aufbau-19 | korpus-zuschnitt/1",
      "Tür 1 Links | stk | 1 | demo-aufbau-19 | korpus-zuschnitt/1",
    ]);
    for (const p of pos.filter((x) => x.werkstoff)) expect(p.werkstoff).toEqual({
      aufbau: { katalog: "demo", id: "demo-aufbau-19", revision: 1 }, klasse: "platte",
    });
    // Schubkasten Eiche: kein Aufbau im Katalog -> manuell, werkstoff null.
    expect(zeile.filter((z) => z.startsWith("Schubkasten-"))).toHaveLength(5);
    expect(zeile.filter((z) => z.startsWith("Schubkasten-")).every((z) => z.endsWith("| stk | 1 | - | manuell"))).toBe(true);
    // Kante: Seiten 2×850 + Böden 2×562 + Tür rundum 2×(846+596) = 5708 mm, Rückwand ohne.
    const kante = pos.filter((p) => p.einheit === "m");
    expect(kante.map((p) => [p.menge, p.herkunft.art === "regel" && p.herkunft.regel_ref, p.werkstoff, p.masse_mm])).toEqual([
      ["5.708", "korpus-kante/1", null, undefined],
    ]);
    expect(kante[0]!.bezeichnung).toMatch(/^Kante 19 mm · .*Annahme/);
    expect(pos.filter((p) => p.typ === "artikel").every((p) => p.einheit === "stk" && p.werkstoff === null)).toBe(true);
    // Kein Preis-Schlüssel, nirgends (Vertrag + ADR-0044: den Preis rechnet VOAI).
    const schluessel = JSON.stringify(pos).match(/"[a-z_]+":/g) ?? [];
    expect(schluessel.filter((k) => /preis|price|betrag|eur|summe/i.test(k))).toEqual([]);
  });

  it("Revision zählbar: andere Revision -> anderer Hash, ungültige wird abgelehnt", () => {
    const t = new Date("2026-11-18T09:00:00Z");
    const r1 = buildVoaiStueckliste(t);
    const r2 = buildVoaiStueckliste(t, VOAI_REVISION + 1);
    expect(r1.inhalt.revision).toBe(VOAI_REVISION);
    expect(r2.inhalt.revision).toBe(VOAI_REVISION + 1);
    expect(r2.inhalt_sha256).not.toBe(r1.inhalt_sha256);
    expect(() => buildVoaiStueckliste(t, 0)).toThrow();
    expect(() => buildVoaiStueckliste(t, 1.5)).toThrow();
  });
});
