"use client";

/**
 * Beschlagmontage — geführte Anleitung mit Bohrbild, in der VI4-Hülle 0.5.0.
 *
 * Bühne: 3D-Vorschau (Werkstück + Messe-Schrank) oder die Stückliste als Blatt.
 * Karte links: der aktuelle Schritt. Karte rechts: Annahmen / Herkunft.
 * Die AR-Ansicht mit 3-Punkt-Registrierung liegt unter /beschlag/xr.
 * Daten unverändert aus core (WorkflowController, MESSE_UNTERSCHRANK); nur das Aussehen ist neu.
 *
 * Texte vorerst deutsch fest verdrahtet; i18n folgt, wenn der Ablauf steht.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { WorkflowController, openQuestions, mayRenderDrillPoints } from "@craft-codex/core";
import { useLocale } from "next-intl";
import Script from "next/script";
import { BeschlagScene } from "../../../components/BeschlagScene";
import { buehneFuer, MesseSchrank } from "../../../components/MesseSchrank";
import { MesseStueckliste, ansichtAusSuche, ladeStuecklisteCsv, ladeVoaiDatei, MESSE_SCHRITT_KEY, schrittAusSpeicher } from "../../../components/MesseStueckliste";
import { BESCHLAEGE, STANDARD_BESCHLAG } from "../../../lib/beschlag/auswahl";

type Huelle = { stand: () => void; setze: (s: "links" | "rechts", auf: boolean, id?: string) => void };
type Vi4 = {
  baue: (c: unknown) => Promise<Huelle>;
  menue: (c: unknown) => Promise<{ stand: () => void }>;
};
type Thema = "light" | "dark" | "auto";
type Ansicht = "montage" | "stueckliste";

// Gleiche Reihenfolge wie im Bohrplan: Schrift direkt NACH den Tokens, Phosphor für die Symbole.
const CSS = [
  "/vi4-design/vi4-tokens.css",
  "/vi4-app/schrift.css",
  "/vi4-design/vi4-rollen.css",
  "/vi4-design/huelle.css",
  "/vendor/phosphor-light/style.css",
];

/** Name ohne vorangestelltes Zeichen (»⭐ Messe-…« -> »Messe-…«), die Menüleiste zeigt Symbole selbst. */
const klar = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "");

