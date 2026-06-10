import type {
  IRAGProvider,
  ISTTProvider,
  ITTSProvider,
  ITopicGuard,
} from "@craft-codex/core";
import type { AnswerFn } from "./pipeline";
import { MockSTTProvider, mockSttFromText } from "./mock-stt";
import { MockTTSProvider } from "./mock-tts";
import { createDovetailAnswerFn } from "./dovetail-answer";
import { WhisperSTTProvider } from "./whisper-stt";
import { ElevenLabsTTSProvider } from "./elevenlabs-tts";
import { createClaudeAnswerFn } from "./claude-answer";
import {
  CachedTTSProvider,
  EMPTY_MANIFEST,
  type TTSCacheManifest,
} from "./tts-cache";
import {
  ServerSTTProvider,
  ServerTTSProvider,
  createServerAnswerFn,
  type ServerVoiceHealth,
} from "./server-providers";

/**
 * Mode-Discriminator fuer Voice-Provider-Bundle.
 *
 * - "mock": MockSTT (rotiert Sample-Queries) + MockTTS (Stille) +
 *   Template-Synthesizer aus dovetail-answer.
 * - "real": Whisper STT + ElevenLabs TTS (optional cached) + Claude SSE —
 *   NUR server-side verwenden (Keys!), client nutzt "server".
 * - "server" (Phase E): Browser spricht mit den eigenen /api/voice/*-Routen;
 *   Keys bleiben am Server. TTS ist cache-first (offline-Kette).
 */
export type VoiceMode = "mock" | "real" | "server";

export interface VoiceProviderBundle {
  mode: VoiceMode;
  stt: ISTTProvider;
  tts: ITTSProvider;
  answer: AnswerFn;
}

export interface MockBundleConfig {
  rag: IRAGProvider;
  guard: ITopicGuard;
  /** Sample-Queries fuer MockSTT-Rotation. Default: array von 1 Frage. */
  sampleQueries?: ReadonlyArray<string>;
}

/**
 * Mock-Bundle — keine API-Keys noetig, deterministisch.
 *
 * STT rotiert durch sampleQueries (default ["Frage stellen"]) und wird
 * pro Mic-Click neu instanziert vom Caller — daher liefert die Factory
 * einen "Platzhalter"-MockSTT mit der ersten sampleQuery. Die VoiceConsole
 * erzeugt fuer jeden Click ihren eigenen MockSTT-Provider.
 */
export function createMockVoiceProviders(
  config: MockBundleConfig,
): VoiceProviderBundle {
  const first = config.sampleQueries?.[0] ?? "Frage stellen";
  return {
    mode: "mock",
    stt: mockSttFromText(first),
    tts: new MockTTSProvider({ secondsPerChar: 0.04 }),
    answer: createDovetailAnswerFn({
      rag: config.rag,
      guard: config.guard,
    }),
  };
}

export interface RealBundleConfig {
  rag: IRAGProvider;
  guard: ITopicGuard;
  anthropicApiKey: string;
  openaiApiKey: string;
  elevenLabsApiKey: string;
  /** Optional: Pre-cached TTS manifest fuer Backup-Stufe-3. */
  ttsCacheManifest?: TTSCacheManifest;
  /** Optional model override fuer Claude. */
  claudeModel?: string;
  /** Optional model override fuer Whisper. */
  whisperModel?: string;
  /** Optional ElevenLabs voiceId override. */
  elevenLabsVoiceId?: string;
}

/**
 * Real-Bundle — alle drei API-Keys Pflicht.
 *
 * **Security WARNING:** Diese Factory NUR aus Server-Side-API-Routes
 * verwenden. API-Keys client-side zu exposen leakt sie in den Browser-Bundle.
 * Phase E migration: API-Routes als Server-Side-Proxy fuer Whisper / Claude /
 * ElevenLabs. Bis dahin: Phase C Mock-Mode bleibt Demo-Default.
 */
