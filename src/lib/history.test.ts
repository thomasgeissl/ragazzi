import { describe, expect, it } from "vitest";
import { createHistoryFile, parseHistoryFile } from "./history";

const message = {
  id: "message-1",
  topic: "devices/one",
  message: "hello",
  encoding: "utf8" as const,
  timestamp: new Date("2026-01-01T12:00:00.000Z"),
  type: "INCOMING" as const,
};

describe("history files", () => {
  it("serializes and restores message direction and timestamps", () => {
    const contents = JSON.stringify(createHistoryFile("Test history", [message]));

    expect(parseHistoryFile(contents)).toEqual({
      title: "Test history",
      messages: [message],
    });
  });

  it("rejects malformed message records", () => {
    expect(() =>
      parseHistoryFile(
        JSON.stringify({
          version: 1,
          title: "Bad history",
          exportedAt: "2026-01-01T12:00:00.000Z",
          messages: [
            { ...message, encoding: "invalid", timestamp: message.timestamp.toISOString() },
          ],
        }),
      ),
    ).toThrow("History message 1 is invalid.");
  });

  it.each([
    ["invalid JSON", "{not json", "not valid JSON"],
    [
      "unsupported version",
      JSON.stringify({
        version: 2,
        title: "History",
        exportedAt: new Date().toISOString(),
        messages: [],
      }),
      "not a supported",
    ],
    [
      "invalid export timestamp",
      JSON.stringify({ version: 1, title: "History", exportedAt: "yesterday", messages: [] }),
      "not a supported",
    ],
    [
      "empty message ID",
      JSON.stringify({
        version: 1,
        title: "History",
        exportedAt: new Date().toISOString(),
        messages: [{ ...message, id: "", timestamp: message.timestamp.toISOString() }],
      }),
      "History message 1 is invalid.",
    ],
    [
      "empty topic",
      JSON.stringify({
        version: 1,
        title: "History",
        exportedAt: new Date().toISOString(),
        messages: [{ ...message, topic: "", timestamp: message.timestamp.toISOString() }],
      }),
      "History message 1 is invalid.",
    ],
  ])("rejects %s", (_description, contents, errorMessage) => {
    expect(() => parseHistoryFile(contents)).toThrow(errorMessage);
  });
});
