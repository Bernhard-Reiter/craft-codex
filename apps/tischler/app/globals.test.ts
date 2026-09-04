/**
 * Ein Stylesheet kann nicht rot werden — deshalb dieser Wächter.
 *
 * `.werkstoff-panel` hat es nie gegeben; der Container heißt `.werkstoff`. Dreizehn Regeln
 * standen unter einem Selektor, den nichts trifft — darunter die komplette Formatierung der
 * Arbeitsfolge (das Raster mit den Presszeiten) und die Dickenspanne. Fachlich war alles da,
 * es sah nur nicht so aus, wie es gebaut war, und kein Test hat es gemerkt: Tests prüfen
 * Verhalten, und totes CSS verhält sich nicht.
 *
 * Der Befund war sogar schon gemeldet (craft#42, Runde 2, zu `.hash-fussnote`) — am Ort
 * geschlossen, das Muster offen gelassen, und die nächste Regel hat ihn geerbt. Genau davor
 * schützt dieser Test: nicht die eine Klasse, sondern die Klasse von Fehler.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const APP = join(__dirname, "..");

function dateien(ordner: string, endungen: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(ordner)) {
    if (name === "node_modules" || name === ".next") continue;
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) out.push(...dateien(pfad, endungen));
    else if (endungen.some((e) => name.endsWith(e))) out.push(pfad);
  }
  return out;
}

/**
 * Klassen, die im CSS stehen und im Markup nicht vorkommen — mit Grund, nicht stillschweigend.
 * Wer hier etwas einträgt, sagt damit: ich habe nachgesehen, und es ist in Ordnung so.
 */
const BEKANNT_UNBENUTZT: Record<string, string> = {
  // Echt tot, aber fremder Code: SystemStatus.tsx setzt `cc-status-dot--on`, nie `--good`.
  // Nicht von mir angefasst — wer den Schaden nicht angerichtet hat, repariert ihn nicht;
  // gemeldet gehört er trotzdem, statt hier zu verschwinden.
  "cc-status-dot--good": "SystemStatus.tsx setzt --on, nicht --good (fremder Code, gemeldet)",
};

describe("globals.css", () => {
  const css = readFileSync(join(APP, "app/globals.css"), "utf8");
  const markup = dateien(APP, [".tsx", ".ts"])
    .filter((p) => !p.endsWith("globals.test.ts"))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");

  /**
   * Die im Markup gesetzten Klassennamen als MENGE — nicht als Fließtext.
   *
   * Vorher stand hier `markup.includes(name)`, also Substring-Suche: eine tote Klasse, die
   * zufällig Teilstring einer lebenden ist (`hash-zeil` in `hash-zeile`), rutschte durch
   * (gemessen von Cody #2 an craft#44). Der reale Fall lief andersherum und wurde gefangen —
   * aber ein Wächter, der nur eine Richtung sieht, ist ein halber.
   *
   * Gesammelt werden ALLE Zeichenketten-Literale, nicht nur `className="…"`. Der erste Anlauf
   * las nur className-Attribute und meldete danach vier Fehlalarme, weil Klassen auch anders
   * gesetzt werden: `classList.add("cc-kiosk")`, `className={x ? "aktiv" : ""}`,
   * Template-Strings. Ein Wächter, der nur die halben Wege kennt, erzeugt Rauschen — und
   * Rauschen führt dazu, dass die Ausnahmeliste wächst statt der Wächter besser wird.
   *
   * Dass dabei Zeichenketten mitkommen, die keine Klassen sind, ist unschädlich: gemeldet wird
   * nur, was NIRGENDS vorkommt.
   */
  function gesetzteKlassen(quelle: string) {
    const genau = new Set<string>();
    const praefixe: string[] = [];
    for (const m of quelle.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)) {
      const roh = m[1] ?? m[2] ?? m[3] ?? "";
      const stuecke = roh.split(/\$\{[^}]*\}/);
      stuecke.forEach((stueck, si) => {
        const teile = stueck.split(/\s+/).filter(Boolean);
        teile.forEach((x, i) => {
          genau.add(x);
          // Letztes Stück vor einem `${…}` ohne trennendes Leerzeichen = dynamisches Präfix,
          // z. B. `cc-status-dot--${x}`.
          if (si < stuecke.length - 1 && i === teile.length - 1 && !/\s$/.test(stueck))
            praefixe.push(x);
        });
      });
    }
    return { genau, praefixe };
  }

  it("jede Klasse im Stylesheet wird auch irgendwo gesetzt", () => {
    // Kommentare zuerst raus: ein Dateiname wie `craft-codex-pitch.html` in einer Anmerkung
    // sieht sonst aus wie die Klasse `html`.
    const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, " ");
    const klassen = [
      ...new Set(ohneKommentare.match(/\.[a-zA-Z][a-zA-Z0-9_-]*/g) ?? []),
    ].map((k) => k.slice(1));
    expect(klassen.length).toBeGreaterThan(50); // sonst prüft der Test nichts
    const { genau, praefixe } = gesetzteKlassen(markup);
    const benutzt = (k: string) =>
      genau.has(k) ||
      // Dynamisch zusammengesetzt: `cc-status-dot--${x}` deckt `cc-status-dot--on` ab.
      praefixe.some((p) => p.length > 3 && k.startsWith(p) && k !== p);
    const tot = klassen.filter((k) => !benutzt(k) && !(k in BEKANNT_UNBENUTZT));
    expect(
      tot,
      "Diese Klassen stehen im Stylesheet, aber kein Markup setzt sie — die Regeln darunter " +
        "sind wirkungslos. Entweder den Selektor richtigstellen oder mit Grund in " +
        "BEKANNT_UNBENUTZT eintragen.",
    ).toEqual([]);
  });

  it("die Ausnahmeliste bleibt ehrlich", () => {
    // Eine Ausnahme ohne Grund ist eine versteckte Lücke; eine Ausnahme, die längst behoben
    // ist, macht die Liste unglaubwürdig.
    for (const [klasse, grund] of Object.entries(BEKANNT_UNBENUTZT)) {
      expect(grund.length, `${klasse} ohne Begründung`).toBeGreaterThan(20);
      expect(css, `${klasse} steht gar nicht mehr im CSS — Eintrag entfernen`).toContain(klasse);
    }
  });
});
