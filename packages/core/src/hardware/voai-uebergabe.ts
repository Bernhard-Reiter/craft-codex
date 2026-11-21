/**
 * Übergabe der Messe-Stückliste an VOAI als Datei im Vertrag »stueckliste/2«
 * (voai-waas packages/shared/contracts/stueckliste/2, nur gelesen 18.11.2026).
 *
 * KEINE Preise: der Vertrag verbietet jedes preis-Feld, VOAI setzt Preise
 * aus der eigenen Preisliste. Kein Aufruf an VOAI, nur eine Datei.
 *
 * Wie cody-cad kern/protokoll/korpus_stueckliste.py (führt, Meister 1201 wort-4-037):
 * Platten mit Katalog-Aufbau = freiposition stk + masse_mm, Regel korpus-zuschnitt/1,
 * werkstoff = Aufbau + Klasse (VOAI rechnet die Fläche selbst: Länge × Breite × Menge);
 * Platten ohne Aufbau (Schubkasten Eiche) = freiposition manuell, werkstoff null;
 * Kanten = EINE freiposition je Aufbau + Dicke in »m« (Laufmeter netto aus dem
 * Kantenbild der Etiketten), Regel korpus-kante/1, »Annahme« in der Bezeichnung;
 * Blum-Beschläge = artikel mit artikel_id »blum:<nr>«.
 * inhalt_sha256 = hex(SHA-256(UTF-8(JCS({schema, inhalt})))).
 * SHA-256 ist hier selbst gerechnet: crypto.subtle fehlt im Browser über
 * http im LAN (kein sicherer Kontext), und core läuft auch im Browser.
 */

import { buildMesseEtiketten, buildMesseStueckliste, type StuecklistenZeile } from "./messe-stueckliste.js";

export const VOAI_SCHEMA = "stueckliste/2";

/** Feste, kleingeschriebene UUIDs, damit dieselbe Liste denselben Hash hat. */
const PROJEKT_REF = "c0dec0de-0000-4000-8000-00000000a600";
const LISTE_REF = "c0dec0de-0000-4000-8000-00000000b600";
const posRef = (i: number) => `c0dec0de-0000-4000-8000-${(0xc000 + i).toString(16).padStart(12, "0")}`;

/**
 * Blum-Teil in der Stückliste -> artikel_id. Alle als »stk«: VOAI bepreist nur stk,
 * ein MOVENTO-Satz (Paar) bzw. ein Kupplungs-Satz zählt als 1 Stück.
 */
const BLUM: { treffer: RegExp; nr: string }[] = [
  { treffer: /71B3550/, nr: "71B3550" },
  { treffer: /173L6100/, nr: "173L6100" },
  { treffer: /766H5000S/, nr: "766H5000S" },
  { treffer: /T51\.7601/, nr: "T51.7601" },
];

/**
 * Revision der Liste. VOAI lehnt dieselbe liste_ref mit gleicher Revision und anderem
 * Inhalt mit 409 ab -> nach jeder Maßänderung am Messe-Schrank um 1 hochzählen.
 * 2: 15 Positionen mit den Namen der Werkstatt-Mappe (G3).
 * 3: Platten mit Werkstoff (demo-aufbau-19), Kante in m (16 Positionen).
 */
export const VOAI_REVISION = 3;

type Werkstoff = {
  aufbau: { katalog: string; id: string; revision: number };
  klasse: "platte";
};

/**
 * Werkstoff je Stücklisten-Material. demo-aufbau-19 r1 -> Träger demo-traeger-19,
 * typ spanplatte -> Klasse platte (cody-cad daten/demo/werkstoffe, kern/bauteil/klasse.py).
 * Material ohne Eintrag (Eiche) bleibt werkstoff null.
 */
const WERKSTOFF: Record<string, Werkstoff> = {
  "Demo-Träger 19 roh (synthetisch)": {
    aufbau: { katalog: "demo", id: "demo-aufbau-19", revision: 1 },
    klasse: "platte",
  },
};

const REGEL_ZUSCHNITT = "korpus-zuschnitt/1";
const REGEL_KANTE = "korpus-kante/1";

type Position = {
  position_ref: string;
  typ: "artikel" | "freiposition";
  artikel_id: string | null;
  bezeichnung: string | null;
  menge: string;
  einheit: "stk" | "satz" | "m";
  masse_mm?: { laenge: string; breite: string; dicke: string };
  katalog_snapshot_sha256: null;
  herkunft: { art: "manuell" } | { art: "regel"; regel_ref: string };
  programm: null;
  werkstoff: Werkstoff | null;
};

export type VoaiStueckliste = {
  schema: typeof VOAI_SCHEMA;
  inhalt: {
    projekt_ref: string;
    liste_ref: string;
    revision: number;
    positionen: Position[];
  };
  export: { cody_cad_version: string; erzeugt_am: string };
  inhalt_sha256: string;
};

function position(z: StuecklistenZeile, i: number): Position {
  const basis = {
    position_ref: posRef(i),
    menge: String(z.anzahl),
    katalog_snapshot_sha256: null,
    herkunft: { art: "manuell" as const },
    programm: null,
    werkstoff: null,
  };
  if (z.gruppe === "Beschlag") {
    const b = BLUM.find((x) => x.treffer.test(z.artikel ?? ""));
    return {
      ...basis,
      typ: "artikel",
      artikel_id: b ? `blum:${b.nr}` : null,
      bezeichnung: z.teil,
      einheit: "stk",
    };
  }
  const [laenge, breite, dicke] = z.mass.split(" × ");
  const text = `${z.teil}${z.annahme ? " (Annahme)" : ""}, ${z.material}`;
  const werkstoff = WERKSTOFF[z.material];
  return {
    ...basis,
    ...(werkstoff ? { herkunft: { art: "regel" as const, regel_ref: REGEL_ZUSCHNITT }, werkstoff } : {}),
    typ: "freiposition",
    artikel_id: null,
    bezeichnung: text.normalize("NFC").slice(0, 200),
    einheit: "stk",
    ...(laenge && breite && dicke ? { masse_mm: { laenge, breite, dicke } } : {}),
  };
}

