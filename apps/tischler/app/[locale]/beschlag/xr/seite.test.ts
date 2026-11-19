import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MESSE_AR_PLATZ, MESSE_BUEHNE, blickAmPlatz } from "../../../../components/MesseSchrank";

/**
 * AR-Seite der Beschlagmontage (wort-19-156, Cs GELB zu Video 6):
 * A1 — die Seite steht in der VI4-Hülle 0.5.0 wie die Etiketten (Menüleiste + Bühne).
 * A3 — ohne AR (Mac, iPad) steht nur ein ruhiger Satz da; der Technik-Grund
 *      (immersive-ar, https, WebXR) nur im title und in der Konsole.
 * Quelltext-Test (Muster bohrplan-blaetter.test.ts): die Seite selbst zieht
 * Canvas + WebXR, ein Rendern in jsdom prüft hier nichts Echtes.
 */
const SEITE = readFileSync(join(__dirname, "page.tsx"), "utf8");

/** JSX-Block »ohne AR«: nach `{support && !support.ar && (` bis zum schließenden `)}` (Bedingung selbst nicht mit). */
function ohneArBlock(q: string): string {
  const marke = "{support && !support.ar && (";
  const start = q.indexOf(marke);
  if (start < 0) return "";
  const ende = q.indexOf(")}", start);
  return q.slice(start + marke.length, ende < 0 ? undefined : ende);
}

/** Sichtbarer Text eines JSX-Blocks: Attribute (title=…, className=…) und {…} raus. */
function sichtbar(block: string): string {
  return block
    .replace(/<[^>]*>/g, " ")
    .replace(/\{[^}]*\}/g, " ");
}

