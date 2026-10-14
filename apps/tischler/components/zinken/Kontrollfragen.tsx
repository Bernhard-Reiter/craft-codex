"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import type { Kontrollfrage } from "../../lib/zinken/lehrgang-typen";

/**
 * Kontrollfragen mit sofortiger Rückmeldung. Die Erklärung kommt bei
 * richtig UND falsch — Rückmeldung sagt, warum, nicht nur ob.
 */
export function Kontrollfragen({
  fragen,
  onAntwort,
}: {
  fragen: readonly Kontrollfrage[];
  onAntwort?: (frageId: string, richtig: boolean) => void;
}) {
  const t = useTranslations("zinken.fragen");
  const [gewaehlt, setGewaehlt] = useState<Record<string, number>>({});
  const id = useId();
  const beantwortet = fragen.filter((f) => gewaehlt[f.id] !== undefined);
  const richtig = beantwortet.filter((f) => gewaehlt[f.id] === f.richtig).length;

  return (
    <section aria-labelledby={`${id}-t`} data-testid="kontrollfragen">
      <h3 id={`${id}-t`} className="cc-kicker" style={{ marginBottom: "0.6rem" }}>
        {t("titel")}
        {beantwortet.length > 0 && (
          <span className="cc-muted" style={{ marginLeft: "0.6rem", fontWeight: 400 }}>
            {t("stand", { richtig, gesamt: fragen.length })}
          </span>
        )}
      </h3>
      <ol style={{ display: "grid", gap: "0.9rem", paddingLeft: "1.1rem", margin: 0 }}>
        {fragen.map((f) => {
          const wahl = gewaehlt[f.id];
          const fertig = wahl !== undefined;
          const ok = wahl === f.richtig;
          return (
            <li key={f.id}>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled={fertig}>
                <legend style={{ fontWeight: 600, marginBottom: "0.35rem" }}>{f.frage}</legend>
                {f.antworten.map((a, i) => (
                  <label key={i} style={{ display: "flex", gap: "0.45rem", alignItems: "baseline", fontSize: "0.9rem", padding: "0.15rem 0" }}>
                    <input
                      type="radio"
                      name={`${id}-${f.id}`}
                      checked={wahl === i}
                      onChange={() => {
                        setGewaehlt((g) => ({ ...g, [f.id]: i }));
                        onAntwort?.(f.id, i === f.richtig);
                      }}
                    />
                    {a}
                  </label>
                ))}
              </fieldset>
              {fertig && (
                <div role="status" style={{ marginTop: "0.35rem", fontSize: "0.88rem", borderLeft: `3px solid var(${ok ? "--cc-good" : "--cc-bad"})`, paddingLeft: "0.6rem" }}>
                  <strong>{ok ? t("richtig") : t("falsch")}</strong> {f.erklaerung}
                  {!ok && (
                    <div>
                      <button type="button" className="cc-btn cc-btn--sm" style={{ marginTop: "0.4rem" }}
                        onClick={() => setGewaehlt((g) => { const n = { ...g }; delete n[f.id]; return n; })}>
                        {t("nochmal")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
