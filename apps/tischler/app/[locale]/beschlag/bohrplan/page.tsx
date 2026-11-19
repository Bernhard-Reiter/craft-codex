"use client";

/**
 * Bohrplan zum Messe-Unterschrank — Druckansicht, je gebohrter Platte eine
 * bemaßte Skizze + Bohrtabelle. Blum-Teile + Lochreihe, Ø6 Hinterstück und
 * Kupplung Boden (Lagen aus cody-cad). Maße aus core, keine Preise.
 * Jede Bohrung mit `offen` erscheint orange mit Quelle »Annahme«.
 */

import {
  buildBlumClipTopTuerLayout,
  buildMesseBodenLayout,
  buildMesseHinterstueckLayout,
  buildMesseUnterschrankSeiteLayout,
  MESSE_LOCHREIHE,
  MESSE_UNTERSCHRANK,
  messeLochreihePunkte,
  type HardwareLayout,
} from "@craft-codex/core";
import { useLocale } from "next-intl";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { blattAusSuche, bohrplanRueckweg, bohrplanRueckwegText } from "../../../../components/MesseStueckliste";

const M = MESSE_UNTERSCHRANK;

type Blatt = {
  teil: string;
  /** Teilname wie in der Werkstatt-Mappe (cody-cad), steht im Blattkopf statt einer Pos.-Nummer. */
  name: string;
  breite: number;
  hoehe: number;
  layout: HardwareLayout;
  /** Beschlag-Zeile im Blattkopf ohne alten Teilnamen (Druck nennt das Teil nur wie die Mappe). */
  beschlag?: string;
  /** Annahme zum ganzen Blatt (orange), z. B. die Anzahl der Scharniere. */
  annahme?: string;
  /** Innenansicht gespiegelt: Vorderkante rechts im Bild (rechte Korpusseite). */
  gespiegelt?: boolean;
  /** Lochreihe (cody-cad) mitzeichnen: Punkte ohne Nummer, eine Zeile in der Tabelle. */
  lochreihe?: boolean;
  /** Bezugskante für y, wenn sie nicht Ober-/Unterkante heißt (Boden: Vorderkante unten im Blatt). */
  yAb?: string;
};

const LOCHREIHE = messeLochreihePunkte();

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
    name: "Tür 1 Links",
    breite: M.tuer.breite,
    hoehe: M.tuer.hoehe,
    layout: buildBlumClipTopTuerLayout(M.tuer.breite, M.tuer.hoehe),
    beschlag: "Blum CLIP top BLUMOTION 110°",
    annahme: M.annahmen[0],
  },
  {
    teil: "Seite",
    name: "Seite Links",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: SEITE_LINKS,
    beschlag: "Montageplatten 173L6100 + MOVENTO 766H5000S",
    lochreihe: true,
  },
  {
    teil: "Seite",
    name: "Seite Rechts",
    breite: M.korpus.tiefe,
    hoehe: M.korpus.hoehe,
    layout: SEITE_RECHTS,
    beschlag: "MOVENTO 766H5000S (spiegelbildlich)",
    annahme:
      "Rechte Seite spiegelbildlich zur linken gezeichnet (Innenansicht, Vorderkante rechts im Bild). " +
      "Keine Montageplatten, weil die Tür links anschlägt.",
    gespiegelt: true,
    lochreihe: true,
  },
  {
    teil: "Hinterstück",
    name: "Schubkasten-Hinterstück",
    breite: 520,
    hoehe: 121,
    layout: buildMesseHinterstueckLayout(),
  },
  {
    teil: "Boden",
    name: "Schubkasten-Boden",
    breite: 530,
    hoehe: 490,
    layout: buildMesseBodenLayout(),
    yAb: "Vorderkante",
  },
];

