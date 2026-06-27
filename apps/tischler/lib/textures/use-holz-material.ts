"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

/**
 * Fichte-Holzmaterial mit Hirnholz/Laengsholz-Unterscheidung.
 *
 * Die Brett-Geometrie liegt im lokalen mm-System: die Stirnseiten (Normale ~±Z,
 * wo die Zinken sitzen) sind HIRNHOLZ (Jahresringe), alle anderen Flaechen
 * LAENGSHOLZ (laufende Maserung). Per onBeforeCompile waehlt der Shader nach der
 * Flaechen-Normale die richtige Textur und projiziert sie triplanar (UV-frei,
 * funktioniert mit der CSG-Geometrie).
 *
 * Texturen via OpenAI gpt-image-1 generiert.
 */
export function useHolzMaterial(
  baseColor = "#caa46f",
): THREE.MeshStandardMaterial {
  const laengs = useTexture("/textures/fichte-laengsholz.png");
  const hirn = useTexture("/textures/fichte-hirnholz.png");

  return useMemo(() => {
    for (const t of [laengs, hirn]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      roughness: 0.78,
      metalness: 0,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.mapLaengs = { value: laengs };
      shader.uniforms.mapHirn = { value: hirn };
      // Kachelgroesse ~ 80 mm pro Wiederholung.
      shader.uniforms.texScale = { value: 1 / 80 };

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vHolzPos;\nvarying vec3 vHolzNrm;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n  vHolzPos = position;\n  vHolzNrm = normal;",
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            "varying vec3 vHolzPos;",
            "varying vec3 vHolzNrm;",
            "uniform sampler2D mapLaengs;",
            "uniform sampler2D mapHirn;",
            "uniform float texScale;",
          ].join("\n"),
        )
        .replace(
          "#include <map_fragment>",
          [
            "vec3 hN = abs(normalize(vHolzNrm));",
            "vec3 hP = vHolzPos * texScale;",
            "vec3 woodCol;",
            "if (hN.z > 0.55) { woodCol = texture2D(mapHirn, hP.xy).rgb; }",
            "else if (hN.y >= hN.x) { woodCol = texture2D(mapLaengs, hP.xz).rgb; }",
            "else { woodCol = texture2D(mapLaengs, hP.zy).rgb; }",
            "diffuseColor.rgb *= woodCol;",
          ].join("\n"),
        );
    };

    return mat;
  }, [laengs, hirn, baseColor]);
}
