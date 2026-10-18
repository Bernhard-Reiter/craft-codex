import { describe, it, expect } from "vitest";
import {
  MESS_DAUER_MS,
  ZIEL_HZ,
  auswerten,
  brichMessungAb,
  fpsAus,
  laufendeSekunden,
  neueMessung,
  nimmFrame,
  starteMessung,
  urteilFuer,
  type FpsMessung,
} from "./fps-messung";

/** Füttert eine laufende Messung, bis sie fertig ist; gibt die Zahl der Aufrufe zurück. */
function fuettere(m: FpsMessung, delta: (i: number) => number, max = 100_000): number {
  let i = 0;
  while (m.zustand === "laeuft" && i < max) nimmFrame(m, delta(i++));
  return i;
}

describe("fps-messung (P6-Spike)", () => {
  it("Ziel und Dauer stehen fest: 72 Hz, 60 s", () => {
    expect(ZIEL_HZ).toBe(72);
    expect(MESS_DAUER_MS).toBe(60_000);
  });

  it("80 Hz gleichmäßig über 60 s: 4800 Frames, alle Kennzahlen 80, Urteil ok", () => {
    const m = neueMessung();
    starteMessung(m);
    fuettere(m, () => 12.5);
    const a = auswerten(m);
    expect(m.zustand).toBe("fertig");
    expect(a.frames).toBe(4800);
    expect(a.dauerS).toBeCloseTo(60, 6);
    expect(a.mittelFps).toBeCloseTo(80, 6);
    expect(a.low1Fps).toBeCloseTo(80, 6);
    expect(a.minFps).toBeCloseTo(80, 6);
    expect(a.urteil).toBe("ok");
  });

  it("genau 72 Hz ist ok (Grenze gehört zu ok)", () => {
    const m = neueMessung();
    starteMessung(m);
    fuettere(m, () => 1000 / 72);
    const a = auswerten(m);
    expect([4320, 4321]).toContain(a.frames);
    expect(a.mittelFps).toBeCloseTo(72, 3);
    expect(a.urteil).toBe("ok");
  });

  it("60 Hz ist NICHT ok", () => {
    const m = neueMessung();
    starteMessung(m);
    fuettere(m, () => 1000 / 60);
    const a = auswerten(m);
    expect(a.mittelFps).toBeCloseTo(60, 3);
    expect(a.urteil).toBe("nicht-ok");
  });

  it("1%-Low und Minimum sehen die Ruckler, der Mittelwert kaum", () => {
    // je 100 Frames: 99 × 10 ms und 1 × 100 ms → Mittel 100/1,09 s ≈ 91,7 fps
    const m = neueMessung(10_900);
    starteMessung(m);
    fuettere(m, (i) => (i % 100 === 99 ? 100 : 10));
    const a = auswerten(m);
    expect(a.frames).toBe(1000);
    expect(a.mittelFps).toBeCloseTo(1000 / 10.9, 6);
    expect(a.low1Fps).toBeCloseTo(10, 6);
    expect(a.minFps).toBeCloseTo(10, 6);
    expect(a.urteil).toBe("ok");
  });

  it("1%-Low mittelt die langsamsten 1 % (nicht nur den einen schlechtesten)", () => {
    // 1000 Frames: 990 × 10 ms, 5 × 20 ms, 5 × 40 ms → langsamste 10 im Mittel 30 ms
    const m = neueMessung(1_000_000);
    starteMessung(m);
    for (let i = 0; i < 1000; i++) nimmFrame(m, i < 5 ? 20 : i < 10 ? 40 : 10);
    const a = auswerten(m);
    expect(a.low1Fps).toBeCloseTo(1000 / 30, 6);
    expect(a.minFps).toBeCloseTo(25, 6);
  });

  it("Urteil: gerundet wie angezeigt — 71,96 → 72,0 ok, 71,94 → 71,9 NICHT ok", () => {
    expect(urteilFuer(71.96, 100)).toBe("ok");
    expect(urteilFuer(71.94, 100)).toBe("nicht-ok");
    expect(urteilFuer(120, 0)).toBe("keine-daten");
  });

  it("nimmt nur während der Messung auf und ignoriert ungültige Werte", () => {
    const m = neueMessung(1_000);
    expect(nimmFrame(m, 10)).toBe(false); // bereit
    starteMessung(m);
    for (const d of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) expect(nimmFrame(m, d)).toBe(false);
    expect(m.anzahl).toBe(0);
    let fertigMeldungen = 0;
    for (let i = 0; i < 200; i++) if (nimmFrame(m, 10)) fertigMeldungen++;
    expect(fertigMeldungen).toBe(1);
    expect(m.anzahl).toBe(100);
    expect(laufendeSekunden(m)).toBeCloseTo(1, 9);
  });

  it("Puffer voll beendet die Messung; der Puffer wird nie neu angelegt", () => {
    const m = neueMessung(1_000, 10); // Platz für 10 Frames
    const puffer = m.deltas;
    starteMessung(m);
    expect(fuettere(m, () => 1)).toBe(10);
    expect(m.zustand).toBe("fertig");
    starteMessung(m);
    expect(m.deltas).toBe(puffer);
    expect(m.anzahl).toBe(0);
  });

  it("Abbruch verwirft die Werte; auswerten ohne Frames = keine Daten", () => {
    const m = neueMessung();
    starteMessung(m);
    for (let i = 0; i < 50; i++) nimmFrame(m, 14);
    brichMessungAb(m);
    expect(m.zustand).toBe("bereit");
    expect(auswerten(m)).toEqual({ frames: 0, dauerS: 0, mittelFps: 0, low1Fps: 0, minFps: 0, urteil: "keine-daten" });
  });

  it("Live-Bildrate aus Frames und Zeit", () => {
    expect(fpsAus(72, 1000)).toBe(72);
    expect(fpsAus(10, 0)).toBe(0);
  });
});
