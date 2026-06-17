"use client";

import type { ModeId, ModeManager } from "@craft-codex/core";

interface SurfaceModeBarProps {
  manager: ModeManager;
  activeId: ModeId | null;
  onSwitch: (id: ModeId) => void;
  /** Modes, die in der Bar NICHT gezeigt werden (z.B. noch ohne Inhalt). */
  hideIds?: ReadonlyArray<ModeId>;
}

/**
 * Tab-Bar fuer Master-Surface Modes (Tafel/CAD/Video).
 *
 * Zeigt Icon + Label aus dem registrierten ModeManager. Active mode visuell
 * hervorgehoben (analog zu DovetailStep ModeBar). Logikfreier presentational
 * Component — Switch + Lifecycle wird vom Caller (page.tsx) verwaltet.
 */
export function SurfaceModeBar({
  manager,
  activeId,
  onSwitch,
  hideIds,
}: SurfaceModeBarProps) {
  const modes = manager
    .list()
    .filter((m) => !hideIds?.includes(m.id));

  return (
    <div role="tablist" aria-label="Master-Surface Modes" className="cc-tabbar">
      {modes.length === 0 ? (
        <span className="cc-muted" style={{ fontSize: "0.85rem" }}>
          Keine Modes registriert.
        </span>
      ) : (
        modes.map((m) => {
          const isActive = m.id === activeId;
          return (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              data-mode-id={m.id}
              onClick={() => onSwitch(m.id)}
              className="cc-tab"
            >
              <span aria-hidden="true">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })
      )}
    </div>
  );
}
