import { describe, it, expect } from "vitest";
import {
  ZINKENARTEN,
  getLernpfad,
  getFirstPlayable,
  getZinkenartById,
} from "./zinkenarten";

describe("Zinken-Lernpfad-Datenmodell", () => {
  it("hat eindeutige IDs", () => {
    const ids = ZINKENARTEN.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("order ist lückenlos 1..n", () => {
    const orders = getLernpfad().map((z) => z.order);
    expect(orders).toEqual(
      Array.from({ length: ZINKENARTEN.length }, (_, i) => i + 1),
    );
  });

  it("Lernpfad ist nach order aufsteigend sortiert", () => {
    const orders = getLernpfad().map((z) => z.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("startet einfach (Schwierigkeit 1) und steigert sich", () => {
    const path = getLernpfad();
    expect(path[0]?.schwierigkeit).toBe(1);
    expect(path.at(-1)?.schwierigkeit).toBe(3);
  });

  it("jede spielbare Art hat eine Werkstatt-Route, nicht-spielbare nicht", () => {
    for (const z of ZINKENARTEN) {
      if (z.playable) expect(z.href, z.id).toBeTruthy();
      else expect(z.href, z.id).toBeUndefined();
    }
  });

  it("genau eine spielbare Art existiert und ist der erste Hands-on-Einstieg", () => {
    const playable = ZINKENARTEN.filter((z) => z.playable);
    expect(playable).toHaveLength(1);
    expect(getFirstPlayable()?.id).toBe("offener-schwalbenschwanz");
  });

  it("jede Art hat eine Meister-Stimme (voiceIntro) und Inhalt", () => {
    for (const z of ZINKENARTEN) {
      expect(z.voiceIntro.length, z.id).toBeGreaterThan(20);
      expect(z.was.length, z.id).toBeGreaterThan(20);
      expect(z.wann.length, z.id).toBeGreaterThan(20);
    }
  });

  it("getZinkenartById findet und verfehlt korrekt", () => {
    expect(getZinkenartById("fingerzinken")?.name).toBe("Fingerzinken");
    expect(getZinkenartById("gibtsnicht")).toBeUndefined();
  });
});
