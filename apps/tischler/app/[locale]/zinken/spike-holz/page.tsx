import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SpikeHolzSeite } from "../../../../components/zinken/SpikeHolzSeite";

/**
 * P6-Spike »Holz auf der Quest« (Plan v2): Messseite für die Quest 3, kein
 * Lehrinhalt. Nicht verlinkt, nicht im Index (robots noindex, nofollow).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "zinken.spikeHolz.meta" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { languages: { de: "/de/zinken/spike-holz", en: "/en/zinken/spike-holz" } },
  };
}

export default function SpikeHolzPage() {
  return <SpikeHolzSeite />;
}
