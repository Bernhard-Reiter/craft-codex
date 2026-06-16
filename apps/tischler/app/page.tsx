import Link from "next/link";
import { DemoResetButton } from "../components/DemoResetButton";
import { SiteFooter } from "../components/SiteFooter";
import { SystemStatus } from "../components/SystemStatus";

const pieces: Array<{
  href: string;
  num: string;
  title: string;
  body: string;
  cta: string;
}> = [
  {
    href: "/lernen",
    num: "00",
    title: "Zinken verstehen",
    body: "Von ganz vorne: Was ist ein Zinken, wofür ist er gut, welche Arten gibt es? Erst verstehen — dann anreißen. Mit Lernpfad und der Stimme des Meisters.",
    cta: "Überblick starten",
  },
  {
    href: "/dovetail",
    num: "01",
    title: "Schwalbenschwanz",
    body: "Die Königsdisziplin der Eckverbindung — parametrisch in 3D. Pins, Winkel und Brettmaße live ziehen, alle fünf Lernschritte vom Anreißen bis zum Prüfen.",
    cta: "Werkstatt öffnen",
  },
  {
    href: "/voice",
    num: "02",
    title: "Stimme des Meisters",
    body: "Fragen stellen wie am Hobel nebenan: Antworten aus dem Fachkorpus mit Quellen aus offiziellen Regelwerken — gesprochen, auch komplett ohne Netz.",
    cta: "Stimme testen",
  },
  {
    href: "/dovetail/xr",
    num: "03",
    title: "Hologramm (WebXR)",
    body: "Dasselbe Werkstück immersiv: Quest 3 oder Galaxy XR aufsetzen, das Brett schwebt auf Tischhöhe im Raum — Lernschritte per Handgriff wechseln.",
    cta: "XR starten",
  },
];

export default function Page() {
  return (
    <>
      <main>
        {/* Hero — CyberCraft-Statement: groß, schwarz auf weiß, gelber Marker. */}
        <section className="cc-page" style={{ paddingTop: "3.5rem" }}>
          <p className="cc-kicker">Offener Wissenspool fürs Handwerk</p>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
              margin: "1rem 0 1.25rem",
              maxWidth: "16ch",
            }}
          >
            Handwerk. <span className="cc-mark">Hologramm.</span> Meisterwissen.
          </h1>
          <p
            className="cc-muted"
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: "58ch",
              margin: 0,
            }}
          >
            Craft Codex bringt das Wissen der Meister dorthin, wo gearbeitet
            wird: als parametrisches 3D-Werkstück, als Stimme, die Fachfragen
            beantwortet, und als Hologramm im Raum. Offline-fest gebaut — für
            Werkstätten, nicht für Schönwetter-WLAN.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              margin: "1.75rem 0 2.5rem",
            }}
          >
            <Link href="/lernen" className="cc-btn cc-btn--primary">
              Überblick starten
            </Link>
            <Link href="/dovetail" className="cc-btn">
              Werkstatt öffnen
            </Link>
            <Link href="/dovetail/xr" className="cc-btn cc-btn--dark">
              XR-Demo
            </Link>
          </div>

          {/* Live verlötet: probt Health-Route, TTS-Cache, WebXR, Korpus. */}
          <SystemStatus />
        </section>

        {/* Werkstücke */}
        <section className="cc-page" style={{ marginTop: "3.5rem" }}>
          <h2 className="cc-section-title">Werkstücke</h2>
          <div className="cc-grid-cards">
            {pieces.map((p) => (
              <Link key={p.href} href={p.href} className="cc-card">
                <span className="cc-card-num">{p.num}</span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    margin: "0.75rem 0 0.5rem",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="cc-muted"
                  style={{ margin: 0, lineHeight: 1.55, fontSize: "0.9rem" }}
                >
                  {p.body}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "1rem",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    borderBottom: "3px solid var(--cc-yellow)",
                  }}
                >
                  {p.cta} →
                </span>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: "2.5rem" }}>
            <DemoResetButton />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
