import type {
  IRAGProvider,
  ISTTProvider,
  ITTSProvider,
  ITopicGuard,
} from "@craft-codex/core";
import type { AnswerFn } from "./pipeline";
import { mockSttFromText } from "./mock-stt";
import { MockTTSProvider } from "./mock-tts";
import { CachedTTSProvider, type TTSCacheManifest } from "./tts-cache";
import {
  ServerSTTProvider,
  ServerTTSProvider,
  createServerAnswerFn,
  type ServerVoiceHealth,
} from "./server-providers";

/**
 * Mode-Discriminator fuer das Voice-Provider-Bundle.
 * - "server" (live): Browser spricht mit den eigenen /api/voice/*-Routen,
 *   Keys bleiben am Server, TTS ist cache-first (Offline-Kette).
 * - "real"/"mock": Badges der VoiceConsole, wenn kein Server-Bundle vorliegt
 *   (Mock = Offline-Demo ohne Keys).
 */
export type VoiceMode = "mock" | "real" | "server";

export interface VoiceProviderBundle {
  mode: VoiceMode;
  stt: ISTTProvider;
  tts: ITTSProvider;
  answer: AnswerFn;
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
 *  - TTS:    Cache-Hit → Offline-PCM; sonst Server (Gemini/ElevenLabs); sonst Mock
 *  - Answer: Server (Gemini/Claude/Template — laeuft IMMER, RAG ist server-side);
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
