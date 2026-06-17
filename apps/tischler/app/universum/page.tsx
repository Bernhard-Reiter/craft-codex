import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";

/**
 * Das Craft Codex Universum — das Vision-Manifest (Bernhard, 16.06.2026).
 * Sein Wortlaut, getreu typografiert im ruhigen VOAI-Paper-/Jakarta-Design.
 * Die Seite selbst ist der Beweis der Vision: Cody verwandelt Worte in ein
 * lebendiges Werkzeug.
 */

const ROLLEN: Array<{ wer: string; was: string }> = [
  {
    wer: "Der Meister",
    was: "ist die Quelle. Sein Wissen, sein Auge, sein Gefühl fürs Material — das ist der Rohstoff.",
  },
  {
    wer: "Der Lehrer",
    was: "führt und ordnet. Er macht aus Erfahrung Lehrstoff.",
  },
  {
    wer: "Der Schüler",
    was: "baut. Er beschreibt das Handwerk in seiner Sprache, und Cody formt daraus ein interaktives Werkzeug — Stimme, VR, am Werkstück.",
  },
  {
    wer: "Cody",
    was: "ist der unsichtbare Motor. Er ersetzt niemanden. Er ist der Webstuhl, an dem die Gemeinschaft webt — man sieht ihn nie, man sieht nur, was entsteht.",
  },
];

const NUTZEN: Array<{ wer: string; was: string }> = [
  {
    wer: "Der Meister",
    was: "sein Lebenswerk geht nicht verloren, sondern weiter. Und das ewig Wiederholte übernimmt die Maschine: Zeit zurück für das, was nur ein Mensch kann.",
  },
  {
    wer: "Der Lehrer",
    was: "einen neuen Lehrplan und Schüler, die etwas können, das es vorher nicht gab.",
  },
  {
    wer: "Der Schüler",
    was: "lernt von einem geduldigen Meister rund um die Uhr und lernt zugleich, KI zu bauen. Wer das Handwerk beherrscht und die KI dazu, ist unersetzlich.",
  },
  {
    wer: "Die Region",
    was: "wird Vorreiter einer neuen Disziplin und hält die Jungen im Tal, statt sie zu verlieren.",
  },
  {
    wer: "Europa",
    was: "ein Handwerks-Wissens-Commons, das offen bleibt. Der Output dieser Schicht ist frei. Made in Europe, und es bleibt in Europa.",
  },
];

