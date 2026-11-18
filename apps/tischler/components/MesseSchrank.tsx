"use client";

/**
 * Messe-Unterschrank als ganzer Schrank in Originalgröße (AR).
 *
 * Maße nur aus MESSE_UNTERSCHRANK (core, aus cody-cad daten, siehe PR 79).
 * Gezeichnet wird in Millimetern mit y nach oben: Ursprung = Mitte der
 * Unterkante an der Korpus-Vorderkante, die Front zeigt nach +z, die Tiefe
 * geht nach −z. Die Umrechnung nach Meter macht die äußere Group.
 *
 * Aufbau wie in der Demo-Vorlage: Seiten über die volle Höhe, Unter- und
 * Oberboden zwischen den Seiten, Rückwand 19 zwischen (Demo, synthetisch).
 * Tür mit Fuge 2 aufliegend über die ganze Höhe, Schubkasten als Innenauszug
 * dahinter ohne eigene Front (wie cody-cad, Meister 1172 18.11.2026).
 *
 * Montage-Leuchten: der aktive Schritt färbt das Teil, an dem gearbeitet
 * wird (Tür bei B1/B2, linke Korpusseite bei B3/M1, Schubkasten bei M2).
 * Bei B4 und M2 steht die Tür offen und der Schubkasten ist ausgezogen.
 */

import { MESSE_UNTERSCHRANK as M } from "@craft-codex/core";

const SCALE_MM_TO_M = 0.001;

const FARBE = {
  korpus: "#d9cdb4",
  rueckwand: "#bfb39a",
  front: "#f4efe4",
  kante: "#3a3428",
  griff: "#7a7468",
  kasten: "#e6dcc6",
  leuchten: "#ff8a00",
};

type Teil = "tuer" | "seite" | "schubkasten";

/** Welches Teil bei welchem Montage-Schritt leuchtet. */
export function teilFuer(stepId: string | undefined): Teil | null {
  if (!stepId) return null;
  if (stepId.startsWith("B1.") || stepId.startsWith("B2.") || stepId.startsWith("B4.")) return "tuer";
  if (stepId.startsWith("B3.") || stepId.startsWith("M1.")) return "seite";
  if (stepId.startsWith("M2.")) return "schubkasten";
  return null;
}

/** Tür offen + Schubkasten heraus: beim Einclipsen (B4) und beim Schubkasten (M2), sonst wäre er verdeckt (H6). */
export function offenFuer(stepId: string | undefined): boolean {
  return !!stepId && (stepId.startsWith("B4.") || stepId.startsWith("M2."));
}

/** Tür offen (rad) und Auszug (mm), siehe offenFuer (B4 + M2). */
const TUER_OFFEN = -Math.PI * 0.55;
const AUSZUG_MM = 400; // MOVENTO NL 500, nicht ganz ausgezogen

function Platte({
  groesse,
  pos,
  farbe,
  leuchtet = false,
}: {
  groesse: [number, number, number];
  pos: [number, number, number];
  farbe: string;
  leuchtet?: boolean;
}) {
  return (
    <mesh position={pos}>
      <boxGeometry args={groesse} />
      <meshStandardMaterial
        color={leuchtet ? FARBE.leuchten : farbe}
        emissive={leuchtet ? FARBE.leuchten : "#000000"}
        emissiveIntensity={leuchtet ? 0.6 : 0}
        roughness={0.8}
      />
    </mesh>
  );
}

