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
import {
  karteFuer,
  ladeAuftrag,
  luecke,
  schluesselKurz,
  type Auftrag,
  type AuftragLuecke,
} from "../../../lib/werkstoff/auftrag";
import { ladeSzene, type Szene } from "../../../lib/werkstoff/szene";
import { WerkstoffSzene } from "../../../components/WerkstoffSzene";

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
  // Der Auftrag bestimmt, welche Bretter es gibt — nicht eine Liste im Code. Fehlt er, gibt es
  // kein Brett und den Satz dazu; ein Katalog-Beispiel an seiner Stelle wäre das falsche Material.
  const [auftrag, setAuftrag] = useState<Auftrag | null>(null);
  const [auftragFehler, setAuftragFehler] = useState<string | null>(null);
  // Die Szene wird erst gezeigt, wenn das Modell zum Auftrag passt (lib/werkstoff/szene.ts).
  // `szene === undefined` heißt: noch nicht geprüft; `null`: kein Modell im Bundle.
  const [szene, setSzene] = useState<Szene | null | undefined>(undefined);
  const [szeneFehler, setSzeneFehler] = useState<string | null>(null);
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  // Ein angetipptes Brett ohne Karte: kein Fehler, sondern der Grund — Material noch offen.
  const [lueckeGewaehlt, setLueckeGewaehlt] = useState<AuftragLuecke | null>(null);
  const [karte, setKarte] = useState<Materialkarte | null>(null);
  const [stand, setStand] = useState<Bundlestand | null>(null);
  const [grenze, setGrenze] = useState<Datengrenze | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    ladeKatalogstand().then(setStand).catch((e) => setFehler(String(e.message ?? e)));
    // Fehlt die Grenzaussage, bleibt es still — kein Fehler, aber auch kein Satz, den
    // niemand belegen kann.
    ladeDatengrenze().then(setGrenze);
    ladeAuftrag()
      .then(setAuftrag)
      .catch((e) => setAuftragFehler(String(e.message ?? e)));
  }, []);

  useEffect(() => {
    if (!auftrag) return;
    let abgebrochen = false;
    ladeSzene(auftrag)
      .then((s) => !abgebrochen && setSzene(s))
      .catch((e) => {
        if (abgebrochen) return;
        setSzene(null); // nie ein Modell zeigen, das nicht zum Auftrag passt
        setSzeneFehler(String(e.message ?? e));
      });
    return () => {
      abgebrochen = true;
    };
  }, [auftrag]);

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
  // Ein Tap führt über den Schlüssel: zur Karte, wenn es eine gibt — sonst zur benannten Lücke.
  const tippeTeil = (schluessel: string) => {
    if (!auftrag) return;
    const id = karteFuer(auftrag, schluessel);
    if (id) {
      setLueckeGewaehlt(null);
      setGewaehlt(gewaehlt === id ? null : id);
      return;
    }
    const l = auftrag.teile_ohne_karte.find((t) => t.schluessel === schluessel);
    if (l) {
      setGewaehlt(null);
      setLueckeGewaehlt(lueckeGewaehlt?.schluessel === l.schluessel ? null : l);
    }
  };
  const bretter = useMemo(
    () =>
      auftrag
        ? [
            ...auftrag.teile.map((t) => ({ ...t, luecke: undefined as AuftragLuecke | undefined })),
            ...auftrag.teile_ohne_karte.map((t) => ({ ...t, luecke: t })),
          ].sort((a, b) => a.schluessel.localeCompare(b.schluessel))
        : [],
    [auftrag],
  );
  // Für die Hervorhebung in der Szene: der Schlüssel des gewählten Bretts — Karte oder Lücke.
  const gewaehltSchluessel = useMemo(
    () =>
      lueckeGewaehlt?.schluessel ??
      auftrag?.teile.find((t) => t.werkstueck_id === gewaehlt)?.schluessel ??
      null,
    [auftrag, gewaehlt, lueckeGewaehlt],
  );
  const schritte = useMemo(() => (karte ? arbeitsfolge(karte) : []), [karte]);

  return (
    <main className="werkstoff">
      <header className="kopf">
        <h1>Materialwissen am Werkstück</h1>
        <p className="herkunft">
          {stand
            ? `Katalogstand ${stand.stand} · ${stand.dateien} Datendateien · ${stand.sha256.slice(0, 12)}…`
            : "Katalogstand wird gelesen …"}
        </p>
        {auftrag && (
          <p className="herkunft">
            Möbel {auftrag.moebel_id} · Revision {auftrag.revision} · Plan{" "}
            {auftrag.buildplan_sha256.slice(0, 12)}…
          </p>
        )}
        {/* Die getragene Lücke auf Plan-Ebene (R48b-6): was dem Plan mit Absicht fehlt, steht hier —
            unter dem Plan-Hash, nicht nur im Bundle. React escaped — der Loader prüft KEINE Zeichen,
            der Wächter dafür ist panel.test.tsx. Schlüssel mit Index: zwei gleiche Hinweise sind erlaubt. */}
        {auftrag?.hinweise?.map((h, i) => (
          <p key={`${i}-${h}`} className="herkunft hinweis-plan">
            ⓘ {h}
          </p>
        ))}
        {auftragFehler && <p className="fehler">⚠ Kein Auftrag im Bundle: {auftragFehler}</p>}
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

      {szene && (
        <WerkstoffSzene
          url={szene.url}
          gewaehlt={gewaehltSchluessel}
          luecken={auftrag?.teile_ohne_karte.map((l) => l.schluessel) ?? []}
          onTeil={tippeTeil}
        />
      )}
      {szene === null && !szeneFehler && (
        <p className="hinweis-klein">Kein 3D-Modell im Auftrag — Teile unten antippen.</p>
      )}
      {szeneFehler && <p className="fehler">⚠ {szeneFehler}</p>}

      <section className="teile" aria-label="Werkstücke antippen">
        {bretter.map((w) => {
          const aktiv = w.luecke
            ? lueckeGewaehlt?.schluessel === w.schluessel
            : gewaehlt === w.werkstueck_id;
          return (
            <button
              key={w.schluessel}
              type="button"
              className={`teil ${w.luecke ? "luecke" : ""} ${aktiv ? "aktiv" : ""}`}
              onClick={() => tippeTeil(w.schluessel)}
              aria-pressed={aktiv}
            >
              <span className="teilname">{schluesselKurz(w.schluessel)}</span>
              <span className="teilmass">{w.luecke ? "Material noch offen" : w.werkstueck_id}</span>
            </button>
          );
        })}
      </section>

      {auftrag && lueckeGewaehlt && (
        <section className="luecke-hinweis" aria-live="polite">
          <h2>{schluesselKurz(lueckeGewaehlt.schluessel)} — Material noch offen</h2>
          <p>
            Aufbau {lueckeGewaehlt.aufbau}: {luecke(auftrag, lueckeGewaehlt.schluessel)?.grund}
          </p>
          <p className="hinweis-klein">
            Der Plan verlangt dieses Brett, der Katalog kennt seinen Aufbau nicht. Welches Material
            verbaut wird, entscheidet der Betrieb — nicht das Werkzeug.
          </p>
        </section>
      )}

      {fehler && <p className="fehler">⚠ {fehler}</p>}

      {karte && (
        <section className="karte" aria-live="polite">
          <header className="kartenkopf">
            <div>
              <h2>{karte.werkstueck.bezeichnung}</h2>
              <p className="aufbau">
                Teil {karte.werkstueck.id} · Aufbau {karte.aufbau.bezeichnung} ({karte.aufbau.id}@
                {karte.aufbau.revision})
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
