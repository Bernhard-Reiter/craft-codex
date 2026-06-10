"use client";

import { useState } from "react";

/**
 * Demo-Reset: wischt ALLE craft-codex localStorage-Keys (Session, Progress,
 * Modes, Placements) und laedt neu — der naechste Vorfuehr-Durchlauf startet
 * jungfraeulich. 2-Klick-Bestaetigung, kein window.confirm (blockt WebXR).
 */
export function DemoResetButton() {
  const [armed, setArmed] = useState(false);

  const reset = () => {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("craft-codex:")) doomed.push(key);
      }
      for (const key of doomed) window.localStorage.removeItem(key);
    } finally {
      window.location.reload();
    }
  };

  return armed ? (
    <button
      type="button"
      onClick={reset}
      style={{
        fontSize: "0.75rem",
        padding: "0.35rem 0.7rem",
        background: "rgba(255, 107, 107, 0.15)",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 107, 107, 0.5)",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      Wirklich zuruecksetzen? (loescht Fortschritt + Platzierungen)
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setArmed(true)}
      style={{
        fontSize: "0.75rem",
        padding: "0.35rem 0.7rem",
        background: "transparent",
        color: "var(--color-muted)",
        border: "1px solid var(--color-border)",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      ↺ Demo zuruecksetzen
    </button>
  );
}
