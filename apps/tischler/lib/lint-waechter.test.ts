/**
 * Wächter für den Lint-Wächter (#36): Die App meldet dieselben zwei
 * TS-Hygiene-Regeln wie packages/core — unbenutzte Namen als Fehler (mit
 * `^_`-Ausnahme), `any` als Warnung. Geprüft über die ESLint-API mit der
 * echten Konfiguration der App; die Proben sind gedachte Pfade (`lintText`),
 * es entsteht keine Datei.
 *
 * Warum ein Test: Vor #35 meldete der Lint-Job grün, ohne eine Regel
 * anzuwenden; vor #36 kam `any` + unbenutzte Variable in der App durch, im
 * Kern nicht. Ein Wächter, der nichts prüft, meldet grün — dieser Test merkt
 * es, wenn die Regeln, ihre Dateimuster oder die Next-Regeln wegfallen.
 */
import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE = resolve(APP, "../../packages/core");

const UNUSED = "@typescript-eslint/no-unused-vars";
const ANY = "@typescript-eslint/no-explicit-any";
const PROBE = "export function sab(x: any) { const unbenutzt = 42; return x; }\n";

type Meldung = { ruleId: string | null; severity: number; line: number; message: string };

async function melde(cwd: string, code: string, pfad: string): Promise<Meldung[]> {
  const eslint = new ESLint({ cwd });
  const [res] = await eslint.lintText(code, { filePath: join(cwd, pfad) });
  return (res?.messages ?? []).map((m) => ({
    ruleId: m.ruleId,
    severity: m.severity,
    line: m.line,
    message: m.message,
  }));
}

const von = (ms: Meldung[], regel: string) => ms.filter((m) => m.ruleId === regel);

