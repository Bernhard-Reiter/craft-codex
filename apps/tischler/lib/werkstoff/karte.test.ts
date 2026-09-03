/**
 * Materialkarte im Panel: gruppieren, Ampel, Verweise, Lücken — und kein stiller Fallback.
 * Die Fixture ist die ECHTE Karte aus dem Offline-Bundle (cody-cad M5-04), nicht erfunden:
 * genau das JSON, das auf der Baustelle im Auftragsordner liegt.
 */
import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  gruppiere,
  luecken,
  rolleLesbar,
  schwaechste,
  verweise,
  type Materialkarte,
  ladeKarte,
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

// ---------------------------------------------------------------------------
// ladeKarte war bis eben von KEINEM Test gedeckt — dieselbe Lücke wie bei den
// strikten Schemata drüben: die Regel stand da, den Weg dorthin ging niemand.
// Der Stub liest die ECHTEN Bundle-Dateien, damit hier nicht eine erfundene
// Nutzlast geprüft wird, die es so nie gibt.
// ---------------------------------------------------------------------------
describe("ladeKarte", () => {
  const bundle = join(__dirname, "../../public/werkstoff-bundle");

  /** fetch über das Dateisystem — `aenderung` darf eine Antwort verbiegen. */
  const stub = (aenderung?: (pfad: string, inhalt: string) => string | null) =>
    vi.fn(async (url: string) => {
      const pfad = join(bundle, url.replace("/werkstoff-bundle/", ""));
      if (!existsSync(pfad)) return { ok: false, status: 404 } as Response;
      const roh = readFileSync(pfad, "utf8");
      const inhalt = aenderung ? aenderung(url, roh) : roh;
      if (inhalt === null) return { ok: false, status: 404 } as Response;
      return { ok: true, status: 200, json: async () => JSON.parse(inhalt) } as Response;
    });

  it("liefert die Karte, wenn Karte und Manifest zusammengehören", async () => {
    vi.stubGlobal("fetch", stub());
    const k = await ladeKarte("boden-562x555");
    expect(k.werkstueck.id).toBe("boden-562x555");
    vi.unstubAllGlobals();
  });

  it("zeigt lieber nichts als das falsche Material", async () => {
    vi.stubGlobal("fetch", stub());
    await expect(ladeKarte("gibt-es-nicht")).rejects.toThrow(/Keine Karte/);
    vi.unstubAllGlobals();
  });

  it("verlangt das Resolve-Manifest im Bundle", async () => {
    // Ohne Manifest hieße "bekanntes Werkstück" nur: es steht in der Datei, die ich
    // gerade gelesen habe. Die Karte belegte sich selbst.
    vi.stubGlobal("fetch", stub((url, roh) => (url.includes("/manifeste/") ? null : roh)));
    await expect(ladeKarte("boden-562x555")).rejects.toThrow(/ohne Resolve-Manifest/);
    vi.unstubAllGlobals();
  });

  it("lehnt ab, wenn Karte und Manifest nicht zusammengehören", async () => {
    vi.stubGlobal(
      "fetch",
      stub((url, roh) =>
        url.includes("/manifeste/")
          ? JSON.stringify({ ...JSON.parse(roh), resolve_manifest_sha256: "f".repeat(64) })
          : roh,
      ),
    );
    await expect(ladeKarte("boden-562x555")).rejects.toThrow(/gehören nicht zusammen/);
    vi.unstubAllGlobals();
  });
});
