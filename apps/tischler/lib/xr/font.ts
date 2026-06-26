/**
 * Lokaler 3D-Text-Font fuer alle drei `<Text>`-Labels in der XR-Szene.
 *
 * WARUM lokal: troika-three-text (hinter drei's <Text>) laedt seinen Font sonst
 * vom jsdelivr-CDN (unicode-font-resolver). In der Offline-Demo (WLAN-Ausfall)
 * blieben dann ALLE 3D-Labels — Step-Bar, Voice-Buttons, Platzier-Controls —
 * komplett leer. Mit diesem gebuendelten Noto-Sans (OFL) rendern sie immer.
 *
 * ⚠️ Zeichensatz: Latin-Subset. KEINE Emojis / Pfeil-Glyphen in 3D-Text legen
 * (die wuerden als Leerflaeche erscheinen) — Klartext/ASCII verwenden.
 */
export const XR_FONT_URL = "/fonts/noto-sans-latin.ttf";