// ESLint lädt je Instanz die Next-Konfiguration — das braucht mehr als die 5 s Vorgabe.
describe("Lint-Wächter App (#36)", { timeout: 60_000 }, () => {
  it("R1: unbenutzte Variable in lib/*.ts ist ein Fehler", async () => {
    const ms = await melde(APP, PROBE, "lib/__sab.ts");
    expect(von(ms, UNUSED).map((m) => [m.severity, m.line])).toEqual([[2, 1]]);
  });

  it("R2: any in lib/*.ts ist eine Warnung", async () => {
    const ms = await melde(APP, PROBE, "lib/__sab.ts");
    expect(von(ms, ANY).map((m) => m.severity)).toEqual([1]);
  });

  it("R3: beide Regeln greifen auch in .tsx", async () => {
    const ms = await melde(APP, PROBE, "components/__sab.tsx");
    expect([von(ms, UNUSED).length, von(ms, ANY).length]).toEqual([1, 1]);
  });

  it("R4: Variablen mit _ sind frei, andere nicht (Ausnahme wie im Kern)", async () => {
    const code =
      "export function f() { const _frei = 1; const unbenutzt = 2; return 0; }\n";
    const ms = await melde(APP, code, "lib/__frei.ts");
    const namen = von(ms, UNUSED).map((m) => m.message);
    // positive Vorbedingung im selben Test: ohne Regel wäre »kein _frei« leer-grün
    expect(namen.some((t) => t.includes("'unbenutzt'"))).toBe(true);
    expect(namen.filter((t) => t.includes("'_frei'"))).toEqual([]);
  });

  it("P1: dieselbe Probe — App und Kern melden beide Regeln mit gleicher Schwere", async () => {
    const app = await melde(APP, PROBE, "lib/__sab.ts");
    const kern = await melde(CORE, PROBE, "src/__sab.ts");
    const schwere = (ms: Meldung[]) => [UNUSED, ANY].map((r) => von(ms, r).map((m) => m.severity));
    expect(schwere(kern)).toEqual([[2], [1]]);
    expect(schwere(app)).toEqual(schwere(kern));
  });

  it("W1: die Next-Regeln bleiben (img ohne next/image wird gemeldet)", async () => {
    const ms = await melde(APP, 'export const B = () => <img src="x" alt="" />;\n', "components/__img.tsx");
    expect(ms.some((m) => m.ruleId === "@next/next/no-img-element")).toBe(true);
  });

  it("W2: die Probe-Pfade sind nicht ignoriert", async () => {
    const eslint = new ESLint({ cwd: APP });
    for (const p of ["lib/__sab.ts", "components/__sab.tsx", "lib/__frei.ts"]) {
      expect([p, await eslint.isPathIgnored(join(APP, p))]).toEqual([p, false]);
    }
  });

  describe("W3: app/, components/, lib/ werden wirklich gelesen", () => {
    let proOrdner: Record<string, number> = {};
    beforeAll(async () => {
      // ohne errorOnUnmatchedPattern: false wirft ESLint, wenn ein Ordner ganz ignoriert ist —
      // dann fiele W3 per Wurf statt am expect unten.
      const eslint = new ESLint({ cwd: APP, errorOnUnmatchedPattern: false });
      const res = await eslint.lintFiles(["app", "components", "lib"]);
      proOrdner = { app: 0, components: 0, lib: 0 };
      for (const r of res) {
        if (!/\.tsx?$/.test(r.filePath)) continue;
        const ordner = relative(APP, r.filePath).split(/[\\/]/)[0]!;
        if (ordner in proOrdner) proOrdner[ordner] = (proOrdner[ordner] ?? 0) + 1;
      }
    }, 180_000);

    it("je Ordner mehr als 0 TS-Dateien gelintet", () => {
      expect(Object.entries(proOrdner).filter(([, n]) => n === 0)).toEqual([]);
    });
  });

  // #64: `next lint` las nur app/, components/, lib/ — lint ist jetzt die ESLint-CLI über die ganze App.
  it("W4: lint ist die ESLint-CLI über die ganze App", () => {
    const pkg = JSON.parse(readFileSync(join(APP, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.lint).toBe("eslint . --max-warnings 0");
  });

  it("W5: die 5 TS-Dateien außerhalb von app/components/lib sind nicht ignoriert und bekommen beide Regeln", async () => {
    const eslint = new ESLint({ cwd: APP });
    const pfade = ["middleware.ts", "vitest.config.ts", "i18n/navigation.ts", "i18n/request.ts", "i18n/routing.ts"];
    const zeilen: [string, boolean, [number, boolean][], number[]][] = [];
    for (const p of pfade) {
      const [res] = await eslint.lintText(PROBE, { filePath: join(APP, p) });
      const ms: Meldung[] = res?.messages ?? [];
      zeilen.push([
        p,
        await eslint.isPathIgnored(join(APP, p)),
        von(ms, UNUSED).map((m): [number, boolean] => [m.severity, m.message.includes("'unbenutzt'")]),
        von(ms, ANY).map((m) => m.severity),
      ]);
    }
    // erst sammeln, dann EIN expect: ein ignorierter Pfad wirft nicht schon beim ersten Paar
    expect(zeilen).toEqual(pfade.map((p) => [p, false, [[2, true]], [1]]));
  });

  it("W6a: die 5 JS/MJS-Dateien außerhalb sind nicht ignoriert", async () => {
    const eslint = new ESLint({ cwd: APP });
    const pfade = [
      "eslint.config.mjs",
      "next.config.mjs",
      "scripts/build-tts-cache.mjs",
      "scripts/check-i18n-parity.mjs",
      "scripts/harvest-ris-corpus.mjs",
    ];
    const paare: [string, boolean][] = [];
    for (const p of pfade) paare.push([p, await eslint.isPathIgnored(join(APP, p))]);
    expect(paare).toEqual(pfade.map((p) => [p, false]));
  });

  it("W6b: .mjs bekommt die Next-Regeln", async () => {
    const ms = await melde(APP, "export default [];\n", "scripts/__sab.mjs");
    expect(ms.some((m) => m.ruleId === "import/no-anonymous-default-export")).toBe(true);
  });
});
