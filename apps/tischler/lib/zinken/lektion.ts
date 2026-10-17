/**
 * Geführte Lektion — das "Regie"-Skript für die interaktive Werkstatt.
 *
 * Modell (Bernhard 16.06.): GEFÜHRT + KI-Assist. Ein fester, pitch-sicherer
 * Beat-Pfad; der Meister erzählt jeden Beat, der Lernende steuert vor/zurück
 * und kann JEDERZEIT per Stimme fragen (KI-Assist-Schicht). Letzter Beat =
 * XR-Übergabe ("jetzt du am Holz"), weil beim Pitch ein Quest-Headset live
 * dabei ist.
 *
 * Jeder Beat sagt der Bühne, WELCHE Fläche sie zeigt und WAS der Meister sagt.
 * Slice 1 nutzt die 3D-Fläche pro Handschritt (vorhandene DovetailScene) +
 * XR-Übergabe. Tafel-Live-Anriss / Video sind als surface-Typen vorbereitet
 * (Slice 2), ohne das Schema zu ändern.
 */

import type { DovetailStep } from "@craft-codex/core";
import type { KapitelId } from "./kapitel";

export type LektionSurface = "joint3d" | "tafel" | "video" | "xr";

export interface LektionBeat {
  id: string;
  /** Kapitel des Lehrgangs, zu dem dieser Beat gehört (kapitel.ts). */
  kapitel: KapitelId;
  /** Kurzlabel für die Beat-Leiste */
  label: string;
  /** Welche Fläche die Bühne zeigt */
  surface: LektionSurface;
  /** Für 3D-Beats: welcher Lernschritt (treibt Anrisslinien). */
  step?: DovetailStep;
  /** Überschrift im Meister-Panel */
  titel: string;
  /**
   * Was der Meister bei diesem Beat sagt — warm, kurz, gesprochen.
   * ⚠️ Wortlaut = TTS-Cache-Key (build-tts-cache.mjs): nicht beiläufig ändern,
   * sonst greift die vorvertonte Stimme nicht.
   */
  meisterSays: string;
  /** Nur XR-Beat: Ziel der Übergabe. */
  href?: string;
}

export const SCHWALBENSCHWANZ_LEKTION: readonly LektionBeat[] = [
  {
    id: "ueberblick",
    kapitel: "warum",
    label: "Überblick",
    surface: "joint3d",
    step: "ueberblick",
    titel: "Das bauen wir",
    meisterSays:
      "Schau dir die fertige Verbindung an. Zwei Bretter, die sich über Eck verzahnen — die keilförmigen Zinken verhaken sich und halten ohne Leim. Dreh sie ruhig, dann fangen wir an.",
  },
  {
    id: "anreissen",
    kapitel: "anzeichnen",
    label: "Anreißen",
    surface: "joint3d",
    step: "anreissen",
    titel: "Schritt 1 — Anreißen",
    meisterSays:
      "Zuerst reißen wir an. Mit dem Streichmaß die Grundlinie am Zinkenbrett nur auf beiden Flächen reißen, dann die Schrägen im Hirnholz mit der Schmiege, Anschlag an der Fläche. Die roten Linien sind die Grundlinie, die orangen die Schräge.",
  },
  {
    id: "saegen",
    kapitel: "saegen",
    label: "Sägen",
    surface: "joint3d",
    step: "saegen",
    titel: "Schritt 2 — Sägen",
    meisterSays:
      "Jetzt wird gesägt — immer auf der Abfallseite der Linie. Die Anrisslinie bleibt als feiner Strich stehen, sie ist später deine Prüfmarke beim Passen.",
  },
  {
    id: "stemmen",
    kapitel: "stemmen",
    label: "Stemmen",
    surface: "joint3d",
    step: "stemmen",
    titel: "Schritt 3 — Stemmen",
    meisterSays:
      "Beim Stemmen erst senkrecht in die Anrisslinie einschlagen, dann flach von unten das Material wegspalten. Niemals tiefer als die Streichmaß-Linie.",
  },
  {
    id: "passen",
    kapitel: "zusammenfuehren",
    label: "Passen",
    surface: "joint3d",
    step: "passen",
    titel: "Schritt 4 — Passen",
    meisterSays:
      "Trocken anpassen, ohne Leim. Geht es ohne Druck rein, ist es zu lose. Klemmt es, suchst du die Glanzstellen und nimmst sie punktgenau mit dem Stemmeisen ab.",
  },
  {
    id: "pruefen",
    kapitel: "zusammenfuehren",
    label: "Prüfen",
    surface: "joint3d",
    step: "pruefen",
    titel: "Schritt 5 — Prüfen",
    meisterSays:
      "Zum Schluss prüfen wir gegen die Soll-Geometrie — das grüne Hologramm. Dein Werkstück soll ihm so nah wie möglich kommen: kein Spalt, kein Hirnholz-Ausriss.",
  },
  // Kapitel-Folge hier bewusst nicht monoton: der XR-Beat gehört zu »kontrolle« (Kap. 3, Prüfbild in der Brille),
  // steht aber nach »zusammenfuehren« (Kap. 9), weil die Übergabe ans echte Holz den Lehrgang abschließt (#62 N3).
  {
    id: "xr-uebergabe",
    kapitel: "kontrolle",
    label: "Jetzt du (XR)",
    surface: "xr",
    titel: "Jetzt du — am echten Holz",
    meisterSays:
      "Genug zugeschaut. Setz die Brille auf: die Verbindung schwebt auf deiner Werkbank, und die Hologramm-Führung zeigt dir Schritt für Schritt, wo du anreißt, sägst und stemmst.",
    href: "/dovetail/xr",
  },
] as const;

export function getLektion(): readonly LektionBeat[] {
  return SCHWALBENSCHWANZ_LEKTION;
}
