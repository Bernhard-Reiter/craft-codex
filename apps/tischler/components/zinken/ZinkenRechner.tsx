"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  papierRechnung,
  type ZinkenEingabeFehler,
  type ZinkenTeilung,
} from "@craft-codex/core";

export interface RechnerEingabe {
  B: number;
  D: number;
  dichte: "dicht" | "weit";
  /** undefined = Vorschlag der Formel gilt. */
  azs: number | undefined;
  halbverdeckt: boolean;
}

/**
 * Rechner der Aufteilung. Zeigt nur an, was `zinkenTeilung` liefert —
 * gerundet wird ausschließlich in der Anzeige (auf 0,1 mm).
 */
export function ZinkenRechner({
  eingabe,
  onEingabe,
  teilung,
  fehler,
}: {
  eingabe: RechnerEingabe;
  onEingabe: (e: RechnerEingabe) => void;
  teilung: ZinkenTeilung | null;
  fehler: readonly ZinkenEingabeFehler[];
}) {
  const t = useTranslations("zinken.rechner");
  const locale = useLocale() === "en" ? "en-GB" : "de-AT";
  const id = useId();
  const zahl = (n: number, d = 1) =>
    n.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const setze = (teil: Partial<RechnerEingabe>) => onEingabe({ ...eingabe, ...teil });
  const zahlAus = (v: string) => (v.trim() === "" ? Number.NaN : Number(v.replace(",", ".")));

  const L = teilung?.layout;
  const papier = teilung ? papierRechnung(teilung) : null;

  return (
    <section className="cc-card" aria-labelledby={`${id}-t`} data-testid="zinken-rechner">
      <h3 id={`${id}-t`} className="cc-kicker" style={{ marginBottom: "0.8rem" }}>
        {t("titel")}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem" }}>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.85rem" }}>
          {t("breite")}
          <input className="cc-input" type="number" inputMode="decimal" min={40} max={600}
            value={Number.isFinite(eingabe.B) ? eingabe.B : ""}
            onChange={(e) => setze({ B: zahlAus(e.target.value) })} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.85rem" }}>
          {t("dicke")}
          <input className="cc-input" type="number" inputMode="decimal" min={8} max={50}
            value={Number.isFinite(eingabe.D) ? eingabe.D : ""}
            onChange={(e) => setze({ D: zahlAus(e.target.value) })} />
        </label>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: "0.8rem 0 0" }}>
        <legend style={{ fontSize: "0.85rem", marginBottom: "0.3rem" }}>{t("dichte")}</legend>
        {(["dicht", "weit"] as const).map((d) => (
          <label key={d} style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem" }}>
            <input type="radio" name={`${id}-dichte`} checked={eingabe.dichte === d} onChange={() => setze({ dichte: d })} />
            {t(d)}
          </label>
        ))}
      </fieldset>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "end", marginTop: "0.8rem" }}>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.85rem" }}>
          {t("azs")}
          <input className="cc-input" type="number" min={1} max={20} step={1} style={{ maxWidth: "7rem" }}
            value={eingabe.azs ?? teilung?.azsVorschlag ?? ""}
            onChange={(e) => setze({ azs: zahlAus(e.target.value) })} />
        </label>
        {teilung && eingabe.azs !== undefined && eingabe.azs !== teilung.azsVorschlag && (
          <button type="button" className="cc-btn cc-btn--sm" onClick={() => setze({ azs: undefined })}>
            {t("vorschlag", { n: teilung.azsVorschlag })}
          </button>
        )}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: "0.8rem 0 0" }}>
        <legend style={{ fontSize: "0.85rem", marginBottom: "0.3rem" }}>{t("art")}</legend>
        <label style={{ display: "inline-flex", gap: "0.4rem", marginRight: "1rem", fontSize: "0.85rem" }}>
          <input type="radio" name={`${id}-art`} checked={!eingabe.halbverdeckt} onChange={() => setze({ halbverdeckt: false })} />
          {t("offen")}
        </label>
        <label style={{ display: "inline-flex", gap: "0.4rem", fontSize: "0.85rem" }}>
          <input type="radio" name={`${id}-art`} checked={eingabe.halbverdeckt} onChange={() => setze({ halbverdeckt: true })} />
          {t("halbverdeckt")}
        </label>
      </fieldset>

      {fehler.length > 0 && (
        <ul role="alert" style={{ color: "var(--cc-bad)", fontSize: "0.85rem", margin: "0.8rem 0 0", paddingLeft: "1.1rem" }}>
          {fehler.map((f) => (
            <li key={f}>{t(`fehler.${f}`)}</li>
          ))}
        </ul>
      )}

      {teilung && L && papier && (
        <div aria-live="polite" style={{ marginTop: "1rem" }}>
          <p className="cc-kicker" style={{ marginBottom: "0.4rem" }}>{t("ergebnis")}</p>
          <table style={{ width: "100%", fontSize: "0.88rem", borderCollapse: "collapse" }}>
            <tbody>
              <Zeile k={t("azsRoh")} v={`B / (${zahl(teilung.faktor)} · D) = ${zahl(L.AZS_raw, 2)} → AZS ${L.AZS}`} />
              <Zeile k={t("azt")} v={String(L.AZT)} />
              <Zeile k={t("t")} v={`${zahl(L.T)} mm`} testId="wert-t" />
              <Zeile k={t("zinken")} v={`${zahl(L.zinkenBreite)} mm`} />
              <Zeile k={t("schwalbe")} v={`${zahl(L.schwalbeBreite)} mm`} testId="wert-2t" />
              <Zeile k={t("schraege")} v={`1:${L.slopeRatio} ≈ ${zahl(teilung.schraege.grad)}°`} testId="wert-grad" />
              <Zeile k={t("hilfsdreieck", { ratio: L.slopeRatio })} v={`${zahl(teilung.hilfsdreieck.versatz)} / ${zahl(teilung.hilfsdreieck.laenge)} mm`} />
              {eingabe.halbverdeckt && (
                <Zeile k={t("blatt")} v={`${zahl(teilung.blatt.BL)} / ${zahl(teilung.blatt.SL)} mm`} />
              )}
            </tbody>
          </table>
          <p style={{ fontSize: "0.82rem", marginTop: "0.6rem" }}>
            {t("geht", { zinken: L.AZS + 1, schwalben: L.AZS, summe: zahl(teilung.summe) })}
          </p>
          <p className="cc-muted" style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
            {t("papier", { t: zahl(papier.T), zweiT: zahl(papier.zweiT), ratio: L.slopeRatio, hilf: zahl(papier.hilfsLaenge) })}
          </p>
          <p className="cc-muted" style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>{t("winkelHinweis")}</p>
        </div>
      )}
    </section>
  );
}

function Zeile({ k, v, testId }: { k: string; v: string; testId?: string }) {
  return (
    <tr style={{ borderTop: "1px solid var(--cc-line-soft)" }}>
      <th scope="row" style={{ textAlign: "left", fontWeight: 400, padding: "0.3rem 0.4rem 0.3rem 0" }}>{k}</th>
      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", padding: "0.3rem 0" }} data-testid={testId}>
        {v}
      </td>
    </tr>
  );
}
