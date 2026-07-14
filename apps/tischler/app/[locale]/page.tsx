import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { DemoResetButton } from "../../components/DemoResetButton";
import { SiteFooter } from "../../components/SiteFooter";
import { SystemStatus } from "../../components/SystemStatus";
import { Link } from "../../i18n/navigation";

const PIECE_HREFS = ["/lernen", "/dovetail", "/voice", "/dovetail/xr"] as const;

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  const pieces = PIECE_HREFS.map((href, i) => ({
    href,
    num: t(`pieces.${i}.num`),
    title: t(`pieces.${i}.title`),
    body: t(`pieces.${i}.body`),
    cta: t(`pieces.${i}.cta`),
  }));

  return (
    <>
      <main>
        {/* Hero — CyberCraft-Statement: groß, schwarz auf weiß, gelber Marker. */}
        <section className="cc-page" style={{ paddingTop: "3.5rem" }}>
          <p className="cc-kicker">{t("kicker")}</p>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
              margin: "1rem 0 1.25rem",
              maxWidth: "16ch",
            }}
          >
            {t.rich("h1", {
              mark: (chunks) => <span className="cc-mark">{chunks}</span>,
            })}
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
            {t("intro")}
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
              {t("ctaOverview")}
            </Link>
            <Link href="/dovetail" className="cc-btn">
              {t("ctaWorkshop")}
            </Link>
            <Link href="/dovetail/xr" className="cc-btn cc-btn--dark">
              {t("ctaXr")}
            </Link>
          </div>

          {/* Live verlötet: probt Health-Route, TTS-Cache, WebXR, Korpus. */}
          <SystemStatus />
        </section>

        {/* Werkstücke */}
        <section className="cc-page" style={{ marginTop: "3.5rem" }}>
          <h2 className="cc-section-title">{t("piecesTitle")}</h2>
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
                    fontWeight: 600,
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

        {/* Vision — das Universum (der grosse Bogen) */}
        <section className="cc-page" style={{ marginTop: "3.5rem", paddingBottom: "1rem" }}>
          <Link
            href="/universum"
            className="cc-card cc-card--dark"
            style={{ display: "block" }}
          >
            <p className="cc-kicker" style={{ color: "var(--cc-yellow)" }}>
              <span style={{ color: "var(--cc-paper)" }}>
                {t("vision.kicker")}
              </span>
            </p>
            <h2
              style={{
                color: "var(--cc-paper)",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                margin: "0.6rem 0 0.75rem",
                maxWidth: "26ch",
              }}
            >
              {t.rich("vision.title", {
                hl: (chunks) => <span className="cc-hl">{chunks}</span>,
              })}
            </h2>
            <p style={{ color: "var(--cc-paper)", opacity: 0.85, margin: 0, maxWidth: "52ch", lineHeight: 1.55 }}>
              {t("vision.body")}
            </p>
            <span
              style={{
                display: "inline-block",
                marginTop: "1rem",
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--cc-yellow)",
              }}
            >
              {t("vision.cta")}
            </span>
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
