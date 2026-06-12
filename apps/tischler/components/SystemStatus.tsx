"use client";

import { useEffect, useState } from "react";
import { getDemoCorpus } from "../lib/rag/corpus";
import {
  probeServerVoice,
  type ServerVoiceHealth,
} from "../lib/voice/server-providers";
import { EMPTY_MANIFEST, type TTSCacheManifest } from "../lib/voice/tts-cache";
import { detectXRSupport, type XRSupport } from "../lib/xr/support";

/**
 * Live-Funkcheck auf der Startseite — probt dieselben Quellen wie die
 * Voice-Factory (Health-Route, TTS-Cache-Manifest, WebXR, RAG-Korpus) und
 * sagt ehrlich, welche Stufe der Offline-Kette gerade trägt. Jede Zeile
 * bleibt grün benutzbar: Ausfall heißt Fallback, nie Stillstand.
 */
export function SystemStatus() {
  const [health, setHealth] = useState<ServerVoiceHealth | null | "probing">(
    "probing",
  );
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const [xr, setXr] = useState<XRSupport | null>(null);

  const corpusCount = getDemoCorpus().length;

  useEffect(() => {
    let on = true;
    void (async () => {
      const [h, manifest, support] = await Promise.all([
        probeServerVoice(),
        fetch("/tts-cache/manifest.json", { cache: "no-store" })
          .then((r) =>
            r.ok ? (r.json() as Promise<TTSCacheManifest>) : EMPTY_MANIFEST,
          )
          .catch(() => EMPTY_MANIFEST),
        detectXRSupport(),
      ]);
      if (!on) return;
      setHealth(h);
      setCacheCount(Object.keys(manifest.entries ?? {}).length);
      setXr(support);
    })();
    return () => {
      on = false;
    };
  }, []);

  const probing = health === "probing";
  const h = probing ? null : health;

  const rows: Array<{ label: string; on: boolean; detail: string }> = [
    {
      label: "Wissenskorpus",
      on: true,
      detail: `${corpusCount} Fachdokumente · lokal im Browser, läuft immer`,
    },
    {
      label: "Antwort-Hirn",
      on: true,
      detail: probing
        ? "prüfe Server …"
        : h?.ok
          ? h.answer === "template"
            ? "Server erreichbar · Template-Antworten aus dem Korpus"
            : `Server erreichbar · ${h.answer} antwortet live`
          : "offline · lokales Template aus dem Korpus übernimmt",
    },
    {
      label: "Stimme",
      on: !probing && ((cacheCount ?? 0) > 0 || h?.tts === true),
      detail: probing
        ? "prüfe Cache …"
        : (cacheCount ?? 0) > 0
          ? `${cacheCount} Antworten offline vorvertont${h?.tts ? " · Server-TTS zusätzlich live" : ""}`
          : h?.tts
            ? "Server-TTS live"
            : "kein Audio · Antworten kommen als Text",
    },
    {
      label: "WebXR",
      on: xr ? xr.ar || xr.vr : false,
      detail: !xr
        ? "prüfe Headset-Support …"
        : xr.ar || xr.vr
          ? `bereit: ${[xr.ar ? "AR" : null, xr.vr ? "VR" : null].filter(Boolean).join(" + ")}`
          : "dieser Browser kann kein XR · 3D-Werkstatt läuft trotzdem",
    },
  ];

  return (
    <div className="cc-card cc-card--gray cc-card--flat" data-testid="system-status">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <span className="cc-kicker">Systemcheck — live</span>
        <span className="cc-muted" style={{ fontSize: "0.72rem" }}>
          Offline-Kette: Cache → Server → Text. Die Demo bricht nie.
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {rows.map((r) => (
          <div key={r.label} className="cc-status">
            <span
              className={`cc-status-dot${r.on ? " cc-status-dot--on" : ""}`}
              aria-hidden="true"
            />
            <span>
              {r.label}
              <span
                className="cc-muted"
                style={{ display: "block", fontWeight: 400, fontSize: "0.74rem" }}
              >
                {r.detail}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
