/**
 * Geführte Lektion — ENGLISCHER Zwilling von lektion.ts.
 *
 * Struktur, IDs, surfaces, steps und hrefs sind identisch zur deutschen
 * Quelle; NUR die sichtbaren Texte (label, titel, meisterSays) sind ins
 * Englische übersetzt (US English, Meister-zu-Lehrling-Ton).
 * Typen kommen aus lektion.ts — so erzwingt der Compiler die
 * Struktur-Gleichheit.
 *
 * ⚠️ meisterSays = TTS-Cache-Key (build-tts-cache.mjs): Für die englischen
 * Sätze existiert noch KEIN vorvertonter Cache — bei Einführung der
 * EN-Stimme zuerst den Cache bauen, danach Wortlaut nicht beiläufig ändern.
 */

import type { LektionBeat } from "./lektion";

export const SCHWALBENSCHWANZ_LEKTION_EN: readonly LektionBeat[] = [
  {
    id: "ueberblick",
    label: "Overview",
    surface: "joint3d",
    step: "ueberblick",
    titel: "This is what we'll build",
    meisterSays:
      "Take a look at the finished joint. Two boards meshing at a corner — the wedge-shaped tails lock into the pins and hold without glue. Go ahead, turn it around. Then we'll get started.",
  },
  {
    id: "anreissen",
    label: "Lay out",
    surface: "joint3d",
    step: "anreissen",
    titel: "Step 1 — Lay out",
    meisterSays:
      "First we lay out. Scribe the board thickness all the way around with the marking gauge, then set the dovetail angles with the bevel gauge. The red lines are your chopping depth, the orange ones are the angle.",
  },
  {
    id: "saegen",
    label: "Saw",
    surface: "joint3d",
    step: "saegen",
    titel: "Step 2 — Saw",
    meisterSays:
      "Now we saw — always on the waste side of the line. The layout line stays as a fine mark; later it's your reference when you fit the joint.",
  },
  {
    id: "stemmen",
    label: "Chop",
    surface: "joint3d",
    step: "stemmen",
    titel: "Step 3 — Chop",
    meisterSays:
      "When you chop, first strike straight down into the scribe line, then come in flat from below and split the waste away. Never go deeper than the marking-gauge line.",
  },
  {
    id: "passen",
    label: "Fit",
    surface: "joint3d",
    step: "passen",
    titel: "Step 4 — Fit",
    meisterSays:
      "Fit it dry, no glue. If it slides in with no pressure, it's too loose. If it binds, look for the shiny spots and pare them off, right on the mark, with your chisel.",
  },
  {
    id: "pruefen",
    label: "Check",
    surface: "joint3d",
    step: "pruefen",
    titel: "Step 5 — Check",
    meisterSays:
      "Finally we check against the target geometry — the green hologram. Your workpiece should come as close to it as you can: no gaps, no tear-out in the end grain.",
  },
  {
    id: "xr-uebergabe",
    label: "Your turn (XR)",
    surface: "xr",
    titel: "Your turn — on real wood",
    meisterSays:
      "Enough watching. Put on the headset: the joint floats on your workbench, and the hologram guide shows you step by step where to lay out, saw, and chop.",
    href: "/dovetail/xr",
  },
] as const;

export function getLektionEn(): readonly LektionBeat[] {
  return SCHWALBENSCHWANZ_LEKTION_EN;
}
