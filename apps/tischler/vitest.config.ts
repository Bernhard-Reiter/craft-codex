import { defineConfig } from "vitest/config";

export default defineConfig({
  // Automatic JSX runtime (wie Next) — kein `import React` in Tests nötig.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      // CJS UMD bundles have circular-dep issue in Node — force ESM source.
      "three-bvh-csg": "three-bvh-csg/src/index.js",
      "three-mesh-bvh": "three-mesh-bvh/src/index.js",
    },
  },
  test: {
    environment: "node",
    // .test.tsx (Komponenten) laufen in jsdom; reine Logik-.test.ts in node.
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    globals: false,
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx", "app/**/*.test.ts"],
    passWithNoTests: false,
  },
});
