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
import { useLocale } from "next-intl";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const M = MESSE_UNTERSCHRANK;

type Blatt = {
  teil: string;
  breite: number;
  hoehe: number;
  layout: HardwareLayout;
  /** Annahme zum ganzen Blatt (orange), z. B. die Anzahl der Scharniere. */
  annahme?: string;
  /** Innenansicht gespiegelt: Vorderkante rechts im Bild (rechte Korpusseite). */
  gespiegelt?: boolean;
};

const SEITE_LINKS = buildMesseUnterschrankSeiteLayout();

/**
 * Rechte Korpusseite = dieselben MOVENTO-Bohrungen wie links, ab Vorderkante
 * gemessen. Keine Montageplatten: die Tür schlägt links an. Keine neuen Maße.
 */
const SEITE_RECHTS: HardwareLayout = {
  ...SEITE_LINKS,
  id: "messe-unterschrank-600--korpusseite-rechts",
  label: "Korpusseite rechts: MOVENTO 766H5000S (spiegelbildlich)",
  article: "Blum 766H5000S",
  points: SEITE_LINKS.points.filter((p) => p.id.startsWith("movento.")),
  chains: SEITE_LINKS.chains
    .filter((c) => c.axis === "x")
    .map((c) => ({ ...c, segments: [], total: 0 })),
};

const BLAETTER: Blatt[] = [
  {
    teil: "Tür",
    breite: M.tuer.breite,
    hoehe: M.tuer.hoehe,
    layout: buildBlumClipTopTuerLayout(M.tuer.breite, M.tuer.hoehe),
    annahme: M.annahmen[0],
  },
  {
    teil: "Seite",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: SEITE_LINKS,
  },
  {
    teil: "Seite",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: SEITE_RECHTS,
    annahme:
      "Rechte Seite spiegelbildlich zur linken gezeichnet (Innenansicht, Vorderkante rechts im Bild). " +
      "Keine Montageplatten, weil die Tür links anschlägt.",
    gespiegelt: true,
  },
];

/** Pos. wie in Stückliste, Etikett und VOAI-Vorschau. */
function posVon(teil: string): number | undefined {
  const i = buildMesseStueckliste().findIndex((z) => z.teil === teil);
  return i < 0 ? undefined : i + 1;
}

/** Zahl mit deutschem Komma (22,5 statt 22.5). */
const de = (n: number) => String(n).replace(".", ",");

/** Jeder Annahme-Satz nur einmal je Blatt; die Zeile trägt nur die Nummer. */
function annahmen(l: HardwareLayout): string[] {
  return [...new Set(l.points.flatMap((p) => (p.offen ? [p.offen] : [])))];
}

function quelle(l: HardwareLayout): string {
  return `Blum-Datenblatt ${l.source.document}, S. ${l.source.page}`;
}

/** Farbe je Bohrungsart aus der Norm (--vi4-fach-bohr-*). */
function bohrFarbe(id: string): string {
  if (id.startsWith("topf.")) return "var(--vi4-fach-bohr-topf)";
  if (id.startsWith("platte.")) return "var(--vi4-fach-bohr-montageplatte)";
  return "var(--vi4-fach-bohr-sonst)";
}

