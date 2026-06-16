"use client";

import { Component, type ReactNode } from "react";

/**
 * SceneBoundary — DOM-level React Error Boundary um die WebGL-Bühne.
 *
 * Doktrin „die Demo bricht nie": ein WebGL-Context-Fehler (kein GPU,
 * blocklisted Treiber, schwacher Beamer-Laptop) oder ein Throw in der
 * Three-Geometrie darf NICHT den ganzen React-Tree zum weißen Screen
 * crashen. Stattdessen zeigt der Fallback eine ruhige 2D-Alternative.
 */
interface Props {
  children: ReactNode;
  fallback: ReactNode;
}
interface State {
  failed: boolean;
}

export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    // Nur server-seitig/Konsole loggen — kein Leak an den Nutzer.
    console.error("[SceneBoundary] 3D/WebGL render error:", error);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Ruhiger 2D-Fallback für die Bühne, wenn kein 3D/WebGL verfügbar ist. */
export function SceneFallback({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "1.5rem",
        textAlign: "center",
        color: "var(--cc-paper)",
      }}
    >
      <p
        className="cc-mono"
        style={{ margin: 0, opacity: 0.85, letterSpacing: "0.06em" }}
      >
        3D ist auf diesem Gerät nicht verfügbar — hier die Verbindung in 2D.
      </p>
      <div style={{ width: "min(90%, 420px)", background: "var(--cc-paper)", borderRadius: "var(--cc-radius)", padding: "1rem" }}>
        {children}
      </div>
    </div>
  );
}
