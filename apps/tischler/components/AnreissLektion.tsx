"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { IRAGProvider, ITopicGuard, DovetailParams } from "@craft-codex/core";
import {
  buildAnreissFlow,
  istLinieSichtbar,
} from "../lib/zinken/anreiss-flow";
import { DovetailSceneContents } from "./DovetailScene";
import { WerkzeugAmBrett } from "./WerkzeugAmBrett";
import { VoiceConsole } from "./VoiceConsole";
import type { VoiceProviderBundle } from "../lib/voice/factory";

// Startwerte wie im Lehrbuch-Beispiel (Bernhard: 140 breit, 13 tief, ~200 lang).
const START = { width_mm: 140, thickness_mm: 13, length_mm: 200 };

interface AnreissLektionProps {
  rag: IRAGProvider;
  guard: ITopicGuard;
  voiceBundle: VoiceProviderBundle | null;
}

/**
 * Gefuehrter Anreiss-Modus fuer /lernen.
 *
 * Links die virtuelle Tafel (der Meister schreibt die Formeln an), rechts das
 * 3D-Brett, an dem dieselbe Teilung Schritt fuer Schritt als progressive
 * Anrisslinie erscheint. Brettmasse live einstellbar; der Lehrling klickt sich
 * durch die 7 Phasen und darf jederzeit nachfragen.
 */
