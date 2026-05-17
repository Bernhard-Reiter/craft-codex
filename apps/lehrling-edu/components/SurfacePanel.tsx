"use client";

import type { ModeId, ModeManager } from "@voai/lehrlings-core";
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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "1rem",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        minHeight: 120,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.95rem",
          fontWeight: 600,
        }}
      >
        {meta ? (
          <>
            <span aria-hidden="true">{meta.icon}</span>
            <span>{meta.label}</span>
          </>
        ) : (
          <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>
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
      <div
        style={{
          color: "var(--color-muted)",
          fontSize: "0.85rem",
          lineHeight: 1.5,
        }}
      >
        Waehle einen Mode oben (Tafel / CAD / Video) um zu starten.
      </div>
    );
  }

  if (activeId === "tafel" && active instanceof TafelMode) {
    return (
      <div
        data-mode-active={meta.id}
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0.5rem",
          background: "var(--color-bg)",
          borderRadius: 6,
        }}
      >
        <TafelCanvas mode={active} width={640} height={360} />
      </div>
    );
  }

  if (activeId === "cad" && active instanceof CADMode) {
    return (
      <div
        data-mode-active={meta.id}
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0.5rem",
          background: "var(--color-bg)",
          borderRadius: 6,
        }}
      >
        <CADViewer mode={active} width={640} height={360} />
      </div>
    );
  }

  if (activeId === "video" && active instanceof VideoMode) {
    return (
      <div
        data-mode-active={meta.id}
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0.5rem",
          background: "var(--color-bg)",
          borderRadius: 6,
        }}
      >
        <VideoPlayer mode={active} width={640} height={360} />
      </div>
    );
  }

  return (
    <div
      style={{
        color: "var(--color-muted)",
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}
    >
      <span data-mode-stub={meta.id}>
        [{meta.label}-Mode active — UI-Wiring folgt.]
      </span>
    </div>
  );
}
