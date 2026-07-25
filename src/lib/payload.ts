import { Buffer } from "node:buffer";

export type PayloadEncoding = "utf8" | "hex" | "base64" | "uint8";

export interface EncodedPayload {
  encoding: PayloadEncoding;
  message: string;
  payload: string | Buffer;
}

const HEX_PATTERN = /^(?:[0-9a-fA-F]{2})+$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const isDisplayable = (message: string) => {
  return !Array.from(message).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return (
      code <= 8 ||
      (code >= 11 && code <= 12) ||
      (code >= 14 && code <= 31) ||
      (code >= 127 && code <= 159)
    );
  });
};

export function encodePayload(message: string, encoding: PayloadEncoding): EncodedPayload {
  switch (encoding) {
    case "utf8":
      return { encoding, message, payload: message };
    case "hex": {
      const normalized = message.replace(/\s/g, "");
      if (!HEX_PATTERN.test(normalized)) {
        throw new Error("Hex payloads must contain complete byte pairs (for example, 7f 00 ff).");
      }
      return {
        encoding,
        message: normalized.toLowerCase(),
        payload: Buffer.from(normalized, "hex"),
      };
    }
    case "base64": {
      const normalized = message.replace(/\s/g, "");
      if (!BASE64_PATTERN.test(normalized)) {
        throw new Error("Base64 payload is invalid.");
      }
      return { encoding, message: normalized, payload: Buffer.from(normalized, "base64") };
    }
    case "uint8": {
      if (!/^\d+$/.test(message.trim())) {
        throw new Error("Unsigned byte payloads must be an integer from 0 to 255.");
      }
      const value = Number(message.trim());
      if (value > 255) {
        throw new Error("Unsigned byte payloads must be an integer from 0 to 255.");
      }
      return { encoding, message: String(value), payload: Buffer.from([value]) };
    }
  }
}

export function decodePayload(payload: Buffer): Pick<EncodedPayload, "encoding" | "message"> {
  try {
    const message = new TextDecoder("utf-8", { fatal: true }).decode(payload);
    if (isDisplayable(message)) {
      return { encoding: "utf8", message };
    }
  } catch {
    // Binary payloads are represented as hex below.
  }

  return { encoding: "hex", message: payload.toString("hex") };
}
