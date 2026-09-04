/**
 * Materialkarte im Panel: gruppieren, Ampel, Verweise, Lücken — und kein stiller Fallback.
 * Die Fixture ist die ECHTE Karte aus dem Offline-Bundle (cody-cad M5-04), nicht erfunden:
 * genau das JSON, das auf der Baustelle im Auftragsordner liegt.
 */
import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  arbeitsfolge,
  ladeDatengrenze,  gruppiere,
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

  it("lässt »leer gegen leer« nicht als Übereinstimmung durchgehen", async () => {
    // Der Fail-Open, der in genau dem Code saß, der die Lücke schließen sollte: fehlt der Hash
    // auf BEIDEN Seiten, ist `undefined !== undefined` falsch — kein Wurf, Karte geliefert.
    // Zwei leere Zeichenketten genauso. »Leer« heißt hier Messfehler, nicht gleich.
    for (const leer of [undefined, ""] as const) {
      vi.stubGlobal(
        "fetch",
        stub((_url, roh) => {
          const o = JSON.parse(roh);
          if (leer === undefined) delete o.resolve_manifest_sha256;
          else o.resolve_manifest_sha256 = leer;
          return JSON.stringify(o);
        }),
      );
      await expect(ladeKarte("boden-562x555")).rejects.toThrow(
        /ohne gültigen Manifest-Hash/,
      );
      vi.unstubAllGlobals();
    }
  });

  it("verlangt den Werkstückbezug im Manifest, nicht nur denselben Hash", async () => {
    // Ohne diese Prüfung hinge der Bezug allein daran, dass zwei Dateien denselben Hash tragen —
    // ein Manifest unter falschem Dateinamen käme durch.
    vi.stubGlobal(
      "fetch",
      stub((url, roh) =>
        url.includes("/manifeste/")
          ? JSON.stringify({ ...JSON.parse(roh), werkstueck: { id: "ein-anderes" } })
          : roh,
      ),
    );
    await expect(ladeKarte("boden-562x555")).rejects.toThrow(/Manifest gehört zu ein-anderes/);
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

describe("arbeitsfolge", () => {
  // Sie stand in jeder Karte und wurde nie angezeigt — dabei ist sie der Teil, für den der
  // Handwerker das Panel aufmacht. Geprüft an der ECHTEN Karte, nicht an erfundenen Schritten.
  const schritte = arbeitsfolge(KARTE);

  it("gibt alle Schritte in der richtigen Reihenfolge", () => {
    expect(schritte.length).toBe(8);
    expect(schritte.map((s) => s.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("nennt die Schritte, wie sie in der Werkstatt heißen", () => {
    expect(schritte.map((s) => s.titel)).toEqual([
      "Furnieren",
      "Kante anleimen",
      "Schleifen",
      "Lack auftragen",
      "Trocknen",
      "Zwischenschliff",
      "Lack auftragen",
      "Trocknen",
    ]);
  });

  it("trägt die Werte mit Einheit, die am Werkstück gebraucht werden", () => {
    // `?.` wäre hier falsch: fehlt der Schritt, soll der Test scheitern, nicht schweigen.
    const furnieren = schritte[0]!.werte;
    expect(furnieren).toContainEqual({ was: "Leimauftrag", wert: "120 g/m²" });
    const lack = schritte[3]!.werte;
    expect(lack).toContainEqual({ was: "Auftragsmenge", wert: "100 g/m²" });
    expect(lack).toContainEqual({ was: "Glanzgrad", wert: "10 GU" });
  });

  it("rechnet Minuten in etwas um, das jemand lesen kann", () => {
    // 2880 min sagt keinem etwas. 2 Tage schon — und danach wird die Werkstatt geplant.
    const trocknen = schritte[4]!.werte;
    expect(trocknen).toContainEqual({ was: "Endhärte nach", wert: "2 Tage" });
    expect(trocknen).toContainEqual({ was: "Schleifbar nach", wert: "2 h" });
    expect(trocknen).toContainEqual({ was: "Stapelbar nach", wert: "12 h" });
  });

  it("wirft nichts weg, was in der Karte steht", () => {
    const ausKarte = KARTE.arbeitsfolge.reduce(
      (n, s) => n + Object.keys(s.parameter ?? {}).length,
      0,
    );
    const angezeigt = schritte.reduce((n, s) => n + s.werte.length, 0);
    expect(angezeigt).toBe(ausKarte);
  });
});

describe("die Dicke ist eine Spanne, keine Zahl", () => {
  it("die echte Karte nennt Minimum, Maximum und was NICHT drinsteckt", () => {
    // Nach dieser Zahl werden Nut und Band ausgelegt. Die beiden ADLER-Klarlackschichten sind
    // nicht addiert (Trockenschichtdicke nicht hinterlegt) — das muss am Wert stehen.
    expect(KARTE.dicke_mm.nominal).toBe(20.8);
    expect(KARTE.dicke_mm.minimum).toBe(20.1);
    expect(KARTE.dicke_mm.maximum).toBe(21.5);
    expect(KARTE.dicke_mm.freigabe).toBe("annahme");
    expect(KARTE.dicke_mm.ausgeschlossen).toHaveLength(2);
    for (const a of KARTE.dicke_mm.ausgeschlossen!) {
      expect(a.grund.length).toBeGreaterThan(10);
      expect(a.rolle).toMatch(/klarlack/);
    }
  });
});

describe("ladeDatengrenze", () => {
  const bundle = join(__dirname, "../../public/werkstoff-bundle");
  const stub = (aenderung?: (roh: string) => string | null) =>
    vi.fn(async (url: string) => {
      const pfad = join(bundle, url.replace("/werkstoff-bundle/", ""));
      if (!existsSync(pfad)) return { ok: false, status: 404 } as Response;
      const inhalt = aenderung ? aenderung(readFileSync(pfad, "utf8")) : readFileSync(pfad, "utf8");
      if (inhalt === null) return { ok: false, status: 404 } as Response;
      return { ok: true, status: 200, json: async () => JSON.parse(inhalt) } as Response;
    });

  it("liest die Grenzaussage aus dem echten Bundle", async () => {
    vi.stubGlobal("fetch", stub());
    const g = await ladeDatengrenze();
    expect(g).not.toBeNull();
    // Geprüft wird die AUSSAGE, nicht der Wortlaut: der Satz darf umformuliert werden (und
    // wurde es gerade — cody-cad#61 hat ihn aus der Entwicklersprache geholt), aber zwei Dinge
    // müssen drinstehen, sonst ist er wertlos.
    //
    // 1. WAS bleibt draußen — irgendein Geldbegriff, den ein Handwerker kennt.
    expect(g!.warum).toMatch(/preis|kondition|einkauf/i);
    // 2. WIE WEIT die Zusage reicht. Ohne das hält jemand die Grenze für dichter, als sie ist —
    //    und das ist der Satz, der bei einer Kürzung als Erstes verschwindet.
    expect(g!.grenze).toMatch(/feldname/i);
    expect(g!.grenze).toMatch(/inhalt|wert|freitext|bemerkung/i);
    vi.unstubAllGlobals();
  });

  it("schweigt lieber, als einen unbelegten Satz anzuzeigen", async () => {
    // Fehlende Datei: kein Fehler, aber auch keine Beruhigung.
    vi.stubGlobal("fetch", stub(() => null));
    expect(await ladeDatengrenze()).toBeNull();
    // Halbe Datei (nur `warum`, keine Grenze): genauso — eine Zusage ohne ihre Reichweite ist
    // schlimmer als keine, weil sie für mehr gehalten wird.
    vi.stubGlobal("fetch", stub((roh) => JSON.stringify({ warum: JSON.parse(roh).warum })));
    expect(await ladeDatengrenze()).toBeNull();
    vi.unstubAllGlobals();
  });
});
