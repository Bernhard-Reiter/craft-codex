import type { DovetailStep } from "@craft-codex/core";
import { getLektion } from "../lib/zinken/lektion";
import { getLektionEn } from "../lib/zinken/lektion.en";

/**
 * Meister-Text zum aktuellen Handschritt auf /dovetail — wörtlich aus der
 * geführten Lektion (lib/zinken/lektion.ts bzw. .en.ts), damit der Lehrling
 * neben der Szene liest, was in diesem Schritt zu tun ist. Der Überblick hat
 * seine eigene Karte und zeigt hier nichts.
 */
export function SchrittText({
  step,
  locale,
}: {
  step: DovetailStep;
  locale: "de" | "en";
}) {
  if (step === "ueberblick") return null;
  const lektion = locale === "en" ? getLektionEn() : getLektion();
  const beat = lektion.find((b) => b.step === step);
  if (!beat) return null;
  return (
    <section className="cc-card cc-card--flat" aria-live="polite">
      <p className="cc-kicker" style={{ marginBottom: "0.6rem" }}>
        {beat.titel}
      </p>
      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
        {beat.meisterSays}
      </p>
    </section>
  );
}
