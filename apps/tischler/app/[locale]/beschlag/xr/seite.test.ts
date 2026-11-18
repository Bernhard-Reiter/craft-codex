import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
