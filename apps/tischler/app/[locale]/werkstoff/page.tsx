"use client";

/**
 * Materialwissen am Werkstück — der Durchstich (Bernhard, 03.09.2026: „bau ihn mit EGGER und
 * Adler").
 *
 * Der Handwerker tippt auf ein Werkstück und sieht, woraus es besteht: Hersteller,
 * Verarbeitung, Sicherheit, Datenblatt an der richtigen Seite — und was NICHT belegt ist.
 * Die Karten liegen als Offline-Bundle im Auftrag (`public/werkstoff-bundle/`), erzeugt von
 * `werkzeuge/projektion.py` in cody-cad; ohne Netz lesbar, ohne Betriebsdaten, eingefroren auf
 * einen Katalogstand.
 *
 * Diese Ansicht ist die Bildschirm-Vorschau. Die Brille kommt danach — mit dem horizon-Kit
 * (Bernhards Kit-Direktive), nicht mit handgenagelten Containern.
 */

import { useEffect, useMemo, useState } from "react";
import {
  AMPEL,
  AMPEL_TEXT,
  arbeitsfolge,
  gruppiere,
  ladeKarte,
  ladeDatengrenze,
  ladeKatalogstand,
  luecken,
  rolleLesbar,
  verweise,
  type Bundlestand,
  type Datengrenze,
  type Komponentenzeile,
  type Materialkarte,
} from "../../../lib/werkstoff/karte";

const WERKSTUECKE = [
  { id: "seite-links-890x555", kurz: "Seite links", laenge: 890, breite: 555 },
  { id: "boden-562x555", kurz: "Boden", laenge: 562, breite: 555 },
];

function Ampel({ freigabe }: { freigabe: Materialkarte["freigabe"] }) {
  return (
    <span className="ampel" title={AMPEL_TEXT[freigabe]}>
      <span className="punkt" style={{ background: AMPEL[freigabe] }} aria-hidden />
      {freigabe}
    </span>
  );
}

