import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const isVitest = !!process.env.VITEST;

export default defineConfig({
  plugins: isVitest ? [react()] : [react(), nodePolyfills()],
  base: "./",
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    pool: "forks",
    maxWorkers: "50%",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.ts", "src/store/reducers/**/*.ts"],
      exclude: ["src/**/*.test.{ts,tsx}"],
    },
  },
});
