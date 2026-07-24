import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  base: "./",
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
});
