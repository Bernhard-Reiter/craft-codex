import { WorkflowController } from "@craft-codex/core";
import { describe, expect, it } from "vitest";
import { BESCHLAEGE } from "../lib/beschlag/auswahl";
import { MESSE_UNTERSCHRANK as M } from "@craft-codex/core";
import { buehneFuer, offenFuer, teilFuer } from "./MesseSchrank";

/** H6: jeder Messe-Schritt zeigt ein leuchtendes Teil; Tür offen nur, wenn der Kasten sonst verdeckt wäre. */
describe("MesseSchrank Markierung je Montage-Schritt (H6)", () => {
  const messe = BESCHLAEGE.find((b) => b.id === "messe");
  if (!messe) throw new Error("Messe-Vorlage fehlt in BESCHLAEGE");
  const ids = new WorkflowController(messe.workflow).getSteps().map((s) => s.id);

  it("alle 6 Messe-Schritte haben ein Teil, B4 = Tür, M2 = Schubkasten", () => {
    expect(ids).toHaveLength(6);
    expect(ids.map((id) => [id.slice(0, 2), teilFuer(id)])).toEqual([
      ["B1", "tuer"],
      ["B2", "tuer"],
      ["B3", "seite"],
      ["M1", "seite"],
      ["M2", "schubkasten"],
      ["B4", "tuer"],
    ]);
  });

  it("Tür offen + Kasten heraus nur bei M2 und B4", () => {
    expect(ids.filter(offenFuer).map((id) => id.slice(0, 2))).toEqual(["M2", "B4"]);
    expect(offenFuer(undefined)).toBe(false);
  });
});

/** H7: Messe-Bühne ohne graue Werkstück-Tafel, Kamera näher am Schrank; Hawa/Blum unverändert. */
describe("Messe-Bühne (H7)", () => {
  type P3 = [number, number, number];
  const abstand = (a: P3, b: P3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const sichtHoehe = (d: number, fov: number) => 2 * d * Math.tan(((fov / 2) * Math.PI) / 180);

  it("Hawa/Blum: Tafel bleibt, Kamera wie bisher z = 2,9 auf den Nullpunkt", () => {
    expect(buehneFuer(false)).toEqual({ tafel: true, kamera: [0, 0, 2.9], ziel: [0, 0, 0], fov: 45 });
  });

  it("Messe: keine Tafel, Kamera näher als 2,9 und der Schrank passt trotzdem ganz ins Bild", () => {
    const b = buehneFuer(true);
    expect(b.tafel).toBe(false);
    const d = abstand(b.kamera, b.ziel);
    expect(d).toBeLessThan(2.9);
    const h = sichtHoehe(d, b.fov);
    expect(h).toBeGreaterThan(1.3 * M.korpus.hoehe * 0.001);
    expect(h).toBeLessThan(sichtHoehe(2.9, 45) * 0.7);
    // Kamera steht vor der offenen Tür (B4/M2 ragt ~Türbreite nach vorn)
    expect(b.kamera[2]).toBeGreaterThan(M.tuer.breite / 1000 + 0.3);
  });

  it("Messe: Kamera links der linken Seite (B3/M1), Kasten und offene Tür ganz im Bild", () => {
    const b = buehneFuer(true);
    const [B, H] = [M.korpus.breite / 1000, M.korpus.hoehe / 1000];
    expect(b.kamera[0]).toBeLessThan(-B / 2); // sieht die Außenseite der linken Korpusseite
    expect(b.ziel[1]).toBeLessThan(H / 2); // tiefer: Kasten unten nicht abgeschnitten
    // Bildlage (−1..1 senkrecht) wie eine Perspektiv-Kamera mit fov senkrecht
    const sub = (a: P3, c: P3): P3 => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
    const dot = (a: P3, c: P3) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const norm = (a: P3): P3 => {
      const l = Math.hypot(...a);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const f = norm(sub(b.ziel, b.kamera));
    const r = norm([-f[2], 0, f[0]]); // f × (0,1,0)
    const u: P3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const t = Math.tan(((b.fov / 2) * Math.PI) / 180);
    const bildY = (p: P3) => {
      const d = sub(p, b.kamera);
      return dot(d, u) / dot(d, f) / t;
    };
    const auszug = 0.4; // AUSZUG_MM
    const tuerX = -B / 2 - 0.1; // offene Tür (99°) steht etwas links der Seite
    const punkte: P3[] = [
      [0, 0.03, auszug], // Kasten vorn unten (M2)
      [-B / 2, 0, 0], // Korpus vorn unten links
      [-B / 2, H, -M.korpus.tiefe / 1000], // linke Seite oben hinten (B3/M1)
      [tuerX, H, M.tuer.breite / 1000], // Türspitze oben
      [tuerX, 0, M.tuer.breite / 1000], // Türspitze unten
    ];
    for (const p of punkte) expect(Math.abs(bildY(p))).toBeLessThan(0.95);
  });
});
