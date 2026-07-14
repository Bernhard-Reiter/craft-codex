import { useTranslations } from "next-intl";

/**
 * OfflineTrust — der DSGVO-/Vertrauens-Satz für den Pitch.
 *
 * Berufsschulen in Österreich haben Datenschutzbeauftragte. Der stärkste
 * Vertrauens-Move: sichtbar machen, dass nichts das Gerät verlässt. Killt den
 * Datenschutz-Einwand, bevor er kommt.
 */
export function OfflineTrust({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("workshop.offlineTrust");
  return (
    <span className="cc-trust" title={t("title")}>
      {compact ? t("compact") : t("full")}
    </span>
  );
}
