/**
 * Der Auftrag im Offline-Bundle — die Klammer zwischen Konstruktion und Karte.
 *
 * cody-cad schreibt ihn im BuildPlan-Modus (`bauen --buildplan --revision`, #66): welches Möbel
 * (`moebel_id`), welcher Plan (`buildplan_sha256`), welche Revision — und für jedes Teil die
 * Brücke `schluessel` (Knotenname im 3D-Modell) → `werkstueck_id` (Karte). Ohne diese Klammer
 * zeigt die Szene Bretter derselben Sorte; mit ihr dasselbe Brett wie in der Zeichnung.
 *
 * Vertrag (Cody #2, 04.09.): GLB-Knotennamen = `schluessel`, Wurzel = `moebel_id`. Geprüft wird in
 * BEIDE Richtungen — ein Knoten ohne Karte ist ein Brett ohne Material, eine Karte ohne Knoten ist
 * Material ohne Brett. Beides ist ein Fehler, keiner davon still.
 */

export interface AuftragTeil {
  schluessel: string;
  werkstueck_id: string;
}

/**
 * Ein Teil des Plans, für das der Katalog keinen Aufbau kennt — benannt, mit Grund. Die Lücke
 * wird getragen, nicht weggeschnitten (cody-cad `--ohne-karte`): der Plan bleibt ein
 * konsistentes Möbel, das Brett steht in der Szene, und die Brille sagt, warum es keine Karte hat.
 */
export interface AuftragLuecke extends AuftragTeil {
  aufbau: string;
  grund: string;
}

/** Das Modell, das zu diesem Auftrag gehört — Hash über die Datei, wie cody-cad ihn schrieb. */
export interface AuftragModell {
  glb_sha256: string;
  datei: string;
}

export interface Auftrag {
  moebel_id: string;
  /**
   * Was der Loader hier prüft: die Form (64 Hex) — sonst nichts. Dass es der kanonische Hash
   * des Plans ist, aus dem die Karten stammen, garantiert cody-cad beim Erzeugen; hier wird es
   * nicht nachgerechnet (dafür müsste JS Pythons Zahlendarstellung treffen, s. `karte.ts`).
   * Was es NICHT beweist: dass das Modell in der Szene aus demselben Plan kommt. Referenz- und
   * Demo-Plan trugen dieselbe `moebel_id` (Review craft#47, Cody #2) — die Wurzel unterscheidet
   * Pläne nicht. Die Bindung Plan → Modell schließt erst `auftrag.modell.glb_sha256`
   * (`bauen --modell`, cody-cad#68; Loader-Seite in #48).
   */
  buildplan_sha256: string;
  revision: number;
  /** Nur Teile MIT Karte — die Brücke Knotenname → Karte. */
  teile: AuftragTeil[];
  /** Teile ohne Karte, jedes mit Grund. Disjunkt zu `teile`; zusammen = Knoten des Modells. */
  teile_ohne_karte: AuftragLuecke[];
  /**
   * Die Bindung Plan → Modell (cody-cad `bauen --modell`, #68): der Loader lädt nur ein Modell,
   * das der Auftrag nennt, und nur, wenn die Datei diesen Hash trägt. Fehlt das Feld, gibt es
   * keine Szene — die Wurzel unterscheidet Pläne nicht, der Hash schon.
   */
  modell?: AuftragModell;
}

const HEX64 = /^[0-9a-f]{64}$/;

