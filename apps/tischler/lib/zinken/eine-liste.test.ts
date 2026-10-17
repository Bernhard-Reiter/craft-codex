import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1 · Wächter (T3w): Es gibt nur EINE Kapitel-Liste (lib/zinken/kapitel.ts).
 * Kein anderer Quelltext unter app/, components/, lib/ darf eine eigene
 * Literal-Liste von Lehrgang- oder Kapitel-Ids führen (z. B. »reihe«,
 * »MIT_ANIMATION«). Gezählt werden Array-Literale aus lauter Strings, die
 * ALLE solche Ids sind und mindestens zwei Elemente haben. Listen der
 * /dovetail-Schritte (Core DovetailStep, mit »ueberblick«/»pruefen«) fallen
 * dadurch heraus — sie sind Folge-Issue F3, nicht P1.
 */

const APP = fileURLToPath(new URL("../../", import.meta.url));

const IDS = new Set([
  // Kapitel (kapitel.ts)
  "warum",
  "anzeichnen",
  "kontrolle",
  "saegen",
  "stemmen-vorbereiten",
  "stemmen",
  "schwalbenbrett-anreissen",
  "schwalbenbrett-saegen",
  "zusammenfuehren",
  // Lehrgang-Einträge, alt und neu
  "passen",
  "holz",
  "aufteilung",
  "anreissen",
]);

const ERLAUBT = new Set(["lib/zinken/kapitel.ts"]);
const WURZELN = ["app", "components", "lib"] as const;

function dateien(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...dateien(p));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Array-Literale, die nur aus String-Literalen bestehen (auch mehrzeilig). */
const LISTE = /\[\s*((?:"[^"\n]*"\s*,\s*)+"[^"\n]*"\s*,?\s*)\]/g;

function literalListen(quelltext: string): string[][] {
  const out: string[][] = [];
  for (const m of quelltext.matchAll(LISTE)) {
    out.push([...m[1]!.matchAll(/"([^"\n]*)"/g)].map((x) => x[1]!));
  }
  return out;
}

describe("P1 · eine Kapitel-Liste — Wächter gegen Literal-Listen (T3w)", () => {
  it("der Scanner erkennt eine Liste und lässt /dovetail-Listen durch (Selbstprobe)", () => {
    const probe = `const a = ["saegen", "stemmen", "passen"];\nconst b = [\n  "anreissen",\n  "saegen",\n  "pruefen",\n];`;
    const listen = literalListen(probe);
    expect(listen).toHaveLength(2);
    const treffer = listen.filter((l) => l.length >= 2 && l.every((x) => IDS.has(x)));
    expect(treffer).toEqual([["saegen", "stemmen", "passen"]]);
  });

  it("außerhalb von lib/zinken/kapitel.ts führt kein Quelltext eine eigene Id-Liste", () => {
    const funde: string[] = [];
    const gesehen: string[] = [];
    const gelesen = new Map<string, number>();
    for (const teil of WURZELN) {
      for (const p of dateien(join(APP, teil))) {
        const rel = relative(APP, p).split("\\").join("/");
        gesehen.push(rel);
        if (ERLAUBT.has(rel)) continue;
        gelesen.set(teil, (gelesen.get(teil) ?? 0) + 1);
        for (const l of literalListen(readFileSync(p, "utf8"))) {
          if (l.length >= 2 && l.every((x) => IDS.has(x))) funde.push(`${rel}: [${l.join(", ")}]`);
        }
      }
    }
    // Der Wächter hat wirklich gesucht: jede erlaubte Liste lag im Suchbaum (#62 N-b, #72 N1), und JEDE Wurzel
    // hat mindestens eine Datei gelesen — eine leere Wurzel wäre sonst still grün (#72 S1).
    for (const e of ERLAUBT) expect(gesehen).toContain(e);
    expect(WURZELN.filter((w) => !gelesen.get(w))).toEqual([]);
    expect(funde).toEqual([]);
  });
});
