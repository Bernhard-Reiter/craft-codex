import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildVoaiStueckliste, VOAI_SCHEMA } from "./voai-uebergabe.js";

/**
 * Vertragstest: unsere VOAI-Datei gegen die gepinnte, byte-gleiche Kopie von
 * voai-waas packages/shared/contracts/stueckliste/2/stueckliste.schema.json
 * (Commit a8c28a8b, sha256 822cd2eb…0d45, siehe __fixtures__/voai-stueckliste-2.PIN.md).
 * Keine neue Abhängigkeit (Meister 1202 wort-3-983): kleine Handprüfung der
 * Schlüsselwörter, die das Schema nutzt. Unbekanntes Schlüsselwort -> Fehler,
 * damit eine neue Vertragsfassung nicht still durchrutscht.
 */
const SCHEMA_DATEI = new URL("./__fixtures__/voai-stueckliste-2.schema.json", import.meta.url);
const SCHEMA_SHA256 = "822cd2eb99d834879e7aebcd1b17a52abccf4a12eed3370a80697a9d6c0b0d45";

type S = Record<string, unknown>;
const OHNE_PRUEFUNG = new Set(["$schema", "$id", "$defs", "title", "description"]);
const BEKANNT = new Set([
  "$ref", "type", "const", "enum", "required", "properties", "additionalProperties", "minProperties",
  "items", "minItems", "maxItems", "uniqueItems", "minLength", "maxLength", "pattern", "minimum", "maximum",
  "oneOf", "allOf", "not", "if", "then", "else",
]);

function typVon(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

/** Fehler als »pfad: text«; leer = gültig. */
function pruefe(wurzel: S, s: S, v: unknown, pfad = ""): string[] {
  const f: string[] = [];
  const weiter = (t: S, w: unknown, p = pfad) => pruefe(wurzel, t, w, p);
  for (const k of Object.keys(s)) {
    if (!OHNE_PRUEFUNG.has(k) && !BEKANNT.has(k)) f.push(`${pfad}: Schlüsselwort ${k} nicht geprüft`);
  }
  if (typeof s.$ref === "string") {
    const name = s.$ref.replace(/^#\/\$defs\//, "");
    const ziel = (wurzel.$defs as Record<string, S>)[name];
    if (!ziel) return [`${pfad}: $ref ${s.$ref} fehlt`];
    f.push(...weiter(ziel, v));
  }
  if (s.type !== undefined) {
    const t = typVon(v);
    const erlaubt = ([] as string[]).concat(s.type as string | string[]);
    if (!erlaubt.includes(t) && !(t === "integer" && erlaubt.includes("number"))) f.push(`${pfad}: type ${t} statt ${erlaubt}`);
  }
  if ("const" in s && JSON.stringify(v) !== JSON.stringify(s.const)) f.push(`${pfad}: const ${JSON.stringify(s.const)}`);
  if (Array.isArray(s.enum) && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) f.push(`${pfad}: enum ${JSON.stringify(v)}`);
  if (typeof v === "string") {
    if (typeof s.pattern === "string" && !new RegExp(s.pattern, "u").test(v)) f.push(`${pfad}: pattern ${JSON.stringify(v)}`);
    if (typeof s.minLength === "number" && [...v].length < s.minLength) f.push(`${pfad}: minLength`);
    if (typeof s.maxLength === "number" && [...v].length > s.maxLength) f.push(`${pfad}: maxLength`);
  }
  if (typeof v === "number") {
    if (typeof s.minimum === "number" && v < s.minimum) f.push(`${pfad}: minimum`);
    if (typeof s.maximum === "number" && v > s.maximum) f.push(`${pfad}: maximum`);
  }
  if (Array.isArray(v)) {
    if (typeof s.minItems === "number" && v.length < s.minItems) f.push(`${pfad}: minItems`);
    if (typeof s.maxItems === "number" && v.length > s.maxItems) f.push(`${pfad}: maxItems`);
    if (s.uniqueItems === true && new Set(v.map((x) => JSON.stringify(x))).size !== v.length) f.push(`${pfad}: uniqueItems`);
    if (s.items) v.forEach((x, i) => f.push(...weiter(s.items as S, x, `${pfad}/${i}`)));
  }
  if (typVon(v) === "object") {
    const o = v as Record<string, unknown>;
    const props = (s.properties ?? {}) as Record<string, S>;
    for (const r of (s.required as string[] | undefined) ?? []) if (!(r in o)) f.push(`${pfad}: required ${r} fehlt`);
    if (typeof s.minProperties === "number" && Object.keys(o).length < s.minProperties) f.push(`${pfad}: minProperties`);
    for (const [k, w] of Object.entries(o)) {
      if (props[k]) f.push(...weiter(props[k]!, w, `${pfad}/${k}`));
      else if (s.additionalProperties === false) f.push(`${pfad}: ${k} nicht erlaubt`);
    }
  }
  if (Array.isArray(s.oneOf)) {
    const n = (s.oneOf as S[]).filter((t) => weiter(t, v).length === 0).length;
    if (n !== 1) f.push(`${pfad}: oneOf trifft ${n}`);
  }
  for (const t of (s.allOf as S[] | undefined) ?? []) f.push(...weiter(t, v));
  if (s.not && weiter(s.not as S, v).length === 0) f.push(`${pfad}: not`);
  if (s.if) {
    const zweig = weiter(s.if as S, v).length === 0 ? s.then : s.else;
    if (zweig) f.push(...weiter(zweig as S, v));
  }
  return f;
}

describe("VOAI-Vertrag stueckliste/2: unsere Datei passt zum gepinnten Schema", () => {
  const roh = readFileSync(SCHEMA_DATEI);
  const schema = JSON.parse(roh.toString("utf8")) as S;

  it("Kopie ist byte-gleich gepinnt (sha256) und meint dieselbe Vertragsversion", () => {
    expect(createHash("sha256").update(roh).digest("hex")).toBe(SCHEMA_SHA256);
    const version = ((schema.properties as Record<string, S>).schema as S).const;
    expect(version).toBe(VOAI_SCHEMA);
  });

  it("erzeugte VOAI-Datei hat 0 Schema-Befunde, die Handprüfung erkennt ein fehlendes Pflichtfeld", () => {
    const datei = JSON.parse(JSON.stringify(buildVoaiStueckliste(new Date("2026-11-18T09:00:00Z"))));
    expect(pruefe(schema, schema, datei)).toEqual([]);
    // Gegenprobe: die Prüfung ist nicht blind.
    const kaputt = JSON.parse(JSON.stringify(datei));
    delete kaputt.inhalt.positionen[0].einheit;
    expect(pruefe(schema, schema, kaputt).some((x) => x.includes("required einheit fehlt"))).toBe(true);
  });
});
