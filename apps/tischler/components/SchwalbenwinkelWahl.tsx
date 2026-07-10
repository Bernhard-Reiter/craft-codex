"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Schwalbenwinkel-Auswahl: 1:6 ODER 1:8 — und der Unterschied erklärt.
 *
 * Bewusst KEINE dogmatische Hart-/Weichholz-Regel (Tradition unterscheidet
 * sich; das legt der Meister fest). Stattdessen: der Lernende WÄHLT den Winkel,
 * SIEHT ihn am Zinken und liest, was der Unterschied bedeutet.
 */

type Ratio = 6 | 8;

const W = 220;
const H = 170;
const TOP_Y = 28;
const BOT_Y = 138;
const HALF = 26; // halbe Breite an der schmalen (oberen) Seite
const CX = W / 2;

// Aufweitung sichtbar skaliert: 1:6 (steiler) flarred stärker als 1:8 (feiner).
function flareFor(ratio: Ratio): number {
  return ((BOT_Y - TOP_Y) / ratio) * 1.9;
}

export function SchwalbenwinkelWahl() {
  const t = useTranslations("learn.anglePicker");
  const [ratio, setRatio] = useState<Ratio>(6);
  const flare = flareFor(ratio);
  const deg = t(`ratios.${ratio}.deg`);

  const tail = [
    `${CX - HALF},${TOP_Y}`,
    `${CX + HALF},${TOP_Y}`,
    `${CX + HALF + flare},${BOT_Y}`,
    `${CX - HALF - flare},${BOT_Y}`,
  ].join(" ");

  return (
    <div
      className="cc-stack-sm"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 200px) 1fr",
        gap: "clamp(1rem, 3vw, 2rem)",
        alignItems: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t("svgLabel", { ratio, deg })}
        style={{ width: "100%", maxWidth: 200 }}
      >
        {/* Hirnholz-Grundlinie */}
        <line
          x1="6"
          y1={BOT_Y}
          x2={W - 6}
          y2={BOT_Y}
          stroke="var(--cc-hair)"
          strokeWidth="2"
        />
        {/* senkrechte Referenz (gerade Kante) */}
        <line
          x1={CX - HALF}
          y1={TOP_Y}
          x2={CX - HALF}
          y2={BOT_Y}
          stroke="var(--cc-hair)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {/* der Zinken im gewählten Winkel */}
        <polygon
          points={tail}
          fill="var(--cc-yellow)"
          stroke="var(--cc-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={{ transition: "all 200ms ease" }}
        />
        <text
          x={CX}
          y={TOP_Y - 10}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="14"
          fill="var(--cc-ink)"
        >
          1:{ratio} · {deg}
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }} role="group" aria-label={t("groupLabel")}>
          {([6, 8] as Ratio[]).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === ratio}
              className="cc-tab"
              onClick={() => setRatio(r)}
            >
              1:{r} {r === 6 ? t("steeper") : t("finer")}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
          {t(`ratios.${ratio}.title`)}
        </p>
        <p className="cc-muted" style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55 }}>
          {t(`ratios.${ratio}.text`)}
        </p>
        <p className="cc-note" style={{ marginTop: "0.25rem" }}>
          {t.rich("note", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
    </div>
  );
}
