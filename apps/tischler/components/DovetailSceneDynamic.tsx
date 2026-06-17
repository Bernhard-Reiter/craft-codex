"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-Variante der 3D-Bühne: three.js + @react-three landen NICHT im
 * Haupt-Bundle der Seite, sondern werden erst geladen, wenn die Bühne
 * tatsächlich rendert. ssr:false — WebGL ist client-only. Spart ~400-500 kB
 * First-Load-JS auf /werkstatt und /dovetail (schwacher Beamer-Laptop).
 */
export const DovetailScene = dynamic(
  () => import("./DovetailScene").then((m) => m.DovetailScene),
  { ssr: false, loading: () => null },
);
