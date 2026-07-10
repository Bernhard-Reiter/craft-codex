#!/usr/bin/env node
/**
 * i18n-Parity-Gate: de/*.json und en/*.json muessen EXAKT dieselben
 * Blatt-Keys haben (fehlender Key = halb uebersetzte Seite im Antrag-Demo).
 * Zusaetzlich: leere Strings und identische DE==EN-Langtexte als Warnung
 * (Copy-Paste-vergessen-Detektor). Exit 1 bei Parity-Verletzung.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "messages");

function leafKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") keys.push(...leafKeys(v, path));
    else keys.push(path);
  }
  return keys;
}

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

const deFiles = readdirSync(join(root, "de")).filter((f) => f.endsWith(".json"));
const enFiles = readdirSync(join(root, "en")).filter((f) => f.endsWith(".json"));

let errors = 0;
let warnings = 0;

const fileSet = new Set([...deFiles, ...enFiles]);
for (const file of [...fileSet].sort()) {
  if (!deFiles.includes(file)) {
    console.error(`✗ ${file}: fehlt in messages/de/`);
    errors++;
    continue;
  }
  if (!enFiles.includes(file)) {
    console.error(`✗ ${file}: fehlt in messages/en/`);
    errors++;
    continue;
  }
  const de = JSON.parse(readFileSync(join(root, "de", file), "utf8"));
  const en = JSON.parse(readFileSync(join(root, "en", file), "utf8"));
  const deKeys = new Set(leafKeys(de));
  const enKeys = new Set(leafKeys(en));

  for (const k of deKeys) {
    if (!enKeys.has(k)) {
      console.error(`✗ ${file}: Key "${k}" fehlt in EN`);
      errors++;
    }
  }
  for (const k of enKeys) {
    if (!deKeys.has(k)) {
      console.error(`✗ ${file}: Key "${k}" fehlt in DE`);
      errors++;
    }
  }
  for (const k of [...deKeys].filter((k) => enKeys.has(k))) {
    const dv = get(de, k);
    const ev = get(en, k);
    if (typeof ev === "string" && ev.trim() === "") {
      console.error(`✗ ${file}: EN-Key "${k}" ist leer`);
      errors++;
    }
    // Langtexte, die DE==EN sind, sind fast sicher vergessene Uebersetzungen.
    // Kurze Labels (XR, GitHub, 1:6 …) duerfen identisch sein.
    if (typeof dv === "string" && dv === ev && dv.length > 30) {
      console.warn(`⚠ ${file}: "${k}" ist in DE und EN identisch (vergessen?)`);
      warnings++;
    }
  }
}

if (errors > 0) {
  console.error(`\ni18n-Parity: ${errors} Fehler, ${warnings} Warnungen`);
  process.exit(1);
}
console.log(`i18n-Parity: OK (${fileSet.size} Namespaces, ${warnings} Warnungen)`);
