/**
 * P6-Spike »Holz auf der Quest«: das eine Brett, der Holz-Shader und die
 * gebackene Variante (Plan B). Messseite, kein Lehrinhalt.
 *
 * - Alle Brettmaße kommen aus BRETT_MM, alle Holzwerte aus HOLZ. Die Szene
 *   und die Shader-Uniforms lesen nur von hier (lib/holz-spike.test.ts prüft das).
 * - Die Geometrie liegt in mm (Breite x, Dicke y, Länge z = Faserrichtung);
 *   die Szene skaliert sie mit MM_ZU_M auf Meter.
 * - Shader (Variante »shader«): Jahresringe um eine Markröhre unter dem Brett
 *   (flach gesägt), zwei Aufrufe Wertrauschen (je 8 Hash-Werte), kein
 *   Raymarching, keine Schleife, keine Textur, Licht = Umgebung + eine Richtung.
 * - Plan B (Variante »textur«): dieselbe Holzfunktion einmal beim Start in drei
 *   kleine Texturen gebacken (Seite, Fläche oben/unten, Hirnholz), dann ein
 *   einfaches MeshLambertMaterial je Flächenart. Kein Bild aus dem Netz, kein
 *   neues Paket.
 */
import * as THREE from "three";

export interface BrettMasse {
  readonly breite: number;
  readonly dicke: number;
  readonly laenge: number;
}

/** Das EINE Brett der Messseite, in mm. */
export const BRETT_MM: BrettMasse = Object.freeze({ breite: 140, dicke: 20, laenge: 300 });

export const MM_ZU_M = 0.001;

export type HolzVariante = "shader" | "textur";

/** Holzwerte (Fichte, flach gesägt) — gelten für Shader UND gebackene Textur. */
export const HOLZ = Object.freeze({
  /** Breite eines Jahrrings in mm. */
  ringAbstandMm: 3,
  /** Anteil Frühholz am Ring (hell), danach Übergang ins Spätholz (dunkel). */
  fruehAnteil: 0.6,
  uebergang: 0.2,
  /** Markröhre so weit unter der Unterseite (mm): flach gesägtes Brett. */
  markAbstandMm: 45,
  /** Wellige Ringe: Rauschen mit dieser Frequenz (1/mm) und Auslenkung (mm). */
  rauschFrequenz: 0.08,
  rauschAmplitudeMm: 1.6,
  /** Entlang der Faser (z) wird das Rauschen um diesen Faktor gestreckt. */
  faserStreckung: 0.04,
  /** Feine Faserstreifen: Frequenz (1/mm) und Abdunklung (0 … 1). */
  faserFrequenz: 0.9,
  faserTiefe: 0.12,
  frueh: "#dcbc8c",
  spaet: "#a8774a",
});

/** Licht: Richtung ZUM Licht (Welt) und Umgebungsanteil; Szene und Shader lesen beides. */
export const LICHT = {
  richtung: [0.4, 1, 0.6] as [number, number, number],
  umgebung: 0.45,
};

/**
 * Farben der Messseite (kein Signalgelb). marke/papier = VI4_XR aus #56
 * (lib/look.ts ist noch nicht auf main), gut/schlecht = --cc-good/--cc-bad.
 */
export const SPIKE_FARBEN = Object.freeze({
  marke: "#2c4b7a",
  papier: "#ffffff",
  text: "#e8ebf0",
  leise: "#aeb4bf",
  gut: "#1a7f37",
  schlecht: "#c62828",
  hintergrund: "#101010",
});

/** Posen in der Szene (m, rad). Vorschau-Kamera nur ohne Brille. */
export const SZENE: {
  brettPosition: [number, number, number];
  brettDrehungY: number;
  tafelPosition: [number, number, number];
  tafelDrehungY: number;
  vorschauKamera: [number, number, number];
} = {
  brettPosition: [0, 1.0, -0.55],
  brettDrehungY: Math.PI / 2,
  tafelPosition: [0.45, 1.4, -0.8],
  tafelDrehungY: -0.45,
  vorschauKamera: [0.3, 1.45, 0.25],
};

