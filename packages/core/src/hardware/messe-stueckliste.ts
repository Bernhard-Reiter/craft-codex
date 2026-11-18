/**
 * Stückliste für den Messe-Unterschrank (IHM Ziel 2).
 *
 * Rechnet NUR aus den Maßen in MESSE_UNTERSCHRANK, keine neuen Maße und
 * keine Preise. Was in der Vorlage nicht belegt ist, steht hier mit
 * `annahme: true`. Oberboden und Rückwand folgen der 3D-Szene
 * (MesseSchrank.tsx, Demo) und sind ebenfalls Annahme.
 */

import { BLUM_MOVENTO, MESSE_UNTERSCHRANK } from "./messe-unterschrank.js";

export type StuecklistenZeile = {
  gruppe: "Korpus" | "Front" | "Schubkasten" | "Beschlag";
  teil: string;
  anzahl: number;
  /** Länge × Breite × Stärke in mm, leer wenn nicht belegt. */
  mass: string;
  material: string;
  annahme: boolean;
  hinweis: string;
};

const m = MESSE_UNTERSCHRANK;
const P = m.plattenstaerke;
const fmt = (a: number, b: number, c: number) => `${a} × ${b} × ${c}`;

export function buildMesseStueckliste(): StuecklistenZeile[] {
  const lichteBreite = m.korpus.breite - 2 * P;
  const zeilen: StuecklistenZeile[] = [
    {
      gruppe: "Korpus",
      teil: "Seite",
      anzahl: 2,
      mass: fmt(m.korpus.hoehe, m.korpus.tiefe, P),
      material: `Platte ${P} mm (Demo-Katalog)`,
      annahme: false,
      hinweis: "Korpus 600 × 850 × 575, Freigabe Meister",
    },
    {
      gruppe: "Korpus",
      teil: "Unterboden",
      anzahl: 1,
      mass: fmt(lichteBreite, m.korpus.tiefe, P),
      material: `Platte ${P} mm (Demo-Katalog)`,
      annahme: true,
      hinweis: "Unterboden zwischen den Seiten (Annahme)",
    },
    {
      gruppe: "Korpus",
      teil: "Oberboden",
      anzahl: 1,
      mass: fmt(lichteBreite, m.korpus.tiefe, P),
      material: `Platte ${P} mm (Demo-Katalog)`,
      annahme: true,
      hinweis: "zwischen den Seiten, wie in der 3D-Szene (Annahme)",
    },
    {
      gruppe: "Korpus",
      teil: "Rückwand",
      anzahl: 1,
      mass: fmt(lichteBreite, m.korpus.hoehe - 2 * P, P),
      material: `Platte ${P} mm (Demo-Katalog)`,
      annahme: true,
      hinweis: "19 zwischen Seiten und Böden, wie in der 3D-Szene (Annahme)",
    },
    {
      gruppe: "Front",
      teil: "Tür",
      anzahl: 1,
      mass: fmt(m.tuer.hoehe, m.tuer.breite, P),
      material: `Platte ${P} mm (Demo-Katalog)`,
      annahme: true,
      hinweis: "Höhe folgt aus der Schubkastenfront (Annahme)",
    },
    {
      gruppe: "Front",
      teil: "Schubkastenfront",
      anzahl: 1,
      mass: fmt(m.schubkastenFront.hoehe, m.schubkastenFront.breite, P),
      material: `Platte ${P} mm (Demo-Katalog)`,
      annahme: true,
      hinweis: "Fronthöhe nicht belegt, Bernhard sagt das Maß",
    },
    ...m.schubkastenTeile.map((t): StuecklistenZeile => {
      const i = t.search(/ \d/);
      const name = t.slice(0, i);
      const mass = t.slice(i + 1);
      return {
        gruppe: "Schubkasten",
        teil: name,
        anzahl: 1,
        mass,
        material: "Platte 16 mm",
        annahme: false,
        hinweis: "Holzschubkasten H 150 / LW 562 (cody-cad B2a)",
      };
    }),
    {
      gruppe: "Beschlag",
      teil: "Blum CLIP top BLUMOTION 110° 71B3550",
      anzahl: 2,
      mass: "",
      material: "Topfband",
      annahme: false,
      hinweis: "zwei Scharniere an der Tür, Anschlag links",
    },
    {
      gruppe: "Beschlag",
      teil: "Blum Kreuzmontageplatte 173L6100",
      anzahl: 2,
      mass: "",
      material: "Montageplatte",
      annahme: false,
      hinweis: "auf der linken Korpusseite",
    },
    {
      gruppe: "Beschlag",
      teil: `${BLUM_MOVENTO.artikel} NL ${BLUM_MOVENTO.nennlaenge}`,
      anzahl: 1,
      mass: "",
      material: "Unterflurführung (Paar)",
      annahme: false,
      hinweis: "Schraubpunkte außer 37 nicht bestätigt",
    },
    {
      gruppe: "Beschlag",
      teil: BLUM_MOVENTO.kupplung,
      anzahl: 1,
      mass: "",
      material: "Kupplung (Satz)",
      annahme: false,
      hinweis: "",
    },
  ];
  return zeilen;
}

const csvFeld = (s: string | number) => {
  const t = String(s);
  return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** CSV mit Semikolon (Excel DE), erste Zeile = Kopf. */
export function messeStuecklisteCsv(zeilen = buildMesseStueckliste()): string {
  const kopf = ["Gruppe", "Teil", "Anzahl", "Maß L × B × S (mm)", "Material", "Annahme", "Hinweis"];
  const reihen = zeilen.map((z) =>
    [z.gruppe, z.teil, z.anzahl, z.mass, z.material, z.annahme ? "ja" : "", z.hinweis]
      .map(csvFeld)
      .join(";"),
  );
  return [kopf.join(";"), ...reihen].join("\n") + "\n";
}
