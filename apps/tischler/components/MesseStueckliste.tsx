"use client";

/**
 * Stückliste des Messe-Unterschranks als Tafel + CSV-Download.
 * Werte nur aus MESSE_UNTERSCHRANK (core), Annahmen markiert, keine Preise.
 */

import {
  buildMesseStueckliste,
  buildVoaiStueckliste,
  messeStuecklisteCsv,
} from "@craft-codex/core";
import { Link } from "../i18n/navigation";

export function MesseStueckliste() {
  const zeilen = buildMesseStueckliste();
  // Dieselbe Datei wie beim Knopf, nur zum Ansehen (Zeitstempel egal).
  const voai = buildVoaiStueckliste();

  const herunterladen = () => {
    // BOM, damit Excel die Umlaute richtig liest.
    const blob = new Blob(["﻿" + messeStuecklisteCsv(zeilen)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stueckliste-messe-unterschrank-600.csv";
    a.click();
    // Safari/iPad braucht die URL noch kurz nach dem Klick.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Datei im VOAI-Vertrag stueckliste/2, ohne Preise. Kein Aufruf an VOAI.
  const anVoai = () => {
    const text = JSON.stringify(buildVoaiStueckliste(), null, 2) + "\n";
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "voai-stueckliste-messe-unterschrank-600.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="stueckliste" aria-labelledby="stueckliste-titel">
      <div className="kopfzeile">
        <h2 id="stueckliste-titel">Stückliste · Unterschrank 600</h2>
        <button type="button" onClick={herunterladen}>
          ⬇ CSV herunterladen
        </button>
        <Link href="/beschlag/etiketten?vorlage=messe">🏷 Etiketten drucken</Link>
        <Link href="/beschlag/bohrplan?vorlage=messe">📐 Bohrplan</Link>
        <button type="button" onClick={anVoai} title="JSON-Datei für den Angebots-Import in VOAI, ohne Preise">
          ➜ An VOAI übergeben
        </button>
      </div>
      <div className="rolle">
        <table>
          <thead>
            <tr>
              <th>Gruppe</th>
              <th>Teil</th>
              <th className="zahl">Stk.</th>
              <th>Maß L × B × S (mm)</th>
              <th>Material</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z, i) => (
              <tr key={i} className={z.annahme ? "annahme" : undefined}>
                <td>{z.gruppe}</td>
                <td>{z.teil}</td>
                <td className="zahl">{z.anzahl}</td>
                <td>{z.mass || "–"}</td>
                <td>{z.material || "–"}</td>
                <td>
                  {z.annahme && <span className="marke">Annahme</span>} {z.hinweis}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fuss">
        Orange markiert = Annahme, noch nicht belegt. Maße nur aus der Messe-Vorlage, ohne Preise.
      </p>

      <details className="voai" open>
        <summary>
          Vorschau: das bekommt VOAI ({voai.inhalt.positionen.length} Positionen, Revision{" "}
          {voai.inhalt.revision}, Prüfsumme {voai.inhalt_sha256.slice(0, 12)})
        </summary>
        <div className="rolle">
          <table>
            <thead>
              <tr>
                <th className="zahl">Pos.</th>
                <th>Position</th>
                <th className="zahl">Menge</th>
                <th>Einheit</th>
                <th>Artikel</th>
              </tr>
            </thead>
            <tbody>
              {voai.inhalt.positionen.map((p, i) => (
                <tr key={p.position_ref}>
                  <td className="zahl">{i + 1}</td>
                  <td>
                    {p.bezeichnung}
                    {p.masse_mm && (
                      <span className="mass">
                        {" "}
                        · {p.masse_mm.laenge} × {p.masse_mm.breite} × {p.masse_mm.dicke} mm
                      </span>
                    )}
                  </td>
                  <td className="zahl">{p.menge}</td>
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
        <p className="fuss">Kein Preis in der Datei, VOAI setzt die Preise selbst. Format stueckliste/2.</p>
      </details>

      <style jsx>{`
        .stueckliste {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .kopfzeile {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        h2 {
          margin: 0;
          font-size: 1.2rem;
        }
        button {
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }
        .rolle {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        th,
        td {
          text-align: left;
          padding: 0.4rem 0.5rem;
          border-bottom: 1px solid rgba(127, 127, 127, 0.3);
          vertical-align: top;
        }
        .zahl {
          text-align: right;
        }
        tr.annahme td {
          background: rgba(255, 140, 0, 0.1);
        }
        .marke {
          display: inline-block;
          padding: 0 0.4rem;
          border-radius: 4px;
          background: #e67e00;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .voai summary {
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .mass {
          opacity: 0.7;
        }
        .fuss {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.75;
        }
      `}</style>
    </section>
  );
}