describe("AR-Seite in der VI4-Hülle (A1)", () => {
  it("lädt huelle.js und die VI4-Stile wie die Etiketten", () => {
    expect(SEITE).toContain('src="/vi4-design/huelle.js"');
    for (const css of ["/vi4-design/vi4-tokens.css", "/vi4-design/huelle.css"]) {
      expect(SEITE).toContain(`"${css}"`);
    }
    expect(SEITE).toContain('document.body.classList.add("vi4-rahmen")');
  });

  it("baut Menüleiste und Bühne mit Schließen = Rückweg zur Montage", () => {
    expect(SEITE).toContain('<header id="xr-menue" />');
    expect(SEITE).toContain('<div id="xr-buehne">');
    expect(SEITE).toMatch(/H\.menue\(\{\s*ziel: "#xr-menue"/);
    expect(SEITE).toMatch(/schliessen: \{ wort: "Schließen", verb: "schliessen", tun: zurueck \}/);
    expect(SEITE).toMatch(/H\.baue\(\{ wurzel: "#xr-werk", buehne: "#xr-buehne"/);
    expect(SEITE).toContain("xrRueckweg(beschlagRef.current.id)");
  });

  it("die Website-Kopfleiste fällt auf /beschlag/xr weg (sonst zwei Leisten, wort-22-605)", () => {
    const kopf = readFileSync(join(__dirname, "../../../../components/SiteHeader.tsx"), "utf8");
    const zeile = kopf.split("\n").find((z) => z.includes("return null;") && z.includes("pathname ===")) ?? "";
    expect(zeile).toContain('pathname === "/beschlag/xr"');
  });

  it("der Rückweg-Link »← Desktop-Ansicht« bleibt (Video-Treiber, 0080aee)", () => {
    expect(SEITE).toContain("<Link href={xrRueckweg(beschlag.id)}>← Desktop-Ansicht</Link>");
  });

  it("Platz 0 wie die Montage: Umgebung korpus (G2)", () => {
    expect(SEITE).toContain('umgebung: { aktiv: "korpus"');
    expect(SEITE).not.toContain('aktiv: "layout"');
  });

  it("Name in der Leiste ohne Stern, Label nie roh (G1)", () => {
    expect(SEITE).toContain('titel: "Montage in AR"');
    expect(SEITE).toContain("zusatz: () => klar(beschlagRef.current.label)");
    expect(SEITE).not.toMatch(/zusatz: \(\) => beschlagRef\.current\.label/);
    expect(SEITE).toContain('s.replace(/^[^\\p{L}\\p{N}]+/u, "")');
  });
});

describe("ohne AR nur ein ruhiger Satz (A3)", () => {
  it("der Block ohne AR zeigt den ruhigen Satz", () => {
    const block = ohneArBlock(SEITE);
    expect(block).not.toBe("");
    expect(block).toContain("{OHNE_AR_SATZ}");
    expect(SEITE).toContain('const OHNE_AR_SATZ = "AR läuft auf der Quest 3 — hier die Desktop-Ansicht.";');
  });

  it("kein Technik-Wort im sichtbaren Text, Grund nur im title", () => {
    const block = ohneArBlock(SEITE);
    expect(sichtbar(block)).not.toMatch(/immersive|https|WebXR|kann kein/i);
    expect(block).toMatch(/title=\{support\.reason/);
  });

  it("auch die Prüf-Zeile vor dem Ergebnis nennt kein WebXR", () => {
    expect(SEITE).not.toContain("Prüfe WebXR-Unterstützung");
  });
});

describe("Montage-Schritt in AR (A2)", () => {
  it("bei ?vorlage=messe übernimmt die AR-Seite den gemerkten Montage-Schritt (gleicher Schlüssel wie die Montage)", () => {
    const MONTAGE = readFileSync(join(__dirname, "..", "page.tsx"), "utf8");
    for (const q of [SEITE, MONTAGE]) {
      // ein Schlüssel für beide Seiten, aus MesseStueckliste — kein eigener String je Seite
      expect(q).not.toContain('"beschlag-messe-schritt"');
      expect(q).toMatch(/import \{[^}]*MESSE_SCHRITT_KEY[^}]*\} from "[./]+\/components\/MesseStueckliste"/);
    }
    expect(SEITE).toContain("sessionStorage.getItem(MESSE_SCHRITT_KEY)");
    expect(SEITE).toMatch(/setIndex\(schrittAusSpeicher\(roh, /);
    // nach waehle(v) (setzt Schritt 0), sonst gewönne die 0
    expect(SEITE.indexOf("if (v) waehle(v);")).toBeGreaterThan(0);
    expect(SEITE.indexOf("setIndex(schrittAusSpeicher(")).toBeGreaterThan(SEITE.indexOf("if (v) waehle(v);"));
  });

  it("schreibt den Schritt bei der Messe-Vorlage zurück, damit der Rückweg zur Montage beim selben Schritt landet", () => {
    const i = SEITE.indexOf("sessionStorage.setItem(MESSE_SCHRITT_KEY, String(index))");
    expect(i).toBeGreaterThan(0);
    // nur für die Messe-Vorlage, und bei jedem Schrittwechsel neu
    const vor = SEITE.lastIndexOf("useEffect(", i);
    expect(SEITE.slice(vor, i)).toContain('if (beschlag.id !== "messe") return;');
    expect(SEITE.slice(i, i + 250)).toContain("}, [index, beschlag.id]);");
  });
});

describe("Messe-Vorschau der AR-Seite (Video 9, C PW11)", () => {
  it("sieht die linke Korpusseite wie die Montage, der Quest-Platz bleibt", () => {
    // Platz und Drehung des freien Schranks unverändert (Quest), nur aus der Konstante
    expect(MESSE_AR_PLATZ).toEqual({ position: [0.9, 0, -1.2], drehungY: -0.4 });
    expect(SEITE).toContain("<group position={MESSE_AR_PLATZ.position} rotation={[0, MESSE_AR_PLATZ.drehungY, 0]}>");
    expect(SEITE).not.toContain("position: [0, 0, 2.9]");
    expect(SEITE).toContain("blickAmPlatz(MESSE_BUEHNE)");
    expect(SEITE).toContain("<VorschauBlick buehne={vorschau} />");

    const { kamera, ziel } = blickAmPlatz(MESSE_BUEHNE);
    const [px, , pz] = MESSE_AR_PLATZ.position;
    const th = MESSE_AR_PLATZ.drehungY;
    // Mitte der linken Seite (x = −0,3 m, y 0,425, z −0,29) in Welt, Außennormale −x gedreht
    const welt = (x: number, y: number, z: number) => [
      x * Math.cos(th) + z * Math.sin(th) + px, y, -x * Math.sin(th) + z * Math.cos(th) + pz,
    ];
    const mitte = welt(-0.3, 0.425, -0.29);
    const normale = [-Math.cos(th), 0, Math.sin(th)];
    const zurKamera = kamera.map((v, i) => v - mitte[i]!);
    const abstand = Math.hypot(...zurKamera);
    const zuwendung = normale.reduce((s, v, i) => s + v * zurKamera[i]! / abstand, 0);
    expect(zuwendung).toBeGreaterThan(0.2); // vorher (Kamera 0/0/2,9) etwa −0,23: Seite weggedreht
    expect(abstand).toBeLessThan(2.5); // vorher etwa 4,6 m: Schrank winzig
    // Kamera und Ziel = Montage-Blick, im Schrank-Rahmen
    const [kx, ky, kz] = MESSE_BUEHNE.kamera;
    const [zx, zy, zz] = MESSE_BUEHNE.ziel;
    expect(Math.hypot(...kamera.map((v, i) => v - welt(kx, ky, kz)[i]!))).toBeLessThan(1e-9);
    expect(Math.hypot(...ziel.map((v, i) => v - welt(zx, zy, zz)[i]!))).toBeLessThan(1e-9);
  });
});
