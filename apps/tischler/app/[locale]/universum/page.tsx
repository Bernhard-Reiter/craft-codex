import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteFooter } from "../../../components/SiteFooter";
import { Link } from "../../../i18n/navigation";

/**
 * Das Craft Codex Universum — das Vision-Manifest (Bernhard, 16.06.2026).
 * Sein Wortlaut, getreu typografiert im ruhigen VOAI-Paper-/Jakarta-Design.
 * Die Seite selbst ist der Beweis der Vision: Cody verwandelt Worte in ein
 * lebendiges Werkzeug.
 */

const ROLLEN_COUNT = 4;
const NUTZEN_COUNT = 5;

export default function UniversumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("universe");

  const rollen = Array.from({ length: ROLLEN_COUNT }, (_, i) => ({
    wer: t(`how.roles.${i}.who`),
    was: t(`how.roles.${i}.what`),
  }));
  const nutzen = Array.from({ length: NUTZEN_COUNT }, (_, i) => ({
    wer: t(`benefits.items.${i}.who`),
    was: t(`benefits.items.${i}.what`),
  }));

  const hl = (chunks: React.ReactNode) => (
    <span className="cc-hl">{chunks}</span>
  );
  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  return (
    <>
      <main className="cc-reader">
        {/* HERO */}
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel" />
            <span>{t("eyebrow")}</span>
          </div>
          <h1 className="cc-display" style={{ maxWidth: "22ch" }}>
            {t.rich("h1", { hl })}
          </h1>
          <p className="cc-lead" style={{ marginTop: "1.1rem" }}>
            {t("lead")}
          </p>
        </section>

        {/* KEIN PRODUKT */}
        <section>
          <p className="cc-kicker">{t("notProduct.kicker")}</p>
          <p className="cc-lead" style={{ margin: "0.9rem 0 0", maxWidth: "60ch" }}>
            {t("notProduct.lead")}
          </p>
          <p className="cc-sub" style={{ marginTop: "1rem" }}>
            {t("notProduct.sub")}
          </p>
        </section>

        {/* DAS WARUM */}
        <section>
          <p className="cc-kicker">{t("why.kicker")}</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", margin: "0.6rem 0 0.9rem", maxWidth: "20ch" }}>
            {t.rich("why.title", { hl })}
          </h2>
          <p className="cc-sub">{t("why.body")}</p>
        </section>

        {/* WIE ES GEBAUT WIRD */}
        <section>
          <p className="cc-kicker">{t("how.kicker")}</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", margin: "0.6rem 0 1.25rem", maxWidth: "24ch" }}>
            {t.rich("how.title", { hl })}
          </h2>
          <div className="cc-grid-cards">
            {rollen.map((r) => (
              <div key={r.wer} className="cc-card cc-card--flat">
                <p style={{ margin: 0, fontWeight: 600 }}>{r.wer}</p>
                <p className="cc-muted" style={{ margin: "0.4rem 0 0", lineHeight: 1.55, fontSize: "0.9rem" }}>
                  {r.was}
                </p>
              </div>
            ))}
          </div>
          <p className="cc-note" style={{ marginTop: "1.5rem" }}>
            {t.rich("how.note1", { strong })}
          </p>
          <p className="cc-note cc-note--official" style={{ marginTop: "0.9rem" }}>
            {t.rich("how.note2", { strong })}
          </p>
        </section>

        {/* DAS SCHWUNGRAD */}
        <section>
          <p className="cc-kicker">{t("flywheel.kicker")}</p>
          <p
            style={{
              margin: "0.9rem 0 0",
              fontSize: "clamp(1.05rem, 2vw, 1.4rem)",
              lineHeight: 1.5,
              fontWeight: 500,
              borderLeft: "4px solid var(--cc-yellow)",
              paddingLeft: "1rem",
              maxWidth: "60ch",
            }}
          >
            {t("flywheel.chain")}
          </p>
          <p className="cc-sub" style={{ marginTop: "1rem" }}>
            {t("flywheel.body")}
          </p>
        </section>

        {/* WAS JEDER BEKOMMT */}
        <section>
          <p className="cc-kicker">{t("benefits.kicker")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.9rem" }}>
            {nutzen.map((n) => (
              <div
                key={n.wer}
                className="cc-card cc-card--flat cc-stack-sm"
                style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,3fr)", gap: "1rem", alignItems: "baseline" }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>{n.wer}</p>
                <p className="cc-muted" style={{ margin: 0, lineHeight: 1.55, fontSize: "0.9rem" }}>
                  {n.was}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CODY — UNSICHTBARER MOTOR */}
        <section>
          <p className="cc-kicker">{t("engine.kicker")}</p>
          <p className="cc-sub" style={{ marginTop: "0.9rem" }}>
            {t("engine.body")}
          </p>
        </section>

        {/* HORIZONT */}
        <section>
          <div className="cc-card cc-card--dark">
            <p className="cc-kicker" style={{ color: "var(--cc-yellow)" }}>
              <span style={{ color: "var(--cc-paper)" }}>{t("horizon.kicker")}</span>
            </p>
            <p style={{ color: "var(--cc-paper)", fontSize: "clamp(1.05rem, 2vw, 1.4rem)", lineHeight: 1.5, margin: "0.9rem 0 0", maxWidth: "56ch" }}>
              {t("horizon.body")}
            </p>
            <p style={{ color: "var(--cc-paper)", margin: "1.25rem 0 0", fontWeight: 600, fontSize: "1.1rem" }}>
              {t("horizon.punch")}
            </p>
            <p style={{ color: "var(--cc-yellow)", margin: "1.5rem 0 0", fontStyle: "italic" }}>
              {t("horizon.tagline")}
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/lernen" className="cc-btn cc-btn--primary">
                {t("horizon.cta")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
