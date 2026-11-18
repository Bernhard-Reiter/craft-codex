"use client";

/**
 * Etiketten zur Messe-Stückliste — Druckansicht, je Plattenteil ein Etikett.
 * Werte aus core (buildMesseEtiketten), Kantenbild ist Annahme, keine Preise.
 * Aussehen: VI4-Hülle 0.5.0 (Menüleiste + Bühne, ohne Karten), Muster bohrplan/page.tsx.
 */

import { buildMesseEtiketten, kantenText, type Kantenbild } from "@craft-codex/core";
import { useLocale } from "next-intl";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/** Rechteck, gebänderte Kanten dick in der Kanten-Farbe. L oben/unten, B links/rechts. */
function KantenSkizze({ k }: { k: Kantenbild }) {
  // SVG-Attribute nehmen kein var() -> Farben als style.
  const dick = (an: boolean) =>
    an
      ? { style: { stroke: "var(--vi4-fach-bb-kante)" }, strokeWidth: 5 }
      : { style: { stroke: "var(--vi4-fach-bb-rand)" }, strokeWidth: 1 };
  return (
    <svg viewBox="0 0 120 70" width="120" height="70" aria-label={`Kantenbild ${kantenText(k)}`}>
      <rect x="10" y="10" width="100" height="50" fill="none" style={{ stroke: "var(--vi4-fach-bb-rand)" }} strokeWidth="1" />
      <line x1="10" y1="10" x2="110" y2="10" {...dick(k.l1)} />
      <line x1="10" y1="60" x2="110" y2="60" {...dick(k.l2)} />
      <line x1="10" y1="10" x2="10" y2="60" {...dick(k.b1)} />
      <line x1="110" y1="10" x2="110" y2="60" {...dick(k.b2)} />
      <text x="60" y="8" fontSize="7" textAnchor="middle" style={{ fill: "var(--vi4-muted)" }}>
        L1
      </text>
      <text x="60" y="68" fontSize="7" textAnchor="middle" style={{ fill: "var(--vi4-muted)" }}>
        L2
      </text>
    </svg>
  );
}

type Thema = "light" | "dark" | "auto";
type Vi4 = {
  baue: (c: unknown) => Promise<unknown>;
  menue: (c: unknown) => Promise<{ stand: () => void }>;
};

// Reihenfolge zählt (gleiche precedence): Schrift direkt NACH den Tokens, Phosphor für die Symbole.
const CSS = [
  "/vi4-design/vi4-tokens.css",
  "/vi4-app/schrift.css",
  "/vi4-design/vi4-rollen.css",
  "/vi4-design/huelle.css",
  "/vendor/phosphor-light/style.css",
];

