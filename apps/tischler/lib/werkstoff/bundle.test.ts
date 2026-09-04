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
