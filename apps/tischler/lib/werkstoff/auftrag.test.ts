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
import { glbKnoten, karteFuer, ladeAuftrag, luecke, pruefeSzene, type Auftrag } from "./auftrag";

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
    // Die Lücke wird getragen: die Rückwand hat keinen Katalog-Aufbau, und der Auftrag sagt es.
    expect(a.teile_ohne_karte).toEqual([
      {
        schluessel: "teil:Rw",
        werkstueck_id: "teil_beispielrw000001",
        aufbau: "rw-8@1",
        grund: "kein Aufbau rw-8@1 im Katalogstand 2026-09-03 — Material noch offen",
      },
    ]);
  });

  it("der Auftrag nennt sein Modell — Hash und Datei; ohne das Feld gibt es kein Modell", async () => {
    vi.stubGlobal("fetch", stub());
    const a = await ladeAuftrag();
    expect(a.modell).toEqual({ glb_sha256: expect.stringMatching(/^[0-9a-f]{64}$/), datei: "modell.glb" });
    vi.stubGlobal("fetch", verbiegen((x) => delete x.modell));
    expect((await ladeAuftrag()).modell).toBeUndefined();
    for (const [grund, f] of [
      [/glb_sha256/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).glb_sha256 = "abc")],
      [/datei/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).datei = "")],
      // R48-6: die Datei ist ein Name im Bundle, kein Pfad und keine Adresse
      [/datei/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).datei = "../../etc/passwd")],
      [/datei/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).datei = "/abs/modell.glb")],
      [/datei/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).datei = "https://x/modell.glb")],
      [/datei/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).datei = "modell.gltf")],
      [/datei/, (x: Record<string, unknown>) => ((x.modell as Record<string, unknown>).datei = "mod ell.glb")],
      [/modell/, (x: Record<string, unknown>) => (x.modell = "modell.glb")],
    ] as Array<[RegExp, (x: Record<string, unknown>) => void]>) {
      vi.stubGlobal("fetch", verbiegen(f));
      await expect(ladeAuftrag(), String(grund)).rejects.toThrow(grund);
    }
  });

  it("ein Bundle ohne das Feld teile_ohne_karte (älterer Stand) hat keine Lücke — kein Fehler", async () => {
    vi.stubGlobal("fetch", verbiegen((a) => delete a.teile_ohne_karte));
    expect((await ladeAuftrag()).teile_ohne_karte).toEqual([]);
  });

  it("die Lücke braucht Grund und Aufbau, und ein Schlüssel steht nie in beiden Listen", async () => {
    type L = Array<{ schluessel: string; werkstueck_id: string; aufbau: string; grund: string }>;
    const faelle: Array<[RegExp, (a: Record<string, unknown>) => void]> = [
      [/grund/, (a) => ((a.teile_ohne_karte as L)[0]!.grund = "")],
      [/grund/, (a) => delete (a.teile_ohne_karte as Partial<L[number]>[])[0]!.grund],
      [/aufbau/, (a) => ((a.teile_ohne_karte as L)[0]!.aufbau = "")],
      [/beiden Listen/, (a) => ((a.teile_ohne_karte as L)[0]!.schluessel = "teil:Bo:oben")],
      // null ist kein »fehlendes Feld«: ein älteres Bundle lässt es weg, ein kaputtes schreibt null.
      [/keine Liste/, (a) => (a.teile_ohne_karte = null)],
      [/keine Liste/, (a) => (a.teile_ohne_karte = "teil:Rw")],
      [/doppelt/i, (a) => ((a.teile_ohne_karte as L)[0]!.werkstueck_id = "teil_beispielbo0oben")],
    ];
    for (const [grund, f] of faelle) {
      vi.stubGlobal("fetch", verbiegen(f));
      await expect(ladeAuftrag(), String(grund)).rejects.toThrow(grund);
    }
  });

  it("hinweise: eine kurze Liste Klartext — getrimmt, optional, nie leer, nie ohne Grenze", async () => {
    // Die getragene Lücke auf Plan-Ebene (R48b-6): »Demo-Plan ohne Bohrbild« stand nur im PR-Text.
    // Auftragsebene, weil ein Feld im Plan den kanonischen Plan-Hash kippen würde. Grenzen wie in
    // voai#1226 und cody-cad#73: 1–5 Einträge, je 1–200 Zeichen nach trim.
    vi.stubGlobal("fetch", stub());
    expect((await ladeAuftrag()).hinweise).toEqual(["Demo-Plan ohne Bohrbild — 104 Bohrungen gefiltert (cody-cad#70)"]);
    vi.stubGlobal("fetch", verbiegen((a) => delete a.hinweise));
    expect((await ladeAuftrag()).hinweise).toBeUndefined();
    vi.stubGlobal("fetch", verbiegen((a) => (a.hinweise = ["  mit Rand  ", "x".repeat(200)])));
    expect((await ladeAuftrag()).hinweise).toEqual(["mit Rand", "x".repeat(200)]);
    // Die erlaubte Seite der Trennlinie: genau fünf Einträge mit genau 200 Zeichen kommen durch.
    vi.stubGlobal("fetch", verbiegen((a) => (a.hinweise = Array(5).fill("y".repeat(200)))));
    expect((await ladeAuftrag()).hinweise).toEqual(Array(5).fill("y".repeat(200)));
    for (const kaputt of [[], [""], ["   "], ["x".repeat(201)], Array(6).fill("h"), "Text", [1], null]) {
      vi.stubGlobal("fetch", verbiegen((a) => (a.hinweise = kaputt)));
      await expect(ladeAuftrag(), JSON.stringify(kaputt)).rejects.toThrow(/hinweis/i);
    }
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
  const umbauenAllg = (f: (j: Record<string, unknown>) => void) => {
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

  it("liest Wurzel und Teile aus dem Fixture — die Wurzel ist die der Szene, nicht nodes[0]", () => {
    const k = glbKnoten(glb());
    expect(k.wurzel).toBe("moebel_beispiel0001");
    expect([...k.teile].sort()).toEqual([
      "teil:Bo:oben",
      "teil:Bo:unten",
      "teil:Rw",
      "teil:Se:links",
      "teil:Se:rechts",
    ]);
    // Reihenfolge ≠ Identität: im Fixture steht das Möbel absichtlich nicht an Index 0.
    const b = new Uint8Array(glb());
    const len = new DataView(b.buffer).getUint32(12, true);
    const j = JSON.parse(new TextDecoder().decode(b.subarray(20, 20 + len))) as { scenes: Array<{ nodes: number[] }> };
    expect(j.scenes[0]!.nodes[0]).not.toBe(0);
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
    type N = Array<{ name?: string; children?: number[] }>;
    const wurzelIdx = (j: Record<string, unknown>) => (j.scenes as Array<{ nodes: number[] }>)[0]!.nodes[0]!;
    expect(() => glbKnoten(umbauen((j) => ((j.scenes as Array<{ nodes: number[] }>)[0]!.nodes = [0, 1])))).toThrow(/eine Wurzel/);
    expect(() => glbKnoten(umbauen((j) => delete (j.nodes as N)[wurzelIdx(j)]!.name))).toThrow(/Wurzel.*Name/);
    expect(() => glbKnoten(umbauen((j) => delete (j.nodes as N)[0]!.name))).toThrow(/ohne Namen/);
  });

  it("doppelte Knotennamen sind ein Fehler — zwei Bretter mit einem Namen sind kein Vertrag", () => {
    type N = Array<{ name?: string; children?: number[] }>;
    const dup = umbauenAllg((j) => ((j.nodes as N)[0]!.name = (j.nodes as N)[1]!.name));
    expect(() => glbKnoten(dup)).toThrow(/doppelt/);
  });

  it("genau zwei Ebenen: ein Kind mit eigenen Kindern ist ein Vertragsbruch, keine Gruppe", () => {
    type N = Array<{ name?: string; children?: number[] }>;
    const enkel = umbauenAllg((j) => ((j.nodes as N)[0]!.children = [1]));
    expect(() => glbKnoten(enkel)).toThrow(/zwei Ebenen/);
  });

  it.each([
    ["Magic", 0, 0x58585858, /glTF/],
    ["Version 1 statt 2", 4, 1, /Version/],
    ["Gesamtlänge im Header ≠ Datei", 8, 12, /Gesamtl/],
    ["JSON-Chunk länger als die Datei", 12, 10_000_000, /Datei hat nur/],
    ["JSON-Chunk zu kurz (abgeschnittenes JSON)", 12, 8, /JSON-Chunk|unlesbar/],
    ["Chunk-Typ nicht JSON", 16, 0x004e4942, /JSON-Chunk/],
  ])("Header-Lüge »%s« ist ein Klartext-Fehler, kein RangeError/SyntaxError", (_name, offset, wert, muster) => {
    const b = new Uint8Array(glb());
    new DataView(b.buffer).setUint32(offset, wert, true);
    let fehler: unknown;
    try {
      glbKnoten(b.buffer);
    } catch (e) {
      fehler = e;
    }
    expect(fehler).toBeInstanceOf(Error);
    expect((fehler as Error).message).toMatch(muster);
    expect((fehler as Error).name).not.toMatch(/RangeError|SyntaxError/);
  });

  // Die Trennlinie liegt bei 20 Bytes (der ganze Header). Darunter ist die Datei »zu kurz« — auch
  // mit gültigem Magic; und die Länge wird VOR dem Magic geprüft, damit drei Bytes »xyz« nicht als
  // »Magic fehlt« gemeldet werden. Parität zu cody-cad#71 (Länge vor Magic, Fälle 3/12/19/20).
  const kopf = (n: number) => {
    const b = new Uint8Array(n);
    b.set([0x67, 0x6c, 0x54, 0x46].slice(0, Math.min(4, n))); // »glTF«
    return b;
  };
  it.each([
    ["0 Bytes", new Uint8Array(0), /zu kurz.*0 Bytes, mindestens 20/],
    ["3 Bytes ohne Magic (Länge vor Magic)", Uint8Array.from([0x78, 0x79, 0x7a]), /zu kurz.*3 Bytes, mindestens 20/],
    ["12 Bytes mit gültigem Magic", kopf(12), /zu kurz.*12 Bytes, mindestens 20/],
    ["19 Bytes mit gültigem Magic (eins unter der Linie)", kopf(19), /zu kurz.*19 Bytes, mindestens 20/],
    // Länge vor Magic auch für 4–19 Bytes OHNE Magic — ein Magic-zuerst-Prüfer mit ≥4-Guard bliebe sonst grün.
    ["12 Bytes ohne Magic", Uint8Array.from([0x4e, 0x4f, 0x50, 0x45, 0, 0, 0, 0, 0, 0, 0, 0]), /zu kurz.*12 Bytes, mindestens 20/],
  ])("»%s« ist »zu kurz«, nicht »Magic fehlt«", (_name, bytes, muster) => {
    let fehler: unknown;
    try {
      glbKnoten(bytes.buffer);
    } catch (e) {
      fehler = e;
    }
    expect(fehler).toBeInstanceOf(Error);
    expect((fehler as Error).message).toMatch(muster);
    expect((fehler as Error).message).not.toMatch(/Magic/);
    expect((fehler as Error).name).not.toMatch(/RangeError/);
  });

  it("20 Bytes OHNE Magic sind »kein glTF-Binary«, nicht »zu kurz« — die andere Seite der Linie (R49-3)", () => {
    const b = new Uint8Array(20);
    b.set([0x4e, 0x4f, 0x50, 0x45]); // »NOPE«
    expect(() => glbKnoten(b.buffer)).toThrow(/Magic/);
    expect(() => glbKnoten(b.buffer)).not.toThrow(/zu kurz/);
  });

  it("20 Bytes — genau der Header mit leerem JSON-Chunk — sind nicht »zu kurz«: der Fehler ist der leere Chunk", () => {
    const b = kopf(20);
    const dv = new DataView(b.buffer);
    dv.setUint32(4, 2, true);
    dv.setUint32(8, 20, true);
    dv.setUint32(12, 0, true);
    dv.setUint32(16, 0x4e4f534a, true);
    expect(() => glbKnoten(b.buffer)).toThrow(/unlesbar/);
    expect(() => glbKnoten(b.buffer)).not.toThrow(/zu kurz/);
  });
});

describe("pruefeSzene — Modell und Auftrag müssen sich decken, in beide Richtungen", () => {
  const knoten = () => glbKnoten(new Uint8Array(readFileSync(MINI_GLB)).buffer);

  it("passt: Demo-Fixture gegen den Auftrag des Bundles", () => {
    expect(pruefeSzene(AUFTRAG, knoten())).toEqual({ ok: true, fehler: [] });
  });

  it("die benannte Lücke ist erlaubt: teil:Rw hat keine Karte, aber einen Grund — kein Fehler", () => {
    expect(pruefeSzene(AUFTRAG, knoten()).ok).toBe(true);
    expect(luecke(AUFTRAG, "teil:Rw")).toEqual({
      aufbau: "rw-8@1",
      grund: "kein Aufbau rw-8@1 im Katalogstand 2026-09-03 — Material noch offen",
    });
    expect(luecke(AUFTRAG, "teil:Se:links")).toBeUndefined();
  });

  it("ein Knoten, der weder Karte noch benannte Lücke hat, wird genannt", () => {
    const k = knoten();
    const r = pruefeSzene(AUFTRAG, { ...k, teile: [...k.teile, "teil:Xy"] });
    expect(r.ok).toBe(false);
    expect(r.fehler.join("\n")).toMatch(/teil:Xy.*ohne Karte/);
  });

  it("fehlt die Lücke in der Szene, fehlt ein Brett — auch das wird genannt", () => {
    const k = knoten();
    const r = pruefeSzene(AUFTRAG, { ...k, teile: k.teile.filter((t) => t !== "teil:Rw") });
    expect(r.ok).toBe(false);
    expect(r.fehler.join("\n")).toMatch(/teil:Rw.*nicht in der Szene/);
  });

  it("doppelte Knoten in der Szene sind ein Fehler, kein Mengenvergleich (Review craft#47)", () => {
    const k = knoten();
    const r = pruefeSzene(AUFTRAG, { ...k, teile: [...k.teile, "teil:Se:links"] });
    expect(r.ok).toBe(false);
    expect(r.fehler.join("\n")).toMatch(/teil:Se:links.*doppelt/);
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
      teile: [...k.teile.filter((t) => t !== "teil:Se:rechts"), "teil:Xy"],
    });
    expect(r.fehler).toHaveLength(3);
  });

  it("karteFuer: Schlüssel → Karte, unbekannter Schlüssel → undefined (kein Raten)", () => {
    expect(karteFuer(AUFTRAG, "teil:Se:links")).toBe("teil_beispielse0links");
    expect(karteFuer(AUFTRAG, "teil:Rw")).toBeUndefined();
  });
});


