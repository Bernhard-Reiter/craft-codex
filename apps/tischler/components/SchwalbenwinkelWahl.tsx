"use client";

import { useState } from "react";

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

const INFO: Record<Ratio, { grad: string; titel: string; text: string }> = {
  6: {
    grad: "≈ 9,5°",
    titel: "1:6 — der steilere Winkel",
    text: "Die Schwalben verhaken kräftiger — mehr mechanischer Halt. Die Zinkenspitzen sind robuster. Klassisch für gröbere Arbeiten.",
  },
  8: {
    grad: "≈ 7°",
    titel: "1:8 — der feinere Winkel",
    text: "Wirkt eleganter und filigraner. Beliebt für feine Möbel. Ein noch steilerer Winkel würde an den Spitzen kurzes Hirnholz ergeben, das ausbricht.",
  },
};

export function SchwalbenwinkelWahl() {
  const [ratio, setRatio] = useState<Ratio>(6);
  const flare = flareFor(ratio);
  const info = INFO[ratio];

  const tail = [
    `${CX - HALF},${TOP_Y}`,
    `${CX + HALF},${TOP_Y}`,
    `${CX + HALF + flare},${BOT_Y}`,
    `${CX - HALF - flare},${BOT_Y}`,
  ].join(" ");

  return (
    <div
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
        aria-label={`Schwalbenschwanz im Verhältnis 1 zu ${ratio}`}
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
          1:{ratio} · {info.grad}
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }} role="tablist" aria-label="Schwalbenwinkel">
          {([6, 8] as Ratio[]).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={r === ratio}
              className="cc-tab"
              onClick={() => setRatio(r)}
            >
              1:{r} {r === 6 ? "steiler" : "feiner"}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
          {info.titel}
        </p>
        <p className="cc-muted" style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55 }}>
          {info.text}
        </p>
        <p className="cc-note" style={{ marginTop: "0.25rem" }}>
          <strong>Der Unterschied:</strong> Beide halten fest. 1:6 ist steiler
          und verriegelt kräftiger, 1:8 ist flacher und sieht feiner aus. Welches
          Verhältnis zu welchem Holz gehört, ist Sache der Werkstatt-Tradition —
          das legt dein Meister fest.
        </p>
      </div>
    </div>
  );
}
