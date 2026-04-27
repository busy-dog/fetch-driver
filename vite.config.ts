import { defineConfig } from "vite";

import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      outDir: "dist",
      rollupTypes: false,
      tsconfigPath: "./tsconfig.lib.json",
    }),
  ],
  server: {
    // proxy: {
    //   "/api": {
    //     target: "https://devapp-api.feedalyze.com",
    //     changeOrigin: true,
    //   },
    // },
  },
  build: {
    minify: true,
    sourcemap: true,
    target: "chrome74",
    lib: {
      name: "fetch_driver",
      entry: "./index.ts",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["mime", "remeda", "wildcard-match"],
      output: {
        dir: "dist",
      },
    },
  },
});
