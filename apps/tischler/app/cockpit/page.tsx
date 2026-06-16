import { OfflineTrust } from "../../components/OfflineTrust";
import { SiteFooter } from "../../components/SiteFooter";

/**
 * Lehrer-Cockpit (Pitch-Mockup, statisch).
 *
 * Beantwortet den Direktoren-Einwand „ersetzt das den Lehrer?": Nein — der
 * Meister sieht jederzeit, wo jede:r steht und wer ihn braucht. Die KI macht
 * die Wiederholung, der Meister die Korrektur.
 *
 * Bewusst statisches Mockup: für den Pitch identisch im Eindruck, ohne
 * Echtzeit-Infrastruktur/DSGVO-Last. Die echte Telemetrie folgt nach
 * Förderzusage (liefert dann auch die Outcomes für den Abschlussbericht).
 */

interface Lernender {
  name: string;
  schritt: string;
  fortschritt: number;
  status: "laeuft" | "braucht-meister" | "fertig";
  hinweis?: string;
}

const KLASSE: Lernender[] = [
  { name: "Sarah B.", schritt: "Prüfen", fortschritt: 95, status: "fertig", hinweis: "Spalt 0,1 mm — sehr sauber" },
  { name: "Lena M.", schritt: "Passen", fortschritt: 80, status: "laeuft" },
  {
    name: "Tobias K.",
    schritt: "Stemmen",
    fortschritt: 55,
    status: "braucht-meister",
    hinweis: "3× nach „Hirnholz-Ausriss“ gefragt",
  },
  { name: "David R.", schritt: "Anreißen", fortschritt: 20, status: "laeuft" },
  { name: "Mehmet Y.", schritt: "Sägen", fortschritt: 40, status: "laeuft" },
];

function StatusBadge({ s }: { s: Lernender["status"] }) {
  if (s === "braucht-meister")
    return <span className="cc-badge cc-badge--yellow">braucht Meister</span>;
  if (s === "fertig")
    return <span className="cc-badge cc-badge--good">fertig</span>;
  return <span className="cc-badge">läuft</span>;
}

export default function CockpitPage() {
  const offen = KLASSE.filter((l) => l.status === "braucht-meister").length;

  return (
    <>
      <main className="cc-reader">
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel" />
            <span>Lehrer-Ansicht</span>
          </div>
          <h1 className="cc-display">
            Der Meister <span className="cc-hl">sieht alles.</span>
          </h1>
          <p className="cc-lead" style={{ marginTop: "1.1rem" }}>
            Craft Codex ersetzt keinen Lehrer. Es zeigt ihm in Echtzeit, wo jede
            und jeder steht — und wer ihn gerade braucht.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.1rem", flexWrap: "wrap" }}>
            <OfflineTrust />
            <span className="cc-badge cc-badge--yellow">
              {offen} {offen === 1 ? "Lehrling braucht" : "Lehrlinge brauchen"} dich
            </span>
          </div>
        </section>

        <section>
          <p className="cc-kicker" style={{ marginBottom: "0.9rem" }}>
            Klasse 1b · Schwalbenschwanz
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {KLASSE.map((l) => (
              <div
                key={l.name}
                className="cc-card cc-card--flat"
                data-active={l.status === "braucht-meister" ? "true" : undefined}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,2fr) auto",
                  gap: "1rem",
                  alignItems: "center",
                  ...(l.status === "braucht-meister"
                    ? { borderColor: "var(--cc-yellow-deep)", boxShadow: "0 0 0 1px var(--cc-yellow-deep)" }
                    : {}),
                }}
              >
                <div style={{ fontWeight: 600 }}>{l.name}</div>
                <div className="cc-mono cc-muted">Schritt: {l.schritt}</div>
                <div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--cc-gray)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${l.fortschritt}%`,
                        height: "100%",
                        background: "var(--cc-yellow)",
                      }}
                    />
                  </div>
                  {l.hinweis && (
                    <p className="cc-muted" style={{ margin: "0.3rem 0 0", fontSize: "0.75rem" }}>
                      {l.hinweis}
                    </p>
                  )}
                </div>
                <StatusBadge s={l.status} />
              </div>
            ))}
          </div>

          <p className="cc-note" style={{ marginTop: "1.5rem" }}>
            <strong>Die KI übernimmt die Wiederholung — der Meister die
            Korrektur.</strong> Das Geduldige, ewig Wiederholte macht das Tool;
            für das, was nur ein Mensch kann, bleibt mehr Zeit. Der Lernfortschritt
            ist jederzeit sichtbar und lässt sich für den Förder-Abschlussbericht
            exportieren.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
