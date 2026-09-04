/**
 * Die Szene: das 3D-Modell des Möbels, geprüft gegen den Auftrag, BEVOR es jemand sieht.
 * Red-First — diese Datei stand vor `lib/werkstoff/szene.ts`.
 *
 * Ohne Modell gibt es keine Szene und keinen Fehler (die Bildschirm-Vorschau kommt mit den
 * Schaltflächen aus). Mit Modell muss es zum Auftrag passen — sonst zeigt die Brille ein
 * Brett, zu dem eine fremde Karte gehört, und der Handwerker merkt es nicht.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Auftrag } from "./auftrag";
import { farbeFuerTeil, kameraAufBox, ladeSzene, schluesselAusObjekt } from "./szene";

const BUNDLE = join(__dirname, "../../public/werkstoff-bundle");
const MINI = new Uint8Array(readFileSync(join(__dirname, "fixtures/demo-mini.glb"))).buffer;
const FIXTURE_PFAD = join(__dirname, "fixtures/referenz-korpus.glb");
/** Erst im Test gelesen — fehlt die Datei, sagt es EIN Test in Klartext, statt dass die ganze Datei kollabiert. */
function fixture(): ArrayBuffer {
  if (!existsSync(FIXTURE_PFAD)) throw new Error("fixtures/referenz-korpus.glb fehlt — CI-Fixture aus cody-cad#69");
  return new Uint8Array(readFileSync(FIXTURE_PFAD)).buffer;
}
const AUFTRAG = JSON.parse(readFileSync(join(BUNDLE, "auftrag.json"), "utf8")) as Auftrag;

function stubModell(antwort: { status: number; buf?: ArrayBuffer }) {
  return vi.fn(async (url: string) => {
    if (!String(url).endsWith("modell.glb")) return { ok: false, status: 404 } as Response;
    return {
      ok: antwort.status === 200,
      status: antwort.status,
      arrayBuffer: async () => antwort.buf ?? new ArrayBuffer(0),
    } as unknown as Response;
  });
}
afterEach(() => vi.unstubAllGlobals());

/** Der Auftrag, dessen modell.glb_sha256 zum Mini-Fixture passt — so, wie cody-cad ihn schriebe. */
async function auftragZu(buf: ArrayBuffer, auftrag: Auftrag = AUFTRAG): Promise<Auftrag> {
  const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { ...auftrag, modell: { glb_sha256: h, datei: "modell.glb" } };
}

describe("ladeSzene — das Modell muss zum Auftrag passen, bevor es gezeigt wird", () => {
  it("der Auftrag nennt kein Modell → keine Szene, kein Fehler — auch wenn eine Datei da wäre", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: MINI }));
    const { modell: _weg, ...ohne } = AUFTRAG;
    expect(await ladeSzene(ohne as Auftrag)).toBeNull();
  });

  it("der Auftrag nennt ein Modell, die Datei fehlt → Fehler (nicht »kein Modell«)", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 404 }));
    await expect(ladeSzene(await auftragZu(MINI))).rejects.toThrow(/fehlt|nicht lesbar/);
  });

  it("die Datei trägt nicht den Hash aus dem Auftrag → Fehler nennt den Hash, keine Szene", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: MINI }));
    const falsch = { ...AUFTRAG, modell: { glb_sha256: "0".repeat(64), datei: "modell.glb" } };
    await expect(ladeSzene(falsch)).rejects.toThrow(/Hash|sha256/i);
  });

  it("Modell da, Hash und Knoten passend → URL und die geprüften Knoten", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: MINI }));
    const s = await ladeSzene(await auftragZu(MINI));
    expect(s?.url).toBe("/werkstoff-bundle/modell.glb");
    expect(s?.knoten.wurzel).toBe("moebel_beispiel0001");
    expect(s?.knoten.teile).toHaveLength(5); // vier mit Karte + die Rückwand als Lücke
  });

  it("Modell mit einem Brett ohne Karte → Fehler nennt das Brett, keine Szene", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: MINI }));
    const fremd = await auftragZu(MINI, { ...AUFTRAG, teile: AUFTRAG.teile.filter((t) => t.schluessel !== "teil:Bo:oben") });
    await expect(ladeSzene(fremd)).rejects.toThrow(/teil:Bo:oben/);
  });

  it("Server-Fehler ist ein Fehler, kein »kein Modell«", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 500 }));
    await expect(ladeSzene(await auftragZu(MINI))).rejects.toThrow(/nicht lesbar/);
  });
});

describe("schluesselAusObjekt — vom angetippten Mesh zum Teil", () => {
  type O = { name: string; parent: O | null };
  const knoten = (name: string, parent: O | null = null): O => ({ name, parent });

  it("steigt vom Mesh zum benannten Teil auf", () => {
    const teil = knoten("teil:Se:links", knoten("moebel_beispiel0001"));
    const mesh = knoten("Mesh_0", teil);
    expect(schluesselAusObjekt(mesh)).toBe("teil:Se:links");
  });

  it("die Wurzel ist kein Teil — kein Raten", () => {
    expect(schluesselAusObjekt(knoten("moebel_beispiel0001"))).toBeUndefined();
    expect(schluesselAusObjekt(knoten("Mesh_0", knoten("moebel_beispiel0001")))).toBeUndefined();
  });
});

