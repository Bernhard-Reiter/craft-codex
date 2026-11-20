import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  BRETT_MM,
  FLAECHEN,
  HOLZ,
  HOLZ_FRAGMENT,
  HOLZ_VERTEX,
  LICHT,
  SPIKE_FARBEN,
  backeFlaeche,
  baueBrettGeometrie,
  baueHolzShaderMaterial,
  brettUVs,
  hash13,
  markY,
  rauschen,
  texturGroesse,
  type BrettMasse,
} from "./holz-spike";

const APP = join(__dirname, "..");
const lies = (rel: string) => readFileSync(join(APP, rel), "utf8");

/** Quelltexte der Messseite außer der einen Konstante. */
const SEITE = [
  "app/[locale]/zinken/spike-holz/page.tsx",
  "components/zinken/SpikeHolzSeite.tsx",
  "components/zinken/SpikeHolzSzene.tsx",
];

/** Signalgelb des alten Looks (wie lib/look-xr.test.ts in #56). */
const GELB = /#(ffed00|ffd34d|f5c518|ffd400|e0bc00)\b/i;

function groesse(g: THREE.BufferGeometry): [number, number, number] {
  g.computeBoundingBox();
  const s = g.boundingBox!.getSize(new THREE.Vector3());
  return [s.x, s.y, s.z].map((v) => Math.round(v * 1e6) / 1e6) as [number, number, number];
}

describe("P6-Spike: das eine Brett", () => {
  it("BRETT_MM = 140 × 20 × 300 mm und unveränderlich", () => {
    expect(BRETT_MM).toEqual({ breite: 140, dicke: 20, laenge: 300 });
    expect(Object.isFrozen(BRETT_MM)).toBe(true);
  });

  it("die Geometrie folgt der Konstante (auch bei anderen Maßen)", () => {
    expect(groesse(baueBrettGeometrie())).toEqual([BRETT_MM.breite, BRETT_MM.dicke, BRETT_MM.laenge]);
    const anders: BrettMasse = { breite: 90, dicke: 18, laenge: 250 };
    expect(groesse(baueBrettGeometrie(anders))).toEqual([90, 18, 250]);
  });

  it("Seite, Komponenten und Shader schreiben keine Brettmaße selbst hin", () => {
    const funde: string[] = [];
    for (const rel of SEITE) {
      const q = lies(rel);
      if (/\b(140|300)\b/.test(q)) funde.push(`${rel}: Zahl 140/300`);
      if (/BoxGeometry/.test(q)) funde.push(`${rel}: eigene BoxGeometry`);
    }
    for (const [name, q] of [["HOLZ_VERTEX", HOLZ_VERTEX], ["HOLZ_FRAGMENT", HOLZ_FRAGMENT]] as const) {
      if (/\b(140|300|20)(\.0)?\b/.test(q)) funde.push(`${name}: Brettmaß im Shader`);
    }
    expect(funde).toEqual([]);
    // positive Vorbedingung: die Szene holt Geometrie und Maße wirklich aus lib/holz-spike
    expect(lies("components/zinken/SpikeHolzSzene.tsx")).toMatch(/baueBrettGeometrie\(\)/);
    expect(lies("components/zinken/SpikeHolzSeite.tsx")).toMatch(/BRETT_MM\.(breite|dicke|laenge)/);
  });

  it("drei Gruppen: 0 Seite (±x), 1 oben/unten (±y), 2 Hirnholz (±z)", () => {
    const g = baueBrettGeometrie();
    expect(g.groups.map((x) => x.materialIndex)).toEqual([0, 1, 2]);
    expect(FLAECHEN).toEqual(["seite", "oben", "hirn"]);
    const nrm = g.getAttribute("normal");
    const idx = g.getIndex()!;
    const achse = [0, 1, 2]; // x, y, z
    g.groups.forEach((gr, k) => {
      for (let i = gr.start; i < gr.start + gr.count; i++) {
        const v = idx.getX(i);
        const n = [nrm.getX(v), nrm.getY(v), nrm.getZ(v)];
        expect(Math.abs(n[achse[k]!]!)).toBe(1);
      }
    });
  });

  it("UVs liegen in [0, 1]; auf den Längsflächen läuft u entlang der Faser (z)", () => {
    const g = baueBrettGeometrie();
    const pos = g.getAttribute("position");
    const nrm = g.getAttribute("normal");
    const uv = brettUVs(pos.array, nrm.array);
    expect(Math.min(...uv)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...uv)).toBeLessThanOrEqual(1);
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(nrm.getZ(i)) === 1) continue; // Hirnholz
      expect(uv[2 * i]).toBeCloseTo(pos.getZ(i) / BRETT_MM.laenge + 0.5, 6);
    }
  });
});

