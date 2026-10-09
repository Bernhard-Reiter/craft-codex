/**
 * Lienz-Demo: Live-Sprache mit dem Meister (OpenAI Realtime, WebRTC).
 *
 * Reine Konfiguration — kein I/O. Die Session (Persona, Werkzeug, Stimme)
 * legt der SERVER beim Ausstellen des Kurzzeit-Schluessels fest; der Browser
 * bekommt nur den Kurzzeit-Schluessel, nie OPENAI_API_KEY.
 *
 * API-Vertrag (gelesen 2026-10-09, developers.openai.com Realtime WebRTC):
 *   POST /v1/realtime/client_secrets  → { value, expires_at }
 *   POST /v1/realtime/calls (SDP, Bearer <value>) → SDP-Answer
 */

import type { VoiceLocale } from "./voice-locale";

export const REALTIME_DEFAULT_MODEL = "gpt-realtime-2.1";
export const REALTIME_DEFAULT_VOICE = "marin";
/** Live-Mitschrift des Lehrlings; per Env "off" abschaltbar. (Rauchtest 2026-10-09: 200) */
export const REALTIME_DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

/** Env-Wert → Transkriptionsmodell (undefined = aus). */
export function transcribeModelAusEnv(raw: string | undefined): string | undefined {
  if (raw === "off") return undefined;
  return raw || REALTIME_DEFAULT_TRANSCRIBE_MODEL;
}
/** Harte Obergrenze je Sitzung im Browser (danach neu starten). */
export const REALTIME_MAX_SESSION_MS = 10 * 60 * 1000;
/** Kurzzeit-Schluessel gilt nur fuer den Verbindungsaufbau. */
export const REALTIME_TOKEN_TTL_S = 60;

export const WISSEN_TOOL_NAME = "suche_wissen";

export const realtimeThemen = ["allgemein", "zinken"] as const;
export type RealtimeThema = (typeof realtimeThemen)[number];

export function parseThema(raw: unknown): RealtimeThema {
  return realtimeThemen.includes(raw as RealtimeThema) ? (raw as RealtimeThema) : "allgemein";
}

const PERSONA: Record<VoiceLocale, string> = {
  de: `Du bist ein erfahrener österreichischer Tischlermeister und redest mit einem Lehrling in der Werkstatt. Du duzt, sprichst klares, warmes Hochdeutsch mit Begeisterung fürs Handwerk und antwortest kurz: höchstens drei Sätze, dann darf der Lehrling nachfragen. Wenn er dich unterbricht, gehst du sofort auf ihn ein.

Fakten holst du dir mit dem Werkzeug ${WISSEN_TOOL_NAME}: IMMER bei Fragen zur Lehrlingsausbildung, Ausbildungsordnung, Berufsbild, Berufsschule, Lehrplan oder Lehrabschlussprüfung, und bei Fachfragen zu Zinken und Holzverbindungen. Erfinde keine Paragraphen und keine Inhalte. Nenne bei Rechts- und Lehrplanfragen die Quelle kurz beim Namen, zum Beispiel "laut Tischlerei-Ausbildungsordnung, Paragraph 2" oder "laut Lehrplan der Berufsschule, Anlage 147". Lies keine Internetadressen vor; die Quellen sieht der Lehrling am Bildschirm. Findet das Werkzeug nichts Passendes, sag das ehrlich.

Bleib beim Holzhandwerk und der Ausbildung. Bei fachfremden Fragen führst du freundlich zurück zum Werkstück.`,
  en: `You are an experienced Austrian master cabinetmaker talking with an apprentice in the workshop. Informal, warm, enthusiastic; answer briefly: at most three sentences, then let the apprentice ask more. If interrupted, respond to the interruption right away.

Get facts with the tool ${WISSEN_TOOL_NAME}: ALWAYS for questions about the apprenticeship, the Austrian training regulation (Tischlerei-Ausbildungsordnung), vocational school curriculum (Lehrplan, Anlage 147) or the final exam, and for technical questions about dovetails and wood joints. Never invent sections or content. For legal or curriculum questions name the source briefly (the sources are German originals). Never read out web addresses; the apprentice sees the sources on screen. If the tool finds nothing fitting, say so honestly.

Stay with woodworking and the apprenticeship; gently steer off-topic questions back to the workpiece.`,
};

const THEMA_ZUSATZ: Record<RealtimeThema, Record<VoiceLocale, string>> = {
  allgemein: { de: "", en: "" },
  zinken: {
    de: "\n\nDer Lehrling steht gerade an der Zinken-Station (Schwalbenschwanz, Fingerzinken, halbverdeckte und verdeckte Zinken). Erkläre praktisch: Anreißen, Sägen, Stemmen, Passen.",
    en: "\n\nThe apprentice is at the dovetail station (through dovetails, finger joints, half-blind and secret mitred dovetails). Explain practically: marking out, sawing, chopping, fitting.",
  },
};

export function realtimeInstructions(locale: VoiceLocale, thema: RealtimeThema): string {
  return PERSONA[locale] + THEMA_ZUSATZ[thema][locale];
}

export function wissenTool(locale: VoiceLocale) {
  return {
    type: "function" as const,
    name: WISSEN_TOOL_NAME,
    description:
      locale === "de"
        ? "Durchsucht den geprüften Wissenskorpus: Tischlerei-Ausbildungsordnung und Berufsschul-Lehrplan (Anlage 147) aus dem RIS sowie Fachwissen zu Zinken und Holzverbindungen. Liefert Textauszüge mit Quelle."
        : "Searches the verified knowledge corpus: Austrian Tischlerei training regulation and vocational school curriculum (Anlage 147) from RIS, plus craft knowledge on dovetails and wood joints. Returns excerpts with source.",
    parameters: {
      type: "object",
      properties: {
        frage: {
          type: "string",
          description:
            locale === "de"
              ? "Suchanfrage in Stichworten auf Deutsch mit den Fachbegriffen der Ausbildungsordnung (Lehrberuf Tischlerei, Lehrzeit, Berufsbild, Lehrabschlussprüfung, Lehrplan Berufsschule), z. B. 'Lehrzeit Lehrberuf Tischlerei' oder 'Lehrabschlussprüfung praktische Prüfung'. Findest du nichts, suche ein zweites Mal mit anderen Stichworten."
              : "Search query as German keywords, e.g. 'Berufsschule Lehrplan Holzverbindungen'.",
        },
      },
      required: ["frage"],
    },
  };
}

export interface RealtimeSessionOptions {
  locale: VoiceLocale;
  thema: RealtimeThema;
  model?: string;
  voice?: string;
  transcribeModel?: string;
}

/** Body fuer POST /v1/realtime/client_secrets. */
export function buildClientSecretRequest(opts: RealtimeSessionOptions) {
  const input: Record<string, unknown> = {
    turn_detection: { type: "server_vad", interrupt_response: true, create_response: true },
  };
  if (opts.transcribeModel) {
    input.transcription = { model: opts.transcribeModel, language: opts.locale };
  }
  return {
    expires_after: { anchor: "created_at", seconds: REALTIME_TOKEN_TTL_S },
    session: {
      type: "realtime",
      model: opts.model || REALTIME_DEFAULT_MODEL,
      instructions: realtimeInstructions(opts.locale, opts.thema),
      tools: [wissenTool(opts.locale)],
      tool_choice: "auto",
      audio: {
        input,
        output: { voice: opts.voice || REALTIME_DEFAULT_VOICE },
      },
    },
  };
}
