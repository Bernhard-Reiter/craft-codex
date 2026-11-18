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
 * Fronten mit Fuge 2 aufliegend. Tür oben, Schubkasten unten (Annahme wie
 * in PR 79).
 */

import { MESSE_UNTERSCHRANK as M } from "@craft-codex/core";

const SCALE_MM_TO_M = 0.001;

const FARBE = {
  korpus: "#d9cdb4",
  rueckwand: "#bfb39a",
  front: "#f4efe4",
  kante: "#3a3428",
  griff: "#7a7468",
};

function Platte({
  groesse,
  pos,
  farbe,
}: {
  groesse: [number, number, number];
  pos: [number, number, number];
  farbe: string;
}) {
  return (
    <mesh position={pos}>
      <boxGeometry args={groesse} />
      <meshStandardMaterial color={farbe} roughness={0.8} />
    </mesh>
  );
}

export function MesseSchrank() {
  const { breite: B, hoehe: H, tiefe: T } = M.korpus;
  const s = M.plattenstaerke;
  const fuge = (B - M.tuer.breite) / 2; // 2 mm, aus den Frontmaßen abgeleitet
  const innen = B - 2 * s;
  const fz = s / 2; // Fronten liegen vor dem Korpus

  const tuerMitteY = H - fuge - M.tuer.hoehe / 2;
  const skMitteY = fuge + M.schubkastenFront.hoehe / 2;

  return (
    <group scale={[SCALE_MM_TO_M, SCALE_MM_TO_M, SCALE_MM_TO_M]}>
      {/* Seiten */}
      {[-1, 1].map((k) => (
        <Platte
          key={k}
          groesse={[s, H, T]}
          pos={[k * (B / 2 - s / 2), H / 2, -T / 2]}
          farbe={FARBE.korpus}
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
      {/* Tür oben, Anschlag links */}
      <Platte
        groesse={[M.tuer.breite, M.tuer.hoehe, s]}
        pos={[0, tuerMitteY, fz]}
        farbe={FARBE.front}
      />
      <Platte
        groesse={[12, 120, 20]}
        pos={[M.tuer.breite / 2 - 40, tuerMitteY - M.tuer.hoehe / 2 + 120, s + 10]}
        farbe={FARBE.griff}
      />
      {/* Schubkastenfront unten */}
      <Platte
        groesse={[M.schubkastenFront.breite, M.schubkastenFront.hoehe, s]}
        pos={[0, skMitteY, fz]}
        farbe={FARBE.front}
      />
      <Platte
        groesse={[160, 12, 20]}
        pos={[0, skMitteY + M.schubkastenFront.hoehe / 2 - 40, s + 10]}
        farbe={FARBE.griff}
      />
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
}: {
  werkstueckBreiteMm: number;
  werkstueckDickeMm?: number;
}) {
  const x = (werkstueckBreiteMm / 2 + LUFT_MM + M.korpus.breite / 2) * SCALE_MM_TO_M;
  const z = -werkstueckDickeMm * SCALE_MM_TO_M;
  return (
    <group position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
      <MesseSchrank />
    </group>
  );
}
