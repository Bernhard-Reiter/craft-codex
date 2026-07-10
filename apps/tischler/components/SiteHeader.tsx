"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation";
import { routing } from "../i18n/routing";
import { DovetailMark } from "./DovetailMark";

const LINKS: Array<{ href: string; key: string }> = [
  { href: "/", key: "start" },
  { href: "/universum", key: "vision" },
  { href: "/lernen", key: "overview" },
  { href: "/werkstatt", key: "lesson" },
  { href: "/cockpit", key: "teacher" },
  { href: "/dovetail", key: "freeBuild" },
  { href: "/dovetail/xr", key: "xr" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common.header");

  return (
    <header className="cc-header">
      <Link href="/" className="cc-logo">
        <DovetailMark />
        <span>
          Craft Codex
          <span style={{ color: "var(--cc-muted)", fontWeight: 600 }}>
            {" "}
            {t("brandSuffix")}
          </span>
        </span>
      </Link>
      <nav className="cc-nav" aria-label={t("navAria")}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={pathname === l.href ? "page" : undefined}
          >
            {t(`nav.${l.key}`)}
          </Link>
        ))}
        <a
          href="https://github.com/Bernhard-Reiter/craft-codex"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
        {/* Sprachumschalter: gleiche Seite, andere Locale. */}
        <span aria-label={t("languageToggle")} style={{ display: "inline-flex", gap: "0.35rem" }}>
          {routing.locales.map((l) => (
            <Link
              key={l}
              href={pathname}
              locale={l}
              aria-current={l === locale ? "true" : undefined}
              style={{
                textTransform: "uppercase",
                fontWeight: l === locale ? 800 : 500,
                borderBottom: l === locale ? "3px solid var(--cc-yellow)" : "none",
              }}
            >
              {l}
            </Link>
          ))}
        </span>
      </nav>
    </header>
  );
}
