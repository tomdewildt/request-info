import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "node24",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    ssr: true,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  ssr: {
    noExternal: true,
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