export default function BeschlagPage() {
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [beschlag, setBeschlag] = useState(STANDARD_BESCHLAG);
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});
  const [ansicht, setAnsicht] = useState<Ansicht>("montage");
  const [rechts, setRechts] = useState<"annahmen" | "herkunft">("annahmen");
  const [skript, setSkript] = useState(false);

  const controller = useMemo(() => new WorkflowController(beschlag.workflow), [beschlag]);
  const steps = controller.getSteps();
  const schritt = steps[index];

  const werkstueck = beschlag.werkstueckFuer(schritt?.id);
  const layout = werkstueck.layout;
  const offen = useMemo(() => openQuestions(layout), [layout]);
  const zeigtBohrungen = mayRenderDrillPoints(layout);
  const bohrungenHier = layout.points.filter((p) => p.stepId === schritt?.id);
  const istMesse = beschlag.id === "messe";
  const buehne = buehneFuer(istMesse);
  const annahmenZahl = (beschlag.annahmen?.length ?? 0) + offen.length;

  // Die Hülle wird einmal gebaut; ihre Knöpfe lesen den Stand über Refs.
  const stand = useRef({ index, zahl: steps.length, id: beschlag.id, label: beschlag.label, ansicht, rechts, annahmenZahl });
  stand.current = { index, zahl: steps.length, id: beschlag.id, label: beschlag.label, ansicht, rechts, annahmenZahl };
  const themaRef = useRef<Thema>("light");
  const huelle = useRef<Huelle | null>(null);
  const leiste = useRef<{ stand: () => void } | null>(null);
  const gebaut = useRef(false);

  const waehle = (id: string) => {
    const b = BESCHLAEGE.find((x) => x.id === id);
    if (!b) return;
    setBeschlag(b);
    setIndex(0);
    setErledigt({});
    if (b.id !== "messe") setAnsicht("montage");
  };
  // Direktlink: /beschlag?vorlage=messe lädt die Vorlage gleich; »&ansicht=stueckliste« öffnet die Stückliste.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vorlage");
    if (v) waehle(v);
    setAnsicht(ansichtAusSuche(window.location.search));
    // H3: Messe-Schritt überlebt Bohrplan/Etiketten/Menü (jeder Seitenwechsel lädt die Seite neu)
    const messe = v === "messe" ? BESCHLAEGE.find((x) => x.id === "messe") : undefined;
    if (messe) {
      let roh: string | null = null;
      try {
        roh = window.sessionStorage.getItem(MESSE_SCHRITT_KEY);
      } catch {
        roh = null;
      }
      setIndex(schrittAusSpeicher(roh, new WorkflowController(messe.workflow).getSteps().length));
    }
  }, []);
  useEffect(() => {
    if (beschlag.id !== "messe") return;
    try {
      window.sessionStorage.setItem(MESSE_SCHRITT_KEY, String(index));
    } catch {
      // ohne Speicher startet die Messe-Montage wieder bei Schritt 1
    }
  }, [index, beschlag.id]);

  // Rahmen der Hülle: ganze Fläche, Thema hell; Papier wird immer hell gedruckt.
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
    huelle.current?.stand();
    leiste.current?.stand();
  }, [index, beschlag, ansicht, rechts]);

  useEffect(() => {
    const H = (window as unknown as { VI4Huelle?: Vi4 }).VI4Huelle;
    if (!skript || !H || gebaut.current) return;
    gebaut.current = true;
    const geh = (pfad: string) => {
      window.location.href = `/${locale}${pfad}`;
    };
    const ar = () => geh(stand.current.id === "messe" ? "/beschlag/xr?vorlage=messe" : "/beschlag/xr");
    const nurMesse = () => stand.current.id !== "messe";
    const weiter = () => setIndex((i) => Math.min(stand.current.zahl - 1, i + 1));
    void H.menue({
      ziel: "#bs-menue",
      // Platz 0 (Hülle 0.5.0): Montage am Schrank = »Korpus«. Raum/Einrichtung/Layout-Wechsel gibt es hier noch nicht.
      umgebung: { aktiv: "korpus", tun: () => undefined },
      name: {
        titel: "Montage",
        zusatz: () => `${klar(stand.current.label)} · Schritt ${stand.current.index + 1} von ${stand.current.zahl}`,
      },
      menues: {
        datei: [
          { t: "Stückliste drucken", kbd: "Strg P", tun: () => window.print(), aus: nurMesse },
          { t: "Stückliste als CSV", tun: ladeStuecklisteCsv, aus: nurMesse },
          { t: "Datei für VOAI speichern", tun: ladeVoaiDatei, aus: nurMesse },
          "-",
          { t: "Bohrplan", tun: () => geh("/beschlag/bohrplan?vorlage=messe"), aus: nurMesse },
          { t: "Etiketten", tun: () => geh("/beschlag/etiketten?vorlage=messe"), aus: nurMesse },
          { t: "In AR öffnen (Quest 3)", tun: ar },
        ],
        ansicht: BESCHLAEGE.map((b) => ({
          t: klar(b.label),
          art: "radio",
          an: () => stand.current.id === b.id,
          tun: () => waehle(b.id),
        })),
      },
      ansicht: [
        { wort: "3D", an: () => stand.current.ansicht === "montage", tun: () => setAnsicht("montage") },
        {
          wort: "Stückliste",
          an: () => stand.current.ansicht === "stueckliste",
          tun: () => {
            if (stand.current.id === "messe") setAnsicht("stueckliste");
          },
        },
      ],
      meldung: ["#bs-meldung"],
      thema: {
        wahl: () => themaRef.current,
        setze: (w: Thema) => {
          themaRef.current = w;
          document.documentElement.dataset.theme = w;
        },
      },
      haupt: {
        wort: "Weiter",
        tun: weiter,
        sichtbar: () => stand.current.ansicht === "montage" && stand.current.index < stand.current.zahl - 1,
      },
    }).then((m) => {
      leiste.current = m;
    });
    void H.baue({
      wurzel: "#bs-werk",
      buehne: "#bs-buehne",
      karteLinks: "#bs-links",
      karteRechts: "#bs-rechts",
      links: [
        {
          knoepfe: [
            {
              id: "schritt",
              verb: "beschlag",
              wort: "Schritt",
              karte: "links",
              kurz: () => `${stand.current.index + 1} / ${stand.current.zahl}`,
            },
          ],
        },
        {
          knoepfe: [
            {
              id: "stueckliste",
              verb: "stueckliste",
              wort: "Stückliste",
              kurz: () => (stand.current.id === "messe" ? "" : "nur Messe"),
              an: () => stand.current.ansicht === "stueckliste",
              tun: () => {
                if (stand.current.id === "messe")
                  setAnsicht(stand.current.ansicht === "stueckliste" ? "montage" : "stueckliste");
              },
            },
            {
              id: "bohrplan",
              verb: "bohrungen",
              wort: "Bohrplan",
              tun: () => geh("/beschlag/bohrplan?vorlage=messe"),
            },
            {
              id: "etiketten",
              verb: "materialpass",
              wort: "Etiketten",
              tun: () => geh("/beschlag/etiketten?vorlage=messe"),
            },
            {
              id: "voai",
              verb: "speichern",
              wort: "An VOAI",
              kurz: () => "Datei",
              tun: ladeVoaiDatei,
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
              kurz: () => `${stand.current.annahmenZahl}`,
              warn: () => stand.current.annahmenZahl > 0,
              istAktiv: () => stand.current.rechts === "annahmen",
              tun: () => setRechts("annahmen"),
            },
            {
              id: "herkunft",
              verb: "herkunft",
              wort: "Herkunft",
              karte: "rechts",
              istAktiv: () => stand.current.rechts === "herkunft",
              tun: () => setRechts("herkunft"),
            },
          ],
        },
      ],
      start: { links: true, linksId: "schritt" },
    }).then((h) => {
      huelle.current = h;
    });
  }, [skript, locale]);

  return (
    <>
      {CSS.map((f) => (
        <link key={f} rel="stylesheet" href={f} precedence="vi4" />
      ))}
      <Script src="/vi4-design/huelle.js" strategy="afterInteractive" onReady={() => setSkript(true)} />

      <header id="bs-menue" />
      {/* huelle.js hängt den Span in die Menüleiste um; React verwaltet nur das Div (sonst NotFoundError beim Verlassen). */}
      <div hidden>
        <span
          id="bs-meldung"
          className="entwurf"
          hidden={zeigtBohrungen && annahmenZahl === 0}
          title={zeigtBohrungen ? "ENTWURF · enthält Annahmen" : "ENTWURF · Bohrbild noch nicht freigegeben"}
        >
          ENTWURF
        </span>
      </div>

      <main id="bs-werk" className="werk">
        {/* Klasse der Bühne bleibt fest: huelle.js setzt vi4-buehne von außen, ein wechselndes className würde sie löschen. */}
        <div id="bs-buehne">
          {ansicht === "montage" || !istMesse ? (
            /* Kamera nur beim Aufbau gelesen: key baut die Bühne neu, wenn zwischen Messe und Hawa/Blum gewechselt wird. */
            <Canvas key={istMesse ? "messe" : "standard"} camera={{ position: buehne.kamera, fov: buehne.fov }}>
              <ambientLight intensity={0.75} />
              <directionalLight position={[1, 2, 3]} intensity={1.1} />
              {buehne.tafel && (
                <BeschlagScene layout={layout} faceHeight={werkstueck.hoeheMm} activeStepId={schritt?.id} />
              )}
              {istMesse && <MesseSchrank activeStepId={schritt?.id} />}
              <OrbitControls makeDefault enablePan target={buehne.ziel} />
            </Canvas>
          ) : (
            <div className="papier-buehne">
              <div className="blatt vi4-plan-papier">
                <MesseStueckliste />
              </div>
            </div>
          )}
        </div>

        <section id="bs-links" className="karte" aria-label="Schritt">
          {schritt && (
            <>
              <p className="klein">
                Schritt {index + 1} von {steps.length} · {werkstueck.name}
              </p>
              <h2>{schritt.label}</h2>
              <nav className="navi">
                <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
                  disabled={index === steps.length - 1}
                >
                  Weiter
                </button>
              </nav>
              {schritt.tools.length > 0 && (
                <p className="werkzeug">
                  <span className="etikett">Werkzeug</span> {schritt.tools.join(" · ")}
                </p>
              )}
              <ol className="anweisungen">
                {schritt.instructions.map((z, i) => (
                  <li key={i}>{z}</li>
                ))}
              </ol>
              {bohrungenHier.length > 0 && (
                <p className="bohrhinweis">
                  {bohrungenHier.length} Bohrungen in diesem Schritt:{" "}
                  {[...new Set(bohrungenHier.map((p) => p.tool))].join(", ")}
                </p>
              )}
              {schritt.checklist && schritt.checklist.length > 0 && (
                <ul className="checkliste">
                  {schritt.checklist.map((c) => (
                    <li key={c.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!erledigt[c.id]}
                          onChange={(e) => setErledigt((s) => ({ ...s, [c.id]: e.target.checked }))}
                        />
                        {c.label}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section id="bs-rechts" className="karte" aria-label={rechts === "annahmen" ? "Annahmen" : "Herkunft"}>
          {rechts === "annahmen" ? (
            <>
              <h2>Annahmen · {klar(beschlag.label)}</h2>
              {!zeigtBohrungen && (
                <p className="warnung" role="status">
                  <strong>Bohrbild noch nicht freigegeben.</strong> Die Maße stammen unverändert aus der
                  Herstellervorlage und gehen rechnerisch auf. Die genaue Lage einzelner Bohrungen ist noch nicht
                  bestätigt — deshalb zeigt die Ansicht die Maße zum Nachmessen, aber keine Bohrpunkte.
                </p>
              )}
              {annahmenZahl === 0 ? (
                <p>Keine Annahmen.</p>
              ) : (
                <ol>
                  {beschlag.annahmen?.map((a) => (
                    <li key={a} className="annahme-satz">
                      {a}
                    </li>
                  ))}
                  {offen.map((o) => (
                    <li key={o.pointId} className="annahme-satz">
                      {o.frage}
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <>
              <h2>Herkunft</h2>
              <p>Werkstück: {werkstueck.name}</p>
              <p>
                Anleitung {layout.source.document} · Seite {layout.source.page} · Anschlag {layout.anschlag}
                {layout.source.crosscheck ? ` · gegengeprüft: ${layout.source.crosscheck}` : ""}
              </p>
              {istMesse && <p className="klein">Stückliste, Bohrplan, Etiketten und AR lesen dieselben Daten.</p>}
            </>
          )}
        </section>
      </main>

      {/* Nur Papier: die Stückliste (Messe-Vorlage), hell. Bildschirm zeigt die Werkfläche. */}
      <section id="bs-druck" aria-hidden="true">
        {istMesse ? (
          <MesseStueckliste />
        ) : (
          <p>Für diese Vorlage gibt es noch keine Stückliste.</p>
        )}
      </section>

      <style jsx>{`
        .werk {
          flex: 1 1 auto;
        }
        #bs-buehne :global(canvas) {
          display: block;
        }
        .papier-buehne {
          position: absolute;
          inset: 0;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: auto;
          /* Platz für die Schienen samt Beschriftung (die Wörter stehen neben den Knöpfen, solange keine Karte offen ist). */
          padding: var(--vi4-space-16) calc(var(--vi4-huelle-rand) + var(--vi4-huelle-schiene) + 104px);
        }
        :global(body.vi4-links-auf) .papier-buehne {
          padding-left: calc(var(--vi4-huelle-karte-links) + var(--vi4-huelle-schiene) + var(--vi4-space-48));
        }
        :global(body.vi4-rechts-auf) .papier-buehne {
          padding-right: calc(var(--vi4-huelle-karte-links) + var(--vi4-huelle-schiene) + var(--vi4-space-48));
        }
        .blatt {
          width: min(100%, 980px);
          box-sizing: border-box;
          padding: var(--vi4-space-16) var(--vi4-space-24);
          border-radius: var(--vi4-radius-card);
          box-shadow: var(--vi4-werk-shadow-overlay);
        }
        h2 {
          margin: 0 0 var(--vi4-space-8);
          font-size: var(--vi4-text-label);
          font-weight: var(--vi4-weight-medium);
        }
        .klein {
          margin: 0 0 var(--vi4-space-4);
          font-size: var(--vi4-text-meta);
          color: var(--vi4-werk-ink);
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
        .navi {
          display: flex;
          gap: var(--vi4-space-8);
          margin: 0 0 var(--vi4-space-12);
        }
        .navi button {
          flex: 1 1 0;
          padding: var(--vi4-space-4) var(--vi4-space-12);
          border-radius: var(--vi4-radius-field);
          border: 1px solid var(--vi4-werk-rule);
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }
        .navi button:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .werkzeug {
          margin: 0 0 var(--vi4-space-8);
          font-size: var(--vi4-text-meta);
        }
        .etikett {
          font-weight: var(--vi4-weight-medium);
        }
        .anweisungen,
        ol,
        ul {
          margin: 0 0 var(--vi4-space-12);
          padding-left: var(--vi4-space-20);
        }
        .anweisungen li {
          margin: 0 0 var(--vi4-space-4);
        }
        .bohrhinweis {
          margin: 0 0 var(--vi4-space-12);
          font-size: var(--vi4-text-meta);
        }
        .checkliste {
          list-style: none;
          padding-left: 0;
        }
        .checkliste label {
          display: flex;
          gap: var(--vi4-space-8);
          align-items: flex-start;
          margin: 0 0 var(--vi4-space-4);
        }
        .warnung {
          margin: 0 0 var(--vi4-space-12);
          padding: var(--vi4-space-8) var(--vi4-space-12);
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
        }
        .annahme-satz {
          display: inline-block;
          margin: 2px 0;
          padding: 0 var(--vi4-space-4);
          border-radius: var(--vi4-radius-field);
          background: var(--vi4-fach-annahme-bg);
          color: var(--vi4-fach-annahme-ink);
        }
      `}</style>
      <style jsx global>{`
        #bs-druck {
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
          #bs-werk,
          .vi4-menue,
          .vi4-schiene,
          .vi4-karte-links,
          .vi4-karte-rechts,
          .vi4-m-liste {
            display: none !important;
          }
          #bs-druck {
            display: block;
            color: var(--vi4-ink);
            font-family: var(--vi4-font);
          }
        }
      `}</style>
    </>
  );
}