function Zeile({ karte, z }: { karte: Materialkarte; z: Komponentenzeile }) {
  const links = verweise(z);
  const fehlt = luecken(karte, z);
  const schritte = z.verarbeitung ?? [];
  return (
    <article className="zeile">
      <header>
        <div>
          <strong>{z.bezeichnung}</strong>
          <div className="rolle">{rolleLesbar(z.rolle)}</div>
        </div>
        <Ampel freigabe={z.freigabe} />
      </header>
      {z.hersteller && (
        <p className="hersteller">
          {z.hersteller}
          {z.artikelnr ? ` · Art. ${z.artikelnr}` : ""}
        </p>
      )}

      {schritte.length > 0 && (
        <details>
          <summary>Verarbeitung ({schritte.length})</summary>
          <ul className="schritte">
            {schritte.map((r, i) => (
              <li key={i}>
                <strong>{r.schritt}</strong>
                {r.werkzeuge?.length ? <span className="werkzeug"> — {r.werkzeuge.join(", ")}</span> : null}
                {r.hinweise?.length ? <div className="hinweis">{r.hinweise.join(" · ")}</div> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      {z.sicherheit && (z.sicherheit.schutz?.length || z.sicherheit.hinweise?.length) ? (
        <p className="sicherheit">
          🧤 {[...(z.sicherheit.schutz ?? []), ...(z.sicherheit.hinweise ?? [])].join(" · ")}
        </p>
      ) : null}

      {links.length > 0 && (
        <ul className="verweise">
          {links.map((u) => (
            <li key={u.dokument}>
              <a href={u.url} target="_blank" rel="noreferrer">
                {u.typ}: {u.dokument}
              </a>
              {u.seiten ? <span className="seite"> · {u.seiten}</span> : null}
              {u.sha256 ? (
                <span className="hash" title={`Fingerabdruck ${u.sha256}`}>
                  {" "}
                  · geprüft
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {fehlt.length > 0 && (
        <ul className="luecken">
          {fehlt.map((l, i) => (
            <li key={i}>
              ⚠ {l.dokument}: {l.grund}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function WerkstoffPage() {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [karte, setKarte] = useState<Materialkarte | null>(null);
  const [stand, setStand] = useState<Bundlestand | null>(null);
  const [grenze, setGrenze] = useState<Datengrenze | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    ladeKatalogstand().then(setStand).catch((e) => setFehler(String(e.message ?? e)));
    // Fehlt die Grenzaussage, bleibt es still — kein Fehler, aber auch kein Satz, den
    // niemand belegen kann.
    ladeDatengrenze().then(setGrenze);
  }, []);

  useEffect(() => {
    if (!gewaehlt) {
      setKarte(null);
      return;
    }
    let abgebrochen = false;
    setFehler(null);
    ladeKarte(gewaehlt)
      .then((k) => !abgebrochen && setKarte(k))
      .catch((e) => {
        if (abgebrochen) return;
        setKarte(null); // nie die alte Karte stehen lassen — das wäre das falsche Material
        setFehler(String(e.message ?? e));
      });
    return () => {
      abgebrochen = true;
    };
  }, [gewaehlt]);

  const gruppen = useMemo(() => (karte ? gruppiere(karte.komponenten) : []), [karte]);
  const schritte = useMemo(() => (karte ? arbeitsfolge(karte) : []), [karte]);
  const massstab = 0.28;

  return (
    <main className="werkstoff">
      <header className="kopf">
        <h1>Materialwissen am Werkstück</h1>
        <p className="herkunft">
          {stand
            ? `Katalogstand ${stand.stand} · ${stand.dateien} Datendateien · ${stand.sha256.slice(0, 12)}…`
            : "Katalogstand wird gelesen …"}
        </p>
        <p className="hinweis-klein">
          Offline-Bundle aus dem Auftrag — Datenblätter sind verlinkt, nicht kopiert.
        </p>
        {/* »Hier steht kein Wert« kann zweierlei heißen: fehlt, oder gehört hier nicht hin.
            Nur das erste muss der Handwerker nachfragen — also muss das zweite dastehen. Und
            zwar hier oben: die Grenze gilt für das ganze Bundle, nicht für eine Karte. */}
        {grenze && (
          <p className="hinweis-klein datengrenze">
            {grenze.warum} {grenze.grenze}
          </p>
        )}
      </header>

      <section className="teile" aria-label="Werkstücke antippen">
        {WERKSTUECKE.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`teil ${gewaehlt === w.id ? "aktiv" : ""}`}
            style={{ width: w.laenge * massstab, height: w.breite * massstab }}
            onClick={() => setGewaehlt(gewaehlt === w.id ? null : w.id)}
            aria-pressed={gewaehlt === w.id}
          >
            <span className="teilname">{w.kurz}</span>
            <span className="teilmass">
              {w.laenge} × {w.breite}
            </span>
          </button>
        ))}
      </section>

      {fehler && <p className="fehler">⚠ {fehler}</p>}

      {karte && (
        <section className="karte" aria-live="polite">
          <header className="kartenkopf">
            <div>
              <h2>{karte.werkstueck.bezeichnung}</h2>
              <p className="aufbau">
                Aufbau {karte.aufbau.bezeichnung} ({karte.aufbau.id}@{karte.aufbau.revision})
              </p>
            </div>
            <Ampel freigabe={karte.freigabe} />
          </header>

          <dl className="kennzahlen">
            <div>
              <dt>Dicke</dt>
              <dd>
                {karte.dicke_mm.nominal} mm
                {karte.dicke_mm.minimum !== undefined &&
                  karte.dicke_mm.maximum !== undefined && (
                    <span className="spanne">
                      {" "}
                      ({karte.dicke_mm.minimum}–{karte.dicke_mm.maximum})
                    </span>
                  )}
              </dd>
              {/* Nach dieser Zahl werden Nut und Band ausgelegt. Wenn Schichten fehlen, muss
                  das DANEBEN stehen, nicht in einer Fußnote — sonst rechnet der Handwerker mit
                  einer Summe, die keine ist (Review craft#42). */}
              {(karte.dicke_mm.ausgeschlossen?.length ?? 0) > 0 && (
                <p className="nicht-enthalten">
                  Nicht enthalten:{" "}
                  {karte.dicke_mm.ausgeschlossen!
                    .map((a) => `${rolleLesbar(a.rolle)} (${a.grund})`)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div>
              <dt>Fläche</dt>
              <dd>{karte.werkstueck.flaeche_m2} m²</dd>
            </div>
            <div>
              <dt>Gewicht</dt>
              <dd>{karte.gewicht_kg_m2.wert} kg/m²</dd>
            </div>
            <div>
              <dt>Brand</dt>
              <dd>{karte.brand.klasse ?? karte.brand.status.replace(/_/g, " ")}</dd>
            </div>
          </dl>

          {gruppen.map((g) => (
            <div key={g.titel} className="gruppe">
              <h3>{g.titel}</h3>
              {g.zeilen.map((z) => (
                <Zeile key={z.rolle} karte={karte} z={z} />
              ))}
            </div>
          ))}

          <div className="gruppe">
            <h3>Verbrauch</h3>
            <ul className="verbrauch">
              {karte.verbrauch.positionen.map((p, i) => (
                <li key={i}>
                  <span>{rolleLesbar(p.rolle)}</span>
                  <span className="menge">
                    {p.wert} {p.einheit}
                  </span>
                  <Ampel freigabe={p.freigabe} />
                </li>
              ))}
            </ul>
          </div>

          {karte.videos.length > 0 && (
            <div className="gruppe">
              <h3>Videos</h3>
              <ul className="verweise">
                {karte.videos.map((v, i) => (
                  <li key={i}>
                    <a href={v.url} target="_blank" rel="noreferrer">
                      ▶ {v.dokument}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {schritte.length > 0 && (
            <div className="gruppe arbeitsfolge">
              <h3>Arbeitsfolge</h3>
              <ol>
                {schritte.map((s) => (
                  <li key={s.nr}>
                    <span className="schritt-titel">{s.titel}</span>
                    {s.werte.length > 0 && (
                      <dl className="schritt-werte">
                        {s.werte.map((w) => (
                          <div key={w.was}>
                            <dt>{w.was}</dt>
                            <dd>{w.wert}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {s.werkzeuge.length > 0 && (
                      <p className="schritt-neben">Werkzeug: {s.werkzeuge.join(", ")}</p>
                    )}
                    {s.sicherheit.length > 0 && (
                      <p className="schritt-neben schritt-sicherheit">
                        Sicherheit: {s.sicherheit.join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <footer className="fuss">
            <p>{karte.dokumente_hinweis}</p>
            <p className="hash-zeile">
              Karte {karte.karte_sha256.slice(0, 12)}… · Werte eingefroren auf{" "}
              {karte.resolve_manifest_sha256.slice(0, 12)}…
            </p>
            {/* Was die Zahl bedeutet, gehört daneben. Ein Hash ohne Aussage darüber, WAS an ihm
                geprüft wurde, liest sich wie ein Siegel — und ist keins. Hier stimmt bewiesen:
                Karte und Manifest im Bundle gehören zusammen. Nicht bewiesen: dass der Hash zum
                Inhalt passt (dafür müsste JS Pythons Zahlendarstellung treffen). */}
            <p className="hash-zeile hash-fussnote">
              Manifest im Auftrag gefunden und mit der Karte abgeglichen. Ob der Hash zum Inhalt
              des Manifests passt, prüft dieses Gerät nicht.
            </p>
          </footer>
        </section>
      )}
    </main>
  );
}
