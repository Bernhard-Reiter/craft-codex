"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  pruefeZinkenEingabe,
  zinkenTeilung,
  type ZinkenTeilung,
} from "@craft-codex/core";
import { Link } from "../../../i18n/navigation";
import { SiteFooter } from "../../../components/SiteFooter";
import { SceneBoundary, SceneFallback } from "../../../components/SceneBoundary";
import { ZinkenTeilungSvg } from "../../../components/zinken/ZinkenTeilungSvg";
import { ZinkenRechner, type RechnerEingabe } from "../../../components/zinken/ZinkenRechner";
import { Kontrollfragen } from "../../../components/zinken/Kontrollfragen";
import { LernProtokollPanel, browserAblage } from "../../../components/zinken/LernProtokollPanel";
import { getLehrgang, schrittAusQuery } from "../../../lib/zinken/lehrgang-index";
import type { Hilfestufe, SchrittId } from "../../../lib/zinken/lehrgang-typen";
import { protokolliere } from "../../../lib/zinken/protokoll";

const Werkstueck3D = dynamic(
  () => import("../../../components/zinken/ZinkenWerkstueck3D").then((m) => m.ZinkenWerkstueck3D),
  { ssr: false, loading: () => null },
);

const BUCH: RechnerEingabe = { B: 140, D: 20, dichte: "dicht", azs: undefined, halbverdeckt: false };
const MIT_ANIMATION: readonly SchrittId[] = ["saegen", "stemmen", "passen"];

/**
 * Zinken-Lehrgang am Computer: sechs Schritte, je Vormachen (Meister-
 * Kommentar + 3D in Zeitlupe) → Nachmachen (mit Hilfestufen) →
 * Kontrollpunkt → Kontrollfragen. Rechner + eigene Zeichnung in Schritt 2.
 * Alle Maße aus EINER Quelle (zinkenTeilung im Kern).
 */
