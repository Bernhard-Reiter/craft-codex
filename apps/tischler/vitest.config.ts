import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // CJS UMD bundles have circular-dep issue in Node — force ESM source.
      "three-bvh-csg": "three-bvh-csg/src/index.js",
      "three-mesh-bvh": "three-mesh-bvh/src/index.js",
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx", "app/**/*.test.ts"],
    passWithNoTests: false,
  },
});
