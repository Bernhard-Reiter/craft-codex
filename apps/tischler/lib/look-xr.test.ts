import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { VI4_XR } from "./look";

const CSS = readFileSync(join(__dirname, "../app/_vi4/look.css"), "utf8");
const ZINKEN = join(__dirname, "../components/zinken");

/** Signalgelb des alten Looks, wie es in Komponenten als Zahl steht. */
const GELB = /#(ffed00|ffd34d|f5c518|ffd400|e0bc00)\b/i;

function cssWert(name: string): string | undefined {
  return CSS.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();
}

describe("VI4-Farben für 3D/XR", () => {
  it("VI4_XR ist gleich den Werten in look.css", () => {
    expect(VI4_XR.brand).toBe(cssWert("--vi4-brand"));
    expect(VI4_XR.papier).toBe(cssWert("--vi4-paper"));
  });

  it("keine Zinken-Komponente enthält Signalgelb", () => {
    const dateien = readdirSync(ZINKEN).filter((f) => f.endsWith(".tsx"));
    expect(dateien.length).toBeGreaterThan(5);
    const mitGelb = dateien.filter((f) => GELB.test(readFileSync(join(ZINKEN, f), "utf8")));
    expect(mitGelb).toEqual([]);
  });

  it("Gegenprobe: das Muster erkennt die alten Gelbwerte", () => {
    expect(GELB.test('color="#ffed00"')).toBe(true);
    expect(GELB.test('const MARKER = "#F5C518";')).toBe(true);
    expect(GELB.test('color="#2c4b7a"')).toBe(false);
  });
});
