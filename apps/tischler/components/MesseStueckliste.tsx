"use client";

/**
 * Stückliste des Messe-Unterschranks als Tafel + CSV-Download.
 * Werte nur aus MESSE_UNTERSCHRANK (core), Annahmen markiert, keine Preise.
 */

import {
  bohrplanBlattVerweis,
  buildMesseStueckliste,
  buildVoaiStueckliste,
  gruppeAnzeige,
  MESSE_BOHRPLAN_TEILE,
  messeStuecklisteCsv,
} from "@craft-codex/core";
import { useLocale } from "next-intl";
import { useId } from "react";

/** Link auf das Bohrplan-Blatt des Teils (erstes Blatt, 1-basiert); ohne Blatt undefined. */
export function bohrplanBlattLink(teil: string, locale: string): string | undefined {
  const n = (MESSE_BOHRPLAN_TEILE as readonly string[]).indexOf(teil) + 1;
  return n ? `/${locale}/beschlag/bohrplan?vorlage=messe&blatt=${n}` : undefined;
}

/** Blatt-Index (0-basiert) aus »?blatt=n«; ungültig oder fehlend = undefined. */
export function blattAusSuche(suche: string, anzahl: number): number | undefined {
  const n = Number(new URLSearchParams(suche).get("blatt"));
  return Number.isInteger(n) && n >= 1 && n <= anzahl ? n - 1 : undefined;
}

/** Start-Ansicht der Beschlag-Seite aus »?ansicht=stueckliste« (nur Messe-Vorlage); sonst 3D. */
export function ansichtAusSuche(suche: string): "montage" | "stueckliste" {
  const q = new URLSearchParams(suche);
  return q.get("vorlage") === "messe" && q.get("ansicht") === "stueckliste" ? "stueckliste" : "montage";
}

/** Rückweg vom Bohrplan: per »?blatt=n« geöffnet (aus der Stückliste) -> Stückliste, sonst 3D. */
export function bohrplanRueckweg(suche: string, anzahl: number, locale: string): string {
  const basis = `/${locale}/beschlag?vorlage=messe`;
  return blattAusSuche(suche, anzahl) === undefined ? basis : `${basis}&ansicht=stueckliste`;
}

/** Menü-Text zum Rückweg: nennt das Ziel von bohrplanRueckweg. */
export function bohrplanRueckwegText(suche: string, anzahl: number): string {
  return blattAusSuche(suche, anzahl) === undefined ? "Zurück zur Montage" : "Zurück zur Stückliste";
}

/** CSV-Datei der Stückliste laden (BOM, damit Excel die Umlaute richtig liest). */
export function ladeStuecklisteCsv() {
  lade("\uFEFF" + messeStuecklisteCsv(buildMesseStueckliste()), "text/csv;charset=utf-8", "stueckliste-messe-unterschrank-600.csv");
}

/** Datei im VOAI-Vertrag stueckliste/2, ohne Preise. Kein Aufruf an VOAI, nur ein Download. */
export function ladeVoaiDatei() {
  lade(JSON.stringify(buildVoaiStueckliste(), null, 2) + "\n", "application/json", "voai-stueckliste-messe-unterschrank-600.json");
}