/** Millimeter (ganzzahlig) -> Meter als Dezimalstring ohne Endnullen (5708 -> »5.708«). */
function meter(mm: number): string {
  return (mm / 1000).toFixed(3).replace(/\.?0+$/, "");
}

/**
 * Kanten-Positionen: Laufmeter netto je Material mit Aufbau und Dicke, aus dem
 * Kantenbild der Etiketten (l1/l2 = Länge, b1/b2 = Breite). Das Kantenbild ist
 * Annahme, darum steht »Annahme« in der Bezeichnung (wie cody-cad).
 */
function kanten(zeilen: StuecklistenZeile[], ab: number): Position[] {
  const summe = new Map<string, { material: string; dicke: string; mm: number }>();
  for (const e of buildMesseEtiketten(zeilen)) {
    if (!WERKSTOFF[e.werkstoff]) continue;
    const [l, b, dicke] = e.mass.split(" × ");
    const mm = (e.kanten.l1 ? 1 : 0) * Number(l) + (e.kanten.l2 ? 1 : 0) * Number(l)
      + (e.kanten.b1 ? 1 : 0) * Number(b) + (e.kanten.b2 ? 1 : 0) * Number(b);
    if (!mm || !dicke) continue;
    const key = `${e.werkstoff}|${dicke}`;
    const alt = summe.get(key) ?? { material: e.werkstoff, dicke, mm: 0 };
    summe.set(key, { ...alt, mm: alt.mm + mm });
  }
  return [...summe.values()].map((k, j) => ({
    position_ref: posRef(ab + j),
    typ: "freiposition",
    artikel_id: null,
    bezeichnung: `Kante ${k.dicke} mm · ${k.material} · Annahme: Kanten-Regel noch nicht freigegeben, bitte bestätigen`
      .normalize("NFC")
      .slice(0, 200),
    menge: meter(k.mm),
    einheit: "m",
    katalog_snapshot_sha256: null,
    herkunft: { art: "regel", regel_ref: REGEL_KANTE },
    programm: null,
    werkstoff: null,
  }));
}

/** Kanonisches JSON nach RFC 8785 (reicht für Strings, Ganzzahlen, null, bool). */
export function jcs(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(jcs).join(",")}]`;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${jcs(o[k])}`).join(",")}}`;
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** SHA-256 als Hex (UTF-8 des Textes). */
export function sha256Hex(text: string): string {
  const daten = new TextEncoder().encode(text);
  const bitLen = daten.length * 8;
  const len = ((daten.length + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(len);
  buf.set(daten);
  buf[daten.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(len - 8, Math.floor(bitLen / 2 ** 32));
  dv.setUint32(len - 4, bitLen >>> 0);
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  const r = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < len; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15]!, b = w[i - 2]!;
      const s0 = r(a, 7) ^ r(a, 18) ^ (a >>> 3);
      const s1 = r(b, 17) ^ r(b, 19) ^ (b >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }
    let [A, B, C, D, E, F, G, H] = h as unknown as number[];
    for (let i = 0; i < 64; i++) {
      const S1 = r(E!, 6) ^ r(E!, 11) ^ r(E!, 25);
      const ch = (E! & F!) ^ (~E! & G!);
      const t1 = (H! + S1 + ch + K[i]! + w[i]!) >>> 0;
      const S0 = r(A!, 2) ^ r(A!, 13) ^ r(A!, 22);
      const maj = (A! & B!) ^ (A! & C!) ^ (B! & C!);
      const t2 = (S0 + maj) >>> 0;
      H = G; G = F; F = E; E = (D! + t1) >>> 0;
      D = C; C = B; B = A; A = (t1 + t2) >>> 0;
    }
    const neu = [A, B, C, D, E, F, G, H];
    for (let i = 0; i < 8; i++) h[i] = (h[i]! + neu[i]!) >>> 0;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, "0")).join("");
}

/** Ganze Übergabe-Datei. `jetzt` nur für Tests fest, `revision` siehe VOAI_REVISION. */
export function buildVoaiStueckliste(jetzt = new Date(), revision = VOAI_REVISION): VoaiStueckliste {
  if (!Number.isInteger(revision) || revision < 1) throw new Error(`revision muss ganzzahlig ≥ 1 sein: ${revision}`);
  const zeilen = buildMesseStueckliste();
  const positionen = [...zeilen.map(position), ...kanten(zeilen, zeilen.length)]
    .sort((a, b) => (a.position_ref < b.position_ref ? -1 : 1));
  const inhalt = { projekt_ref: PROJEKT_REF, liste_ref: LISTE_REF, revision, positionen };
  return {
    schema: VOAI_SCHEMA,
    inhalt,
    export: {
      cody_cad_version: "0.1.0",
      erzeugt_am: jetzt.toISOString().replace(/\.\d{3}Z$/, "Z"),
    },
    inhalt_sha256: sha256Hex(jcs({ schema: VOAI_SCHEMA, inhalt })),
  };
}