/** Strikt: was nicht die Form des Vertrags hat, ist kein Auftrag — mit dem Grund. */
function pruefeAuftrag(d: unknown): Auftrag {
  if (!d || typeof d !== "object") throw new Error("Auftrag ist kein Objekt");
  const o = d as Record<string, unknown>;
  if (typeof o.moebel_id !== "string" || !o.moebel_id) throw new Error("Auftrag ohne moebel_id");
  if (typeof o.buildplan_sha256 !== "string" || !HEX64.test(o.buildplan_sha256)) {
    throw new Error("Auftrag ohne gültigen buildplan_sha256 (64 Hex-Zeichen)");
  }
  if (typeof o.revision !== "number" || !Number.isInteger(o.revision) || o.revision < 1) {
    throw new Error("Auftrag ohne gültige revision (ganze Zahl ≥ 1)");
  }
  if (!Array.isArray(o.teile) || o.teile.length === 0) throw new Error("Auftrag ohne teile");
  const schluessel = new Set<string>();
  const karten = new Set<string>();
  const teile: AuftragTeil[] = [];
  for (const t of o.teile as unknown[]) {
    const x = (t ?? {}) as Record<string, unknown>;
    if (typeof x.schluessel !== "string" || !x.schluessel) throw new Error("Teil ohne schluessel");
    if (typeof x.werkstueck_id !== "string" || !x.werkstueck_id) {
      throw new Error(`Teil ${x.schluessel} ohne werkstueck_id`);
    }
    if (schluessel.has(x.schluessel)) throw new Error(`Schlüssel ${x.schluessel} doppelt im Auftrag`);
    if (karten.has(x.werkstueck_id)) throw new Error(`Karte ${x.werkstueck_id} doppelt im Auftrag`);
    schluessel.add(x.schluessel);
    karten.add(x.werkstueck_id);
    teile.push({ schluessel: x.schluessel, werkstueck_id: x.werkstueck_id });
  }
  // Ein älteres Bundle trägt das Feld nicht: keine Lücke. Trägt es das Feld, gilt der Vertrag
  // hart — Grund und Aufbau Pflicht, kein Schlüssel in beiden Listen.
  const teile_ohne_karte: AuftragLuecke[] = [];
  if (o.teile_ohne_karte !== undefined) {
    if (!Array.isArray(o.teile_ohne_karte)) throw new Error("teile_ohne_karte ist keine Liste");
    for (const l of o.teile_ohne_karte as unknown[]) {
      const x = (l ?? {}) as Record<string, unknown>;
      if (typeof x.schluessel !== "string" || !x.schluessel) throw new Error("Lücke ohne schluessel");
      if (typeof x.werkstueck_id !== "string" || !x.werkstueck_id) {
        throw new Error(`Lücke ${x.schluessel} ohne werkstueck_id`);
      }
      if (typeof x.aufbau !== "string" || !x.aufbau) throw new Error(`Lücke ${x.schluessel} ohne aufbau`);
      if (typeof x.grund !== "string" || !x.grund) {
        throw new Error(`Lücke ${x.schluessel} ohne grund — eine Lücke ohne Grund ist eine weggeschnittene`);
      }
      if (schluessel.has(x.schluessel)) {
        throw new Error(`Schlüssel ${x.schluessel} steht in beiden Listen — Karte oder Lücke, nicht beides`);
      }
      if (karten.has(x.werkstueck_id)) throw new Error(`Werkstück ${x.werkstueck_id} doppelt im Auftrag`);
      schluessel.add(x.schluessel);
      karten.add(x.werkstueck_id);
      teile_ohne_karte.push({
        schluessel: x.schluessel,
        werkstueck_id: x.werkstueck_id,
        aufbau: x.aufbau,
        grund: x.grund,
      });
    }
  }
  let modell: AuftragModell | undefined;
  if (o.modell !== undefined) {
    if (!o.modell || typeof o.modell !== "object") throw new Error("modell ist kein Objekt");
    const m = o.modell as Record<string, unknown>;
    if (typeof m.glb_sha256 !== "string" || !HEX64.test(m.glb_sha256)) {
      throw new Error("modell ohne gültigen glb_sha256 (64 Hex-Zeichen)");
    }
    if (typeof m.datei !== "string" || !m.datei) throw new Error("modell ohne datei");
    modell = { glb_sha256: m.glb_sha256, datei: m.datei };
  }
  return {
    moebel_id: o.moebel_id,
    buildplan_sha256: o.buildplan_sha256,
    revision: o.revision,
    teile,
    teile_ohne_karte,
    ...(modell ? { modell } : {}),
  };
}

export async function ladeAuftrag(basis = "/werkstoff-bundle"): Promise<Auftrag> {
  const r = await fetch(`${basis}/auftrag.json`);
  if (!r.ok) {
    throw new Error(
      `Kein Auftrag im Bundle (${r.status}) — das Bundle kennt Bretter derselben Sorte, ` +
        "aber nicht dieses Möbel",
    );
  }
  return pruefeAuftrag(await r.json());
}

export interface SzenenKnoten {
  wurzel: string;
  teile: string[];
}

/**
 * Liest aus einem glTF-Binary (GLB) nur die Namen: die eine Wurzel der Szene und ihre Kinder.
 * Kein Mesh, keine Geometrie — genau das, was der Vertrag verlangt, und ohne WebGL prüfbar.
 *
 * Vertrag (cody-cad `exportiere_glb_verifiziert`, festgeschrieben 04.09. mit Cody #2): GENAU
 * zwei Ebenen — Wurzel = Möbel, Kinder = Teile. Ein Kind mit eigenen Kindern ist kein Teil und
 * keine Gruppe, sondern ein Vertragsbruch; Rekursion würde Gruppen als Teile lesen.
 */
