import { afterEach, describe, expect, it, vi } from "vitest";
import { replayMessages } from "./replay";

const messages = [
  {
    id: "first",
    topic: "one",
    message: "first",
    encoding: "utf8" as const,
    timestamp: new Date("2026-01-01T12:00:00.000Z"),
    type: "INCOMING" as const,
  },
  {
    id: "second",
    topic: "two",
    message: "second",
    encoding: "utf8" as const,
    timestamp: new Date("2026-01-01T12:00:00.250Z"),
    type: "OUTGOING" as const,
  },
  {
    id: "third",
    topic: "three",
    message: "third",
    encoding: "hex" as const,
    timestamp: new Date("2026-01-01T12:00:01.000Z"),
    type: "INCOMING" as const,
  },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("replayMessages", () => {
  it("publishes every message in timestamp order with recorded delays", () => {
    vi.useFakeTimers();
    const publish = vi.fn();
    const complete = vi.fn();
    const progress = vi.fn();

    replayMessages([messages[2], messages[0], messages[1]], publish, complete, progress);

    expect(publish).toHaveBeenCalledWith(messages[0]);
    expect(progress).toHaveBeenLastCalledWith(1, 3);
    vi.advanceTimersByTime(249);
    expect(publish).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(publish).toHaveBeenLastCalledWith(messages[1]);
    vi.advanceTimersByTime(750);
    expect(publish).toHaveBeenLastCalledWith(messages[2]);
    expect(progress).toHaveBeenLastCalledWith(3, 3);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("stops any remaining scheduled messages when cancelled", () => {
    vi.useFakeTimers();
    const publish = vi.fn();
    const controller = replayMessages(messages, publish);

    controller.cancel();
    vi.runAllTimers();

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("completes an empty replay without publishing", () => {
    const publish = vi.fn();
    const complete = vi.fn();

    replayMessages([], publish, complete);

    expect(publish).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
  });
});
