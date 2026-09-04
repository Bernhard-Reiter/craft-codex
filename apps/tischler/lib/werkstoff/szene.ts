/**
 * Die Szene — das 3D-Modell des Möbels, geprüft gegen den Auftrag, BEVOR es jemand sieht.
 *
 * Das Modell kommt aus FreeCAD (cody-cad, `exportiere_glb_verifiziert`): Wurzel = `moebel_id`,
 * Kinder = `schluessel` der Teile. Hier wird nichts gezeichnet — hier wird entschieden, ob
 * gezeichnet werden darf: kein Modell ist keine Szene (und kein Fehler), ein Modell, das nicht
 * zum Auftrag passt, ist ein Fehler mit allen Abweichungen im Text.
 */
import { glbKnoten, pruefeSzene, type Auftrag, type SzenenKnoten } from "./auftrag";

export interface Szene {
  url: string;
  knoten: SzenenKnoten;
}

export async function ladeSzene(auftrag: Auftrag, basis = "/werkstoff-bundle"): Promise<Szene | null> {
  const url = `${basis}/modell.glb`;
  const r = await fetch(url);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Modell nicht lesbar (${r.status})`);
  const knoten = glbKnoten(await r.arrayBuffer());
  const p = pruefeSzene(auftrag, knoten);
  if (!p.ok) throw new Error(`Modell passt nicht zum Auftrag — ${p.fehler.join(" · ")}`);
  return { url, knoten };
}

/** Vom angetippten Objekt (meist ein Mesh) aufwärts bis zum Teil — der Knoten mit »teil:«. */
export function schluesselAusObjekt(o: { name: string; parent?: unknown } | null): string | undefined {
  let k: { name: string; parent?: unknown } | null = o;
  while (k) {
    if (k.name.startsWith("teil:")) return k.name;
    k = (k.parent ?? null) as { name: string; parent?: unknown } | null;
  }
  return undefined;
}

export interface Box {
  min: [number, number, number];
  max: [number, number, number];
}
export interface Kamera {
  position: [number, number, number];
  ziel: [number, number, number];
  nah: number;
  fern: number;
}

/**
 * Kamera aus der Bounding-Box: Ziel = Mitte, Abstand aus der größten Kante und dem Öffnungswinkel
 * — gerechnet, nicht geraten. Screenshots am WebGL-Canvas sind blind; die Zahl muss stimmen.
 */
export function kameraAufBox(box: Box, fovGrad: number): Kamera {
  const groesse = [0, 1, 2].map((i) => box.max[i]! - box.min[i]!) as [number, number, number];
  const maxKante = Math.max(...groesse);
  if (!(maxKante > 0)) throw new Error("Bounding-Box ist leer — kein Möbel zu sehen");
  const ziel = [0, 1, 2].map((i) => (box.min[i]! + box.max[i]!) / 2) as [number, number, number];
  const halb = maxKante / 2;
  const abstand = (halb / Math.tan((fovGrad / 2) * (Math.PI / 180))) * 1.35;
  // Schräg von vorne oben — wie man vor einem Korpus steht.
  const richtung = [0.55, 0.45, 0.7];
  const laenge = Math.hypot(...richtung);
  const position = ziel.map((z, i) => z + (richtung[i]! / laenge) * abstand) as [number, number, number];
  return { position, ziel, nah: Math.max(abstand / 100, 0.01), fern: abstand + maxKante * 4 };
}