describe("die Naht gegen ein echtes OCCT-Modell — nicht nur gegen das Fixture, das aus dem Auftrag erzeugt wurde", () => {
  // Das CI-Fixture referenz-korpus.glb (echter FreeCAD-Export ohne Bohrungen, mit Nuten — im
  // Repo, Erzeuger cody-cad#69/#70) ist seit d204bc8 auch das ausgelieferte modell.glb; beide
  // liegen im Repo, byte-gleich (bundle.test.ts hält das). Das Fixture ist Pflicht und wird NIE
  // übersprungen; fehlt es, sagt der Test das in Klartext statt mit ENOENT (Review craft#47/#48).
  const FIXTURE = join(__dirname, "fixtures/referenz-korpus.glb");

  it("das CI-Fixture referenz-korpus.glb liegt im Repo", () => {
    expect(existsSync(FIXTURE), "fixtures/referenz-korpus.glb fehlt — CI-Fixture aus cody-cad#69, kein Erzeugnis").toBe(true);
  });

  it("ein echtes FreeCAD-GLB (5 Knoten) passt zu auftrag.json — Knoten, Wurzel, kein Zirkel", () => {
    expect(existsSync(FIXTURE), "fixtures/referenz-korpus.glb fehlt").toBe(true);
    for (const q of [FIXTURE]) {
      const buf = new Uint8Array(readFileSync(q)).buffer;
      const k = glbKnoten(buf);
      expect(k.wurzel, q).toBe(AUFTRAG.moebel_id);
      expect(k.teile, q).toHaveLength(5);
      expect(pruefeSzene(AUFTRAG, k), q).toEqual({ ok: true, fehler: [] });
    }
  });

  it("das CI-Fixture referenz-korpus.glb ist ein FreeCAD-Erzeugnis mit Nuten, kein Zirkel aus auftrag.json", () => {
    expect(existsSync(FIXTURE), "fixtures/referenz-korpus.glb fehlt — CI-Fixture aus cody-cad#69").toBe(true);
    // Kommt aus cody-cad (Cody #2, 04.09., PR #69): Referenzplan @ 03040cb ohne die 104 Drillings,
    // mit den 4 Nuten; FreeCAD 1.1.3, korpus_bauen → tessellate(0.1) → Import.export; 23.388 B.
    const buf = new Uint8Array(readFileSync(FIXTURE)).buffer;
    const len = new DataView(buf).getUint32(12, true);
    const j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, len))) as {
      asset: { generator?: string };
      meshes: unknown[];
    };
    expect(j.asset.generator).toMatch(/Open CASCADE/); // echtes OCCT, nicht der Test-Erzeuger
    expect(j.meshes.length).toBe(5);
    expect(buf.byteLength).toBeLessThan(250_000);
  });

  it("das Fixture ist genau das Erzeugnis aus cody-cad#69 — der Hash ist gepinnt, nicht nur die Form", async () => {
    // Review #69 (W1): fünf richtige Namen und dieselbe Bytezahl genügten, um das Fixture zu
    // ersetzen — beide CIs blieben grün, das Protokoll behauptete weiter 418a… Der Pin bindet
    // die Datei an die Attestation in cody-cad (tests/fixtures/freecad/… , glb_sha256).
    expect(existsSync(FIXTURE), "fixtures/referenz-korpus.glb fehlt — CI-Fixture aus cody-cad#69").toBe(true);
    const buf = new Uint8Array(readFileSync(FIXTURE)).buffer;
    const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(h).toBe("418a4bea6bb2c01c546849f3e4950ae5c65890df1b9c2fbabb844d8fb991e95f");
  });
});
