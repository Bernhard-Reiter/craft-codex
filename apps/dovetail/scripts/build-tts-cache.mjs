#!/usr/bin/env node
/* eslint-disable */
/**
 * build-tts-cache.mjs — generiert vor-cachte PCM-Audios fuer Top-20
 * Schwalbenschwanz-Antworten.
 *
 * Use-Case: Phase D Backup-Plan Stufe 3 (ElevenLabs down beim Demo).
 *
 * Workflow:
 *   1. Top-20 Lehrling-Antworten (hardcoded oder aus answers.json)
 *   2. Pro Antwort: POST an ElevenLabs TTS, save PCM zu public/tts-cache/{hash}.pcm
 *   3. Manifest mit hash → file mapping zu public/tts-cache/manifest.json
 *
 * Auf Run-Time: CachedTTSProvider liest manifest.json, fetched PCM
 * statt API zu fragen.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... node scripts/build-tts-cache.mjs
 *
 * Ohne API-Key: erstellt nur manifest-Stub mit empty entries und exit 0.
 * So kann der Build-Step im CI ohne Secrets durchlaufen.
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public", "tts-cache");
const MANIFEST_PATH = join(PUBLIC_DIR, "manifest.json");

const DEFAULT_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";
const OUTPUT_FORMAT = "pcm_24000";
const SAMPLE_RATE = 24000;

// Top-20 paraphrasierte Antworten basierend auf RAG-Corpus.
// Synced manuell vor jedem Demo-Lauf. Phase E: aus rag/corpus lesen.
const TOP_20_ANSWERS = [
  "Der Anriss ist die Grundlage jeder Schwalbenschwanzverbindung. Mit dem Streichmass uebertraegst du die Brettstaerke umlaufend.",
  "Schwalbenwinkel 1 zu 6 ist Standard fuer Hartholz wie Eiche. Steiler braucht Weichholz nicht — 1 zu 8 reicht.",
  "Saege immer auf der Abfallseite. Die Anrisslinie bleibt als feiner Strich stehen — sie ist deine Pruefmarke beim Passen.",
  "Beim Stemmen erst senkrecht in die Anrisslinie einschlagen, dann flach von unten wegspalten. Niemals tiefer als Streichmass.",
  "Trocken anpassen ohne Leim. Geht es ohne Druck rein, ist die Passung zu lose — Werkstueck unbrauchbar.",
  "Pin-Anzahl haengt von der Brettbreite ab. Bis 100 mm reichen 3 bis 5 Pins, breiter ungerade Anzahl.",
  "Stemmeisen-Schliff 25 Grad fuer Weichholz, 30 Grad fuer Hartholz. Spiegelblank honen vor jedem Einsatz.",
  "Frank Klausz empfiehlt Pin-First — saege zuerst die Pins, dann reisse die Schwalben drueber an. Weniger Uebertragungsfehler.",
  "Die Schwalbenschwanzverbindung haelt mechanisch ohne Leim. Sie ist seit dem alten Aegypten belegt — Tutanchamuns Moebel.",
  "Lehrplan Tischler Modul 3: Spalt maximal 0.2 mm, kein Hirnholz-Ausriss, gleichmaessige Pin-Geometrie.",
  "Typische Fehler: Pin zu schmal — bricht beim Einschlagen. Mindestens 4 mm an der schmalsten Stelle.",
  "Schmiege auf 1 zu 6 einstellen — also Verhaeltnis Brettstaerke zu Versatz. Mit Stahllineal pruefen.",
  "Streichmass auf Brettstaerke einstellen. Erst auf der Vorderseite anreissen, dann umlaufend ueber alle vier Kanten.",
  "Hirnholz-Ausriss vermeiden: aus beiden Richtungen abwechselnd stemmen. Letzten halben Millimeter mit Stechbeitel.",
  "Glanzstellen beim Passen identifizieren — das sind die hohen Stellen die reiben. Punktuell abnehmen mit Stechbeitel.",
  "Soll-Geometrie als gruenes Hologramm: dein Werkstueck sollte dem Hologramm so nah wie moeglich kommen.",
  "Bei Pin-Anzahl 5 hast du 4 Schwalben dazwischen plus 2 halbe an den Enden. Klassische Symmetrie.",
  "Ryoba-Saege oder Gestellsaege mit 14 bis 16 Zaehnen pro Zoll. Japan-Saege schneidet auf Zug, westliche auf Stoss.",
  "Wenn der Spalt zu gross ist, kannst du nicht nachbessern — das Werkstueck ist verloren. Lieber langsamer arbeiten.",
  "Passung pruefen ohne Hammer. Mit der Hand reindruecken, dann pruefen. Erst zum Schluss mit Holzhammer leicht klopfen.",
];

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function fetchTTS(text, apiKey) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}/stream?output_format=${OUTPUT_FORMAT}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/pcm",
    },
    body: JSON.stringify({
      text,
      model_id: DEFAULT_MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
      },
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`ElevenLabs ${r.status}: ${err.slice(0, 200)}`);
  }
  return new Uint8Array(await r.arrayBuffer());
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log(
      "[build-tts-cache] ELEVENLABS_API_KEY not set — writing empty manifest stub.",
    );
    console.log(
      "[build-tts-cache] Run with `ELEVENLABS_API_KEY=... pnpm tts:cache` to populate.",
    );
    const stub = {
      version: 1,
      entries: {},
      generated: new Date().toISOString(),
      note: "Empty stub — ELEVENLABS_API_KEY missing at build time.",
    };
    await writeFile(MANIFEST_PATH, JSON.stringify(stub, null, 2));
    process.exit(0);
  }

  console.log(`[build-tts-cache] Generating ${TOP_20_ANSWERS.length} PCM files…`);
  const entries = {};
  let generated = 0;
  let failed = 0;

  for (let i = 0; i < TOP_20_ANSWERS.length; i++) {
    const text = TOP_20_ANSWERS[i];
    const hash = sha256(text);
    const file = `/tts-cache/${hash}.pcm`;
    const fsPath = join(PUBLIC_DIR, `${hash}.pcm`);

    try {
      const pcm = await fetchTTS(text, apiKey);
      await writeFile(fsPath, pcm);
      entries[hash] = { text, file, sampleRate: SAMPLE_RATE };
      generated++;
      console.log(`  [${i + 1}/${TOP_20_ANSWERS.length}] ${hash.slice(0, 8)} ${text.slice(0, 60)}…`);
    } catch (e) {
      failed++;
      console.error(`  [${i + 1}/${TOP_20_ANSWERS.length}] FAILED: ${e.message}`);
    }
  }

  const manifest = {
    version: 1,
    entries,
    generated: new Date().toISOString(),
    stats: { generated, failed, total: TOP_20_ANSWERS.length },
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `[build-tts-cache] Done — ${generated} cached, ${failed} failed. Manifest: ${MANIFEST_PATH}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("[build-tts-cache] Fatal:", e);
  process.exit(1);
});
