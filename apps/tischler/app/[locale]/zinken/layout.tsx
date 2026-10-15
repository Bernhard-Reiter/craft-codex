import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

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

export default function ZinkenLayout({ children }: { children: ReactNode }) {
  return children;
}
