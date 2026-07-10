"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Demo-Reset: wischt ALLE craft-codex localStorage-Keys (Session, Progress,
 * Modes, Placements) und laedt neu — der naechste Vorfuehr-Durchlauf startet
 * jungfraeulich. 2-Klick-Bestaetigung, kein window.confirm (blockt WebXR).
 */
export function DemoResetButton() {
  const t = useTranslations("common.demoReset");
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
      className="cc-btn cc-btn--sm cc-btn--danger"
    >
      {t("confirm")}
    </button>
  ) : (
    <button type="button" onClick={() => setArmed(true)} className="cc-btn cc-btn--sm">
      {t("button")}
    </button>
  );
}
