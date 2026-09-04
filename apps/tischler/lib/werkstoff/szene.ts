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

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  // Ohne WebCrypto kann das Gerät den Hash nicht rechnen — dann gibt es keine Szene, mit Satz,
  // statt »Cannot read properties of undefined« (Review craft#48 R48-7).
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Dieses Gerät kann den Hash nicht prüfen (kein WebCrypto) — keine Szene");
  // Kopie im eigenen Realm: ein ArrayBuffer aus einem anderen Realm (jsdom unter Node 24 in der
  // CI: »2nd argument is not instance of ArrayBuffer«) wird von digest abgelehnt — lokal lief
  // es, auf dem Runner nicht. Die Kopie kostet einmal die Dateigröße und keine Annahme.
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(new Uint8Array(buf));
  const d = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function ladeSzene(auftrag: Auftrag, basis = "/werkstoff-bundle"): Promise<Szene | null> {
  // Nur ein Modell, das der Auftrag nennt — eine Datei, die zufällig im Bundle liegt, ist kein
  // Beleg dafür, dass sie zu diesem Plan gehört.
  if (!auftrag.modell) return null;
  const url = `${basis}/${auftrag.modell.datei}`;
  const r = await fetch(url);
  if (r.status === 404) {
    throw new Error(`Der Auftrag nennt ${auftrag.modell.datei}, aber die Datei fehlt im Bundle (404)`);
  }
  if (!r.ok) throw new Error(`Modell nicht lesbar (${r.status})`);
  const buf = await r.arrayBuffer();
  const ist = await sha256Hex(buf);
  if (ist !== auftrag.modell.glb_sha256) {
    throw new Error(
      `Modell trägt nicht den Hash aus dem Auftrag — Datei ${ist.slice(0, 12)}…, ` +
        `Auftrag ${auftrag.modell.glb_sha256.slice(0, 12)}… — das ist ein anderes Erzeugnis`,
    );
  }
  const knoten = glbKnoten(buf);
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

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Die Färbelogik der Szene als reine Funktion (Review craft#48 R48-9 — die Komponente ist in
 * jsdom nicht testbar, die Regel schon): eine Lücke ist grau, das gewählte Teil heller, alles
 * andere behält seine Farbe; ein Mesh ohne Teil-Schlüssel wird nicht angefasst. Eine gewählte
 * Lücke bleibt grau — nur heller.
 */
export function farbeFuerTeil(
  teil: string | undefined,
  gewaehlt: string | null,
  luecken: readonly string[],
  basis: RGB,
): RGB {
  if (!teil) return basis;
  let f: RGB = luecken.includes(teil) ? { r: 0.62, g: 0.64, b: 0.66 } : basis;
  if (teil === gewaehlt) f = { r: Math.min(1, f.r + 0.15), g: Math.min(1, f.g + 0.15), b: Math.min(1, f.b + 0.15) };
  return f;
}