/** y der Markröhre im Brett-System (mm): unter der Unterseite. */
export function markY(b: BrettMasse = BRETT_MM): number {
  return -(b.dicke / 2 + HOLZ.markAbstandMm);
}

// ---------------------------------------------------------------------------
// Holzfunktion in TS (für Plan B) — Zeile für Zeile wie HOLZ_FRAGMENT unten.

const fract = (x: number) => x - Math.floor(x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Hash (Dave Hoskins, hash13) — ohne sin, gleich im GLSL. Ergebnis in [0, 1). */
export function hash13(x: number, y: number, z: number): number {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = fract(z * 0.1031);
  const d = px * (pz + 31.32) + py * (py + 31.32) + pz * (px + 31.32);
  px += d;
  py += d;
  pz += d;
  return fract((px + py) * pz);
}

/** Wertrauschen 3D, glatt interpoliert, in [0, 1]. */
export function rauschen(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  let fx = x - ix;
  let fy = y - iy;
  let fz = z - iz;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const a = hash13(ix, iy, iz);
  const b = hash13(ix + 1, iy, iz);
  const c = hash13(ix, iy + 1, iz);
  const d = hash13(ix + 1, iy + 1, iz);
  const e = hash13(ix, iy, iz + 1);
  const f = hash13(ix + 1, iy, iz + 1);
  const g = hash13(ix, iy + 1, iz + 1);
  const h = hash13(ix + 1, iy + 1, iz + 1);
  return mix(mix(mix(a, b, fx), mix(c, d, fx), fy), mix(mix(e, f, fx), mix(g, h, fx), fy), fz);
}

/** Holzmuster an einem Punkt (mm, Brett-System): Spätholz-Anteil und Faser, je in [0, 1]. */
export function holzMuster(
  x: number,
  y: number,
  z: number,
  aus: { spaet: number; faser: number },
  b: BrettMasse = BRETT_MM,
): void {
  const fr = HOLZ.rauschFrequenz;
  const n = rauschen(x * fr, y * fr, z * fr * HOLZ.faserStreckung);
  const r = Math.hypot(x, y - markY(b)) + n * HOLZ.rauschAmplitudeMm;
  const t = fract(r / HOLZ.ringAbstandMm);
  aus.spaet = smoothstep(HOLZ.fruehAnteil, HOLZ.fruehAnteil + HOLZ.uebergang, t);
  const ff = HOLZ.faserFrequenz;
  aus.faser = rauschen(x * ff, y * ff, z * ff * HOLZ.faserStreckung);
}

// ---------------------------------------------------------------------------
// Geometrie: Box in mm, drei Gruppen (0 Seite ±x, 1 oben/unten ±y, 2 Hirnholz ±z),
// UVs je Flächenart passend zu den gebackenen Texturen.

export const FLAECHEN = ["seite", "oben", "hirn"] as const;
export type Flaeche = (typeof FLAECHEN)[number];

/**
 * UVs aus Position und Normale: Längsflächen u = Länge (z), v = quer
 * (oben/unten: x, Seite: y); Hirnholz u = x, v = y. Alles in [0, 1].
 */
export function brettUVs(
  position: ArrayLike<number>,
  normal: ArrayLike<number>,
  b: BrettMasse = BRETT_MM,
): Float32Array {
  const n = Math.floor(position.length / 3);
  const uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const x = position[3 * i] ?? 0;
    const y = position[3 * i + 1] ?? 0;
    const z = position[3 * i + 2] ?? 0;
    const ax = Math.abs(normal[3 * i] ?? 0);
    const ay = Math.abs(normal[3 * i + 1] ?? 0);
    const az = Math.abs(normal[3 * i + 2] ?? 0);
    const ux = x / b.breite + 0.5;
    const vy = y / b.dicke + 0.5;
    const uz = z / b.laenge + 0.5;
    if (az >= ax && az >= ay) {
      uv[2 * i] = ux;
      uv[2 * i + 1] = vy;
    } else if (ay >= ax) {
      uv[2 * i] = uz;
      uv[2 * i + 1] = ux;
    } else {
      uv[2 * i] = uz;
      uv[2 * i + 1] = vy;
    }
  }
  return uv;
}