export function createRealVoiceProviders(
  config: RealBundleConfig,
): VoiceProviderBundle {
  if (
    !config.anthropicApiKey ||
    !config.openaiApiKey ||
    !config.elevenLabsApiKey
  ) {
    throw new Error(
      "createRealVoiceProviders: all three API keys required (anthropic, openai, elevenLabs)",
    );
  }

  const upstreamTts = new ElevenLabsTTSProvider({
    apiKey: config.elevenLabsApiKey,
    ...(config.elevenLabsVoiceId
      ? { defaultVoiceId: config.elevenLabsVoiceId }
      : {}),
  });

  const tts = config.ttsCacheManifest
    ? new CachedTTSProvider({
        upstream: upstreamTts,
        manifest: config.ttsCacheManifest,
      })
    : upstreamTts;

  return {
    mode: "real",
    stt: new WhisperSTTProvider({
      apiKey: config.openaiApiKey,
      ...(config.whisperModel ? { model: config.whisperModel } : {}),
    }),
    tts,
    answer: createClaudeAnswerFn({
      apiKey: config.anthropicApiKey,
      rag: config.rag,
      guard: config.guard,
      ...(config.claudeModel ? { model: config.claudeModel } : {}),
    }),
  };
}

/**
 * Auto-Factory: pickt real wenn alle Keys vorhanden, sonst mock.
 *
 * Caller-Convention: pass `undefined` fuer Keys die nicht verfuegbar sind,
 * Factory entscheidet automatisch.
 */
export interface AutoBundleConfig {
  rag: IRAGProvider;
  guard: ITopicGuard;
  anthropicApiKey?: string | undefined;
  openaiApiKey?: string | undefined;
  elevenLabsApiKey?: string | undefined;
  ttsCacheManifest?: TTSCacheManifest;
  sampleQueries?: ReadonlyArray<string>;
}

export interface ServerBundleConfig {
  rag: IRAGProvider;
  guard: ITopicGuard;
  /** Ergebnis von probeServerVoice() — welche Routen konfiguriert sind. */
  health: ServerVoiceHealth;
  /** Pre-cached TTS manifest → cache-first vor dem Server-Roundtrip. */
  ttsCacheManifest?: TTSCacheManifest;
}

/**
 * Phase-E-Bundle: alles laeuft ueber die eigenen API-Routen.
 * Fallback-Kette pro Ebene:
 *  - STT:    Server-Whisper, sonst Mock (UI bietet zusaetzlich Texteingabe)
 *  - TTS:    Cache-Hit → Offline-PCM; sonst Server-ElevenLabs; sonst Mock
 *  - Answer: Server (Claude oder Template — laeuft IMMER, RAG ist server-side);
 *            wirft die Route, faellt die Console auf lokales Template zurueck.
 */
export function createServerVoiceProviders(
  config: ServerBundleConfig,
): VoiceProviderBundle {
  const serverTts = new ServerTTSProvider();
  const tts: ITTSProvider = config.health.tts
    ? config.ttsCacheManifest
      ? new CachedTTSProvider({ upstream: serverTts, manifest: config.ttsCacheManifest })
      : serverTts
    : config.ttsCacheManifest
      ? new CachedTTSProvider({
          upstream: new MockTTSProvider({ secondsPerChar: 0.04 }),
          manifest: config.ttsCacheManifest,
        })
      : new MockTTSProvider({ secondsPerChar: 0.04 });

  return {
    mode: "server",
    stt: config.health.stt ? new ServerSTTProvider() : mockSttFromText("Frage stellen"),
    tts,
    answer: createServerAnswerFn(),
  };
}

export function createVoiceProviders(
  config: AutoBundleConfig,
): VoiceProviderBundle {
  const hasAllKeys =
    !!config.anthropicApiKey &&
    !!config.openaiApiKey &&
    !!config.elevenLabsApiKey;

  if (hasAllKeys) {
    return createRealVoiceProviders({
      rag: config.rag,
      guard: config.guard,
      anthropicApiKey: config.anthropicApiKey!,
      openaiApiKey: config.openaiApiKey!,
      elevenLabsApiKey: config.elevenLabsApiKey!,
      ...(config.ttsCacheManifest
        ? { ttsCacheManifest: config.ttsCacheManifest }
        : {}),
    });
  }

  return createMockVoiceProviders({
    rag: config.rag,
    guard: config.guard,
    ...(config.sampleQueries ? { sampleQueries: config.sampleQueries } : {}),
  });
}

export { EMPTY_MANIFEST, MockSTTProvider };