export function glbKnoten(buf: ArrayBuffer): SzenenKnoten {
  // Der ganze Header, nicht nur das Magic (Review craft#47 Runde 2): Version, Gesamtlänge,
  // Chunk-Typ, Chunk-Länge in beide Richtungen — jede Lüge ist ein Klartext-Fehler, nie ein
  // RangeError oder SyntaxError aus der Tiefe.
  const dv = new DataView(buf);
  if (buf.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) {
    throw new Error("Kein glTF-Binary (Magic »glTF« fehlt)");
  }
  const version = dv.getUint32(4, true);
  if (version !== 2) throw new Error(`glTF-Version ${version} — der Vertrag gilt für Version 2`);
  const gesamt = dv.getUint32(8, true);
  if (gesamt !== buf.byteLength) {
    throw new Error(`glTF-Header lügt: Gesamtlänge ${gesamt}, Datei hat ${buf.byteLength} Bytes`);
  }
  const jsonLen = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== 0x4e4f534a) throw new Error("glTF-Binary ohne JSON-Chunk");
  if (20 + jsonLen > buf.byteLength) {
    throw new Error(
      `glTF-Header lügt: JSON-Chunk mit ${jsonLen} Bytes, Datei hat nur ${buf.byteLength}`,
    );
  }
  let j: {
    scenes?: Array<{ nodes?: number[] }>;
    nodes?: Array<{ name?: string; children?: number[] }>;
    scene?: number;
  };
  try {
    j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  } catch {
    throw new Error(`glTF-JSON-Chunk unlesbar (${jsonLen} Bytes laut Header) — abgeschnitten oder kein JSON`);
  }
  const nodes = j.nodes ?? [];
  const szene = j.scenes?.[j.scene ?? 0];
  const wurzeln = szene?.nodes ?? [];
  if (wurzeln.length !== 1) {
    throw new Error(
      `Szene hat ${wurzeln.length} Wurzeln — der Vertrag verlangt genau eine Wurzel (das Möbel)`,
    );
  }
  const wurzelIdx = wurzeln[0];
  const wurzel = wurzelIdx === undefined ? undefined : nodes[wurzelIdx];
  if (!wurzel || !wurzel.name) {
    throw new Error("Wurzel ohne Name — das Möbel ist nicht identifizierbar");
  }
  const kinder: number[] = wurzel.children ?? [];
  const gesehen = new Set<string>();
  const teile = kinder.map((i) => {
    const k = nodes[i];
    const n = k?.name;
    if (!n) throw new Error(`Knoten ${i} ohne Namen — er kann keine Karte tragen`);
    if ((k?.children ?? []).length > 0) {
      throw new Error(
        `Knoten ${n} hat eigene Kinder — der Vertrag verlangt genau zwei Ebenen (Möbel → Teile)`,
      );
    }
    if (gesehen.has(n)) throw new Error(`Knotenname ${n} doppelt — zwei Bretter mit einem Namen`);
    gesehen.add(n);
    return n;
  });
  return { wurzel: wurzel.name, teile };
}

export interface SzenenPruefung {
  ok: boolean;
  fehler: string[];
}

/**
 * Beide Richtungen, alle Abweichungen — nicht nur die erste. Erlaubt in der Szene sind genau
 * `teile ∪ teile_ohne_karte`; jedes davon muss auch da sein. Duplikate sind ein Fehler, kein
 * Mengenvergleich (Review craft#47: `['teil:A','teil:A']` gegen `{A}` war ok — Fail-Open).
 */
export function pruefeSzene(auftrag: Auftrag, knoten: SzenenKnoten): SzenenPruefung {
  const fehler: string[] = [];
  if (knoten.wurzel !== auftrag.moebel_id) {
    fehler.push(
      `Falsches Möbel: die Szene heißt ${knoten.wurzel}, der Auftrag gilt für ${auftrag.moebel_id}`,
    );
  }
  const erlaubt = new Set([
    ...auftrag.teile.map((t) => t.schluessel),
    ...auftrag.teile_ohne_karte.map((t) => t.schluessel),
  ]);
  const inSzene = new Set<string>();
  for (const s of knoten.teile) {
    if (inSzene.has(s)) fehler.push(`Knoten ${s} doppelt in der Szene — zwei Bretter mit einem Namen`);
    inSzene.add(s);
    if (!erlaubt.has(s)) fehler.push(`Knoten ${s} ohne Karte im Auftrag — Brett ohne Material`);
  }
  for (const t of auftrag.teile) {
    if (!inSzene.has(t.schluessel)) {
      fehler.push(`Karte ${t.schluessel} nicht in der Szene — Material ohne Brett`);
    }
  }
  for (const t of auftrag.teile_ohne_karte) {
    if (!inSzene.has(t.schluessel)) {
      fehler.push(`Lücke ${t.schluessel} nicht in der Szene — das Brett fehlt, nicht nur die Karte`);
    }
  }
  return { ok: fehler.length === 0, fehler };
}

export function karteFuer(auftrag: Auftrag, schluessel: string): string | undefined {
  return auftrag.teile.find((t) => t.schluessel === schluessel)?.werkstueck_id;
}

/** Die benannte Lücke zu einem Schlüssel — Aufbau und Grund, oder nichts. */
export function luecke(auftrag: Auftrag, schluessel: string): { aufbau: string; grund: string } | undefined {
  const l = auftrag.teile_ohne_karte.find((t) => t.schluessel === schluessel);
  return l ? { aufbau: l.aufbau, grund: l.grund } : undefined;
}

/** »teil:Se:links« → »Se:links« — die Schaltfläche trägt den Schlüssel, nicht ein Wunschwort. */
export function schluesselKurz(schluessel: string): string {
  return schluessel.replace(/^teil:/, "");
}
