/**
 * Faltet die Zeichen, die die uikit-XR-Schrift NICHT darstellt.
 *
 * Gemessen am Glyphen-Atlas der uikit-1.0-Inter (01.09.2026): Umlaute und ß
 * SIND vorhanden — gefaltet werden nur noch die Technik-Zeichen der
 * Bohrmaße und Typografie: Ø ø ± – — · ≈ → × ² „ " ".
 *
 * Historie: In der uikit-0.8-Linie fehlten auch die Umlaute; die alte,
 * breitere Faltung (ä→ae …) lebte in XRDetailTafel. Nach der Migration auf
 * 1.0 wäre sie eine unnötige Verstümmelung deutscher Texte.
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
    .replace(/[„“”]/g, '"');
}
