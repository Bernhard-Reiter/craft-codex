"use client";

/**
 * Etiketten zur Messe-Stückliste — Druckansicht, je Plattenteil ein Etikett.
 * Werte aus core (buildMesseEtiketten), Kantenbild ist Annahme, keine Preise.
 */

import { buildMesseEtiketten, kantenText, type Kantenbild } from "@craft-codex/core";
import { Link } from "../../../../i18n/navigation";

/** Rechteck, gebänderte Kanten dick + orange. L oben/unten, B links/rechts. */
function KantenSkizze({ k }: { k: Kantenbild }) {
  const dick = (an: boolean) => (an ? { stroke: "#e67e00", strokeWidth: 5 } : { stroke: "#888", strokeWidth: 1 });
  return (
    <svg viewBox="0 0 120 70" width="120" height="70" aria-label={`Kantenbild ${kantenText(k)}`}>
      <rect x="10" y="10" width="100" height="50" fill="none" stroke="#bbb" strokeWidth="1" />
      <line x1="10" y1="10" x2="110" y2="10" {...dick(k.l1)} />
      <line x1="10" y1="60" x2="110" y2="60" {...dick(k.l2)} />
      <line x1="10" y1="10" x2="10" y2="60" {...dick(k.b1)} />
      <line x1="110" y1="10" x2="110" y2="60" {...dick(k.b2)} />
      <text x="60" y="8" fontSize="7" textAnchor="middle" fill="#666">L1</text>
      <text x="60" y="68" fontSize="7" textAnchor="middle" fill="#666">L2</text>
    </svg>
  );
}

export default function EtikettenPage() {
  const etiketten = buildMesseEtiketten();

  return (
    <main className="etiketten">
      <header className="kopf">
        <h1>Etiketten · Unterschrank 600</h1>
        <p>
          {etiketten.length} Plattenteile. Kantenbild ist Annahme (in der Vorlage nicht belegt).
        </p>
        <p className="knoepfe">
          <button type="button" onClick={() => window.print()}>
            🖨 Drucken
          </button>
          <Link href="/beschlag?vorlage=messe">← zurück zur Montage</Link>
        </p>
      </header>

      <div className="raster">
        {etiketten.map((e) => (
          <article key={e.nr} className="etikett">
            <div className="zeile1">
              <span className="nr">Pos. {e.pos}</span>
              <strong>{e.teil}</strong>
              {e.stueck !== "1/1" && <span className="nr">{e.stueck}</span>}
            </div>
            <div className="mass">{e.mass} mm</div>
            <div className="werkstoff">{e.werkstoff}</div>
            <div className="unten">
              <KantenSkizze k={e.kanten} />
              <div>
                <div>Kante: {kantenText(e.kanten)}</div>
                <div>Position: {e.position}</div>
                {e.annahme && <div className="marke">Annahme</div>}
              </div>
            </div>
            <div className="fuss">Messe-Unterschrank 600</div>
          </article>
        ))}
      </div>

      <style jsx>{`
        .etiketten {
          max-width: 68rem;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }
        h1 {
          margin: 0 0 0.35rem;
          font-size: 1.6rem;
        }
        .knoepfe {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
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
        .raster {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .etikett {
          border: 1px solid #999;
          border-radius: 6px;
          padding: 0.6rem 0.75rem;
          background: #fff;
          color: #111;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.85rem;
          break-inside: avoid;
        }
        .zeile1 {
          display: flex;
          gap: 0.5rem;
          align-items: baseline;
          font-size: 1rem;
        }
        .nr {
          font-weight: 700;
          color: #e67e00;
        }
        .mass {
          font-size: 1.15rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .unten {
          display: flex;
          gap: 0.6rem;
          align-items: center;
        }
        .marke {
          display: inline-block;
          margin-top: 0.2rem;
          padding: 0 0.4rem;
          border-radius: 4px;
          background: #e67e00;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .fuss {
          font-size: 0.7rem;
          color: #666;
        }
        @media print {
          .kopf {
            display: none;
          }
          .etiketten {
            padding: 0;
            max-width: none;
          }
          .raster {
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm;
          }
          /* Browser drucken keine Hintergründe: »Annahme« als Rahmen. */
          .marke {
            background: none;
            color: #111;
            border: 1px solid #111;
          }
        }
      `}</style>
    </main>
  );
}
