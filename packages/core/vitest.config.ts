import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // three-bvh-csg + three-mesh-bvh ship a CJS UMD bundle with a circular
      // dependency that breaks Node's CJS loader ("Class extends value undefined").
      // Force vite/vitest to load their ESM source so the test runner works.
      "three-bvh-csg": "three-bvh-csg/src/index.js",
      "three-mesh-bvh": "three-mesh-bvh/src/index.js",
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/index.ts", "src/**/*.d.ts"],
    },
  },
});
