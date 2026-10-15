"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  exportiereProtokoll,
  istOptIn,
  ladeEintraege,
  loescheProtokoll,
  setzeOptIn,
  type Ablage,
} from "../../lib/zinken/protokoll";

/** Browser-Ablage; wirft in gesperrten Kontexten — das fängt protokoll.ts ab. */
export function browserAblage(): Ablage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function LernProtokollPanel({ version }: { version: number }) {
  const t = useTranslations("zinken.protokoll");
  const [an, setAn] = useState(false);
  const [anzahl, setAnzahl] = useState(0);

  useEffect(() => {
    const a = browserAblage();
    if (!a) return;
    setAn(istOptIn(a));
    setAnzahl(ladeEintraege(a).length);
  }, [version]);

  const umschalten = () => {
    const a = browserAblage();
    if (!a) return;
    setzeOptIn(a, !an);
    setAn(istOptIn(a));
    setAnzahl(ladeEintraege(a).length);
  };

  const exportieren = () => {
    const a = browserAblage();
    if (!a) return;
    const blob = new Blob([exportiereProtokoll(a)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zinken-lernprotokoll.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="cc-card cc-card--flat" data-testid="lern-protokoll">
      <h3 className="cc-kicker" style={{ marginBottom: "0.5rem" }}>{t("titel")}</h3>
      <p style={{ fontSize: "0.85rem" }}>{t("erklaerung")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.7rem", alignItems: "center" }}>
        <button type="button" className={`cc-btn cc-btn--sm${an ? "" : " cc-btn--dark"}`} aria-pressed={an} onClick={umschalten}>
          {an ? t("aus") : t("an")}
        </button>
        {an && (
          <>
            <span className="cc-muted" style={{ fontSize: "0.82rem" }}>{t("anzahl", { n: anzahl })}</span>
            <button type="button" className="cc-btn cc-btn--sm" onClick={exportieren} disabled={anzahl === 0}>{t("export")}</button>
            <button type="button" className="cc-btn cc-btn--sm" onClick={() => { const a = browserAblage(); if (a) { loescheProtokoll(a); setAnzahl(0); } }} disabled={anzahl === 0}>
              {t("loeschen")}
            </button>
          </>
        )}
      </div>
      <p className="cc-muted" style={{ fontSize: "0.78rem", marginTop: "0.6rem" }}>{t("studie")}</p>
    </section>
  );
}
