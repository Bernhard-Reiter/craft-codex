"use client";

import { hirnholzStuecke, type ZinkenTeilung } from "@craft-codex/core";

/**
 * Eigene Zeichnung: Hirnholz des ZINKENBRETTS (Zinken zuerst) mit
 * Mittellinie, Teilungskette 1T/2T, Abfall getönt, Grundmaße und daneben
 * das Hilfsdreieck für die Schräge (1T auf ratio·T).
 *
 * Bewusst KEINE Nachzeichnung einer Buchabbildung: andere Ansicht
 * (Hirnholz statt Fläche), eigene Gestaltung. Alle Zahlen kommen aus
 * `zinkenTeilung` — die Zeichnung rechnet nichts selbst aus, sie projiziert.
 */
export interface ZinkenTeilungSvgLabels {
  titel: string;
  mittellinie: string;
  aussen: string;
  innen: string;
  abfall: string;
  hilfsdreieck: string;
}

const fmt = (n: number, d = 1) =>
  n.toLocaleString("de-AT", { minimumFractionDigits: d, maximumFractionDigits: d });

export function ZinkenTeilungSvg({
  teilung,
  labels,
  locale = "de",
}: {
  teilung: ZinkenTeilung;
  labels: ZinkenTeilungSvgLabels;
  locale?: "de" | "en";
}) {
  const { layout, segmente, hilfsdreieck, schraege } = teilung;
  const { B, D, T, slopeRatio } = layout;
  const num = (n: number, d = 1) =>
    locale === "en"
      ? n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })
      : fmt(n, d);

  // Zeichenraum in mm. Oben Platz für die Maßkette, rechts für das Dreieck.
  const padL = 14;
  const padTop = 26;
  const padBottom = 16;
  const triGap = 18;
  // Hilfsdreieck auf Brettdicke skaliert, damit es neben das Brett passt.
  const triH = Math.max(D, 18);
  const triScale = triH / hilfsdreieck.laenge;
  const triW = hilfsdreieck.versatz * triScale;
  const W = padL + B + triGap + Math.max(triW, 8) + 22;
  const H = padTop + D + padBottom;
  const x0 = padL;
  const y0 = padTop;
  const yMid = y0 + D / 2;

  // Zinken und Abfall kommen fertig aus dem Kern (eine Quelle für SVG/3D/AR).
  const stuecke = hirnholzStuecke(teilung).map((st) => ({
    id: st.id,
    art: st.art,
    pts: st.punkte.map(([x, z]) => [x0 + x, y0 + z] as [number, number]),
  }));
  const zinkenPolys = stuecke.filter((s) => s.art === "zinken");
  const abfallPolys = stuecke.filter((s) => s.art === "abfall");

  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const fs = Math.max(3.2, Math.min(5, B / 32));
  const triX = x0 + B + triGap;
  const triY = y0 + (D - triH) / 2;

  return (
    <svg
      viewBox={`0 0 ${W.toFixed(1)} ${H.toFixed(1)}`}
      role="img"
      aria-label={labels.titel}
      style={{ width: "100%", height: "auto", display: "block" }}
      data-testid="zinken-teilung-svg"
    >
      <title>{labels.titel}</title>
      <defs>
        <pattern id="zt-abfall" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="var(--cc-bad, #b4472f)" strokeWidth="0.6" />
        </pattern>
      </defs>

      {/* Hirnholz-Fläche */}
      <rect x={x0} y={y0} width={B} height={D} fill="var(--cc-paper, #f6f1e7)" stroke="var(--cc-ink, #1d1d1b)" strokeWidth="0.5" />

      {/* Abfall zwischen den Zinken */}
      {abfallPolys.map((p) => (
        <polygon key={p.id} points={poly(p.pts)} fill="url(#zt-abfall)" stroke="none" data-rolle="abfall" />
      ))}

      {/* Zinken */}
      {zinkenPolys.map((p) => (
        <polygon
          key={p.id}
          points={poly(p.pts)}
          fill="var(--cc-yellow, #2c4b7a)"
          fillOpacity="0.55"
          stroke="var(--cc-ink, #1d1d1b)"
          strokeWidth="0.45"
          data-rolle="zinken"
        />
      ))}

      {/* Mittellinie + Teilungspunkte */}
      <line x1={x0 - 4} y1={yMid} x2={x0 + B + 4} y2={yMid} stroke="var(--cc-ink-soft, #555)" strokeWidth="0.35" strokeDasharray="3 1.2 0.6 1.2" />
      {segmente.slice(1).map((s) => (
        <circle key={`p-${s.index}`} cx={x0 + s.von} cy={yMid} r="0.9" fill="var(--cc-ink, #1d1d1b)" />
      ))}
      <text x={x0 - 5} y={yMid + fs * 0.35} fontSize={fs * 0.8} textAnchor="end" fill="var(--cc-ink-soft, #555)">
        {labels.mittellinie}
      </text>

      {/* Maßkette 1T/2T oben */}
      {segmente.map((s) => {
        const xm = x0 + (s.von + s.bis) / 2;
        return (
          <g key={`m-${s.index}`}>
            <line x1={x0 + s.von} y1={y0 - 9} x2={x0 + s.von} y2={y0 - 2} stroke="var(--cc-ink-soft, #555)" strokeWidth="0.25" />
            <text x={xm} y={y0 - 4} fontSize={fs * 0.75} textAnchor="middle" fill="var(--cc-ink, #1d1d1b)">
              {s.art === "schwalbe" ? "2T" : "1T"}
            </text>
          </g>
        );
      })}
      <line x1={x0 + B} y1={y0 - 9} x2={x0 + B} y2={y0 - 2} stroke="var(--cc-ink-soft, #555)" strokeWidth="0.25" />
      {/* Gesamtmaß B */}
      <line x1={x0} y1={y0 - 16} x2={x0 + B} y2={y0 - 16} stroke="var(--cc-ink, #1d1d1b)" strokeWidth="0.3" />
      <text x={x0 + B / 2} y={y0 - 18} fontSize={fs} textAnchor="middle" fill="var(--cc-ink, #1d1d1b)">
        {`B = ${num(B, 0)} · AZT ${layout.AZT} · T = ${num(T)} mm`}
      </text>

      {/* Außen / Innen + D */}
      <text x={x0} y={y0 + D + fs * 1.3} fontSize={fs * 0.75} fill="var(--cc-ink-soft, #555)">
        {labels.innen}
      </text>
      <text x={x0 + B} y={y0 + D + fs * 1.3} fontSize={fs * 0.75} textAnchor="end" fill="var(--cc-ink-soft, #555)">
        {`${labels.abfall}: ▨`}
      </text>
      <text x={x0 - 5} y={y0 + fs * 0.3} fontSize={fs * 0.7} textAnchor="end" fill="var(--cc-ink-soft, #555)">
        {labels.aussen}
      </text>
      <text x={x0 - 5} y={y0 + D} fontSize={fs * 0.7} textAnchor="end" fill="var(--cc-ink-soft, #555)">
        {`D ${num(D, 0)}`}
      </text>

      {/* Hilfsdreieck 1T auf ratio·T */}
      <g data-testid="zinken-hilfsdreieck">
        <polygon
          points={poly([
            [triX, triY],
            [triX, triY + triH],
            [triX + triW, triY + triH],
          ])}
          fill="none"
          stroke="var(--cc-ink, #1d1d1b)"
          strokeWidth="0.4"
        />
        <text x={triX - 1.5} y={triY + triH / 2} fontSize={fs * 0.7} textAnchor="end" fill="var(--cc-ink, #1d1d1b)">
          {`${slopeRatio}T`}
        </text>
        <text x={triX + triW / 2} y={triY + triH + fs * 0.95} fontSize={fs * 0.7} textAnchor="middle" fill="var(--cc-ink, #1d1d1b)">
          1T
        </text>
        <text x={triX + triW + 2} y={triY + fs} fontSize={fs * 0.7} fill="var(--cc-ink, #1d1d1b)">
          {`1:${num(slopeRatio, slopeRatio % 1 ? 1 : 0)} ≈ ${num(schraege.grad)}°`}
        </text>
        <text x={triX + triW + 2} y={triY + fs * 2} fontSize={fs * 0.62} fill="var(--cc-ink-soft, #555)">
          {labels.hilfsdreieck}
        </text>
      </g>
    </svg>
  );
}
