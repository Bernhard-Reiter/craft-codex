"use client";

/**
 * Bohrplan zum Messe-Unterschrank — Druckansicht, je gebohrter Platte eine
 * bemaßte Skizze + Bohrtabelle. Nur die Bohrungen der Blum-Teile, keine
 * Lochreihe. Maße aus core (dieselben Layouts wie AR/2D), keine Preise.
 * Jede Bohrung mit `offen` erscheint orange mit Quelle »Annahme«.
 */

import {
  buildBlumClipTopTuerLayout,
  buildMesseStueckliste,
  buildMesseUnterschrankSeiteLayout,
  MESSE_UNTERSCHRANK,
  type HardwareLayout,
} from "@craft-codex/core";
import { Link } from "../../../../i18n/navigation";

const M = MESSE_UNTERSCHRANK;
const ORANGE = "#e67e00";

type Blatt = { teil: string; breite: number; hoehe: number; layout: HardwareLayout };

const BLAETTER: Blatt[] = [
  {
    teil: "Tür",
    breite: M.tuer.breite,
    hoehe: M.tuer.hoehe,
    layout: buildBlumClipTopTuerLayout(M.tuer.breite, M.tuer.hoehe),
  },
  {
    teil: "Seite",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: buildMesseUnterschrankSeiteLayout(),
  },
];

/** Pos. wie in Stückliste, Etikett und VOAI-Vorschau. */
function posVon(teil: string): number | undefined {
  const i = buildMesseStueckliste().findIndex((z) => z.teil === teil);
  return i < 0 ? undefined : i + 1;
}

function quelle(l: HardwareLayout): string {
  return `Blum-Datenblatt ${l.source.document}, S. ${l.source.page}`;
}

function Skizze({ b }: { b: Blatt }) {
  const w = 260;
  const s = w / b.breite;
  const h = b.hoehe * s;
  const xFrom = b.layout.chains.find((c) => c.axis === "x")?.from ?? "linke Kante";
  return (
    <svg
      viewBox={`-30 -20 ${w + 60} ${h + 40}`}
      width={w + 60}
      height={h + 40}
      role="img"
      aria-label={`Bohrskizze ${b.layout.label}`}
    >
      <rect x="0" y="0" width={w} height={h} fill="none" stroke="currentColor" strokeWidth="1" />
      <text x={w / 2} y={-6} fontSize="9" textAnchor="middle">
        {b.breite} mm · x ab {xFrom}
      </text>
      <text x={-8} y={h / 2} fontSize="9" textAnchor="middle" transform={`rotate(-90 ${-8} ${h / 2})`}>
        {b.hoehe} mm
      </text>
      {b.layout.points.map((p, i) => {
        const cy = (p.yRef === "oberkante" ? p.y : b.hoehe - p.y) * s;
        const cx = p.x * s;
        const farbe = p.offen ? ORANGE : "currentColor";
        return (
          <g key={p.id}>
            <circle cx={cx} cy={cy} r={Math.max(2.5, (p.diameter / 2) * s)} fill="none" stroke={farbe} strokeWidth="1.5" />
            <text x={cx + 7} y={cy + 3} fontSize="8" fill={farbe}>
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function BohrplanPage() {
  return (
    <main className="bohrplan">
      <header className="kopf">
        <p className="entwurf">ENTWURF · Bohrmaße vor dem Bohren prüfen</p>
        <h1>Bohrplan · Unterschrank 600</h1>
        <p>
          Nur die Bohrungen der Blum-Teile (CLIP top 71B3550, Montageplatte 173L6100, MOVENTO
          766H5000S). Keine Lochreihe. <span className="o">Orange</span> = nicht aus den Daten belegt
          (Annahme).
        </p>
        <p className="knoepfe">
          <button type="button" onClick={() => window.print()}>
            🖨 Drucken
          </button>
          <Link href="/beschlag?vorlage=messe">← zurück zur Montage</Link>
        </p>
      </header>

      {BLAETTER.map((b) => {
        const xFrom = b.layout.chains.find((c) => c.axis === "x")?.from ?? "linke Kante";
        const pos = posVon(b.teil);
        return (
          <section key={b.layout.id} className="blatt">
            <h2>
              {pos ? `Pos. ${pos} · ` : ""}
              {b.layout.label}
            </h2>
            <p className="klein">
              {b.breite} × {b.hoehe} mm · Anschlag {b.layout.anschlag} · Status {b.layout.status}
            </p>
            <div className="inhalt">
              <Skizze b={b} />
              <table>
                <thead>
                  <tr>
                    <th>Nr.</th>
                    <th>x ab {xFrom}</th>
                    <th>y</th>
                    <th>Ø</th>
                    <th>Werkzeug</th>
                    <th>Quelle</th>
                  </tr>
                </thead>
                <tbody>
                  {b.layout.points.map((p, i) => (
                    <tr key={p.id} className={p.offen ? "offen" : undefined}>
                      <td>{i + 1}</td>
                      <td>{p.x}</td>
                      <td>
                        {p.y} ab {p.yRef === "oberkante" ? "Oberkante" : "Unterkante"}
                      </td>
                      <td>{p.diameter}</td>
                      {/* depth ist bei Schrauben die Schraubenlänge, darum das Werkzeug zeigen. */}
                      <td>{p.tool}</td>
                      <td>{p.offen ? <>Annahme: {p.offen}</> : quelle(b.layout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="blatt">
        <h2>Nicht gezeichnet</h2>
        <ul className="o">
          <li>Korpusseite rechts: MOVENTO spiegelbildlich zur linken Seite (Annahme, eigenes Bild fehlt).</li>
          <li>Kupplung T51.7601: keine Bohrdaten in der Vorlage.</li>
        </ul>
      </section>

      <style jsx>{`
        .bohrplan {
          max-width: 60rem;
          margin: 0 auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .entwurf {
          margin: 0;
          padding: 0.4rem 0.7rem;
          border: 2px solid ${ORANGE};
          color: ${ORANGE};
          font-weight: 700;
          text-transform: uppercase;
        }
        h1,
        h2 {
          margin: 0.2rem 0;
        }
        h2 {
          font-size: 1.05rem;
        }
        .o {
          color: ${ORANGE};
        }
        .klein {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.75;
        }
        .knoepfe {
          display: flex;
          gap: 1rem;
          align-items: center;
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
        .blatt {
          border: 1px solid rgba(127, 127, 127, 0.4);
          border-radius: 8px;
          padding: 0.75rem;
          break-inside: avoid;
        }
        .inhalt {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: flex-start;
        }
        table {
          flex: 1 1 22rem;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        th,
        td {
          text-align: left;
          padding: 0.3rem 0.4rem;
          border-bottom: 1px solid rgba(127, 127, 127, 0.3);
          vertical-align: top;
        }
        tr.offen td {
          color: ${ORANGE};
        }
        @media print {
          .knoepfe {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
