import { describe, expect, it } from "vitest";
import { normalizePort, validateBrokerPorts } from "./ports";

describe("normalizePort", () => {
  it("returns a valid integer port", () => {
    expect(normalizePort(9001, 1)).toBe(9001);
    expect(normalizePort("1883", 1)).toBe(1883);
  });

  it("falls back for non-integers and out-of-range values", () => {
    expect(normalizePort("abc", 9001)).toBe(9001);
    expect(normalizePort(0, 9001)).toBe(9001);
    expect(normalizePort(65536, 9001)).toBe(9001);
    expect(normalizePort(1.5, 9001)).toBe(9001);
    expect(normalizePort(undefined, 1883)).toBe(1883);
  });

  it("accepts boundary ports", () => {
    expect(normalizePort(1, 9001)).toBe(1);
    expect(normalizePort(65535, 9001)).toBe(65535);
  });
});

describe("validateBrokerPorts", () => {
  it("accepts distinct valid ports", () => {
    expect(validateBrokerPorts("9001", "1883")).toEqual({
      ok: true,
      wsPort: 9001,
      tcpPort: 1883,
    });
  });

  it("rejects non-integer or out-of-range ports", () => {
    expect(validateBrokerPorts("x", "1883")).toEqual({
      ok: false,
      error: "Ports must be integers between 1 and 65535.",
    });
    expect(validateBrokerPorts("0", "1883").ok).toBe(false);
    expect(validateBrokerPorts("9001", "70000").ok).toBe(false);
  });

  it("rejects identical WebSocket and TCP ports", () => {
    expect(validateBrokerPorts(1883, 1883)).toEqual({
      ok: false,
      error: "WebSocket and TCP ports must be different.",
    });
  });
});
