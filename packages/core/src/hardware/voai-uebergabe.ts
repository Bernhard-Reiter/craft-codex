/**
 * Übergabe der Messe-Stückliste an VOAI als Datei im Vertrag »stueckliste/2«
 * (voai-waas packages/shared/contracts/stueckliste/2, nur gelesen 18.11.2026).
 *
 * KEINE Preise: der Vertrag verbietet jedes preis-Feld, VOAI setzt Preise
 * aus der eigenen Preisliste. Kein Aufruf an VOAI, nur eine Datei.
 *
 * Plattenteile = freiposition (herkunft manuell, werkstoff null),
 * Blum-Beschläge = artikel mit artikel_id »blum:<nr>«.
 * inhalt_sha256 = hex(SHA-256(UTF-8(JCS({schema, inhalt})))).
 * SHA-256 ist hier selbst gerechnet: crypto.subtle fehlt im Browser über
 * http im LAN (kein sicherer Kontext), und core läuft auch im Browser.
 */

import { buildMesseStueckliste, type StuecklistenZeile } from "./messe-stueckliste.js";

export const VOAI_SCHEMA = "stueckliste/2";

/** Feste, kleingeschriebene UUIDs, damit dieselbe Liste denselben Hash hat. */
const PROJEKT_REF = "c0dec0de-0000-4000-8000-00000000a600";
const LISTE_REF = "c0dec0de-0000-4000-8000-00000000b600";
const posRef = (i: number) => `c0dec0de-0000-4000-8000-${(0xc000 + i).toString(16).padStart(12, "0")}`;

/** Blum-Teil in der Stückliste -> artikel_id + Einheit. */
const BLUM: { treffer: RegExp; nr: string; einheit: "stk" | "satz" }[] = [
  { treffer: /71B3550/, nr: "71B3550", einheit: "stk" },
  { treffer: /173L6100/, nr: "173L6100", einheit: "stk" },
  { treffer: /766H5000S/, nr: "766H5000S", einheit: "satz" },
  { treffer: /T51\.7601/, nr: "T51.7601", einheit: "satz" },
];

type Position = {
  position_ref: string;
  typ: "artikel" | "freiposition";
  artikel_id: string | null;
  bezeichnung: string | null;
  menge: string;
  einheit: "stk" | "satz";
  masse_mm?: { laenge: string; breite: string; dicke: string };
  katalog_snapshot_sha256: null;
  herkunft: { art: "manuell" };
  programm: null;
  werkstoff: null;
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
    const b = BLUM.find((x) => x.treffer.test(z.teil));
    return {
      ...basis,
      typ: "artikel",
      artikel_id: b ? `blum:${b.nr}` : null,
      bezeichnung: z.teil,
      einheit: b?.einheit ?? "stk",
    };
  }
  const [laenge, breite, dicke] = z.mass.split(" × ");
  const text = `${z.gruppe} ${z.teil}${z.annahme ? " (Annahme)" : ""}, ${z.material}`;
  return {
    ...basis,
    typ: "freiposition",
    artikel_id: null,
    bezeichnung: text.normalize("NFC").slice(0, 200),
    einheit: "stk",
    ...(laenge && breite && dicke ? { masse_mm: { laenge, breite, dicke } } : {}),
  };
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

/** Ganze Übergabe-Datei. `jetzt` nur für Tests fest. */
export function buildVoaiStueckliste(jetzt = new Date()): VoaiStueckliste {
  const positionen = buildMesseStueckliste()
    .map(position)
    .sort((a, b) => (a.position_ref < b.position_ref ? -1 : 1));
  const inhalt = { projekt_ref: PROJEKT_REF, liste_ref: LISTE_REF, revision: 1, positionen };
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