export default function UniversumPage() {
  return (
    <>
      <main className="cc-reader">
        {/* HERO */}
        <section>
          <div className="cc-eyebrow">
            <span className="cc-winkel" />
            <span>Die Vision · gemeinsam gebaut</span>
          </div>
          <h1 className="cc-display" style={{ maxWidth: "22ch" }}>
            Das Craft Codex <span className="cc-hl">Universum</span>.
          </h1>
          <p className="cc-lead" style={{ marginTop: "1.1rem" }}>
            Cody, Schüler und Lehrer bauen es gemeinsam — Generation für
            Generation.
          </p>
        </section>

        {/* KEIN PRODUKT */}
        <section>
          <p className="cc-kicker">Kein Produkt. Ein Universum.</p>
          <p className="cc-lead" style={{ margin: "0.9rem 0 0", maxWidth: "60ch" }}>
            Craft Codex ist kein fertiges Werkzeug, das man kauft. Es ist ein
            lebendes, wachsendes Universum aus Handwerkswissen — und es gehört
            allen, die es bauen.
          </p>
          <p className="cc-sub" style={{ marginTop: "1rem" }}>
            Es beginnt klein: mit den Zinken in der Tischlerei. Aber jede Branche
            ist eine eigene Welt in diesem Universum — der Metaller, die
            Elektrotechnik, der Maschinenbau, jedes Handwerk und jede technische
            Disziplin. Das Universum dehnt sich aus, Welt für Welt, Meister für
            Meister, Generation für Generation.
          </p>
        </section>

        {/* DAS WARUM */}
        <section>
          <p className="cc-kicker">Das Warum</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", margin: "0.6rem 0 0.9rem", maxWidth: "20ch" }}>
            Mit jedem Meister, der geht, stirbt ein <span className="cc-hl">Leben voll Wissen</span>.
          </h2>
          <p className="cc-sub">
            Bisher war das ein Verlust ohne Rückweg. Jetzt nicht mehr: Das Wissen
            des alten Meisters kann eingefangen, geprüft und weitergegeben werden
            — nicht als totes Lehrbuch, sondern als ein geduldiger digitaler
            Meister, der nie müde wird und in der Sprache des Lehrlings antwortet.
            Das Handwerk wird nicht konserviert wie im Museum. Es lebt und wächst
            ins KI-Zeitalter hinein.
          </p>
        </section>

        {/* WIE ES GEBAUT WIRD */}
        <section>
          <p className="cc-kicker">Wie es gebaut wird — die Gemeinschaft ist der Baumeister</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", margin: "0.6rem 0 1.25rem", maxWidth: "24ch" }}>
            Nicht einer baut. Cody verwandelt die Worte der Gemeinschaft in
            <span className="cc-hl"> lebendige Werkzeuge</span>.
          </h2>
          <div className="cc-grid-cards">
            {ROLLEN.map((r) => (
              <div key={r.wer} className="cc-card cc-card--flat">
                <p style={{ margin: 0, fontWeight: 600 }}>{r.wer}</p>
                <p className="cc-muted" style={{ margin: "0.4rem 0 0", lineHeight: 1.55, fontSize: "0.9rem" }}>
                  {r.was}
                </p>
              </div>
            ))}
          </div>
          <p className="cc-note" style={{ marginTop: "1.5rem" }}>
            <strong>Das Bauen ist der Lehrplan.</strong> Während die Schüler das
            Universum erweitern, lernen sie eine neue Disziplin — Angewandte KI:
            sie lernen das Handwerk und sie lernen, die KI dafür zu bauen.
          </p>
          <p className="cc-note cc-note--official" style={{ marginTop: "0.9rem" }}>
            Bevor ein Werkzeug jemanden unterrichtet, gibt ein Meister es frei.
            Der digitale Meister <strong>erfindet nichts</strong> — jede Antwort
            steht auf geprüftem Wissen aus echter Quelle.
          </p>
        </section>

        {/* DAS SCHWUNGRAD */}
        <section>
          <p className="cc-kicker">Das Schwungrad</p>
          <p
            style={{
              margin: "0.9rem 0 0",
              fontSize: "clamp(1.05rem, 2vw, 1.4rem)",
              lineHeight: 1.5,
              fontWeight: 500,
              borderLeft: "4px solid var(--cc-yellow)",
              paddingLeft: "1rem",
              maxWidth: "60ch",
            }}
          >
            mehr Schüler bauen → mehr Meisterwissen wird eingefangen → bessere
            Werkzeuge → mehr Branchen → mehr Schüler, die das Handwerk wieder als
            Zukunft sehen → die bauen wieder mehr.
          </p>
          <p className="cc-sub" style={{ marginTop: "1rem" }}>
            Kein einzelner Mensch ist der Flaschenhals. Cody skaliert das Bauen,
            die Gemeinschaft skaliert das Wissen — vom Tischler bis zum Metaller,
            ohne dass einer allein jedes Werkzeug bauen müsste.
          </p>
        </section>

        {/* WAS JEDER BEKOMMT */}
        <section>
          <p className="cc-kicker">Was jeder bekommt</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.9rem" }}>
            {NUTZEN.map((n) => (
              <div
                key={n.wer}
                className="cc-card cc-card--flat cc-stack-sm"
                style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,3fr)", gap: "1rem", alignItems: "baseline" }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>{n.wer}</p>
                <p className="cc-muted" style={{ margin: 0, lineHeight: 1.55, fontSize: "0.9rem" }}>
                  {n.was}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CODY — UNSICHTBARER MOTOR */}
        <section>
          <p className="cc-kicker">Cody — der unsichtbare Motor</p>
          <p className="cc-sub" style={{ marginTop: "0.9rem" }}>
            Cody selbst bleibt verborgen. Niemand sieht ihn — die Gemeinschaft
            sieht nur, was entsteht: das wachsende Universum. Der Motor ist das
            Geheimnis, der Output ist das Geschenk. So kann das Universum
            großzügig offen sein, ohne dass je preisgegeben wird, womit es gewebt
            wurde.
          </p>
        </section>

        {/* HORIZONT */}
        <section>
          <div className="cc-card cc-card--dark">
            <p className="cc-kicker" style={{ color: "var(--cc-yellow)" }}>
              <span style={{ color: "var(--cc-paper)" }}>Der Horizont</span>
            </p>
            <p style={{ color: "var(--cc-paper)", fontSize: "clamp(1.05rem, 2vw, 1.4rem)", lineHeight: 1.5, margin: "0.9rem 0 0", maxWidth: "56ch" }}>
              In zehn, in zwanzig Jahren trägt das Universum das gesammelte
              Wissen unzähliger Meister aus jeder Branche — laufend erweitert von
              jeder neuen Generation, frei verfügbar, unterrichtet von
              unermüdlichen digitalen Meistern. Und daneben bleibt das
              Unersetzliche: die Hand, das Auge, das Urteil des Menschen.
            </p>
            <p style={{ color: "var(--cc-paper)", margin: "1.25rem 0 0", fontWeight: 600, fontSize: "1.1rem" }}>
              Das Wissen des alten Meisters stirbt nicht mehr mit ihm. Es lebt
              weiter — und jede Generation baut es größer.
            </p>
            <p style={{ color: "var(--cc-yellow)", margin: "1.5rem 0 0", fontStyle: "italic" }}>
              Das ist das Craft Codex Universum.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/lernen" className="cc-btn cc-btn--primary">
                Wo es beginnt: die Zinken →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
