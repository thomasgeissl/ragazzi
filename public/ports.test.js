import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { normalizePort } = require("./ports");

describe("public/ports normalizePort", () => {
  it("matches broker:setPorts validation", () => {
    expect(normalizePort(9001, 1)).toBe(9001);
    expect(normalizePort("bad", 1883)).toBe(1883);
    expect(normalizePort(0, 1883)).toBe(1883);
    expect(normalizePort(65535, 1)).toBe(65535);
  });
});
