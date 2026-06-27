"use client";

import { useCallback, useRef } from "react";
import type { ITTSProvider, TTSChunk } from "@craft-codex/core";
import { playPcmChunks } from "./pcm-player";

/**
 * Spricht einen festen Text mit der Meister-Stimme (TTS) — fuer die gefuehrte
 * Vorfuehrung: beim Schrittwechsel erklaert der Meister automatisch, was er tut.
 *
 * Beim erneuten Aufruf (schnelles Vor/Zurueck) wird das laufende Sprechen
 * abgebrochen (Synthese + Audio), damit sich die Stimmen nicht ueberlagern.
 *
 * Ohne TTS-Provider (offline/kein Key) ein No-op — der Text steht ja sichtbar.
 */
export function useMeisterSpeak(tts?: ITTSProvider) {
  const abortRef = useRef<AbortController | null>(null);

  return useCallback(
    (text: string) => {
      if (!tts || !text.trim()) return;

      // Vorheriges Sprechen abbrechen.
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      void (async () => {
        try {
          const chunks: TTSChunk[] = [];
          for await (const chunk of tts.synthesizeStream(text)) {
            if (ac.signal.aborted) return;
            chunks.push(chunk);
          }
          if (ac.signal.aborted) return;
          await playPcmChunks(chunks, ac.signal);
        } catch {
          /* Stimme nicht verfuegbar — Text bleibt sichtbar */
        }
      })();
    },
    [tts],
  );
}
