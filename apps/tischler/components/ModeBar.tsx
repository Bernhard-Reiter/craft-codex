"use client";

import { useTranslations } from "next-intl";
import type { DovetailStep } from "@craft-codex/core";

// "Überblick" = Schritt 0 (mit •), die fünf Handschritte tragen 1–5.
const STEPS: Array<{ id: DovetailStep; mark: string }> = [
  { id: "ueberblick", mark: "•" },
  { id: "anreissen", mark: "1" },
  { id: "saegen", mark: "2" },
  { id: "stemmen", mark: "3" },
  { id: "passen", mark: "4" },
  { id: "pruefen", mark: "5" },
];

interface ModeBarProps {
  active: DovetailStep;
  onChange: (step: DovetailStep) => void;
}

export function ModeBar({ active, onChange }: ModeBarProps) {
  const t = useTranslations("dovetail.modeBar");
  return (
    <div role="group" className="cc-tabbar" aria-label={t("aria")}>
      {STEPS.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(s.id)}
            className="cc-tab"
          >
            <span className="cc-tab-step" aria-hidden="true">
              {s.mark}
            </span>
            {t(`steps.${s.id}`)}
          </button>
        );
      })}
    </div>
  );
}