describe("P6-Spike: Holz-Shader billig und plausibel", () => {
  it("kein Raymarching, keine Schleife, keine Textur, kein discard", () => {
    for (const q of [HOLZ_VERTEX, HOLZ_FRAGMENT]) {
      expect(q).not.toMatch(/\b(for|while|do)\s*[({]/);
      expect(q).not.toMatch(/texture|sampler/i);
      expect(q).not.toMatch(/\bdiscard\b/);
    }
    // genau zwei Rausch-Aufrufe in main (plus die Definition) = 16 Hash-Werte je Pixel
    expect(HOLZ_FRAGMENT.match(/rauschen\(/g)?.length).toBe(3);
  });

  it("Holzwerte plausibel für Fichte, Markröhre außerhalb des Bretts", () => {
    expect(HOLZ.ringAbstandMm).toBeGreaterThanOrEqual(1);
    expect(HOLZ.ringAbstandMm).toBeLessThanOrEqual(8);
    expect(HOLZ.rauschAmplitudeMm).toBeLessThan(HOLZ.ringAbstandMm);
    expect(HOLZ.fruehAnteil + HOLZ.uebergang).toBeLessThan(1);
    expect(HOLZ.faserTiefe).toBeGreaterThanOrEqual(0);
    expect(HOLZ.faserTiefe).toBeLessThanOrEqual(0.3);
    expect(markY()).toBeLessThan(-BRETT_MM.dicke / 2);
    expect(LICHT.umgebung).toBeGreaterThan(0);
    expect(LICHT.umgebung).toBeLessThan(1);
  });

  it("die Uniforms kommen aus HOLZ und BRETT_MM", () => {
    const m = baueHolzShaderMaterial();
    const u = m.uniforms;
    expect(u.uRingAbstand!.value).toBe(HOLZ.ringAbstandMm);
    expect(u.uFruehAnteil!.value).toBe(HOLZ.fruehAnteil);
    expect(u.uRauschAmp!.value).toBe(HOLZ.rauschAmplitudeMm);
    expect((u.uMark!.value as THREE.Vector2).y).toBe(markY());
    expect((u.uLicht!.value as THREE.Vector3).length()).toBeCloseTo(1, 9);
    // jede Uniform, die der Shader erklärt, wird auch gesetzt
    const erklaert = [...HOLZ_FRAGMENT.matchAll(/uniform \w+ (\w+);/g)].map((x) => x[1]).sort();
    expect(erklaert).toEqual(Object.keys(u).sort());
    m.dispose();
  });

  it("Hash und Rauschen: deterministisch und im Bereich [0, 1]", () => {
    let min = 1;
    let max = 0;
    for (let i = 0; i < 500; i++) {
      const h = hash13(i * 1.7, i * 0.3, -i);
      const n = rauschen(i * 0.37, i * 0.11, i * 0.05);
      min = Math.min(min, h, n);
      max = Math.max(max, h, n);
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(1);
    expect(max - min).toBeGreaterThan(0.5);
    expect(hash13(1, 2, 3)).toBe(hash13(1, 2, 3));
  });
});

describe("P6-Spike: Plan B (gebackene Textur)", () => {
  it("drei kleine Texturen, Zweierpotenzen, zusammen höchstens 2^18 Pixel", () => {
    let summe = 0;
    for (const f of FLAECHEN) {
      const { breite, hoehe } = texturGroesse(f);
      expect(Math.log2(breite) % 1).toBe(0);
      expect(Math.log2(hoehe) % 1).toBe(0);
      summe += breite * hoehe;
    }
    expect(summe).toBeLessThanOrEqual(2 ** 18);
  });

  it("backen ist deterministisch, deckend und zeigt Jahresringe (hell/dunkel)", () => {
    const a = backeFlaeche("oben");
    const b = backeFlaeche("oben");
    expect(a.daten.length).toBe(a.breite * a.hoehe * 4);
    expect(Buffer.from(a.daten).equals(Buffer.from(b.daten))).toBe(true);
    let rotMin = 255;
    let rotMax = 0;
    let nichtDeckend = 0;
    for (let o = 0; o < a.daten.length; o += 4) {
      if (a.daten[o + 3] !== 255) nichtDeckend++;
      rotMin = Math.min(rotMin, a.daten[o]!);
      rotMax = Math.max(rotMax, a.daten[o]!);
    }
    expect(nichtDeckend).toBe(0);
    expect(rotMax - rotMin).toBeGreaterThan(30);
  });
});

describe("P6-Spike: Farben", () => {
  it("kein Signalgelb in der Konstante und in den Quelltexten der Messseite", () => {
    expect(Object.values(SPIKE_FARBEN).filter((c) => GELB.test(c))).toEqual([]);
    const mitGelb = [...SEITE, "lib/holz-spike.ts"].filter(
      (rel) => GELB.test(lies(rel)) || /cc-yellow|cc-btn--primary|cc-mark/.test(lies(rel)),
    );
    expect(mitGelb).toEqual([]);
    expect(GELB.test('color="#ffd400"')).toBe(true); // Gegenprobe
  });
});
