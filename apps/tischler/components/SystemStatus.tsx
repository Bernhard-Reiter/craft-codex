"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("common.systemStatus");
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
      label: t("corpus.label"),
      on: true,
      detail: t("corpus.detail", { count: corpusCount }),
    },
    {
      label: t("brain.label"),
      on: true,
      detail: probing
        ? t("brain.probing")
        : h?.ok
          ? h.answer === "template"
            ? t("brain.template")
            : t("brain.live", { provider: h.answer })
          : t("brain.offline"),
    },
    {
      label: t("voice.label"),
      on: !probing && ((cacheCount ?? 0) > 0 || h?.tts === true),
      detail: probing
        ? t("voice.probing")
        : (cacheCount ?? 0) > 0
          ? t(h?.tts ? "voice.cachedLive" : "voice.cached", {
              count: cacheCount ?? 0,
            })
          : h?.tts
            ? t("voice.serverOnly")
            : t("voice.none"),
    },
    {
      label: t("xr.label"),
      on: xr ? xr.ar || xr.vr : false,
      detail: !xr
        ? t("xr.probing")
        : xr.ar || xr.vr
          ? t("xr.ready", {
              modes: [xr.ar ? "AR" : null, xr.vr ? "VR" : null]
                .filter(Boolean)
                .join(" + "),
            })
          : t("xr.none"),
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
        <span className="cc-kicker">{t("kicker")}</span>
        <span className="cc-muted" style={{ fontSize: "0.72rem" }}>
          {t("offlineChain")}
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
