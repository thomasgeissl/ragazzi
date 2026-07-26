import type { MessageType, MqttMessage } from "../stores/mqtt";
import type { PayloadEncoding } from "./payload";

const HISTORY_FILE_VERSION = 1;
const payloadEncodings: PayloadEncoding[] = ["utf8", "hex", "base64", "uint8"];
const messageTypes: MessageType[] = ["INCOMING", "OUTGOING"];

export interface HistoryFile {
  version: typeof HISTORY_FILE_VERSION;
  title: string;
  exportedAt: string;
  messages: Array<{
    id: string;
    topic: string;
    message: string;
    encoding: PayloadEncoding;
    timestamp: string;
    type: MessageType;
  }>;
}

export interface ImportedHistory {
  title: string;
  messages: MqttMessage[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function createHistoryFile(title: string, messages: MqttMessage[]): HistoryFile {
  return {
    version: HISTORY_FILE_VERSION,
    title,
    exportedAt: new Date().toISOString(),
    messages: messages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    })),
  };
}

export function parseHistoryFile(contents: string): ImportedHistory {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== HISTORY_FILE_VERSION ||
    typeof parsed.title !== "string" ||
    !isDate(parsed.exportedAt) ||
    !Array.isArray(parsed.messages)
  ) {
    throw new Error("The selected file is not a supported Ragazzi history export.");
  }

  const messages = parsed.messages.map((message, index): MqttMessage => {
    if (
      !isRecord(message) ||
      typeof message.id !== "string" ||
      !message.id.trim() ||
      typeof message.topic !== "string" ||
      !message.topic.trim() ||
      typeof message.message !== "string" ||
      !payloadEncodings.includes(message.encoding as PayloadEncoding) ||
      !isDate(message.timestamp) ||
      !messageTypes.includes(message.type as MessageType)
    ) {
      throw new Error(`History message ${index + 1} is invalid.`);
    }

    return {
      id: message.id,
      topic: message.topic,
      message: message.message,
      encoding: message.encoding as PayloadEncoding,
      timestamp: new Date(message.timestamp),
      type: message.type as MessageType,
    };
  });

  return { title: parsed.title.trim() || "Imported history", messages };
}
