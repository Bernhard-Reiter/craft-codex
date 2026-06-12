"use client";

import type { DovetailStep } from "@craft-codex/core";

const STEPS: Array<{ id: DovetailStep; label: string }> = [
  { id: "anreissen", label: "Anreißen" },
  { id: "saegen", label: "Sägen" },
  { id: "stemmen", label: "Stemmen" },
  { id: "passen", label: "Passen" },
  { id: "pruefen", label: "Prüfen" },
];

interface ModeBarProps {
  active: DovetailStep;
  onChange: (step: DovetailStep) => void;
}

export function ModeBar({ active, onChange }: ModeBarProps) {
  return (
    <div role="tablist" className="cc-tabbar" aria-label="Lernschritte">
      {STEPS.map((s, i) => {
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
              {i + 1}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
