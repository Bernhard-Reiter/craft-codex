/**
 * Meldet genau einmal je XR-Sitzung, dass sie zu Ende ist (Übergang
 * »Sitzung da« → »keine Sitzung«). Damit setzt die Seite den Zustand der
 * Sitzung zurück (Modus, Registrierung …). Eine alte Pose darf in der
 * nächsten Sitzung nicht als »ausgerichtet« weiterleben, denn der Raum
 * ist dann ein anderer.
 */
export interface SitzungsQuelle {
  subscribe(listener: (s: { session?: unknown }) => void): () => void;
}

export function beiSitzungsEnde(store: SitzungsQuelle, onEnde: () => void): () => void {
  let aktiv = false;
  return store.subscribe((s) => {
    if (s.session) {
      aktiv = true;
    } else if (aktiv) {
      aktiv = false;
      onEnde();
    }
  });
}
