import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { decodePayload, encodePayload } from "./payload";

describe("payload codec", () => {
  it("keeps UTF-8 payloads as text", () => {
    expect(encodePayload("hello", "utf8")).toEqual({
      encoding: "utf8",
      message: "hello",
      payload: "hello",
    });
  });

  it("encodes hexadecimal byte pairs", () => {
    const encoded = encodePayload("7F 00 ff", "hex");

    expect(encoded.message).toBe("7f00ff");
    expect(encoded.payload).toEqual(Buffer.from([0x7f, 0x00, 0xff]));
  });

  it.each(["7", "zz", "f 00"])("rejects malformed hex %s", (message) => {
    expect(() => encodePayload(message, "hex")).toThrow("Hex payloads");
  });

  it("encodes Base64 bytes", () => {
    const encoded = encodePayload("fwA=", "base64");

    expect(encoded.payload).toEqual(Buffer.from([0x7f, 0x00]));
  });

  it.each(["!", "abc", "fw==="])("rejects malformed Base64 %s", (message) => {
    expect(() => encodePayload(message, "base64")).toThrow("Base64 payload");
  });

  it.each([
    ["0", 0],
    ["127", 127],
    ["255", 255],
  ])("encodes uint8 value %s", (message, expected) => {
    const encoded = encodePayload(message, "uint8");

    expect(encoded.message).toBe(message);
    expect(encoded.payload).toEqual(Buffer.from([expected]));
  });

  it.each(["-1", "256", "1.5", "hello"])("rejects invalid uint8 %s", (message) => {
    expect(() => encodePayload(message, "uint8")).toThrow("Unsigned byte");
  });

  it("decodes printable UTF-8 and represents binary as hex", () => {
    expect(decodePayload(Buffer.from("hello"))).toEqual({ encoding: "utf8", message: "hello" });
    expect(decodePayload(Buffer.from("Grüße"))).toEqual({ encoding: "utf8", message: "Grüße" });
    expect(decodePayload(Buffer.from([0x7f, 0xff]))).toEqual({ encoding: "hex", message: "7fff" });
  });
});
