import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { OfflineTrust } from "../../../components/OfflineTrust";
import { SiteFooter } from "../../../components/SiteFooter";

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

type LernStatus = "laeuft" | "braucht-meister" | "fertig";

interface Lernender {
  fortschritt: number;
  status: LernStatus;
  hatHinweis?: boolean;
}

// Namen/Schritte/Hinweise kommen aus messages/{locale}/cockpit.json
// (students.<index>.*) — hier nur die sprachneutralen Werte.
const KLASSE: Lernender[] = [
  { fortschritt: 95, status: "fertig", hatHinweis: true },
  { fortschritt: 80, status: "laeuft" },
  { fortschritt: 55, status: "braucht-meister", hatHinweis: true },
  { fortschritt: 20, status: "laeuft" },
  { fortschritt: 40, status: "laeuft" },
];

function StatusBadge({ s }: { s: LernStatus }) {
  const t = useTranslations("cockpit");
  if (s === "braucht-meister")
    return (
      <span className="cc-badge cc-badge--yellow">
        {t("status.braucht-meister")}
      </span>
    );
  if (s === "fertig")
    return <span className="cc-badge cc-badge--good">{t("status.fertig")}</span>;
  return <span className="cc-badge">{t("status.laeuft")}</span>;
}

export default function CockpitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("cockpit");

  const offen = KLASSE.filter((l) => l.status === "braucht-meister").length;

  return (
    <>
      <main className="cc-reader">
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel" />
            <span>{t("eyebrow")}</span>
          </div>
          <h1 className="cc-display">
            {t.rich("h1", {
              hl: (chunks) => <span className="cc-hl">{chunks}</span>,
            })}
          </h1>
          <p className="cc-lead" style={{ marginTop: "1.1rem" }}>
            {t("lead")}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.1rem", flexWrap: "wrap" }}>
            <OfflineTrust />
            <span className="cc-badge cc-badge--yellow">
              {t("needYou", { count: offen })}
            </span>
          </div>
        </section>

        <section>
          <p className="cc-kicker" style={{ marginBottom: "0.9rem" }}>
            {t("classKicker")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {KLASSE.map((l, idx) => (
              <div
                key={t(`students.${idx}.name`)}
                className="cc-card cc-card--flat cc-stack-sm"
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
                <div style={{ fontWeight: 600 }}>{t(`students.${idx}.name`)}</div>
                <div className="cc-mono cc-muted">
                  {t("stepLabel", { step: t(`students.${idx}.step`) })}
                </div>
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
                  {l.hatHinweis && (
                    <p className="cc-muted" style={{ margin: "0.3rem 0 0", fontSize: "0.75rem" }}>
                      {t(`students.${idx}.hint`)}
                    </p>
                  )}
                </div>
                <StatusBadge s={l.status} />
              </div>
            ))}
          </div>

          <p className="cc-note" style={{ marginTop: "1.5rem" }}>
            {t.rich("note", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
