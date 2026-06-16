"use client";

import type { DovetailStep } from "@craft-codex/core";

// "Überblick" = Schritt 0 (mit •), die fünf Handschritte tragen 1–5.
const STEPS: Array<{ id: DovetailStep; label: string; mark: string }> = [
  { id: "ueberblick", label: "Überblick", mark: "•" },
  { id: "anreissen", label: "Anreißen", mark: "1" },
  { id: "saegen", label: "Sägen", mark: "2" },
  { id: "stemmen", label: "Stemmen", mark: "3" },
  { id: "passen", label: "Passen", mark: "4" },
  { id: "pruefen", label: "Prüfen", mark: "5" },
];

interface ModeBarProps {
  active: DovetailStep;
  onChange: (step: DovetailStep) => void;
}

export function ModeBar({ active, onChange }: ModeBarProps) {
  return (
    <div role="tablist" className="cc-tabbar" aria-label="Lernschritte">
      {STEPS.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(s.id)}
            className="cc-tab"
          >
            <span className="cc-tab-step" aria-hidden="true">
              {s.mark}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
