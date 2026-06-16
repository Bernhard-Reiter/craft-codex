/**
 * OfflineTrust — der DSGVO-/Vertrauens-Satz für den Pitch.
 *
 * Berufsschulen in Österreich haben Datenschutzbeauftragte. Der stärkste
 * Vertrauens-Move: sichtbar machen, dass nichts das Gerät verlässt. Killt den
 * Datenschutz-Einwand, bevor er kommt.
 */
export function OfflineTrust({ compact = false }: { compact?: boolean }) {
  return (
    <span className="cc-trust" title="Läuft vollständig lokal — offline-fest gebaut">
      {compact
        ? "Läuft lokal · offline-fest"
        : "Läuft lokal · kein Byte verlässt das Gerät"}
    </span>
  );
}