export default function ZinkenLehrgangPage() {
  const t = useTranslations("zinken");
  const appLocale: "de" | "en" = useLocale() === "en" ? "en" : "de";
  const lehrgang = getLehrgang(appLocale);

  const [schrittId, setSchrittId] = useState<SchrittId>("holz");
  const [hilfe, setHilfe] = useState<Hilfestufe>(2);
  const [eingabe, setEingabe] = useState<RechnerEingabe>(BUCH);
  const [fortschritt, setFortschritt] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const [zeitlupe, setZeitlupe] = useState(true);
  const [protokollVersion, setProtokollVersion] = useState(0);

  // Schritt aus dem Query lesen (direkt verlinkbar: /zinken?schritt=saegen)
  useEffect(() => {
    setSchrittId(schrittAusQuery(new URLSearchParams(window.location.search).get("schritt")));
  }, []);

  const notiere = useCallback((e: Parameters<typeof protokolliere>[1]) => {
    const a = browserAblage();
    if (a && protokolliere(a, e)) setProtokollVersion((v) => v + 1);
  }, []);

  const geheZu = useCallback(
    (id: SchrittId) => {
      setSchrittId(id);
      setFortschritt(0);
      setLaeuft(false);
      const url = new URL(window.location.href);
      url.searchParams.set("schritt", id);
      window.history.replaceState(null, "", url.toString());
      notiere({ art: "schritt", schritt: id });
    },
    [notiere],
  );

  const fehler = useMemo(
    () => pruefeZinkenEingabe(eingabe.B, eingabe.D, eingabe.azs),
    [eingabe],
  );
  const teilung: ZinkenTeilung | null = useMemo(() => {
    if (fehler.length > 0) return null;
    return zinkenTeilung(eingabe.B, eingabe.D, {
      dichte: eingabe.dichte,
      azs: eingabe.azs,
      blattAnteil: eingabe.halbverdeckt ? 0.25 : undefined,
    });
  }, [eingabe, fehler]);
  // Die Bühne zeigt immer ein gültiges Werkstück (bei Eingabefehlern das Buchbeispiel).
  const buehnenTeilung = teilung ?? zinkenTeilung(BUCH.B, BUCH.D);

  const index = lehrgang.findIndex((s) => s.id === schrittId);
  const schritt = lehrgang[index] ?? lehrgang[0]!;
  const mitAnimation = MIT_ANIMATION.includes(schritt.id);

  const svgLabels = {
    titel: t("svg.titel"),
    mittellinie: t("svg.mittellinie"),
    aussen: t("svg.aussen"),
    innen: t("svg.innen"),
    abfall: t("svg.abfall"),
    hilfsdreieck: t("svg.hilfsdreieck"),
  };

  return (
    <>
      <main className="cc-page" style={{ maxWidth: 1280, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
        <header style={{ marginBottom: "1.2rem" }}>
          <p className="cc-kicker">{t("hero.kicker")}</p>
          <h1 className="cc-display" style={{ margin: "0.3rem 0 0.5rem", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
            {t("hero.title")}
          </h1>
          <p className="cc-lead" style={{ maxWidth: "62ch" }}>{t("hero.lead")}</p>
          <p className="cc-note" role="note" style={{ marginTop: "0.8rem", maxWidth: "70ch" }} data-testid="ar-regel">
            {t("hero.sicherheit")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.8rem", alignItems: "center" }}>
            <Link href="/zinken/xr" className="cc-btn cc-btn--primary cc-btn--sm">{t("hero.xr")}</Link>
            <span className="cc-muted" style={{ fontSize: "0.78rem", maxWidth: "60ch" }}>{t("hero.quelle")}</span>
          </div>
        </header>

        {/* Schrittleiste */}
        <nav aria-label={t("nav.label")} className="cc-tabbar" style={{ flexWrap: "wrap", marginBottom: "1.2rem" }}>
          {lehrgang.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cc-tab"
              aria-current={s.id === schritt.id ? "step" : undefined}
              aria-pressed={s.id === schritt.id}
              onClick={() => geheZu(s.id)}
              style={{ fontSize: "0.82rem" }}
            >
              <span className="cc-tab-step">{s.nr}</span> {s.titel}
            </button>
          ))}
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "1.4rem", alignItems: "start" }}>
          {/* LINKS: der Schritt */}
          <article aria-labelledby="schritt-titel" style={{ display: "grid", gap: "1.1rem" }}>
            <header>
              <p className="cc-kicker">{t("nav.schritt", { nr: schritt.nr })}</p>
              <h2 id="schritt-titel" style={{ margin: "0.2rem 0 0.4rem", fontSize: "1.45rem" }}>{schritt.titel}</h2>
              <p><strong>{t("schritt.ziel")}:</strong> {schritt.ziel}</p>
            </header>

            <section>
              <h3 className="cc-kicker">{t("schritt.werkzeug")}</h3>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", listStyle: "none", padding: 0, margin: "0.4rem 0 0" }}>
                {schritt.werkzeug.map((w) => (
                  <li key={w} className="cc-chip" style={{ fontSize: "0.8rem" }}>{w}</li>
                ))}
              </ul>
            </section>

            <section className="cc-card cc-card--gray">
              <h3 className="cc-kicker" style={{ marginBottom: "0.5rem" }}>{t("schritt.vormachen")}</h3>
              <ol style={{ display: "grid", gap: "0.45rem", paddingLeft: "1.1rem", margin: 0 }}>
                {schritt.vormachen.map((v, i) => (
                  <li key={i} style={{ fontSize: "0.92rem" }}>{v}</li>
                ))}
              </ol>
            </section>

            <section>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <h3 className="cc-kicker">{t("schritt.nachmachen")}</h3>
                <div role="group" aria-label={t("hilfe.label")} className="cc-tabbar" style={{ fontSize: "0.75rem" }}>
                  {([2, 1, 0] as const).map((h) => (
                    <button key={h} type="button" className="cc-tab" aria-pressed={hilfe === h}
                      onClick={() => { setHilfe(h); notiere({ art: "hilfe", schritt: schritt.id, stufe: h }); }}>
                      {t(`hilfe.stufe${h}`)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="cc-muted" style={{ fontSize: "0.78rem", margin: "0.3rem 0 0.5rem" }}>{t("hilfe.erklaerung")}</p>
              {hilfe === 0 ? (
                <p style={{ fontSize: "0.9rem" }}>{t("schritt.nachmachenAus")}</p>
              ) : (
                <ol style={{ display: "grid", gap: "0.45rem", paddingLeft: "1.1rem", margin: 0 }} data-testid="nachmachen">
                  {schritt.nachmachen.map((n, i) => (
                    <li key={i} style={{ fontSize: "0.92rem" }}>
                      {hilfe === 2 ? (<><strong>{n.kurz}.</strong> {n.lang}</>) : n.kurz}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="cc-card" style={{ borderLeft: "4px solid var(--cc-good)" }}>
              <h3 className="cc-kicker" style={{ marginBottom: "0.5rem" }}>{t("schritt.kontrollpunkt")}</h3>
              <ul style={{ display: "grid", gap: "0.35rem", listStyle: "none", padding: 0, margin: 0 }}>
                {schritt.kontrollpunkt.map((k) => (
                  <li key={k}>
                    <label style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", fontSize: "0.9rem" }}>
                      <input type="checkbox" /> {k}
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <details>
              <summary className="cc-kicker" style={{ cursor: "pointer" }}>{t("schritt.fehler")} ({schritt.fehler.length})</summary>
              <ul style={{ display: "grid", gap: "0.6rem", listStyle: "none", padding: 0, margin: "0.6rem 0 0" }}>
                {schritt.fehler.map((f) => (
                  <li key={f.fehler} style={{ fontSize: "0.88rem" }}>
                    <strong>{f.fehler}</strong>
                    <br />
                    <span className="cc-muted">{t("schritt.fehlerUrsache")}:</span> {f.ursache}
                    <br />
                    <span className="cc-muted">{t("schritt.fehlerAbhilfe")}:</span> {f.abhilfe}
                  </li>
                ))}
              </ul>
            </details>

            <section className="cc-note" role="note">
              <h3 className="cc-kicker" style={{ marginBottom: "0.4rem" }}>{t("schritt.sicherheit")}</h3>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.88rem" }}>
                {schritt.sicherheit.map((s) => (<li key={s}>{s}</li>))}
              </ul>
            </section>

            <Kontrollfragen
              key={schritt.id}
              fragen={schritt.fragen}
              onAntwort={(frageId, richtig) => notiere({ art: "frage", schritt: schritt.id, frageId, richtig })}
            />

            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <button type="button" className="cc-btn cc-btn--sm" disabled={index <= 0}
                onClick={() => geheZu(lehrgang[index - 1]!.id)}>
                ← {t("nav.zurueck")}
              </button>
              <button type="button" className="cc-btn cc-btn--primary cc-btn--sm" disabled={index >= lehrgang.length - 1}
                onClick={() => geheZu(lehrgang[index + 1]!.id)}>
                {t("nav.weiter")} →
              </button>
            </div>
          </article>

          {/* RECHTS: Bühne */}
          <div style={{ display: "grid", gap: "1rem", position: "sticky", top: "calc(var(--cc-header-h, 56px) + 0.8rem)" }}>
            <section aria-label={t("buehne.label")} className="cc-stage" style={{ position: "relative", height: "min(52vh, 440px)", borderRadius: "var(--cc-radius)", overflow: "hidden" }}>
              <SceneBoundary fallback={<SceneFallback><ZinkenTeilungSvg teilung={buehnenTeilung} labels={svgLabels} locale={appLocale} /></SceneFallback>}>
                <Werkstueck3D
                  teilung={buehnenTeilung}
                  phase={schritt.id}
                  fortschritt={mitAnimation ? fortschritt : 1}
                  laeuft={mitAnimation && laeuft}
                  tempo={zeitlupe ? 0.35 : 1}
                  onFortschritt={(f) => {
                    setFortschritt(f);
                    if (f >= 1) setLaeuft(false);
                  }}
                />
              </SceneBoundary>
              {mitAnimation && (
                <div style={{ position: "absolute", left: "0.6rem", right: "0.6rem", bottom: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                  <button type="button" className="cc-btn cc-btn--primary cc-btn--sm"
                    onClick={() => { if (fortschritt >= 1) setFortschritt(0); setLaeuft((l) => !l); }}>
                    {laeuft ? t("buehne.pause") : t("buehne.abspielen")}
                  </button>
                  <button type="button" className="cc-btn cc-btn--sm" onClick={() => { setFortschritt(0); setLaeuft(false); }}>
                    {t("buehne.vonVorn")}
                  </button>
                  <button type="button" className="cc-btn cc-btn--sm" aria-pressed={zeitlupe} onClick={() => setZeitlupe((z) => !z)}>
                    {zeitlupe ? t("buehne.zeitlupe") : t("buehne.normal")}
                  </button>
                  <input type="range" className="cc-range" min={0} max={1} step={0.001} value={fortschritt}
                    aria-label={t("buehne.label")} style={{ flex: "1 1 120px" }}
                    onChange={(e) => { setLaeuft(false); setFortschritt(Number(e.target.value)); }} />
                </div>
              )}
            </section>

            {(schritt.id === "aufteilung" || schritt.id === "anreissen") && (
              <div className="cc-card" style={{ padding: "0.8rem" }}>
                <ZinkenTeilungSvg teilung={buehnenTeilung} labels={svgLabels} locale={appLocale} />
              </div>
            )}
            {schritt.id === "aufteilung" && (
              <ZinkenRechner eingabe={eingabe} onEingabe={setEingabe} teilung={teilung} fehler={fehler} />
            )}

            <LernProtokollPanel version={protokollVersion} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