export function MesseSchrank({ activeStepId }: { activeStepId?: string }) {
  const teil = teilFuer(activeStepId);
  const offen = offenFuer(activeStepId);
  const { breite: B, hoehe: H, tiefe: T } = M.korpus;
  const s = M.plattenstaerke;
  const fuge = (B - M.tuer.breite) / 2; // 2 mm, aus den Frontmaßen abgeleitet
  const innen = B - 2 * s;
  const fz = s / 2; // Fronten liegen vor dem Korpus

  const tuerMitteY = fuge + M.tuer.hoehe / 2;

  return (
    <group scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}>
      {/* Seiten (k = −1 ist links) */}
      {[-1, 1].map((k) => (
        <Platte
          key={k}
          groesse={[s, H, T]}
          pos={[k * (B / 2 - s / 2), H / 2, -T / 2]}
          farbe={FARBE.korpus}
          leuchtet={k === -1 && teil === "seite"}
        />
      ))}
      {/* Unter- und Oberboden zwischen den Seiten */}
      <Platte groesse={[innen, s, T]} pos={[0, s / 2, -T / 2]} farbe={FARBE.korpus} />
      <Platte groesse={[innen, s, T]} pos={[0, H - s / 2, -T / 2]} farbe={FARBE.korpus} />
      {/* Rückwand 19 zwischen (Demo) */}
      <Platte
        groesse={[innen, H - 2 * s, s]}
        pos={[0, H / 2, -T + s / 2]}
        farbe={FARBE.rueckwand}
      />
      {/* Tür über die ganze Höhe (wie cody-cad), Anschlag links: dreht um die linke Kante */}
      <group position={[-M.tuer.breite / 2, tuerMitteY, s]} rotation={[0, offen ? TUER_OFFEN : 0, 0]}>
        <Platte
          groesse={[M.tuer.breite, M.tuer.hoehe, s]}
          pos={[M.tuer.breite / 2, 0, fz - s]}
          farbe={FARBE.front}
          leuchtet={teil === "tuer"}
        />
        <Platte
          groesse={[12, 120, 20]}
          pos={[M.tuer.breite - 40, M.tuer.hoehe / 2 - 120, 10]}
          farbe={FARBE.griff}
        />
      </group>
      {/* Innenschubkasten hinter der Tür (H 150, keine eigene Front): fährt bei offener Tür aus */}
      <group position={[0, 0, offen ? AUSZUG_MM : 0]}>
        <Platte
          groesse={[innen - 32, 150, 490]}
          pos={[0, s + 10 + 75, -245]}
          farbe={FARBE.kasten}
          leuchtet={teil === "schubkasten"}
        />
      </group>
    </group>
  );
}

/** Abstand Werkstück → Schrank in mm (Luft zwischen den Kanten). */
const LUFT_MM = 300;

/**
 * Schrank neben dem registrierten Werkstück. Das Werkstück liegt flach,
 * sein Frame ist zentriert, x rechts, y oben (entlang der Fläche), z aus der
 * Fläche nach oben. Der Schrank steht rechts daneben auf derselben
 * Tischfläche, die Front zeigt zur Unterkante des Werkstücks.
 */
export function MesseSchrankNebenWerkstueck({
  werkstueckBreiteMm,
  werkstueckDickeMm = M.plattenstaerke,
  activeStepId,
}: {
  werkstueckBreiteMm: number;
  werkstueckDickeMm?: number;
  activeStepId?: string;
}) {
  const x = (werkstueckBreiteMm / 2 + LUFT_MM + M.korpus.breite / 2) * SCALE_MM_TO_M;
  const z = -werkstueckDickeMm * SCALE_MM_TO_M;
  return (
    <group position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
      <MesseSchrank activeStepId={activeStepId} />
    </group>
  );
}

/**
 * Browser-Vorschau: das Werkstück steht aufrecht (zentriert, y oben), der
 * Schrank steht rechts daneben, Unterkanten bündig.
 */
export function MesseSchrankNebenTafel({
  werkstueckBreiteMm,
  werkstueckHoeheMm,
  activeStepId,
}: {
  werkstueckBreiteMm: number;
  werkstueckHoeheMm: number;
  activeStepId?: string;
}) {
  const x = (werkstueckBreiteMm / 2 + LUFT_MM + M.korpus.breite / 2) * SCALE_MM_TO_M;
  const y = (-werkstueckHoeheMm / 2) * SCALE_MM_TO_M;
  return (
    <group position={[x, y, 0]}>
      <MesseSchrank activeStepId={activeStepId} />
    </group>
  );
}

/** Bühne der 3D-Vorschau: Werkstück-Tafel ja/nein, Kamera und Drehpunkt in m. */
export type Buehne = {
  tafel: boolean;
  kamera: [number, number, number];
  ziel: [number, number, number];
  fov: number;
};

/** Hawa/Blum wie bisher: Tafel zentriert, ein 2-m-Türblatt passt ganz ins Bild (sichtbare Höhe ≈ 2,4 m bei z = 2,9). */
export const STANDARD_BUEHNE: Buehne = { tafel: true, kamera: [0, 0, 2.9], ziel: [0, 0, 0], fov: 45 };

/**
 * H7 Messe: keine graue Werkstück-Tafel, der Schrank steht allein (Ursprung = Mitte
 * unten an der Front). Kamera von links oben, damit die linke Korpusseite (B3/M1)
 * leuchtend zu sehen ist; Drehpunkt tiefer als halbe Höhe und z = 1,7, damit der
 * ausgezogene Kasten (M2) und die offene Tür (B4/M2) ganz ins Bild passen.
 */
export const MESSE_BUEHNE: Buehne = {
  tafel: false,
  kamera: [-0.8, 0.65, 1.7],
  ziel: [0, 0.35, -0.05],
  fov: 45,
};

export function buehneFuer(istMesse: boolean): Buehne {
  return istMesse ? MESSE_BUEHNE : STANDARD_BUEHNE;
}
