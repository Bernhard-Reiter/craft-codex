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

export interface Auftrag {
  moebel_id: string;
  buildplan_sha256: string;
  revision: number;
  teile: AuftragTeil[];
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
  return { moebel_id: o.moebel_id, buildplan_sha256: o.buildplan_sha256, revision: o.revision, teile };
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
 */
export function glbKnoten(buf: ArrayBuffer): SzenenKnoten {
  const dv = new DataView(buf);
  if (buf.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) {
    throw new Error("Kein glTF-Binary (Magic »glTF« fehlt)");
  }
  const jsonLen = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== 0x4e4f534a) throw new Error("glTF-Binary ohne JSON-Chunk");
  const j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen))) as {
    scenes?: Array<{ nodes?: number[] }>;
    nodes?: Array<{ name?: string; children?: number[] }>;
    scene?: number;
  };
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
  const teile = kinder.map((i) => {
    const n = nodes[i]?.name;
    if (!n) throw new Error(`Knoten ${i} ohne Namen — er kann keine Karte tragen`);
    return n;
  });
  return { wurzel: wurzel.name, teile };
}

export interface SzenenPruefung {
  ok: boolean;
  fehler: string[];
}

/** Beide Richtungen, alle Abweichungen — nicht nur die erste. */
export function pruefeSzene(auftrag: Auftrag, knoten: SzenenKnoten): SzenenPruefung {
  const fehler: string[] = [];
  if (knoten.wurzel !== auftrag.moebel_id) {
    fehler.push(
      `Falsches Möbel: die Szene heißt ${knoten.wurzel}, der Auftrag gilt für ${auftrag.moebel_id}`,
    );
  }
  const imAuftrag = new Set(auftrag.teile.map((t) => t.schluessel));
  const inSzene = new Set(knoten.teile);
  for (const s of knoten.teile) {
    if (!imAuftrag.has(s)) fehler.push(`Knoten ${s} ohne Karte im Auftrag — Brett ohne Material`);
  }
  for (const t of auftrag.teile) {
    if (!inSzene.has(t.schluessel)) {
      fehler.push(`Karte ${t.schluessel} nicht in der Szene — Material ohne Brett`);
    }
  }
  return { ok: fehler.length === 0, fehler };
}

export function karteFuer(auftrag: Auftrag, schluessel: string): string | undefined {
  return auftrag.teile.find((t) => t.schluessel === schluessel)?.werkstueck_id;
}

/** »teil:Se:links« → »Se:links« — die Schaltfläche trägt den Schlüssel, nicht ein Wunschwort. */
export function schluesselKurz(schluessel: string): string {
  return schluessel.replace(/^teil:/, "");
}
