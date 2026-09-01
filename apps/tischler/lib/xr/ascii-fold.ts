/**
 * Faltet Text auf Zeichen, die die uikit-XR-Schrift sicher darstellt.
 *
 * Die im Canvas gerenderte uikit-Schrift hat keine Glyphen für Umlaute und
 * einige Sonderzeichen — ungefaltete Texte erscheinen als Kästchen/Lücken
 * (erster Quest-Test der Beschlag-Tafel, 27.08.). drei/troika-Text ist NICHT
 * betroffen, nur @react-three/uikit-Texte müssen hierdurch.
 *
 * Erweiterte Fassung des asciiFold aus XRDetailTafel (dort lokal): zusätzlich
 * Ø/ø, Gedankenstriche, ± und typografische Anführungszeichen — alles, was in
 * den Beschlag-Texten (Bohrmaße!) vorkommt.
 */
export function asciiFold(s: string): string {
  return s
    .replace(/·/g, "*")
    .replace(/≈/g, "~")
    .replace(/→/g, "->")
    .replace(/×/g, "x")
    .replace(/²/g, "2")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/[—–]/g, "-")
    .replace(/±/g, "+/-")
    .replace(/[„“”]/g, '"')
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}
