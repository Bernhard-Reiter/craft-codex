import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LEHRGANG_DE } from "./lehrgang";
import { LEHRGANG_EN } from "./lehrgang.en";
import { buildAnreissFlow } from "./anreiss-flow";
import { buildAnreissFlowEn } from "./anreiss-flow.en";
import { SCHWALBENSCHWANZ_LEKTION } from "./lektion";
import { SCHWALBENSCHWANZ_LEKTION_EN } from "./lektion.en";

/**
 * P1 · bekannte Fachfehler raus (z-p1 v2 §4: E1, E2, E3, E6, E7, E11) und
 * der Rechner-Hinweis (T11). Grundlage: Bernhards »ja« auf TG 5074.
 */

const APP = new URL("../../", import.meta.url);
const text = (rel: string) => readFileSync(fileURLToPath(new URL(rel, APP)), "utf8");
const json = (rel: string) => JSON.parse(text(rel)) as Record<string, Record<string, unknown>>;

const eintrag = <T extends { id: string }>(liste: readonly T[], id: string) => liste.find((s) => s.id === id);

describe("P1 · E6 »10–14°« ist weg (T4)", () => {
  it.each([
    "lib/zinken/lehrgang.ts",
    "lib/zinken/lehrgang.en.ts",
    "messages/de/zinken.json",
    "messages/en/zinken.json",
  ])("%s nennt keine 10–14°", (rel) => {
    expect(text(rel)).not.toMatch(/10\s*°?\s*[–-]\s*14|10\s*°\s*(bis|to)\s*14/);
  });
});

describe("P1 · E11 einheitliche Begriffe (T5)", () => {
  it.each([
    "lib/zinken/lehrgang.ts",
    "lib/zinken/lektion.ts",
    "lib/zinken/anreiss-flow.ts",
    "components/zinken/ZinkenWerkstueck3D.tsx",
    "messages/de/zinken.json",
    "messages/de/xr.json",
  ])("%s: Stemmeisen und Grundlinie statt Stecheisen/Stechbeitel/Stemmtiefe", (rel) => {
    expect(text(rel)).not.toMatch(/Stecheisen|Stechbeitel|Stemmtiefe/);
  });

  it.each([
    "lib/zinken/lehrgang.en.ts",
    "lib/zinken/lektion.en.ts",
    "lib/zinken/anreiss-flow.en.ts",
    "messages/en/zinken.json",
    "messages/en/xr.json",
  ])("%s: baseline statt chopping depth", (rel) => {
    expect(text(rel)).not.toMatch(/chopping depth/i);
  });
});

describe("P1 · E2 Grundlinie: Zinkenbrett nur Flächen, Schwalbenbrett umlaufend (T6)", () => {
  it("Kapitel 2 DE: Handgriff Grundlinie sagt beides", () => {
    const k2 = eintrag(LEHRGANG_DE, "anzeichnen");
    expect(k2, "Eintrag anzeichnen fehlt").toBeDefined();
    const g = k2?.nachmachen.find((h) => /Grundlinie/.test(h.kurz));
    expect(g?.lang ?? "").toMatch(/nur auf beiden Flächen/);
    expect(g?.lang ?? "").toMatch(/Schwalbenbrett umlaufend/);
  });

  it("Kapitel 2 EN: Handgriff baseline sagt beides", () => {
    const k2 = eintrag(LEHRGANG_EN, "anzeichnen");
    expect(k2, "entry anzeichnen missing").toBeDefined();
    const g = k2?.nachmachen.find((h) => /[Bb]aseline/.test(h.kurz));
    expect(g?.lang ?? "").toMatch(/only on both faces/);
    expect(g?.lang ?? "").toMatch(/tail board all the way round/);
  });

  it("Anreiß-Ablauf (Zinkenbrett): Streichmaß nicht mehr rundherum", () => {
    const de = buildAnreissFlow(140, 20).schritte.find((s) => s.id === "streichmass")!;
    const en = buildAnreissFlowEn(140, 20).schritte.find((s) => s.id === "streichmass")!;
    expect(de.meisterSagt).not.toMatch(/rundherum|umlauf|rundum|ums Brett|allen vier Seiten/);
    expect(en.meisterSagt).not.toMatch(/all the way a?round|right around|around the board|all four sides/);
  });

  it("Lektion Beat anreissen: nicht mehr umlaufend", () => {
    const de = eintrag(SCHWALBENSCHWANZ_LEKTION, "anreissen")!;
    const en = eintrag(SCHWALBENSCHWANZ_LEKTION_EN, "anreissen")!;
    expect(de.meisterSays).not.toMatch(/rundherum|umlauf|rundum|ums Brett|allen vier Seiten/);
    expect(en.meisterSays).not.toMatch(/all the way a?round|right around|around the board|all four sides/);
  });

  it("XR-Tafel Streichmaß: nicht mehr umlaufend", () => {
    expect(String(json("messages/de/xr.json").detail?.streichmass)).not.toMatch(/rundherum|umlauf|rundum|ums Brett|allen vier Seiten/);
    expect(String(json("messages/en/xr.json").detail?.streichmass)).not.toMatch(/all the way a?round|right around|around the board|all four sides/);
  });
});

