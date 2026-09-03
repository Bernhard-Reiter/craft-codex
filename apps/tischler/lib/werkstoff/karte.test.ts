/**
 * Materialkarte im Panel: gruppieren, Ampel, Verweise, Lücken — und kein stiller Fallback.
 * Die Fixture ist die ECHTE Karte aus dem Offline-Bundle (cody-cad M5-04), nicht erfunden:
 * genau das JSON, das auf der Baustelle im Auftragsordner liegt.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  gruppiere,
  luecken,
  rolleLesbar,
  schwaechste,
  verweise,
  type Materialkarte,
} from "./karte";

const KARTE = JSON.parse(
  readFileSync(
    join(__dirname, "../../public/werkstoff-bundle/karten/seite-links-890x555.json"),
    "utf8",
  ),
) as Materialkarte;

describe("Materialkarte aus dem Offline-Bundle", () => {
  it("ist die Karte, die cody-cad erzeugt hat — mit Identität und Freigabe", () => {
    expect(KARTE.schema).toBe("werkstoff/karte.schema.json");
    expect(KARTE.karte_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(KARTE.resolve_manifest_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(KARTE.freigabe).toBe("annahme");
    expect(KARTE.komponenten.length).toBeGreaterThanOrEqual(10);
  });

  it("trägt keine Betriebsdaten — kein Preis geht mit auf die Baustelle", () => {
    const roh = JSON.stringify(KARTE);
    expect(roh).not.toContain('"preise"');
    expect(roh).not.toContain("EUR/kg");
  });

  it("gruppiert nach dem, was am Stück passiert, und verliert keine Zeile", () => {
    const gruppen = gruppiere(KARTE.komponenten);
    expect(gruppen.map((g) => g.titel)).toContain("Trägerplatte");
    expect(gruppen.map((g) => g.titel)).toContain("Leim & Kleber");
    expect(gruppen.reduce((n, g) => n + g.zeilen.length, 0)).toBe(KARTE.komponenten.length);
  });

  it("jede Zeile hat eine Freigabe; die Karte ist nie besser als ihre schwächste Zeile", () => {
    const alle = KARTE.komponenten.map((z) => z.freigabe);
    expect(alle.every(Boolean)).toBe(true);
    expect(KARTE.freigabe).toBe(schwaechste(alle));
  });

  it("zeigt EGGER und ADLER mit antippbaren Datenblättern (https + Seite)", () => {
    const traeger = KARTE.komponenten.find((z) => z.rolle === "traeger");
    expect(traeger?.hersteller).toContain("EGGER");
    const links = verweise(traeger!);
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((u) => u.url!.startsWith("https://"))).toBe(true);
    expect(links.every((u) => Boolean(u.seiten))).toBe(true);
    const lack = KARTE.komponenten.find((z) => (z.hersteller ?? "").includes("ADLER"));
    expect(lack).toBeDefined();
    expect(verweise(lack!).length).toBeGreaterThan(0);
  });

  it("nennt die Lücken, statt sie zu verstecken", () => {
    expect(KARTE.unterlagen_ohne_verweis.length).toBeGreaterThan(0);
    for (const l of KARTE.unterlagen_ohne_verweis) {
      expect(l.grund.length).toBeGreaterThan(9);
    }
    expect(KARTE.komponenten.some((z) => luecken(KARTE, z).length > 0)).toBe(true);
  });

  it("spricht Werkstatt-Deutsch", () => {
    expect(rolleLesbar("klebstoff/kante/vorne")).toBe("Klebstoff · Kante · vorne");
    expect(rolleLesbar("oberflaeche/oben/1-klarlack")).toContain("Oberfläche");
  });

  it("schwaechste: leere Menge hat keine Freigabe", () => {
    expect(schwaechste([])).toBeUndefined();
    expect(schwaechste(["belegt", "annahme", "verifiziert"])).toBe("annahme");
  });
});
