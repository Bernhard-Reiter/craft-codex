/**
 * Der Auftrag im Bundle ist die Klammer zwischen Konstruktion und Karte: welches Möbel, welcher
 * Plan, welche Revision — und welcher Knoten im 3D-Modell welche Karte trägt. Red-First: diese
 * Datei stand, bevor `lib/werkstoff/auftrag.ts` existierte.
 *
 * Vertrag mit cody-cad (#66, Cody #2 04.09.): GLB-Knotennamen = `schluessel`, Wurzel = `moebel_id`.
 * Der Loader prüft in BEIDE Richtungen — ein Knoten ohne Karte ist so falsch wie eine Karte
 * ohne Knoten; das eine zeigt ein Brett ohne Material, das andere Material ohne Brett.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { glbKnoten, karteFuer, ladeAuftrag, pruefeSzene, type Auftrag } from "./auftrag";

const BUNDLE = join(__dirname, "../../public/werkstoff-bundle");
const MINI_GLB = join(__dirname, "fixtures/demo-mini.glb");
const AUFTRAG = JSON.parse(readFileSync(join(BUNDLE, "auftrag.json"), "utf8")) as Auftrag;

function stub(aenderung?: (url: string, roh: string) => string | null) {
  return vi.fn(async (url: string) => {
    const pfad = join(BUNDLE, String(url).replace("/werkstoff-bundle/", ""));
    if (!existsSync(pfad)) return { ok: false, status: 404 } as Response;
    const roh = readFileSync(pfad, "utf8");
    const inhalt = aenderung ? aenderung(String(url), roh) : roh;
    if (inhalt === null) return { ok: false, status: 404 } as Response;
    return { ok: true, status: 200, json: async () => JSON.parse(inhalt) } as Response;
  });
}
const verbiegen = (f: (a: Record<string, unknown>) => void) =>
  stub((url, roh) => {
    if (!url.endsWith("auftrag.json")) return roh;
    const o = JSON.parse(roh);
    f(o);
    return JSON.stringify(o);
  });

afterEach(() => vi.unstubAllGlobals());

describe("ladeAuftrag — die Klammer aus dem Bundle", () => {
  it("liest Möbel, Plan-Hash, Revision und die vier Teile des Demo-Plans", async () => {
    vi.stubGlobal("fetch", stub());
    const a = await ladeAuftrag();
    expect(a.moebel_id).toBe("moebel_beispiel0001");
    expect(a.buildplan_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(a.revision).toBe(3);
    expect(a.teile.map((t) => t.schluessel)).toEqual([
      "teil:Bo:oben",
      "teil:Bo:unten",
      "teil:Se:links",
      "teil:Se:rechts",
    ]);
    expect(a.teile.every((t) => /^teil_/.test(t.werkstueck_id))).toBe(true);
  });

  it("fehlt der Auftrag, ist das ein Fehler — kein leeres Möbel", async () => {
    vi.stubGlobal("fetch", stub((url, roh) => (url.endsWith("auftrag.json") ? null : roh)));
    await expect(ladeAuftrag()).rejects.toThrow(/Kein Auftrag/);
  });

  it("lehnt jeden verbogenen Auftrag ab — mit dem Grund", async () => {
    const faelle: Array<[RegExp, (a: Record<string, unknown>) => void]> = [
      [/teile/, (a) => (a.teile = [])],
      [/doppelt/i, (a) => ((a.teile as Array<{ schluessel: string }>)[1]!.schluessel = "teil:Bo:oben")],
      [/doppelt/i, (a) => ((a.teile as Array<{ werkstueck_id: string }>)[1]!.werkstueck_id = "teil_beispielbo0oben")],
      [/revision/i, (a) => (a.revision = 0)],
      [/revision/i, (a) => (a.revision = "3")],
      [/moebel_id/, (a) => delete a.moebel_id],
      [/buildplan_sha256/, (a) => (a.buildplan_sha256 = "abc")],
      [/schluessel/, (a) => delete (a.teile as Array<{ schluessel?: string }>)[0]!.schluessel],
      [/werkstueck_id/, (a) => ((a.teile as Array<{ werkstueck_id: string }>)[0]!.werkstueck_id = "")],
    ];
    for (const [grund, f] of faelle) {
      vi.stubGlobal("fetch", verbiegen(f));
      await expect(ladeAuftrag(), String(grund)).rejects.toThrow(grund);
    }
  });
});

describe("glbKnoten — was das 3D-Modell an Namen trägt", () => {
  const glb = () => new Uint8Array(readFileSync(MINI_GLB)).buffer;

  it("liest Wurzel und Teile aus dem Fixture (Wurzel = Möbel, Kinder = Schlüssel)", () => {
    const k = glbKnoten(glb());
    expect(k.wurzel).toBe("moebel_beispiel0001");
    expect([...k.teile].sort()).toEqual(["teil:Bo:oben", "teil:Bo:unten", "teil:Se:links", "teil:Se:rechts"]);
  });

  it("lehnt ab, was kein glTF-Binary ist", () => {
    const kaputt = new Uint8Array(glb());
    kaputt[0] = 0x58;
    expect(() => glbKnoten(kaputt.buffer)).toThrow(/glTF/);
  });

  it("verlangt genau eine benannte Wurzel und benannte Kinder", () => {
    const umbauen = (f: (j: Record<string, unknown>) => void) => {
      const b = new Uint8Array(glb());
      const len = new DataView(b.buffer).getUint32(12, true);
      const j = JSON.parse(new TextDecoder().decode(b.subarray(20, 20 + len)));
      f(j);
      const txt = new TextEncoder().encode(JSON.stringify(j));
      const pad = (4 - (txt.length % 4)) % 4;
      const out = new Uint8Array(20 + txt.length + pad);
      const dv = new DataView(out.buffer);
      out.set([0x67, 0x6c, 0x54, 0x46], 0);
      dv.setUint32(4, 2, true);
      dv.setUint32(8, out.length, true);
      dv.setUint32(12, txt.length + pad, true);
      dv.setUint32(16, 0x4e4f534a, true);
      out.set(txt, 20);
      for (let i = 0; i < pad; i++) out[20 + txt.length + i] = 0x20;
      return out.buffer;
    };
    expect(() => glbKnoten(umbauen((j) => ((j.scenes as Array<{ nodes: number[] }>)[0]!.nodes = [0, 1])))).toThrow(/eine Wurzel/);
    expect(() => glbKnoten(umbauen((j) => delete (j.nodes as Array<{ name?: string }>)[0]!.name))).toThrow(/Wurzel.*Name/);
    expect(() => glbKnoten(umbauen((j) => delete (j.nodes as Array<{ name?: string }>)[2]!.name))).toThrow(/ohne Namen/);
  });
});

describe("pruefeSzene — Modell und Auftrag müssen sich decken, in beide Richtungen", () => {
  const knoten = () => glbKnoten(new Uint8Array(readFileSync(MINI_GLB)).buffer);

  it("passt: Demo-Fixture gegen den Auftrag des Bundles", () => {
    expect(pruefeSzene(AUFTRAG, knoten())).toEqual({ ok: true, fehler: [] });
  });

  it("ein Knoten ohne Karte wird genannt — die Rückwand, die es im Katalog nicht gibt", () => {
    const k = knoten();
    const r = pruefeSzene(AUFTRAG, { ...k, teile: [...k.teile, "teil:Rw"] });
    expect(r.ok).toBe(false);
    expect(r.fehler.join("\n")).toMatch(/teil:Rw.*ohne Karte/);
  });

  it("eine Karte ohne Knoten wird genannt — Material ohne Brett", () => {
    const k = knoten();
    const r = pruefeSzene(AUFTRAG, { ...k, teile: k.teile.filter((t) => t !== "teil:Se:rechts") });
    expect(r.ok).toBe(false);
    expect(r.fehler.join("\n")).toMatch(/teil:Se:rechts.*nicht in der Szene/);
  });

  it("die falsche Wurzel ist das falsche Möbel — beide Namen stehen im Fehler", () => {
    const r = pruefeSzene(AUFTRAG, { ...knoten(), wurzel: "moebel_anderes0002" });
    expect(r.ok).toBe(false);
    expect(r.fehler.join("\n")).toMatch(/moebel_anderes0002/);
    expect(r.fehler.join("\n")).toMatch(/moebel_beispiel0001/);
  });

  it("meldet ALLE Abweichungen, nicht nur die erste", () => {
    const k = knoten();
    const r = pruefeSzene(AUFTRAG, {
      wurzel: "moebel_anderes0002",
      teile: [...k.teile.filter((t) => t !== "teil:Se:rechts"), "teil:Rw"],
    });
    expect(r.fehler).toHaveLength(3);
  });

  it("karteFuer: Schlüssel → Karte, unbekannter Schlüssel → undefined (kein Raten)", () => {
    expect(karteFuer(AUFTRAG, "teil:Se:links")).toBe("teil_beispielse0links");
    expect(karteFuer(AUFTRAG, "teil:Rw")).toBeUndefined();
  });
});
