#!/usr/bin/env node
/* eslint-disable */
/**
 * build-tts-cache.mjs — generiert vor-vertonte PCM-Audios für die Top-Antworten
 * mit GOOGLE GEMINI TTS (Prototyp-Stimme; kein ElevenLabs).
 *
 * Use-Case: Offline-Backup für die Lienz-Demo — die vorgenerierten Antworten
 * sprechen sofort und ohne Netz. Online fällt jede ungecachte Antwort live auf
 * /api/voice/tts (ebenfalls Gemini) zurück.
 *
 * Wire-Format = generativelanguage generateContent, responseModalities
 * ["AUDIO"] → inline base64 PCM Int16, sampleRate aus mimeType
 * ("audio/L16;codec=pcm;rate=24000"). Identisch zu lib/voice/gemini-tts.ts
 * und zum Cache-Player.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/build-tts-cache.mjs
 *   (oder lege den Key in apps/tischler/.env.local — wird automatisch geladen)
 *
 * Ohne Key: schreibt einen leeren Manifest-Stub und exit 0 (CI-safe).
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public", "tts-cache");
const MANIFEST_PATH = join(PUBLIC_DIR, "manifest.json");
const ENV_LOCAL = join(__dirname, "..", ".env.local");

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com";
const DEFAULT_MODEL = "gemini-3.1-flash-tts-preview";
const DEFAULT_VOICE = "Kore"; // klar, gutes Deutsch

// Top-Antworten basierend auf RAG-Corpus. Wortlaut = Cache-Key (SHA-256).
const TOP_ANSWERS = [
  "Der Anriss ist die Grundlage jeder Schwalbenschwanzverbindung. Mit dem Streichmass uebertraegst du die Brettstaerke umlaufend.",
  "Saege immer auf der Abfallseite. Die Anrisslinie bleibt als feiner Strich stehen — sie ist deine Pruefmarke beim Passen.",
  "Beim Stemmen erst senkrecht in die Anrisslinie einschlagen, dann flach von unten wegspalten. Niemals tiefer als Streichmass.",
  "Trocken anpassen ohne Leim. Geht es ohne Druck rein, ist die Passung zu lose — Werkstueck unbrauchbar.",
  "Pin-Anzahl haengt von der Brettbreite ab. Bis 100 mm reichen 3 bis 5 Pins, breiter ungerade Anzahl.",
  "Stemmeisen-Schliff 25 Grad fuer Weichholz, 30 Grad fuer Hartholz. Spiegelblank honen vor jedem Einsatz.",
  "Frank Klausz empfiehlt Pin-First — saege zuerst die Pins, dann reisse die Schwalben drueber an. Weniger Uebertragungsfehler.",
  "Die Schwalbenschwanzverbindung haelt mechanisch ohne Leim. Sie ist seit dem alten Aegypten belegt — Tutanchamuns Moebel.",
  "Lehrplan Tischler Modul 3: Spalt maximal 0.2 mm, kein Hirnholz-Ausriss, gleichmaessige Pin-Geometrie.",
  "Typische Fehler: Pin zu schmal — bricht beim Einschlagen. Mindestens 4 mm an der schmalsten Stelle.",
  "Streichmass auf Brettstaerke einstellen. Erst auf der Vorderseite anreissen, dann umlaufend ueber alle vier Kanten.",
  "Hirnholz-Ausriss vermeiden: aus beiden Richtungen abwechselnd stemmen. Letzten halben Millimeter mit Stechbeitel.",
  "Glanzstellen beim Passen identifizieren — das sind die hohen Stellen die reiben. Punktuell abnehmen mit Stechbeitel.",
  "Soll-Geometrie als gruenes Hologramm: dein Werkstueck sollte dem Hologramm so nah wie moeglich kommen.",
  "Ryoba-Saege oder Gestellsaege mit 14 bis 16 Zaehnen pro Zoll. Japan-Saege schneidet auf Zug, westliche auf Stoss.",

  // ── Überblick / "von ganz vorne" + Schwalbenwinkel ──────────────────
  "Ein Zinken ist eine Eckverbindung: zwei Bretter, deren Stirnseiten kammartig ausgeschnitten sind und ineinandergreifen wie zwei Haende.",
  "Zinken verbinden Bretter zu einem Kasten — Schubladen, Truhen, Schatullen. Der Schwalbenschwanz haelt sogar ohne Leim oder Schraube.",
  "Es gibt vier Hauptarten: Fingerzinken, den Schwalbenschwanz, die halbverdeckte und die verdeckte Zinkung. Wir fangen einfach an und steigern uns.",
  "Der Schwalbenschwanz ist keilfoermig hinterschnitten — er verriegelt sich. Das nennt der Tischler Formschluss.",
  "Der Schwalbenwinkel ist 1 zu 6 oder 1 zu 8. 1 zu 6 ist steiler und verhakt staerker, 1 zu 8 ist feiner und sieht eleganter aus. Beide halten.",
  // Meister-Intros je Zinkenart (Wortlaut = zinkenarten.ts voiceIntro)
  "Fangen wir einfach an. Fingerzinken sind gerade — wie Finger, die ineinandergreifen. Sie halten mit Leim und sind der beste erste Schritt.",
  "Jetzt die Königsdisziplin. Der Schwalbenschwanz ist keilförmig — er verhakt sich und hält ohne Leim. Wir bauen ihn Schritt für Schritt: anreißen, sägen, stemmen, passen, prüfen.",
  "Bei der Schublade soll man die Verbindung vorne nicht sehen. Darum die halbverdeckte Zinkung: die Front bleibt glatt, und trotzdem hält die Seite bombenfest.",
  "Die hohe Schule. Bei der verdeckten Zinkung auf Gehrung sieht man von außen gar nichts mehr — die Ecke wirkt wie ein glatter Gehrungsstoß, hält aber wie ein Schwalbenschwanz.",
];

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Lädt GEMINI_* aus .env.local, falls nicht schon im Prozess-Env. */
async function loadEnvLocal() {
  if (process.env.GEMINI_API_KEY) return;
  try {
    const raw = await readFile(ENV_LOCAL, "utf8");
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* keine .env.local — egal */
  }
}

