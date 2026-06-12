"use client";

import type { ModeId, ModeManager } from "@craft-codex/core";
import { TafelMode } from "../lib/surface-modes/tafel";
import { CADMode } from "../lib/surface-modes/cad";
import { VideoMode } from "../lib/surface-modes/video";
import { TafelCanvas } from "./TafelCanvas";
import { CADViewer } from "./CADViewer";
import { VideoPlayer } from "./VideoPlayer";

interface SurfacePanelProps {
  manager: ModeManager;
  activeId: ModeId | null;
}

/**
 * Container fuer den aktiven Master-Surface Mode.
 *
 * Tafel: rendert TafelCanvas (perfect-freehand drawing) wenn aktiv.
 * CAD: rendert CADViewer (GLTFLoader + OrbitControls) wenn aktiv.
 * Video: rendert VideoPlayer (hls.js + nativer MP4-Fallback) wenn aktiv.
 *
 * Lifecycle (activate/dispose) wird vom Caller via ModeManager verwaltet.
 */
export function SurfacePanel({ manager, activeId }: SurfacePanelProps) {
  const meta = activeId
    ? manager.list().find((m) => m.id === activeId) ?? null
    : null;
  const active = manager.getActive();

  return (
    <div
      data-testid="surface-panel"
      className="cc-card cc-card--flat"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        minHeight: 120,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {meta ? (
          <>
            <span aria-hidden="true">{meta.icon}</span>
            <span>{meta.label}</span>
          </>
        ) : (
          <span className="cc-muted" style={{ fontWeight: 400, textTransform: "none" }}>
            Kein Mode aktiv
          </span>
        )}
      </header>
      <ActiveModeBody activeId={activeId} active={active} meta={meta} />
    </div>
  );
}

function ActiveModeBody({
  activeId,
  active,
  meta,
}: {
  activeId: ModeId | null;
  active: ReturnType<ModeManager["getActive"]>;
  meta: { id: ModeId; label: string; icon: string } | null;
}) {
  if (!meta) {
    return (
      <div className="cc-muted" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
        Wähle einen Mode oben (Tafel / CAD / Video) um zu starten.
      </div>
    );
  }

  if (activeId === "tafel" && active instanceof TafelMode) {
    return (
      <div data-mode-active={meta.id} className="cc-stage" style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}>
        <TafelCanvas mode={active} width={640} height={360} />
      </div>
    );
  }

  if (activeId === "cad" && active instanceof CADMode) {
    return (
      <div data-mode-active={meta.id} className="cc-stage" style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}>
        <CADViewer mode={active} width={640} height={360} />
      </div>
    );
  }

  if (activeId === "video" && active instanceof VideoMode) {
    return (
      <div data-mode-active={meta.id} className="cc-stage" style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}>
        <VideoPlayer mode={active} width={640} height={360} />
      </div>
    );
  }

  return (
    <div className="cc-muted" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
      <span data-mode-stub={meta.id}>
        [{meta.label}-Mode active — UI-Wiring folgt.]
      </span>
    </div>
  );
}
