"use client";

/**
 * Schlichte virtuelle Hobelbank für die VR-Fassung: Platte, Füße,
 * Vorderzange. Maße in Metern, Arbeitshöhe 0,85 m. Das Werkstück steht in
 * der Zange (Position `zangeOben` = Oberkante der Bankplatte, vorne links).
 */
export const BANK_HOEHE = 0.85;
export const ZANGE_POSITION: [number, number, number] = [-0.35, BANK_HOEHE + 0.08, -0.29];

export function XRHobelbank() {
  const holz = "#b8875a";
  const dunkel = "#7a5636";
  return (
    <group position={[0, 0, -0.6]}>
      {/* Platte */}
      <mesh position={[0, BANK_HOEHE - 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.6]} />
        <meshStandardMaterial color={holz} roughness={0.8} />
      </mesh>
      {/* Füße */}
      {[[-0.7, -0.24], [0.7, -0.24], [-0.7, 0.24], [0.7, 0.24]].map(([x, z], i) => (
        <mesh key={i} position={[x!, (BANK_HOEHE - 0.08) / 2, z!]}>
          <boxGeometry args={[0.08, BANK_HOEHE - 0.08, 0.08]} />
          <meshStandardMaterial color={dunkel} />
        </mesh>
      ))}
      {/* Vorderzange (Backe vor der Platte) */}
      <mesh position={[-0.35, BANK_HOEHE - 0.08, 0.33]}>
        <boxGeometry args={[0.3, 0.16, 0.06]} />
        <meshStandardMaterial color={dunkel} />
      </mesh>
      {/* Boden-Andeutung */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}