export function baueBrettGeometrie(b: BrettMasse = BRETT_MM): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(b.breite, b.dicke, b.laenge);
  const pos = g.getAttribute("position");
  const nrm = g.getAttribute("normal");
  g.setAttribute("uv", new THREE.BufferAttribute(brettUVs(pos.array, nrm.array, b), 2));
  // BoxGeometry legt die Flächen in der Reihenfolge +x, −x, +y, −y, +z, −z an.
  // Je zwei gegenüberliegende werden eine Gruppe → 3 Draw-Calls in Plan B, 1 mit Shader.
  const alt = g.groups.slice();
  g.clearGroups();
  for (let k = 0; k < FLAECHEN.length; k++) {
    const p = alt[2 * k];
    const q = alt[2 * k + 1];
    if (p && q) g.addGroup(p.start, p.count + q.count, k);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Variante »shader«

export const HOLZ_VERTEX = /* glsl */ `
varying vec3 vPosMm;
varying vec3 vNrmW;
void main() {
  vPosMm = position;
  vNrmW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HOLZ_FRAGMENT = /* glsl */ `
uniform vec3 uFrueh;
uniform vec3 uSpaet;
uniform vec2 uMark;
uniform float uRingAbstand;
uniform float uFruehAnteil;
uniform float uUebergang;
uniform float uRauschFreq;
uniform float uRauschAmp;
uniform float uFaserStreckung;
uniform float uFaserFreq;
uniform float uFaserTiefe;
uniform vec3 uLicht;
uniform float uUmgebung;
varying vec3 vPosMm;
varying vec3 vNrmW;

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float rauschen(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash13(i);
  float b = hash13(i + vec3(1.0, 0.0, 0.0));
  float c = hash13(i + vec3(0.0, 1.0, 0.0));
  float d = hash13(i + vec3(1.0, 1.0, 0.0));
  float e = hash13(i + vec3(0.0, 0.0, 1.0));
  float g = hash13(i + vec3(1.0, 0.0, 1.0));
  float h = hash13(i + vec3(0.0, 1.0, 1.0));
  float k = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}

void main() {
  vec3 streck = vec3(1.0, 1.0, uFaserStreckung);
  float n = rauschen(vPosMm * uRauschFreq * streck);
  float r = length(vPosMm.xy - uMark) + n * uRauschAmp;
  float t = fract(r / uRingAbstand);
  float spaet = smoothstep(uFruehAnteil, uFruehAnteil + uUebergang, t);
  float faser = rauschen(vPosMm * uFaserFreq * streck);
  vec3 holz = mix(uFrueh, uSpaet, spaet) * (1.0 - uFaserTiefe * faser);
  float licht = uUmgebung + (1.0 - uUmgebung) * max(dot(normalize(vNrmW), uLicht), 0.0);
  gl_FragColor = vec4(holz * licht, 1.0);
  #include <colorspace_fragment>
}
`;

export function baueHolzShaderMaterial(b: BrettMasse = BRETT_MM): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFrueh: { value: new THREE.Color(HOLZ.frueh) },
      uSpaet: { value: new THREE.Color(HOLZ.spaet) },
      uMark: { value: new THREE.Vector2(0, markY(b)) },
      uRingAbstand: { value: HOLZ.ringAbstandMm },
      uFruehAnteil: { value: HOLZ.fruehAnteil },
      uUebergang: { value: HOLZ.uebergang },
      uRauschFreq: { value: HOLZ.rauschFrequenz },
      uRauschAmp: { value: HOLZ.rauschAmplitudeMm },
      uFaserStreckung: { value: HOLZ.faserStreckung },
      uFaserFreq: { value: HOLZ.faserFrequenz },
      uFaserTiefe: { value: HOLZ.faserTiefe },
      uLicht: { value: new THREE.Vector3(...LICHT.richtung).normalize() },
      uUmgebung: { value: LICHT.umgebung },
    },
    vertexShader: HOLZ_VERTEX,
    fragmentShader: HOLZ_FRAGMENT,
  });
}

// ---------------------------------------------------------------------------
// Variante »textur« (Plan B): einmal backen

/** Auflösung der gebackenen Texturen (Pixel je mm, aufgerundet auf Zweierpotenzen). */
export const TEXTUR_PX_PRO_MM = 1.5;

function zweierpotenz(x: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, x)));
}

/** Kantenlängen der Fläche in mm: u-Achse × v-Achse (wie brettUVs). */
function flaechenMm(f: Flaeche, b: BrettMasse): [number, number] {
  if (f === "hirn") return [b.breite, b.dicke];
  if (f === "oben") return [b.laenge, b.breite];
  return [b.laenge, b.dicke];
}

export function texturGroesse(f: Flaeche, b: BrettMasse = BRETT_MM): { breite: number; hoehe: number } {
  const [u, v] = flaechenMm(f, b);
  return { breite: zweierpotenz(u * TEXTUR_PX_PRO_MM), hoehe: zweierpotenz(v * TEXTUR_PX_PRO_MM) };
}

function srgbZuLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function linearZuSrgb8(c: number): number {
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
}
export function hexZuLinear(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [srgbZuLinear(((v >> 16) & 255) / 255), srgbZuLinear(((v >> 8) & 255) / 255), srgbZuLinear((v & 255) / 255)];
}

/**
 * Backt eine Flächenart als RGBA (sRGB, 8 Bit). Zeile j = v, Spalte i = u.
 * Punkt auf der Fläche: Seite x = +B/2, oben y = +D/2, Hirnholz z = +L/2.
 * Licht wird NICHT gebacken (das macht das Lambert-Material).
 */
export function backeFlaeche(
  f: Flaeche,
  b: BrettMasse = BRETT_MM,
): { daten: Uint8Array<ArrayBuffer>; breite: number; hoehe: number } {
  const { breite, hoehe } = texturGroesse(f, b);
  const daten = new Uint8Array(breite * hoehe * 4);
  const frueh = hexZuLinear(HOLZ.frueh);
  const spaet = hexZuLinear(HOLZ.spaet);
  const m = { spaet: 0, faser: 0 };
  for (let j = 0; j < hoehe; j++) {
    const v = (j + 0.5) / hoehe;
    for (let i = 0; i < breite; i++) {
      const u = (i + 0.5) / breite;
      let x: number;
      let y: number;
      let z: number;
      if (f === "hirn") {
        x = (u - 0.5) * b.breite;
        y = (v - 0.5) * b.dicke;
        z = b.laenge / 2;
      } else if (f === "oben") {
        x = (v - 0.5) * b.breite;
        y = b.dicke / 2;
        z = (u - 0.5) * b.laenge;
      } else {
        x = b.breite / 2;
        y = (v - 0.5) * b.dicke;
        z = (u - 0.5) * b.laenge;
      }
      holzMuster(x, y, z, m, b);
      const dunkel = 1 - HOLZ.faserTiefe * m.faser;
      const o = 4 * (j * breite + i);
      daten[o] = linearZuSrgb8(mix(frueh[0], spaet[0], m.spaet) * dunkel);
      daten[o + 1] = linearZuSrgb8(mix(frueh[1], spaet[1], m.spaet) * dunkel);
      daten[o + 2] = linearZuSrgb8(mix(frueh[2], spaet[2], m.spaet) * dunkel);
      daten[o + 3] = 255;
    }
  }
  return { daten, breite, hoehe };
}

/** Drei Lambert-Materialien in der Reihenfolge der Geometrie-Gruppen (FLAECHEN). */
export function baueGebackeneMaterialien(b: BrettMasse = BRETT_MM): THREE.MeshLambertMaterial[] {
  return FLAECHEN.map((f) => {
    const t = backeFlaeche(f, b);
    const tex = new THREE.DataTexture(t.daten, t.breite, t.hoehe, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return new THREE.MeshLambertMaterial({ map: tex });
  });
}
