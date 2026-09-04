"use client";

/**
 * Die Bildschirm-Szene des Möbels: das FreeCAD-Modell aus dem Bundle, ein Tap auf ein Brett
 * öffnet seine Materialkarte. Die Brille kommt danach — mit dem horizon-Kit (Bernhards
 * Kit-Direktive), nicht mit handgenagelten Containern; die Verdrahtung Tap → Schlüssel → Karte
 * ist hier dieselbe und in `lib/werkstoff/szene.ts` ohne WebGL geprüft.
 *
 * Was hier NICHT geprüft ist: das Bild selbst. Screenshots am WebGL-Canvas sind blind; die
 * Kamera wird deshalb aus der Bounding-Box gerechnet (`kameraAufBox`), nicht geraten.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { kameraAufBox, schluesselAusObjekt, type Kamera } from "../lib/werkstoff/szene";

interface Props {
  url: string;
  /** Schlüssel des gewählten Teils (»teil:Se:links«) — wird hervorgehoben. */
  gewaehlt: string | null;
  /** Bretter ohne Karte (benannte Lücke) — grau, damit man sieht: hier ist das Material offen. */
  luecken: string[];
  onTeil: (schluessel: string) => void;
}

const FOV = 45;

function Moebel({ url, gewaehlt, luecken, onTeil, onKamera }: Props & { onKamera: (k: Kamera) => void }) {
  const gltf = useLoader(GLTFLoader, url);
  const { camera } = useThree();
  const szene = useMemo(() => gltf.scene, [gltf]);

  // Kamera aus der Box des geladenen Modells — einmal je Modell, gerechnet. Das Blickziel geht
  // auch an die OrbitControls: sonst ziehen sie den Blick auf (0,0,0), und das ist beim
  // FreeCAD-Export die ECKE des Möbels — die Bildmitte läge auf der Kante (gemessen 04.09.).
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(szene);
    const k = kameraAufBox(
      { min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] },
      FOV,
    );
    camera.position.set(...k.position);
    camera.near = k.nah;
    camera.far = k.fern;
    camera.lookAt(...k.ziel);
    camera.updateProjectionMatrix();
    onKamera(k);
  }, [szene, camera, onKamera]);

  // Hervorhebung: das gewählte Teil heller, eine Lücke grau — alle anderen ihr eigenes Material.
  // Jedes Mesh bekommt sein eigenes Material (der Exporter teilt eines für alle Bretter).
  useEffect(() => {
    const grau = new Set(luecken);
    szene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const teil = schluesselAusObjekt(mesh);
      if (!mesh.userData.eigenesMaterial) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (!m || Array.isArray(m)) return;
        mesh.material = m.clone();
        mesh.userData.eigenesMaterial = true;
        mesh.userData.basisFarbe = (mesh.material as THREE.MeshStandardMaterial).color.clone();
      }
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.copy(mesh.userData.basisFarbe as THREE.Color);
      if (teil && grau.has(teil)) mat.color.setRGB(0.62, 0.64, 0.66);
      if (teil && teil === gewaehlt) mat.color.offsetHSL(0, 0, 0.25);
    });
  }, [szene, gewaehlt, luecken]);

  const tippen = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const s = schluesselAusObjekt(e.object);
    if (s) onTeil(s);
  };

  return <primitive object={szene} onClick={tippen} />;
}

export function WerkstoffSzene(p: Props) {
  // Die gerechnete Kamera steht als data-Attribut am Container: Sonden (und Menschen mit den
  // Entwicklerwerkzeugen) können nachsehen, wohin geschaut wird — der Canvas selbst ist für
  // Screenshots blind.
  const [kamera, setKamera] = useState<Kamera | null>(null);
  const runden = (v: number[]) => v.map((x) => Math.round(x * 1000) / 1000).join(",");
  return (
    <div
      className="szene"
      aria-label="3D-Modell des Möbels — Brett antippen"
      data-ziel={kamera ? runden(kamera.ziel) : undefined}
      data-position={kamera ? runden(kamera.position) : undefined}
    >
      <Canvas camera={{ fov: FOV, position: [2, 2, 2] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 3]} intensity={1.1} />
        <Suspense fallback={null}>
          <Moebel {...p} onKamera={setKamera} />
        </Suspense>
        <OrbitControls makeDefault target={kamera?.ziel} />
      </Canvas>
    </div>
  );
}
