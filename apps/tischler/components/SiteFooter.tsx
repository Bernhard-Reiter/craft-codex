"use client";

import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("common.footer");

  return (
    <footer className="cc-footer">
      <p className="cc-footer-claim">
        {t.rich("claim", { em: (chunks) => <em>{chunks}</em> })}
      </p>
      <div className="cc-footer-meta">
        <span>{t("metaLine")}</span>
        <a
          href="https://github.com/Bernhard-Reiter/craft-codex"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a href="https://cybercraft.institute" target="_blank" rel="noreferrer">
          {t("cybercraft")}
        </a>
      </div>
    </footer>
  );
}