export default function EtikettenPage() {
  const etiketten = buildMesseEtiketten();
  const locale = useLocale();
  const [skript, setSkript] = useState(false);
  const themaRef = useRef<Thema>("light");
  const gebaut = useRef(false);

  // Rahmen der Hülle: ganze Fläche, Thema hell; zum Drucken immer hell.
  useEffect(() => {
    document.body.classList.add("vi4-rahmen");
    document.documentElement.dataset.theme = themaRef.current;
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
      document.body.classList.remove("vi4-rahmen", "vi4-huelle", "vi4-links-auf", "vi4-rechts-auf");
      delete document.documentElement.dataset.theme;
      document.querySelectorAll(".vi4-m-liste").forEach((el) => el.remove());
    };
  }, []);

  useEffect(() => {
    const H = (window as unknown as { VI4Huelle?: Vi4 }).VI4Huelle;
    if (!skript || !H || gebaut.current) return;
    gebaut.current = true;
    const zurueck = () => {
      window.location.href = `/${locale}/beschlag?vorlage=messe`;
    };
    void H.menue({
      ziel: "#et-menue",
      umgebung: { aktiv: "layout", tun: () => undefined },
      name: { titel: "Etiketten", zusatz: () => "Unterschrank 600" },
      menues: {
        datei: [{ t: "Drucken", kbd: "Strg P", tun: () => window.print() }, "-", { t: "Zurück zur Montage", tun: zurueck }],
      },
      thema: {
        wahl: () => themaRef.current,
        setze: (w: Thema) => {
          themaRef.current = w;
          document.documentElement.dataset.theme = w;
        },
      },
      schliessen: { wort: "Schließen", verb: "schliessen", tun: zurueck },
      haupt: { wort: "Drucken", tun: () => window.print() },
    });
    // Ohne Karten: huelle.js Z.31/33 überspringt fehlende Karten-Wähler, die Schienen bleiben leer.
    void H.baue({ wurzel: "#et-werk", buehne: "#et-buehne", links: [], rechts: [] });
  }, [skript, locale]);

  return (
    <>
      {CSS.map((f) => (
        <link key={f} rel="stylesheet" href={f} precedence="vi4" />
      ))}
      <Script src="/vi4-design/huelle.js" strategy="afterInteractive" onReady={() => setSkript(true)} />

      <header id="et-menue" />

      <main id="et-werk" className="werk">
        {/* Bühne ohne className: huelle.js setzt vi4-buehne, React darf sie nie überschreiben (R1 Tischler). */}
        <div id="et-buehne">
          <p className="hinweis">
            {etiketten.length} Plattenteile. Kantenbild ist Annahme (in der Vorlage nicht belegt).
          </p>
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
                    {e.bohren.map((b) => (
                      <div key={b}>Bohren: {b}</div>
                    ))}
                    {e.annahme && <div className="marke">Annahme</div>}
                  </div>
                </div>
                <div className="fuss">Messe-Unterschrank 600</div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        .werk {
          flex: 1 1 auto;
        }
        #et-buehne {
          overflow: auto;
          padding: var(--vi4-space-16) var(--vi4-space-24) var(--vi4-space-48);
          color: var(--vi4-ink);
        }
        .hinweis {
          max-width: 68rem;
          margin: 0 auto var(--vi4-space-8);
          font-size: var(--vi4-text-meta);
          color: var(--vi4-muted);
        }
        .raster {
          max-width: 68rem;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
          gap: 0.75rem;
        }
        .etikett {
          /* --vi4-border-rule ist eine Breite (1px), die Farbe kommt aus --vi4-werk-rule. */
          border: var(--vi4-border-rule) solid var(--vi4-werk-rule);
          border-radius: var(--vi4-radius-card);
          padding: 0.6rem 0.75rem;
          background: var(--vi4-surface-raised);
          color: var(--vi4-ink);
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
          color: var(--vi4-accent);
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
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .fuss {
          font-size: 0.7rem;
          color: var(--vi4-muted);
        }
        @media print {
          .hinweis {
            display: none;
          }
          .raster {
            max-width: none;
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm;
          }
          /* Papier ohne Hintergrund: Etikett-Rand sichtbar zum Ausschneiden. */
          .etikett {
            border-color: var(--vi4-muted);
          }
          /* Browser drucken keine Hintergründe: »Annahme« als Rahmen. */
          .marke {
            background: none;
            color: var(--vi4-ink);
            border: 1px solid var(--vi4-ink);
          }
        }
      `}</style>
      <style jsx global>{`
        @media print {
          html:has(body.vi4-rahmen) {
            height: auto;
          }
          body.vi4-rahmen {
            height: auto;
            display: block;
            overflow: visible;
            background: none;
          }
          .vi4-menue,
          .vi4-schiene,
          .vi4-m-liste {
            display: none !important;
          }
          /* Raster als Blatt: Bühne aus dem absoluten Rahmen der Hülle lösen. */
          #et-werk,
          #et-buehne {
            position: static !important;
            overflow: visible !important;
            padding: 0 !important;
            background: none !important;
          }
        }
      `}</style>
    </>
  );
}
