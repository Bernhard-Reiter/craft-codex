"use client";

import { useCallback } from "react";
import type { ITTSProvider, TTSChunk } from "@craft-codex/core";
import { playPcmChunks } from "./pcm-player";

/**
 * Spricht einen festen Text mit der Meister-Stimme (TTS) — fuer die gefuehrte
 * Vorfuehrung: beim Schrittwechsel erklaert der Meister automatisch, was er tut.
 *
 * Ohne TTS-Provider (offline/kein Key) ein No-op — die Demo laeuft weiter, der
 * Text steht ja sichtbar im Panel.
 */
export function useMeisterSpeak(tts?: ITTSProvider) {
  return useCallback(
    (text: string) => {
      if (!tts || !text.trim()) return;
      void (async () => {
        try {
          const chunks: TTSChunk[] = [];
          for await (const chunk of tts.synthesizeStream(text)) {
            chunks.push(chunk);
          }
          await playPcmChunks(chunks);
        } catch {
          /* Stimme nicht verfuegbar — Text bleibt sichtbar */
        }
      })();
    },
    [tts],
  );
}