/** Blattkopf: Teilname wie in der Mappe, dann die Beschlag-Zeile (Name nicht doppelt, wenn sie schon damit beginnt). */
function blattKopf(b: Blatt): string {
  if (b.beschlag) return `${b.name} · ${b.beschlag}`;
  return b.layout.label.startsWith(b.name) ? b.layout.label : `${b.name} · ${b.layout.label}`;
}

/** Zahl mit deutschem Komma (22,5 statt 22.5). */
const de = (n: number) => String(n).replace(".", ",");

/** Jeder Annahme-Satz nur einmal je Blatt; die Zeile trägt nur die Nummer. */
function annahmen(l: HardwareLayout): string[] {
  return [...new Set(l.points.flatMap((p) => (p.offen ? [p.offen] : [])))];
}

function quelle(l: HardwareLayout): string {
  if (!l.source.page) return `Quelle: ${l.source.document}`;
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
  // Nummern rechts neben dem Loch; liegen zwei Nummern zu nah, rutscht die untere um eine Zeile (16) nach unten.
  // Die Führungslinie zeigt dann, welche Nummer zu welchem Loch gehört (Topf + Schrauben, MOVENTO 243/261).
  const marken = b.layout.points
    .map((p, i) => {
      const cx = (b.gespiegelt ? b.breite - p.x : p.x) * s;
      const cy = (p.yRef === "oberkante" ? p.y : b.hoehe - p.y) * s;
      const r = Math.max(2.5, (p.diameter / 2) * s);
      return { p, i, cx, cy, r, lx: cx + r + 14, ly: cy + 5, farbe: bohrFarbe(p.id) };
    })
    .sort((m, n) => m.ly - n.ly);
  marken.forEach((m, k) => {
    for (const q of marken.slice(0, k)) {
      if (Math.abs(q.lx - m.lx) < 40 && m.ly - q.ly < 16) m.ly = q.ly + 16;
    }
  });
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
      {b.lochreihe && (
        <g aria-label="Lochreihe">
          {LOCHREIHE.map((q) => (
            <circle
              key={`${q.x}-${q.y}`}
              cx={(b.gespiegelt ? b.breite - q.x : q.x) * s}
              cy={(b.hoehe - q.y) * s}
              r={3}
              fill="none"
              stroke="var(--vi4-fach-bohr-lochreihe)"
              strokeWidth="1"
              strokeDasharray="2.5 1.5"
            />
          ))}
        </g>
      )}
      {marken.map(({ p, i, cx, cy, r, lx, ly, farbe }) => (
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
          {/* Führungslinie vom Loch zur Nummer */}
          <line x1={cx + r} y1={cy} x2={lx - 2} y2={ly - 5} stroke={farbe} strokeWidth="0.75" />
          <text x={lx} y={ly} fontSize="14" fontWeight="700" fill={farbe}>
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

type Huelle = { stand: () => void; setze: (s: "links" | "rechts", auf: boolean, id?: string) => void; abbau: () => void };
type Vi4 = {
  baue: (c: unknown) => Promise<Huelle>;
  menue: (c: unknown) => Promise<{ stand: () => void; abbau: () => void }>;
};
type Thema = "light" | "dark" | "auto";

// Reihenfolge zählt (gleiche precedence): Schrift direkt NACH den Tokens, Phosphor für die Symbole.
const CSS = [
  "/vi4-design/vi4-tokens.css",
  "/vi4-app/schrift.css",
  "/vi4-design/vi4-rollen.css",
  "/vi4-design/huelle.css",
  "/vendor/phosphor-light/style.css",
];

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
  // abbau() der Hülle beim Verlassen (Next-Link ohne Neuladen), sonst bleiben ihre Tasten-Handler an document/window
  const abbauen = useRef<Array<() => void>>([]);
  const verlassen = useRef(false);

  // Rahmen der Hülle: ganze Fläche, Thema hell (Foto + Messe)
  useEffect(() => {
    const abbauListe = abbauen.current;
    verlassen.current = false;
    document.body.classList.add("vi4-rahmen");
    document.documentElement.dataset.theme = themaRef.current;
    // Papier ist weiß: zum Drucken immer hell, danach wieder die gewählte Darstellung.
    const hell = () => {
      document.documentElement.dataset.theme = "light";
    };
    const zurueck = () => {
      document.documentElement.dataset.theme = themaRef.current;
    };
    window.addEventListener("beforeprint", hell);
    window.addEventListener("afterprint", zurueck);
    return () => {
      window.removeEventListener("beforeprint", hell);
      window.removeEventListener("afterprint", zurueck);
      verlassen.current = true;
      abbauListe.splice(0).forEach((f) => f());
      document.body.classList.remove("vi4-rahmen", "vi4-huelle", "vi4-links-auf", "vi4-rechts-auf");
      delete document.documentElement.dataset.theme;
      document.querySelectorAll(".vi4-m-liste").forEach((el) => el.remove());
    };
  }, []);

  // Direktlink aus der Stückliste: »?blatt=n« öffnet Blatt n (1-basiert).
  useEffect(() => {
    const i = blattAusSuche(window.location.search, BLAETTER.length);
    if (i !== undefined) setNr(i);
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
    // Seite schon verlassen, bevor menue()/baue() fertig sind? Dann gleich abbauen statt merken.
    const merke = (t: { abbau: () => void }) => {
      if (verlassen.current) t.abbau();
      else abbauen.current.push(t.abbau);
    };
    // Aus der Stückliste (»?blatt=n«) zurück in die Stückliste, sonst in die 3D-Montage.
    const zurueck = () => {
      window.location.href = bohrplanRueckweg(window.location.search, BLAETTER.length, locale);
    };
    void H.menue({
      ziel: "#bp-menue",
      // Platz 0 (Hülle 0.5.0): Logo + Umschalter. Der Bohrplan ist ein Blatt unter »Layout« (Meister 1177 11:43);
      // Raum/Einrichtung/Korpus gibt es in der Tischler-App noch nicht, darum tut der Umschalter dort vorerst nichts.
      umgebung: { aktiv: "layout", tun: () => undefined },
      name: { titel: "Bohrplan", zusatz: () => kurzName(blatt(nrRef.current)) },
      menues: {
        datei: [{ t: "Drucken", kbd: "Strg P", tun: () => window.print() }, "-", { t: bohrplanRueckwegText(window.location.search, BLAETTER.length), tun: zurueck }],
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
      merke(m);
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
            kurz: () => `${b.layout.points.length + (b.lochreihe ? LOCHREIHE.length : 0)} Bohrungen`,
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
      merke(h);
    });
  }, [skript, locale]);

  const b = blatt(nr);

  return (
    <>
      {CSS.map((f) => (
        <link key={f} rel="stylesheet" href={f} precedence="vi4" />
      ))}
      <Script src="/vi4-design/huelle.js" strategy="afterInteractive" onReady={() => setSkript(true)} />

      <header id="bp-menue" />
      {/* huelle.js hängt den Span in die Menüleiste um; React verwaltet nur das Div
          (sonst NotFoundError beim Verlassen der Seite). */}
      <div hidden>
        {/* Mit Platz 0 (Hülle 0.5.0) bleibt der Meldung bei 1366 px kaum Raum: kurz, Satz im Tooltip + auf Papier. */}
        <span id="bp-meldung" className="entwurf" title="Vorschau · Maße vor dem Bohren nachmessen">
          VORSCHAU
        </span>
      </div>

      <main id="bp-werk" className="werk">
        <div id="bp-buehne">
          <div className="blatt vi4-plan-papier">
            <h1>
              {blattKopf(b)}
            </h1>
            <p className="klein">
              {kopfZeile(b)}
            </p>
            <Skizze b={b} />
          </div>
        </div>

        <section id="bp-links" className="karte" aria-label="Bohrtabelle">
          <h2>Bohrtabelle · {kurzName(b)}</h2>
          <Tabelle b={b} />
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
            </>
          ) : (
            <>
              <h2>Herkunft</h2>
              <p>
                Bohrungen der Blum-Teile (CLIP top 71B3550, Montageplatte 173L6100, MOVENTO
                766H5000S), dazu Lochreihe, Ø6 Hinterstück und Kupplung Boden mit Lagen aus dem Bohrbild der Zeichnung. Maße aus
                denselben Daten wie AR und Stückliste.
              </p>
              <p>{quelle(b.layout)}</p>
              <p className="klein">Gestrichelter Kreis = Lage ist eine Annahme.</p>
            </>
          )}
        </section>
      </main>

      {/* Nur Papier: alle Blätter mit Bohrtabelle und Annahmen (wie die alte Seite). Bildschirm zeigt das gewählte Blatt. */}
      <section id="bp-druck" aria-hidden="true">
        {BLAETTER.map((d) => (
          <DruckBlatt key={d.layout.id} b={d} />
        ))}
      </section>

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
        .annahme-satz {
          display: inline-block;
          margin: 2px 0;
          padding: 0 var(--vi4-space-4);
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
        }
        ol,
        ul {
          margin: 0 0 var(--vi4-space-16);
          padding-left: var(--vi4-space-20);
        }
      `}</style>
      <style jsx global>{`
        /* Bohrtabelle (Bildschirm-Karte + Papier) */
        .bp-tab {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--vi4-text-table);
        }
        .bp-tab th,
        .bp-tab td {
          text-align: left;
          padding: var(--vi4-space-4);
          border-bottom: 1px solid var(--vi4-werk-rule);
          vertical-align: top;
          overflow-wrap: break-word;
        }
        .bp-tab td:nth-child(1),
        .bp-tab td:nth-child(2),
        .bp-tab td:nth-child(4) {
          white-space: nowrap;
        }
        /* Werkzeug bricht um statt rechts abgeschnitten zu werden (Karte bleibt Token-breit) */
        .bp-tab td:last-child {
          overflow-wrap: anywhere;
          hyphens: auto;
        }
        .bp-tab .annahme,
        #bp-druck .annahme-satz {
          display: inline-block;
          margin: 2px 0 2px var(--vi4-space-4);
          padding: 0 var(--vi4-space-4);
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
        }
        #bp-druck {
          display: none;
        }
        @media print {
          html:has(body.vi4-rahmen) {
            height: auto;
          }
          body.vi4-rahmen {
            height: auto;
            display: block;
            overflow: visible;
          }
          #bp-werk,
          .vi4-menue,
          .vi4-schiene,
          .vi4-karte-links,
          .vi4-karte-rechts,
          .vi4-m-liste {
            display: none !important;
          }
          #bp-druck {
            display: block;
            color: var(--vi4-ink);
            font-family: var(--vi4-font);
          }
          #bp-druck .druck-blatt:not(:last-of-type) {
            break-after: page;
          }
          #bp-druck h2 {
            margin: 0;
            font-size: var(--vi4-type-1);
            font-weight: var(--vi4-weight-medium);
          }
          #bp-druck h3 {
            margin: var(--vi4-space-16) 0 var(--vi4-space-4);
            font-size: var(--vi4-text-label);
          }
          #bp-druck .klein {
            margin: 0 0 var(--vi4-space-8);
            font-size: var(--vi4-text-meta);
          }
          #bp-druck .skizze {
            display: block;
            width: 100%;
            max-height: 7.5cm;
          }
          #bp-druck ol,
          #bp-druck ul {
            margin: 0;
            padding-left: var(--vi4-space-20);
          }
          #bp-druck .annahme-satz {
            margin-left: 0;
          }
          /* Papier ist breit genug: Werkzeug + Annahme-Marke in einer Zeile, damit jedes Blatt auf eine Seite passt. */
          #bp-druck .bp-tab td:last-child {
            white-space: nowrap;
          }
        }
      `}</style>
    </>
  );
}

/** Bohrtabelle eines Blatts (Karte links und Papier). */
function Tabelle({ b }: { b: Blatt }) {
  const xFrom = b.layout.chains.find((c) => c.axis === "x")?.from ?? "linke Kante";
  // gleiche Zählung wie die Annahmen-Liste (Blatt-Annahme zuerst)
  const saetze = annahmenAlle(b);
  return (
    <table className="bp-tab">
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
              {de(p.y)} ab {b.yAb ?? (p.yRef === "oberkante" ? "Oberkante" : "Unterkante")}
            </td>
            <td>{de(p.diameter)}</td>
            {/* depth ist bei Schrauben die Schraubenlänge, darum das Werkzeug zeigen. */}
            <td>
              {p.tool}
              {p.offen && <span className="annahme">Annahme {saetze.indexOf(p.offen) + 1}</span>}
            </td>
          </tr>
        ))}
        {b.lochreihe && (
          <tr>
            <td>
              <b style={{ color: "var(--vi4-fach-bohr-lochreihe)" }}>LR</b>
            </td>
            <td>{MESSE_LOCHREIHE.abVorne.join(" / ")}</td>
            <td>
              {de(MESSE_LOCHREIHE.vonUnten)} bis {de(LOCHREIHE[LOCHREIHE.length - 1]?.y ?? 0)} ab Unterkante, Raster{" "}
              {MESSE_LOCHREIHE.raster} (×{LOCHREIHE.length})
            </td>
            <td>{de(MESSE_LOCHREIHE.durchmesser)}</td>
            <td>
              Bohrer Ø{MESSE_LOCHREIHE.durchmesser}, Tiefe {MESSE_LOCHREIHE.tiefe}
              <span className="annahme">Annahme {saetze.indexOf(MESSE_LOCHREIHE.annahme) + 1}</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** Ein Blatt fürs Papier: Kopf, Skizze, Bohrtabelle, Annahmen, Herkunft. */
function DruckBlatt({ b }: { b: Blatt }) {
  const saetze = annahmenAlle(b);
  return (
    <article className="druck-blatt">
      <h2>
        {blattKopf(b)}
      </h2>
      <p className="klein">
        {kopfZeile(b)} · Vorschau · Maße vor dem Bohren nachmessen
      </p>
      <Skizze b={b} />
      <h3>Bohrtabelle · {kurzName(b)}</h3>
      <Tabelle b={b} />
      {saetze.length > 0 && (
        <>
          <h3>Annahmen</h3>
          <ol>
            {saetze.map((t) => (
              <li key={t}>
                <span className="annahme-satz">{t}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="klein">{quelle(b.layout)}</p>
    </article>
  );
}

/** Name fürs Menü und die Tabellen-Überschriften: derselbe Teilname wie die Mappe (Feld name). */
function kurzName(b: Blatt): string {
  return b.name;
}

/** Unterzeile: Maße, Tür-Anschlag nur bei Tür und Korpusseiten, Status, Lochreihen-Hinweis. */
function kopfZeile(b: Blatt): string {
  const anschlag = b.teil === "Tür" || b.teil === "Seite" ? ` · Tür-Anschlag ${b.layout.anschlag}` : "";
  const status = b.layout.status.charAt(0).toUpperCase() + b.layout.status.slice(1);
  return `B ${b.breite} × H ${b.hoehe} mm${anschlag} · Status ${status}${b.lochreihe ? " · Lochreihe nach App, Entscheid offen" : ""}`;
}

/** Blatt-Annahme + Annahmen der Bohrungen, jeder Satz einmal. */
function annahmenAlle(b: Blatt): string[] {
  return [
    ...(b.annahme ? [b.annahme] : []),
    ...annahmen(b.layout),
    ...(b.lochreihe ? [MESSE_LOCHREIHE.annahme] : []),
  ];
}

function blatt(i: number): Blatt {
  const b = BLAETTER[i];
  if (!b) throw new Error(`Bohrplan-Blatt ${i} fehlt`);
  return b;
}
