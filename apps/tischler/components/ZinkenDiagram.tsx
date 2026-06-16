"use client";

import { useId, useState } from "react";

/**
 * ZinkenDiagram — robustes 2D-SVG der Schwalbenschwanz-Verbindung mit einem
 * "auseinander ↔ zusammen"-Regler. Bewusst KEIN WebGL: das funktioniert in
 * jedem Browser, auf jedem Beamer, ohne Treiber — pitch-sicher. Der Laie
 * SIEHT, wie sich die keilförmigen Zinken verhaken.
 *
 * Stil = Pitch-Deck: Tinte-auf-Papier, Signal-Gelb, harte Kanten.
 */

const W = 560;
const H = 220;
const MID = 110; // Mittellinie, hier treffen sich die Zinken
const SEG = 80; // Segmentbreite (7 Segmente: 4 oben, 3 unten — s. *_INDICES)
const W_NARROW = 22; // halbe Breite an der schmalen Seite
const FLARE = 13; // Schwalbenschwanz-Aufweitung zur Spitze
const BODY_TOP = 46; // Unterkante oberer Brettkörper (zusammengefügt)
const BODY_BOT = 174; // Oberkante unterer Brettkörper (zusammengefügt)
const MAX_GAP = 52; // maximaler Abstand "auseinander"

function segCenter(i: number): number {
  return SEG / 2 + i * SEG;
}

/** Zinken vom OBEREN Brett: Spitze unten (breit), Basis oben (schmal). */
function topTail(i: number): string {
  const cx = segCenter(i);
  return [
    `${cx - W_NARROW},${BODY_TOP}`,
    `${cx + W_NARROW},${BODY_TOP}`,
    `${cx + W_NARROW + FLARE},${MID}`,
    `${cx - W_NARROW - FLARE},${MID}`,
  ].join(" ");
}

/** Zinken vom UNTEREN Brett: Spitze oben (breit), Basis unten (schmal). */
function bottomTail(i: number): string {
  const cx = segCenter(i);
  return [
    `${cx - W_NARROW - FLARE},${MID}`,
    `${cx + W_NARROW + FLARE},${MID}`,
    `${cx + W_NARROW},${BODY_BOT}`,
    `${cx - W_NARROW},${BODY_BOT}`,
  ].join(" ");
}

const TOP_INDICES = [0, 2, 4, 6];
const BOTTOM_INDICES = [1, 3, 5];

export function ZinkenDiagram({
  showLabels = true,
}: {
  showLabels?: boolean;
}) {
  // 100 = zusammengefügt (Ziel zeigen), 0 = ganz auseinander
  const [join, setJoin] = useState(100);
  const labelId = useId();
  const gap = (1 - join / 100) * MAX_GAP;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={labelId}
        style={{ width: "100%", maxWidth: 560, display: "block" }}
      >
        <title id={labelId}>
          Schwalbenschwanz-Verbindung — oberes und unteres Brett verzahnen sich
        </title>

        {/* OBERES BRETT (gelb) — Körper + Zinken, fährt nach oben beim Trennen */}
        <g transform={`translate(0 ${-gap})`}>
          <rect
            x="0"
            y="6"
            width={W}
            height={BODY_TOP - 6}
            fill="var(--cc-yellow)"
            stroke="var(--cc-ink)"
            strokeWidth="2.5"
          />
          {TOP_INDICES.map((i) => (
            <polygon
              key={`t${i}`}
              points={topTail(i)}
              fill="var(--cc-yellow)"
              stroke="var(--cc-ink)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* UNTERES BRETT (Papier) — Körper + Zinken, fährt nach unten */}
        <g transform={`translate(0 ${gap})`}>
          <rect
            x="0"
            y={BODY_BOT}
            width={W}
            height={H - BODY_BOT - 6}
            fill="var(--cc-paper-pure)"
            stroke="var(--cc-ink)"
            strokeWidth="2.5"
          />
          {BOTTOM_INDICES.map((i) => (
            <polygon
              key={`b${i}`}
              points={bottomTail(i)}
              fill="var(--cc-paper-pure)"
              stroke="var(--cc-ink)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {showLabels && gap > MAX_GAP * 0.45 && (
          <g
            fontFamily="ui-monospace, monospace"
            fontSize="12"
            fill="var(--cc-ink-soft)"
            letterSpacing="0.12em"
          >
            <text x="8" y="20">
              ZINKEN ▸ oberes Brett
            </text>
            <text x="8" y={H - 8}>
              SCHWALBEN ▸ unteres Brett
            </text>
          </g>
        )}
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="cc-btn cc-btn--sm"
          onClick={() => setJoin(0)}
          aria-pressed={join === 0}
        >
          ◀ Auseinander
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={join}
          onChange={(e) => setJoin(Number(e.target.value))}
          className="cc-range"
          aria-label="Verbindung auseinanderziehen oder zusammenfügen"
          style={{ flex: 1, minWidth: 120 }}
        />
        <button
          type="button"
          className="cc-btn cc-btn--primary cc-btn--sm"
          onClick={() => setJoin(100)}
          aria-pressed={join === 100}
        >
          Zusammenfügen ▶
        </button>
      </div>
      <p className="cc-mono cc-muted" style={{ margin: 0 }}>
        {join === 100
          ? "▸ Verriegelt: die keilförmigen Zinken halten ohne Leim."
          : join === 0
            ? "▸ Getrennt: jeder Zinken greift in die Lücke des anderen Bretts."
            : "▸ Schieb die Bretter zusammen …"}
      </p>
    </div>
  );
}