async function fetchGeminiPcm(text, apiKey, model, voice) {
  const url = `${GEMINI_ENDPOINT}/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`GeminiTTS HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) throw new Error("GeminiTTS: kein Audio in der Antwort");
  const sampleRate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] ?? 24000);
  const pcm = Buffer.from(part.inlineData.data, "base64");
  return { pcm, sampleRate };
}

async function main() {
  await loadEnvLocal();
  await mkdir(PUBLIC_DIR, { recursive: true });

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_TTS_MODEL ?? DEFAULT_MODEL;
  const voice = process.env.GEMINI_TTS_VOICE ?? DEFAULT_VOICE;

  if (!apiKey) {
    console.log("! kein GEMINI_API_KEY — schreibe leeren Manifest-Stub.");
    await writeFile(
      MANIFEST_PATH,
      JSON.stringify({ version: 1, entries: {} }, null, 2),
    );
    return;
  }

  console.log(`▸ Gemini TTS: ${model} / Stimme ${voice} / ${TOP_ANSWERS.length} Antworten`);
  const entries = {};
  let ok = 0;
  for (const text of TOP_ANSWERS) {
    const hash = sha256(text);
    try {
      const { pcm, sampleRate } = await fetchGeminiPcm(text, apiKey, model, voice);
      await writeFile(join(PUBLIC_DIR, `${hash}.pcm`), pcm);
      entries[hash] = { text, file: `/tts-cache/${hash}.pcm`, sampleRate };
      ok++;
      console.log(`  ✓ (${ok}/${TOP_ANSWERS.length}) ${text.slice(0, 48)}…`);
    } catch (e) {
      console.log(`  ! ${String(e).slice(0, 120)} — "${text.slice(0, 40)}…"`);
    }
    await new Promise((r) => setTimeout(r, 250)); // höflich
  }

  await writeFile(
    MANIFEST_PATH,
    JSON.stringify({ version: 1, entries }, null, 2),
  );
  console.log(`✓ ${ok}/${TOP_ANSWERS.length} Antworten vertont → ${MANIFEST_PATH}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