function lade(text: string, typ: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: typ }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  // Safari/iPad braucht die URL noch kurz nach dem Klick.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MesseStueckliste() {
  const locale = useLocale();
  const zeilen = buildMesseStueckliste();
  // Steht zweimal auf der Seite (Bühne + Druck): eindeutige Id je Exemplar.
  const titelId = useId();
  // Dieselbe Datei wie beim Knopf, nur zum Ansehen (Zeitstempel egal).
  const voai = buildVoaiStueckliste();

  return (
    <section className="ms-stueckliste" aria-labelledby={titelId}>
      <h2 id={titelId}>Stückliste · Unterschrank 600</h2>
      <div className="ms-rolle">
        <table className="ms-tab">
          <thead>
            <tr>
              <th className="ms-zahl">Pos.</th>
              <th>Gruppe</th>
              <th>Teil</th>
              <th className="ms-zahl">Stk.</th>
              <th>Maß L × B × S (mm)</th>
              <th>Material</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z, i) => (
              <tr key={i} className={z.annahme ? "ms-annahme" : undefined}>
                <td className="ms-zahl">{i + 1}</td>
                <td>{gruppeAnzeige(z)}</td>
                <td>{z.teil}</td>
                <td className="ms-zahl">{z.anzahl}</td>
                <td className="ms-masszelle">{z.mass || "–"}</td>
                <td>
                  {z.artikel && <span className="ms-mass">Blum {z.artikel} · </span>}
                  {z.material || "–"}
                </td>
                <td>
                  {z.annahme && <span className="ms-marke">Annahme</span>} {z.hinweis}
                  {bohrplanBlattVerweis(z.teil) && (
                    <a className="ms-blatt" href={bohrplanBlattLink(z.teil, locale)}>
                      {bohrplanBlattVerweis(z.teil)}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ms-fuss">
        Orange markiert = Annahme, noch nicht belegt. Maße nur aus der Messe-Vorlage, ohne Preise.
      </p>

      <details className="ms-voai" open>
        <summary>
          Vorschau der Datei für VOAI (das Messe-Angebot rechnet aus der Cody-CAD-Datei) ·{" "}
          {voai.inhalt.positionen.length} Positionen
        </summary>
        <div className="ms-rolle">
          <table className="ms-tab">
            <thead>
              <tr>
                <th className="ms-zahl">Pos.</th>
                <th>Position</th>
                <th className="ms-zahl">Menge</th>
                <th>Einheit</th>
                <th>Artikel</th>
              </tr>
            </thead>
            <tbody>
              {voai.inhalt.positionen.map((p, i) => (
                <tr key={p.position_ref}>
                  <td className="ms-zahl">{i + 1}</td>
                  <td>
                    {p.bezeichnung}
                    {p.masse_mm && (
                      <span className="ms-mass">
                        {" "}
                        · {p.masse_mm.laenge} × {p.masse_mm.breite} × {p.masse_mm.dicke} mm
                      </span>
                    )}
                  </td>
                  <td className="ms-zahl">{p.menge}</td>
                  <td>{p.einheit}</td>
                  <td>
                    {p.artikel_id
                      ? p.artikel_id.replace(/^blum:/, "Blum ")
                      : (zeilen[i]?.material ?? "Platte (frei)")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ms-fuss">Kein Preis in der Datei, VOAI setzt die Preise selbst.</p>
        <details className="ms-fuss">
          <summary>Technik</summary>
          Format stueckliste/2 · Revision {voai.inhalt.revision} · Prüfsumme{" "}
          {voai.inhalt_sha256.slice(0, 12)}
        </details>
      </details>

      {/* Global mit Praefix ms-: die Stueckliste steht auf der Buehne und im Druck (styled-jsx-Scope reicht nicht). */}
      <style jsx global>{`
        .ms-stueckliste {
          display: flex;
          flex-direction: column;
          gap: var(--vi4-space-12);
        }
        .ms-stueckliste h2 {
          margin: 0;
          font-size: var(--vi4-type-1);
          font-weight: var(--vi4-weight-medium);
        }
        .ms-rolle {
          overflow-x: auto;
        }
        .ms-tab {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--vi4-text-table);
        }
        .ms-tab th,
        .ms-tab td {
          text-align: left;
          padding: var(--vi4-space-4);
          border-bottom: 1px solid var(--vi4-werk-rule);
          vertical-align: top;
        }
        .ms-tab th {
          font-weight: var(--vi4-weight-medium);
        }
        .ms-tab .ms-zahl {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .ms-tab tr.ms-annahme td {
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
        }
        .ms-marke {
          display: inline-block;
          padding: 0 var(--vi4-space-4);
          border-radius: var(--vi4-radius-field);
          border: 1px solid currentColor;
          font-size: var(--vi4-text-meta);
          font-weight: var(--vi4-weight-medium);
        }
        .ms-blatt {
          display: block;
          font-size: var(--vi4-text-meta);
          font-weight: var(--vi4-weight-medium);
          white-space: nowrap;
        }
        .ms-voai summary {
          cursor: pointer;
          font-weight: var(--vi4-weight-medium);
          margin-bottom: var(--vi4-space-8);
        }
        .ms-mass {
          opacity: 0.7;
        }
        .ms-fuss {
          margin: 0;
          font-size: var(--vi4-text-meta);
          opacity: 0.75;
        }
        @media print {
          /* Druck auf 2 Seiten: Tabelle eine Stufe kleiner, keine Zeile über den Seitenumbruch. */
          .ms-tab {
            font-size: var(--vi4-text-meta);
          }
          .ms-tab tr {
            break-inside: avoid;
          }
          /* Maß in einer Zeile: sonst wird jede Platten-Zeile 3 hoch und die Liste läuft auf Seite 2. */
          .ms-masszelle {
            white-space: nowrap;
          }
          .ms-voai {
            break-before: page;
          }
          .ms-voai summary {
            list-style: none;
          }
        }
      `}</style>
    </section>
  );
}