function Skizze({ b }: { b: Blatt }) {
  const w = 340;
  const s = w / b.breite;
  const h = b.hoehe * s;
  const xFrom = b.layout.chains.find((c) => c.axis === "x")?.from ?? "linke Kante";
  return (
    <svg
      viewBox={`-34 -30 ${w + 74} ${h + 50}`}
      className="skizze"
      role="img"
      aria-label={`Bohrskizze ${b.layout.label}`}
    >
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        fill="var(--vi4-fach-bb-platte)"
        stroke="var(--vi4-fach-bb-kante)"
        strokeWidth="1"
      />
      <text x={w / 2} y={-10} fontSize="14" textAnchor="middle" fill="var(--vi4-fach-bb-strich)">
        {b.breite} mm · x ab {xFrom}
        {b.gespiegelt ? " (rechts im Bild)" : ""}
      </text>
      <text
        x={-12}
        y={h / 2}
        fontSize="14"
        textAnchor="middle"
        fill="var(--vi4-fach-bb-strich)"
        transform={`rotate(-90 ${-12} ${h / 2})`}
      >
        {b.hoehe} mm
      </text>
      {b.layout.points.map((p, i, alle) => {
        const lage = (q: typeof p) => ({
          x: (b.gespiegelt ? b.breite - q.x : q.x) * s,
          y: (q.yRef === "oberkante" ? q.y : b.hoehe - q.y) * s,
        });
        const { x: cx, y: cy } = lage(p);
        // Nummern nahe beieinander (z. B. MOVENTO 243/261) abwechselnd ober-/unterhalb
        const nah = alle.slice(0, i).filter((q) => {
          const l = lage(q);
          return Math.abs(l.x - cx) < 24 && Math.abs(l.y - cy) < 16;
        }).length;
        const ty = nah % 2 === 1 ? cy + 18 : cy - 6;
        const farbe = bohrFarbe(p.id);
        const r = Math.max(2.5, (p.diameter / 2) * s);
        return (
          <g key={p.id}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="var(--vi4-fach-bb-loch-rand)"
              stroke={farbe}
              strokeWidth="1.5"
              strokeDasharray={p.offen ? "3 2" : undefined}
            />
            <text x={cx + r + 3} y={ty} fontSize="14" fontWeight="700" fill={farbe}>
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type Huelle = { stand: () => void; setze: (s: "links" | "rechts", auf: boolean, id?: string) => void };
type Vi4 = {
  baue: (c: unknown) => Promise<Huelle>;
  menue: (c: unknown) => Promise<{ stand: () => void }>;
};
type Thema = "light" | "dark" | "auto";

const CSS = ["vi4-tokens.css", "vi4-rollen.css", "huelle.css"];

export default function BohrplanPage() {
  const locale = useLocale();
  const [nr, setNr] = useState(0);
  const [rechts, setRechts] = useState<"annahmen" | "herkunft">("annahmen");
  const [skript, setSkript] = useState(false);
  const nrRef = useRef(0);
  const rechtsRef = useRef<"annahmen" | "herkunft">("annahmen");
  const themaRef = useRef<Thema>("light");
  const huelle = useRef<Huelle | null>(null);
  const leiste = useRef<{ stand: () => void } | null>(null);
  const gebaut = useRef(false);

  // Rahmen der Hülle: ganze Fläche, Thema hell (Foto + Messe)
  useEffect(() => {
    document.body.classList.add("vi4-rahmen");
    document.documentElement.dataset.theme = themaRef.current;
    return () => {
      document.body.classList.remove("vi4-rahmen", "vi4-huelle", "vi4-links-auf", "vi4-rechts-auf");
      delete document.documentElement.dataset.theme;
      document.querySelectorAll(".vi4-m-liste").forEach((el) => el.remove());
    };
  }, []);

  useEffect(() => {
    nrRef.current = nr;
    rechtsRef.current = rechts;
    huelle.current?.stand();
    leiste.current?.stand();
  }, [nr, rechts]);

  useEffect(() => {
    const H = (window as unknown as { VI4Huelle?: Vi4 }).VI4Huelle;
    if (!skript || !H || gebaut.current) return;
    gebaut.current = true;
    const zurueck = () => {
      window.location.href = `/${locale}/beschlag?vorlage=messe`;
    };
    void H.menue({
      ziel: "#bp-menue",
      name: { titel: "Bohrplan", zusatz: () => `Unterschrank 600 · ${blatt(nrRef.current).teil}` },
      menues: {
        datei: [{ t: "Drucken", kbd: "Strg P", tun: () => window.print() }, "-", { t: "Zurück zur Montage", tun: zurueck }],
        ansicht: BLAETTER.map((b, i) => ({
          t: kurzName(b),
          art: "radio",
          an: () => nrRef.current === i,
          tun: () => setNr(i),
        })),
      },
      meldung: ["#bp-meldung"],
      thema: {
        wahl: () => themaRef.current,
        setze: (w: Thema) => {
          themaRef.current = w;
          document.documentElement.dataset.theme = w;
        },
      },
      schliessen: { wort: "Schließen", verb: "schliessen", tun: zurueck },
      haupt: { wort: "Drucken", tun: () => window.print() },
    }).then((m) => {
      leiste.current = m;
    });
    void H.baue({
      wurzel: "#bp-werk",
      buehne: "#bp-buehne",
      karteLinks: "#bp-links",
      karteRechts: "#bp-rechts",
      links: [
        {
          knoepfe: BLAETTER.map((b, i) => ({
            id: `blatt-${i}`,
            verb: "teil",
            wort: kurzName(b),
            kurz: () => `${b.layout.points.length} Bohrungen`,
            an: () => nrRef.current === i,
            tun: () => setNr(i),
          })),
        },
        {
          knoepfe: [
            {
              id: "bohrungen",
              verb: "bohrungen",
              wort: "Bohrtabelle",
              karte: "links",
              kurz: () => kurzName(blatt(nrRef.current)),
            },
          ],
        },
      ],
      rechts: [
        {
          knoepfe: [
            {
              id: "annahmen",
              verb: "warnung",
              wort: "Annahmen",
              karte: "rechts",
              kurz: () => `${annahmenAlle(blatt(nrRef.current)).length}`,
              warn: () => annahmenAlle(blatt(nrRef.current)).length > 0,
              istAktiv: () => rechtsRef.current === "annahmen",
              tun: () => setRechts("annahmen"),
            },
            {
              id: "herkunft",
              verb: "herkunft",
              wort: "Herkunft",
              karte: "rechts",
              istAktiv: () => rechtsRef.current === "herkunft",
              tun: () => setRechts("herkunft"),
            },
          ],
        },
      ],
      start: { links: true, linksId: "bohrungen" },
    }).then((h) => {
      huelle.current = h;
    });
  }, [skript, locale]);

  const b = blatt(nr);
  const xFrom = b.layout.chains.find((c) => c.axis === "x")?.from ?? "linke Kante";
  const pos = posVon(b.teil);
  const saetze = annahmen(b.layout);

  return (
    <>
      {CSS.map((f) => (
        <link key={f} rel="stylesheet" href={`/vi4-design/${f}`} precedence="vi4" />
      ))}
      <Script src="/vi4-design/huelle.js" strategy="afterInteractive" onReady={() => setSkript(true)} />

      <header id="bp-menue" />
      {/* huelle.js hängt den Span in die Menüleiste um; React verwaltet nur das Div
          (sonst NotFoundError beim Verlassen der Seite). */}
      <div hidden>
        <span id="bp-meldung" className="entwurf">
          ENTWURF · Bohrmaße vor dem Bohren prüfen
        </span>
      </div>

      <main id="bp-werk" className="werk">
        <div id="bp-buehne">
          <div className="blatt vi4-plan-papier">
            <h1>
              {pos ? `Pos. ${pos} · ` : ""}
              {b.layout.label}
            </h1>
            <p className="klein">
              B {b.breite} × H {b.hoehe} mm · Tür-Anschlag {b.layout.anschlag} · Status{" "}
              {b.layout.status.charAt(0).toUpperCase() + b.layout.status.slice(1)}
            </p>
            <Skizze b={b} />
          </div>
        </div>

        <section id="bp-links" className="karte" aria-label="Bohrtabelle">
          <h2>Bohrtabelle · {kurzName(b)}</h2>
          <table>
            <thead>
              <tr>
                <th>Nr.</th>
                <th>x ab {xFrom}</th>
                <th>y</th>
                <th>Ø</th>
                <th>Werkzeug</th>
              </tr>
            </thead>
            <tbody>
              {b.layout.points.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <b style={{ color: bohrFarbe(p.id) }}>{i + 1}</b>
                  </td>
                  <td>{de(p.x)}</td>
                  <td>
                    {de(p.y)} ab {p.yRef === "oberkante" ? "Oberkante" : "Unterkante"}
                  </td>
                  <td>{de(p.diameter)}</td>
                  {/* depth ist bei Schrauben die Schraubenlänge, darum das Werkzeug zeigen. */}
                  <td>
                    {p.tool}
                    {p.offen && <span className="annahme">Annahme {saetze.indexOf(p.offen) + 1}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="bp-rechts" className="karte" aria-label={rechts === "annahmen" ? "Annahmen" : "Herkunft"}>
          {rechts === "annahmen" ? (
            <>
              <h2>Annahmen · {kurzName(b)}</h2>
              <ol>
                {annahmenAlle(b).map((t) => (
                  <li key={t} className="annahme-satz">
                    {t}
                  </li>
                ))}
              </ol>
              <h2>Nicht gezeichnet</h2>
              <ul>
                {/* Anzahlen wie auf den Etiketten (Bohrbild cody-cad), Lage noch nicht gezeichnet. */}
                <li>Lochreihe: 50 Bohrungen je Korpusseite, Lage folgt.</li>
                <li>Schubkasten-Hinterstück: Ø6 für MOVENTO ×2, Lage folgt.</li>
                <li>Schubkasten-Boden: Kupplung T51.7601 ×4, Lage folgt.</li>
              </ul>
            </>
          ) : (
            <>
              <h2>Herkunft</h2>
              <p>
                Nur die Bohrungen der Blum-Teile (CLIP top 71B3550, Montageplatte 173L6100, MOVENTO
                766H5000S). Maße aus denselben Daten wie AR und Stückliste.
              </p>
              <p>{quelle(b.layout)}</p>
              <p className="klein">Gestrichelter Kreis = Lage ist eine Annahme.</p>
            </>
          )}
        </section>
      </main>

      <style jsx>{`
        .werk {
          flex: 1 1 auto;
        }
        #bp-buehne {
          display: flex;
          justify-content: center;
          align-items: stretch;
          overflow: auto;
          padding: var(--vi4-space-16) calc(var(--vi4-huelle-schiene) + var(--vi4-space-48));
        }
        .blatt {
          width: min(100%, 760px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--vi4-space-8);
          padding: var(--vi4-space-16) var(--vi4-space-24);
          border-radius: var(--vi4-radius-card);
          box-shadow: var(--vi4-werk-shadow-overlay);
        }
        .blatt :global(.skizze) {
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          height: 100%;
        }
        :global(body.vi4-links-auf) #bp-buehne {
          padding-left: calc(var(--vi4-huelle-karte-links) + var(--vi4-huelle-schiene) + var(--vi4-space-48));
        }
        :global(body.vi4-rechts-auf) #bp-buehne {
          padding-right: calc(var(--vi4-huelle-karte-links) + var(--vi4-huelle-schiene) + var(--vi4-space-48));
        }
        h1 {
          margin: 0;
          font-size: var(--vi4-type-1);
          text-align: center;
          font-weight: var(--vi4-weight-medium);
          color: var(--vi4-fach-bb-kante);
        }
        h2 {
          margin: 0 0 var(--vi4-space-8);
          font-size: var(--vi4-text-label);
          font-weight: var(--vi4-weight-medium);
        }
        .klein {
          margin: 0;
          font-size: var(--vi4-text-meta);
        }
        .entwurf {
          padding: var(--vi4-space-3) var(--vi4-space-8);
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
          font-weight: var(--vi4-weight-medium);
        }
        .karte {
          padding: var(--vi4-space-16);
          overflow: auto;
          color: var(--vi4-werk-ink);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--vi4-text-table);
        }
        th,
        td {
          text-align: left;
          padding: var(--vi4-space-4);
          border-bottom: 1px solid var(--vi4-werk-rule);
          vertical-align: top;
          overflow-wrap: break-word;
        }
        td:nth-child(1),
        td:nth-child(2),
        td:nth-child(4) {
          white-space: nowrap;
        }
        .annahme,
        .annahme-satz {
          display: inline-block;
          margin: 2px 0;
          padding: 0 var(--vi4-space-4);
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
        }
        .annahme {
          margin-left: var(--vi4-space-4);
        }
        ol,
        ul {
          margin: 0 0 var(--vi4-space-16);
          padding-left: var(--vi4-space-20);
        }
      `}</style>
      <style jsx global>{`
        /* Schrift: next/font gibt Plus Jakarta Sans einen eigenen Namen, darum hier die Variable */
        html:root {
          --vi4-font: var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        @media print {
          .vi4-menue,
          .vi4-schiene,
          .vi4-karte-links,
          .vi4-karte-rechts {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

/** Kurzname fürs Menü: Tür, Seite links, Seite rechts. */
function kurzName(b: Blatt): string {
  if (b.teil !== "Seite") return b.teil;
  return b.gespiegelt ? "Seite rechts" : "Seite links";
}

/** Blatt-Annahme + Annahmen der Bohrungen, jeder Satz einmal. */
function annahmenAlle(b: Blatt): string[] {
  return [...(b.annahme ? [b.annahme] : []), ...annahmen(b.layout)];
}

function blatt(i: number): Blatt {
  const b = BLAETTER[i];
  if (!b) throw new Error(`Bohrplan-Blatt ${i} fehlt`);
  return b;
}