describe("P1 · E3 Schmiege am Zinkenbrett (T7)", () => {
  it("kein »6 Teile in Faserrichtung« mehr", () => {
    expect(JSON.stringify(LEHRGANG_DE)).not.toMatch(/6 Teile in Faserrichtung/);
    expect(JSON.stringify(LEHRGANG_EN)).not.toMatch(/6 parts along the grain/);
  });

  it("Kapitel 2 sagt, wo der Anschlag liegt", () => {
    expect(JSON.stringify(eintrag(LEHRGANG_DE, "anzeichnen") ?? "")).toMatch(/Anschlag an der Fläche/);
    expect(JSON.stringify(eintrag(LEHRGANG_EN, "anzeichnen") ?? "")).toMatch(/stock rests on the face/);
  });
});

describe("P1 · E7 Außen/Innen, Tischlerdreieck, Ecknummer (T8)", () => {
  it("Kapitel 2 DE nennt alle drei Zeichen", () => {
    const t = JSON.stringify(eintrag(LEHRGANG_DE, "anzeichnen") ?? "");
    for (const w of ["AUSSEN", "Innenseite", "Tischlerdreieck", "Ecknummer"]) expect(t, w).toContain(w);
  });

  it("Kapitel 2 EN nennt alle drei Zeichen", () => {
    const t = JSON.stringify(eintrag(LEHRGANG_EN, "anzeichnen") ?? "");
    for (const w of ["OUTSIDE", "inside face", "cabinetmaker's triangle", "corner number"]) expect(t, w).toContain(w);
  });
});

describe("P1 · E1 Schwalbenbrett wird geneigt gesägt (T9)", () => {
  it("Eintrag passen DE: geneigt, nicht »genau wie beim Zinkenbrett«", () => {
    const t = JSON.stringify(eintrag(LEHRGANG_DE, "passen") ?? "");
    expect(t).toMatch(/geneigt/);
    expect(t).not.toMatch(/genau wie beim Zinkenbrett/);
  });

  it("Eintrag passen EN: angled, not »just like on the pin board«", () => {
    const t = JSON.stringify(eintrag(LEHRGANG_EN, "passen") ?? "");
    expect(t).toMatch(/angled/);
    expect(t).not.toMatch(/just like on the pin board/);
  });
});

describe("P1 · Rechner-Hinweis statt 10–14° (T11)", () => {
  it.each(["de", "en"])("%s: rechner.winkelHinweis nennt 1:6 und 1:7", (sprache) => {
    const h = json(`messages/${sprache}/zinken.json`).rechner?.winkelHinweis;
    expect(typeof h, "Schlüssel rechner.winkelHinweis fehlt").toBe("string");
    expect(String(h)).toMatch(/1:6/);
    expect(String(h)).toMatch(/1:7/);
  });
});
