"use client";

import type { ModeId, ModeManager } from "@voai/lehrlings-core";

interface SurfaceModeBarProps {
  manager: ModeManager;
  activeId: ModeId | null;
  onSwitch: (id: ModeId) => void;
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
}: SurfaceModeBarProps) {
  const modes = manager.list();

  return (
    <div
      role="tablist"
      aria-label="Master-Surface Modes"
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        flexWrap: "wrap",
      }}
    >
      {modes.length === 0 ? (
        <span
          style={{
            color: "var(--color-muted)",
            fontSize: "0.85rem",
            padding: "0.5rem",
          }}
        >
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                border: `1px solid ${
                  isActive ? "var(--color-accent)" : "var(--color-border)"
                }`,
                borderRadius: 6,
                background: isActive ? "var(--color-accent)" : "transparent",
                color: isActive ? "#0b0d10" : "var(--color-fg)",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
              }}
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
