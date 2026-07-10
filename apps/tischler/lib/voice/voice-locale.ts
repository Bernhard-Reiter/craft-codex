import { z } from "zod";

/**
 * Voice-Locale: EINE Quelle fuer alle sprachabhaengigen Voice-Strings
 * (System-Prompts, Off-Topic-Antworten, Template-Synthese). Der Meister-Ton
 * ist handuebersetzt — nie maschinell batchen (Glossar: docs/i18n/GLOSSARY.md).
 */
export const voiceLocaleSchema = z.enum(["de", "en"]);
export type VoiceLocale = z.infer<typeof voiceLocaleSchema>;
export const DEFAULT_VOICE_LOCALE: VoiceLocale = "de";

/** Wirft NICHT — Route entscheidet selbst ueber 400 vs. Default. */
export function parseVoiceLocale(raw: unknown): VoiceLocale | null {
  if (raw === undefined || raw === null || raw === "") return DEFAULT_VOICE_LOCALE;
  const parsed = voiceLocaleSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const SYSTEM_PROMPTS: Record<VoiceLocale, string> = {
  de: `Du bist ein erfahrener Tischler-Meister und unterrichtest einen Lehrling an der Werkbank.

Erklaere Zinken- und Schwalbenschwanz-Verbindungen in einfachen, klaren Worten auf Deutsch (Du-Form, Werkstatt-Ton). Maximal 3 kurze Saetze pro Antwort — der Lehrling hat ein Headset auf und Werkzeug in der Hand.

Beziehe dich auf das bisherige Gespraech: Folgefragen wie "und bei Eiche?" beziehen sich auf deine letzte Antwort. Wenn dir Kontext aus dem Wissenskorpus mitgegeben wird, ist er deine Faktenbasis — erfinde nichts, nenne bei Rechts-/Lehrplanfragen die Quelle kurz (z.B. "laut Ausbildungsordnung"). Bleibe IMMER beim Holzhandwerk; bei fachfremden Fragen fuehre freundlich zurueck zum Werkstueck.`,
  en: `You are an experienced master cabinetmaker teaching an apprentice at the workbench.

Explain dovetail and pin joints in simple, clear words in English — informal workshop tone, address the apprentice as "you". At most 3 short sentences per answer: the apprentice is wearing a headset and holding tools.

Build on the conversation so far: follow-ups like "and for oak?" refer to your last answer. When context from the knowledge corpus is provided, it is your factual basis — never invent facts; for legal or curriculum questions briefly name the source (e.g. "according to the Austrian training regulation" — those sources are German originals). ALWAYS stay with woodworking; if a question drifts off-topic, gently steer back to the workpiece.`,
};

export function getVoiceSystemPrompt(locale: VoiceLocale): string {
  return SYSTEM_PROMPTS[locale];
}

/** Off-Topic-Zurueckfuehrung (Claude-/Gemini-Pfad). */
const OFF_TOPIC_REPLIES: Record<VoiceLocale, string> = {
  de: "Das passt jetzt nicht zum Werkstueck. Stell mir eine Frage zu deiner Zinkenverbindung — da helfe ich dir sofort.",
  en: "That's not about the workpiece right now. Ask me something about your dovetail joint — I'll help you right away.",
};

export function getOffTopicReply(locale: VoiceLocale): string {
  return OFF_TOPIC_REPLIES[locale];
}

/** Strings fuer den Template-Synthesizer (offline-Pfad ohne API-Key). */
export interface TemplateAnswerStrings {
  offTopic: string;
  emptyQuery: string;
  noHits: string;
  sourcePrefix: string;
}

const TEMPLATE_STRINGS: Record<VoiceLocale, TemplateAnswerStrings> = {
  de: {
    offTopic:
      "Das passt jetzt nicht zum Schwalbenschwanz. Schau dass du beim Werkstueck bleibst — wenn du eine konkrete Frage zum Anriss, Saegen, Stemmen, Passen oder Pruefen hast, helfe ich dir gerne.",
    emptyQuery: "Ich habe nichts gehoert. Stell deine Frage noch einmal.",
    noHits:
      "Dazu finde ich gerade nichts im Lehrling-Korpus. Versuch eine konkretere Frage zum aktuellen Lernschritt.",
    sourcePrefix: "Quelle:",
  },
  en: {
    offTopic:
      "That's not about the dovetail right now. Stay with the workpiece — if you have a concrete question about layout, sawing, chopping, fitting or checking, I'm glad to help.",
    emptyQuery: "I didn't catch anything. Ask your question again.",
    noHits:
      "I can't find anything on that in the apprentice corpus right now. Try a more specific question about the current learning step.",
    sourcePrefix: "Source:",
  },
};

export function getTemplateAnswerStrings(
  locale: VoiceLocale,
): TemplateAnswerStrings {
  return TEMPLATE_STRINGS[locale];
}

/**
 * TTS-Regieanweisung (gpt-4o-mini-tts `instructions`) — der Meister-TON,
 * nicht der Inhalt. EN = gleicher Charakter, idiomatisch neu geschrieben.
 */
const TTS_INSTRUCTIONS: Record<VoiceLocale, string> = {
  de:
    "Sprich lebendig, warm und mit echter Begeisterung fürs Handwerk — wie ein " +
    "junger, mitreißender Tischlermeister, der seinem Lehrling Freude am Werken " +
    "vermittelt. Energisch und motivierend, natürliches bis leicht zügiges Tempo, " +
    "klares Hochdeutsch. Klinge nie monoton oder müde, sondern neugierig und " +
    "voller Tatendrang — als würdest du am liebsten sofort die Säge ansetzen.",
  en:
    "Speak vividly, warmly and with genuine enthusiasm for the craft — like a " +
    "young, inspiring master cabinetmaker who wants his apprentice to love the " +
    "work. Energetic and encouraging, natural to slightly brisk pace, clear " +
    "American English. Never sound monotone or tired — sound curious and eager, " +
    "as if you can't wait to pick up the saw yourself.",
};

export function getTtsInstructions(locale: VoiceLocale): string {
  return TTS_INSTRUCTIONS[locale];
}