export function AnreissLektion({ rag, guard, voiceBundle }: AnreissLektionProps) {
  const [maße, setMaße] = useState(START);
  const [i, setI] = useState(0);
  const [zeigeWerkzeug, setZeigeWerkzeug] = useState(true);
  // Reset-Handle der OrbitControls — bringt die Ansicht zurueck ins Zentrum,
  // falls man das Brett weggezoomt hat.
  const controlsRef = useRef<{ reset: () => void } | null>(null);

  const flow = useMemo(
    () => buildAnreissFlow(maße.width_mm, maße.thickness_mm),
    [maße.width_mm, maße.thickness_mm],
  );
  const schritt = flow.schritte[Math.min(i, flow.schritte.length - 1)]!;
  const layout = flow.layout;

  // Das 3D-Brett zeigt die BERECHNETE Lehrbuch-Teilung: pinCount = AZS.
  const params: DovetailParams = useMemo(
    () => ({
      thickness_mm: maße.thickness_mm,
      width_mm: maße.width_mm,
      length_mm: maße.length_mm,
      pinCount: layout.AZS,
      ratio: layout.slopeRatio,
      distribution: "uniform",
    }),
    [maße, layout.AZS, layout.slopeRatio],
  );

  const markingFilter = useMemo(
    () => (id: string) => istLinieSichtbar(schritt, id),
    [schritt],
  );

  const atStart = i === 0;
  const atEnd = i >= flow.schritte.length - 1;

  return (
    <section className="cc-card" style={{ display: "grid", gap: "1rem" }}>
      <div>
        <p className="cc-kicker">Geführtes Anreißen</p>
        <h2 style={{ margin: "0.3rem 0 0.2rem", textTransform: "uppercase" }}>
          Der Meister reißt <span className="cc-mark">am Brett</span> an
        </h2>
        <p className="cc-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Stell die Brettmaße ein — links rechnet der Meister an der Tafel, rechts
          erscheint dieselbe Teilung am Brett. Schritt für Schritt, Fragen jederzeit.
        </p>
      </div>

      {/* ── Brettmaße-Einsteller ───────────────────────────────── */}
      <div
        className="cc-card cc-card--gray cc-card--flat"
        style={{ display: "grid", gap: "0.7rem", padding: "0.8rem 1rem" }}
      >
        <MaßSlider
          label="Breite B"
          value={maße.width_mm}
          min={80}
          max={300}
          onChange={(v) => setMaße((m) => ({ ...m, width_mm: v }))}
        />
        <MaßSlider
          label="Dicke D"
          value={maße.thickness_mm}
          min={8}
          max={40}
          onChange={(v) => setMaße((m) => ({ ...m, thickness_mm: v }))}
        />
        <MaßSlider
          label="Länge L"
          value={maße.length_mm}
          min={120}
          max={400}
          onChange={(v) => setMaße((m) => ({ ...m, length_mm: v }))}
        />
        <p className="cc-muted" style={{ margin: 0, fontSize: "0.78rem" }}>
          Ergibt nach Lehrbuch:{" "}
          <strong>{layout.AZS} Schwalben</strong> · {layout.AZT} Teile à{" "}
          {layout.T.toFixed(1).replace(".", ",")} mm · Schräge 1:{layout.slopeRatio}
        </p>
      </div>

      {/* ── Split: Tafel  |  Brett ─────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)",
          gap: "1rem",
        }}
      >
        {/* Virtuelle Tafel */}
        <div
          style={{
            background: "#1f2a24",
            border: "6px solid #6b4a2f",
            borderRadius: 10,
            padding: "1.1rem 1.2rem",
            minHeight: 230,
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#9fc7b0",
            }}
          >
            Tafel · Schritt {i + 1}/{flow.schritte.length} — {schritt.label}
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "#f4f1e8",
            }}
          >
            {schritt.tafel.length > 0 ? (
              schritt.tafel.map((zeile, k) => <div key={k}>{zeile}</div>)
            ) : (
              <div style={{ color: "#9fc7b0" }}>— am Brett zeigen —</div>
            )}
          </div>
          {schritt.kennzahl && (
            <div
              style={{
                marginTop: "auto",
                alignSelf: "flex-start",
                background: "#ffed00",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "0.25rem 0.7rem",
                borderRadius: 4,
              }}
            >
              {schritt.kennzahl}
            </div>
          )}
        </div>

        {/* 3D-Brett mit progressiven Anrisslinien */}
        <div
          className="cc-stage"
          style={{ height: 280, minHeight: 230, position: "relative" }}
        >
          <button
            type="button"
            onClick={() => controlsRef.current?.reset()}
            className="cc-btn cc-btn--sm"
            style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
            title="Brett wieder zentrieren"
          >
            🎯 Zentrieren
          </button>
          <Canvas
            shadows
            camera={{ position: [0.16, 0.22, 0.28], fov: 45 }}
            style={{ width: "100%", height: "100%", background: "#0a0a0a" }}
          >
            <DovetailSceneContents
              params={params}
              step="anreissen"
              markingStyle="line"
              markingFilter={markingFilter}
              withOrbitControls={false}
            />
            {zeigeWerkzeug && (
              <WerkzeugAmBrett phase={schritt.id} params={params} layout={layout} />
            )}
            {/* Eigene Controls: Pan AUS (Brett bleibt zentriert), Zoom gedeckelt,
                Reset-Handle fuer den Zentrieren-Button. */}
            <OrbitControls
              ref={controlsRef as never}
              makeDefault
              target={[0, 0, 0]}
              enablePan={false}
              enableZoom
              minDistance={0.12}
              maxDistance={0.7}
            />
          </Canvas>
        </div>
      </div>

      {/* ── Meister spricht + Navigation ───────────────────────── */}
      <div
        className="cc-card cc-card--flat"
        style={{ display: "grid", gap: "0.7rem", padding: "0.9rem 1rem" }}
      >
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          <strong>Meister:</strong> {schritt.meisterSagt}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="cc-btn cc-btn--sm"
            disabled={atStart}
            onClick={() => setI((x) => Math.max(0, x - 1))}
          >
            ◀ Zurück
          </button>
          <span className="cc-muted" style={{ fontSize: "0.8rem" }}>
            Schritt {i + 1} / {flow.schritte.length}
          </span>
          <button
            type="button"
            className="cc-btn cc-btn--primary cc-btn--sm"
            disabled={atEnd}
            onClick={() => setI((x) => Math.min(flow.schritte.length - 1, x + 1))}
          >
            {atEnd ? "Fertig" : "Weiter ▶"}
          </button>
          {!atStart && (
            <button
              type="button"
              className="cc-chip"
              onClick={() => setI(0)}
            >
              ↺ von vorne
            </button>
          )}
          <button
            type="button"
            className="cc-chip"
            onClick={() => setZeigeWerkzeug((w) => !w)}
            style={{ marginLeft: "auto" }}
          >
            🔧 Werkzeug {zeigeWerkzeug ? "aus" : "an"}
          </button>
        </div>
      </div>

      {/* ── Nachfragen jederzeit (Voice-Coach) ─────────────────── */}
      <div>
        <p className="cc-muted" style={{ fontSize: "0.8rem", margin: "0 0 0.4rem" }}>
          Etwas unklar? Frag den Meister — er kennt die Konstruktionsregeln.
        </p>
        <VoiceConsole
          rag={rag}
          guard={guard}
          tts={voiceBundle?.tts}
          answer={voiceBundle?.answer}
          sampleQueries={[
            "Warum steht in der Schwalbenformel die Zahl 1,7",
            "Was ist die Randzinkenverstaerkung",
            "Darf man Laengsholz mit Querholz verleimen",
          ]}
        />
      </div>
    </section>
  );
}

function MaßSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "5.5rem 1fr 4rem", gap: "0.7rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
      <span className="cc-mono" style={{ fontSize: "0.85rem", textAlign: "right" }}>
        {value} mm
      </span>
    </label>
  );
}
