import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const shared = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: false,
  logLevel: "info",
};

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: [path.join(root, "public/electron.ts")],
    outfile: path.join(root, "public/electron.js"),
    external: ["electron", "aedes", "aedes-stats", "mqtt", "portscanner", "websocket-stream"],
  }),
  esbuild.build({
    ...shared,
    entryPoints: [path.join(root, "public/preload.ts")],
    outfile: path.join(root, "public/preload.js"),
    external: ["electron"],
  }),
  esbuild.build({
    ...shared,
    entryPoints: [path.join(root, "scripts/notarize.ts")],
    outfile: path.join(root, "scripts/notarize.js"),
    external: ["@electron/notarize", "dotenv"],
  }),
]);
