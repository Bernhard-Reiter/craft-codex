"use client";

/**
 * Shared Hook: probt die Server-Voice-Routen + den TTS-Cache und baut das
 * Provider-Bundle. Eine Quelle der Wahrheit für ALLE Seiten mit
 * VoiceConsole — vorher hatte nur /voice diese Verdrahtung und die
 * Werkstatt (/dovetail) blieb stumm im Mock-Modus.
 *
 * Offline-Verhalten unverändert: Health-Probe scheitert → bundle bleibt
 * null → Console fällt auf Mock/Template zurück. Die Demo bricht nie.
 */

import { useEffect, useState } from "react";
import type { IRAGProvider, ITopicGuard } from "@craft-codex/core";
import {
  createServerVoiceProviders,
  type VoiceProviderBundle,
} from "./factory";
import { probeServerVoice } from "./server-providers";
import { EMPTY_MANIFEST, type TTSCacheManifest } from "./tts-cache";

export interface ServerVoiceState {
  /** null = Server nicht erreichbar (offline/statisch) → Mock-Console. */
  bundle: VoiceProviderBundle | null;
  /** Anzahl vorvertonter Antworten im Offline-Cache. */
  cacheCount: number;
  /**
   * 'probing' bis die Health-Probe antwortet, danach 'ready' (Server) oder
   * 'offline' (Mock). Verhindert das Mock→Server-Flackern: die UI kann
   * während 'probing' einen ruhigen Lade-Zustand zeigen statt umzuspringen.
   */
  status: "probing" | "ready" | "offline";
}

export function useServerVoice(
  rag: IRAGProvider,
  guard: ITopicGuard,
  locale: "de" | "en" = "de",
): ServerVoiceState {
  const [bundle, setBundle] = useState<VoiceProviderBundle | null>(null);
  const [cacheCount, setCacheCount] = useState(0);
  const [status, setStatus] = useState<ServerVoiceState["status"]>("probing");

  useEffect(() => {
    let on = true;
    setStatus("probing");
    void (async () => {
      const [health, manifest] = await Promise.all([
        probeServerVoice(),
        fetch("/tts-cache/manifest.json", { cache: "no-store" })
          .then((r) =>
            r.ok ? (r.json() as Promise<TTSCacheManifest>) : EMPTY_MANIFEST,
          )
          .catch(() => EMPTY_MANIFEST),
      ]);
      if (!on) return;
      setCacheCount(Object.keys(manifest.entries ?? {}).length);
      if (health?.ok) {
        setBundle(
          createServerVoiceProviders({
            rag,
            guard,
            health,
            ttsCacheManifest: manifest,
            locale,
          }),
        );
        setStatus("ready");
      } else {
        setBundle(null);
        setStatus("offline");
      }
    })();
    return () => {
      on = false;
    };
  }, [rag, guard, locale]);

  return { bundle, cacheCount, status };
}
