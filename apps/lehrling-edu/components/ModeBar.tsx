"use client";

import type { DovetailStep } from "@voai/lehrlings-core";

const STEPS: Array<{ id: DovetailStep; label: string }> = [
  { id: "anreissen", label: "Anreissen" },
  { id: "saegen", label: "Saegen" },
  { id: "stemmen", label: "Stemmen" },
  { id: "passen", label: "Passen" },
  { id: "pruefen", label: "Pruefen" },
];

interface ModeBarProps {
  active: DovetailStep;
  onChange: (step: DovetailStep) => void;
}

export function ModeBar({ active, onChange }: ModeBarProps) {
  return (
    <div
      role="tablist"
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
      {STEPS.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(s.id)}
            style={{
              padding: "0.5rem 1rem",
              border: `1px solid ${
                isActive ? "var(--color-accent)" : "var(--color-border)"
              }`,
              borderRadius: 6,
              background: isActive ? "var(--color-accent)" : "transparent",
              color: isActive ? "#0b0d10" : "var(--color-fg)",
              fontSize: "0.9rem",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