describe("kameraAufBox — die Kamera rechnet, sie rät nicht", () => {
  it("schaut auf die Mitte und steht weit genug, dass das Möbel ins Bild passt", () => {
    // Beispielmöbel: 600 × 545 × 890 mm (x, y, z), Ursprung in der Ecke.
    const k = kameraAufBox({ min: [0, 0, 0], max: [600, 545, 890] }, 45);
    expect(k.ziel).toEqual([300, 272.5, 445]);
    // Abstand ≥ halbe größte Kante / tan(fov/2), mit Luft — nie zu nah.
    const halb = 890 / 2;
    const mindest = halb / Math.tan((45 / 2) * (Math.PI / 180));
    const abstand = Math.hypot(k.position[0] - 300, k.position[1] - 272.5, k.position[2] - 445);
    expect(abstand).toBeGreaterThanOrEqual(mindest);
    expect(abstand).toBeLessThanOrEqual(mindest * 2);
    expect(k.nah).toBeGreaterThan(0);
    expect(k.fern).toBeGreaterThan(abstand + halb);
  });

  it("eine leere Box ist ein Fehler — ein unsichtbares Möbel ist kein Möbel", () => {
    expect(() => kameraAufBox({ min: [0, 0, 0], max: [0, 0, 0] }, 45)).toThrow(/leer/);
  });
});

describe("ladeSzene — Reihenfolge und Härte der Hash-Prüfung (Review craft#48 R48-4/5/7)", () => {
  it("falscher Hash UND fehlendes Brett → die Meldung ist »anderes Erzeugnis«, nicht »ohne Karte« (Hash vor Knoten)", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: MINI }));
    const falsch: Auftrag = {
      ...AUFTRAG,
      teile: AUFTRAG.teile.filter((t) => t.schluessel !== "teil:Bo:oben"),
      modell: { glb_sha256: "0".repeat(64), datei: "modell.glb" },
    };
    const fehler = await ladeSzene(falsch).catch((e: Error) => e.message);
    expect(fehler).toMatch(/anderes Erzeugnis/);
    expect(fehler).not.toMatch(/ohne Karte/);
  });

  it("der Hash läuft über die ganze Datei — das 23-KB-Fixture mit seinem echten Hash geht durch, mit gekipptem letzten Zeichen nicht", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: fixture() }));
    const gut = await auftragZu(fixture());
    expect(gut.modell?.glb_sha256).toBe("418a4bea6bb2c01c546849f3e4950ae5c65890df1b9c2fbabb844d8fb991e95f");
    expect((await ladeSzene(gut))?.knoten.teile).toHaveLength(5);
    const h = gut.modell!.glb_sha256;
    const gekippt = { ...gut, modell: { ...gut.modell!, glb_sha256: h.slice(0, 63) + (h.endsWith("f") ? "0" : "f") } };
    await expect(ladeSzene(gekippt)).rejects.toThrow(/anderes Erzeugnis/);
  });

  it("ohne crypto.subtle gibt es keine Szene — und der Satz sagt, warum", async () => {
    vi.stubGlobal("fetch", stubModell({ status: 200, buf: MINI }));
    const echt = globalThis.crypto;
    vi.stubGlobal("crypto", { subtle: undefined });
    try {
      await expect(ladeSzene(await auftragZuMit(echt, MINI))).rejects.toThrow(/Hash.*(rechnen|prüfen)|kein Web ?Crypto/i);
    } finally {
      vi.stubGlobal("crypto", echt);
    }
  });
});

/** wie auftragZu, aber mit einem explizit übergebenen crypto (für den Stub-Test). */
async function auftragZuMit(c: Crypto, buf: ArrayBuffer): Promise<Auftrag> {
  const h = Array.from(new Uint8Array(await c.subtle.digest("SHA-256", buf)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { ...AUFTRAG, modell: { glb_sha256: h, datei: "modell.glb" } };
}

describe("farbeFuerTeil — die Färbelogik der Szene als reine Funktion (Review craft#48 R48-9)", () => {
  const basis = { r: 0.8, g: 0.7, b: 0.5 };
  it("eine Lücke ist grau, das gewählte Teil heller, alle anderen behalten ihre Farbe", () => {
    expect(farbeFuerTeil("teil:Rw", null, ["teil:Rw"], basis)).toEqual({ r: 0.62, g: 0.64, b: 0.66 });
    const hell = farbeFuerTeil("teil:Se:links", "teil:Se:links", [], basis);
    expect(hell.r).toBeGreaterThan(basis.r);
    expect(farbeFuerTeil("teil:Se:links", "teil:Bo:oben", ["teil:Rw"], basis)).toEqual(basis);
  });
  it("eine gewählte Lücke ist grau UND heller — die Lücke bleibt als Lücke erkennbar", () => {
    const f = farbeFuerTeil("teil:Rw", "teil:Rw", ["teil:Rw"], basis);
    expect(f.r).toBeGreaterThan(0.62);
    expect(Math.abs(f.r - f.g)).toBeLessThan(0.05); // grau bleibt grau
  });
  it("ein Mesh ohne Teil-Schlüssel wird nicht angefasst", () => {
    expect(farbeFuerTeil(undefined, "teil:Rw", ["teil:Rw"], basis)).toEqual(basis);
  });
});
