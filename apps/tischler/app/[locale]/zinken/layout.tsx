import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import "../../_vi4/look.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "zinken.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { languages: { de: "/de/zinken", en: "/en/zinken", "x-default": "/de/zinken" } },
  };
}

// VI4-Look (VOAI Paper, Navy) nur für den Lehrgang: siehe lib/look.ts und app/_vi4/look.css.
export default function ZinkenLayout({ children }: { children: ReactNode }) {
  return (
    <div data-look="vi4" className="vi4-flaeche">
      {children}
    </div>
  );
}
