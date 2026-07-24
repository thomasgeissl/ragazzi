import { describe, expect, it } from "vitest";
import reducer, {
  addReceivedMessage,
  addSentMessage,
  addSubscription,
  clearMessages,
  setBroker,
  setConnected,
  subscribe,
  unsubscribe,
  unsubscribeAll,
} from "./mqtt";

describe("mqtt reducer", () => {
  it("returns the default state", () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state.connected).toBe(false);
    expect(state.host).toBe("localhost");
    expect(state.port).toBe(9001);
    expect(state.protocol).toBe("ws");
    expect(state.subscriptions).toEqual(new Map());
  });

  it("trims broker host and protocol", () => {
    const state = reducer(undefined, setBroker("  ws  ", "  broker.local  ", 1883));
    expect(state).toMatchObject({
      protocol: "ws",
      host: "broker.local",
      port: 1883,
    });
  });

  it("sets connected", () => {
    expect(reducer(undefined, setConnected(true)).connected).toBe(true);
  });

  it("prepends received messages and caps at 99", () => {
    let state = reducer(undefined, addReceivedMessage("a/topic", "one"));
    expect(state.receivedMessages).toHaveLength(1);
    expect(state.receivedMessages[0]).toMatchObject({
      topic: "a/topic",
      message: "one",
      type: "INCOMING",
    });
    expect(state.receivedMessages[0].timestamp).toBeInstanceOf(Date);

    for (let i = 0; i < 120; i += 1) {
      state = reducer(state, addReceivedMessage("t", String(i)));
    }
    expect(state.receivedMessages).toHaveLength(99);
    expect(state.receivedMessages[0].message).toBe("119");
  });

  it("prepends sent messages and caps at 99", () => {
    let state = reducer(undefined, addSentMessage("out", "hi"));
    expect(state.sentMessages[0]).toMatchObject({
      topic: "out",
      message: "hi",
      type: "OUTGOING",
    });

    for (let i = 0; i < 120; i += 1) {
      state = reducer(state, addSentMessage("t", String(i)));
    }
    expect(state.sentMessages).toHaveLength(99);
  });

  it("tracks subscription flags", () => {
    let state = reducer(undefined, subscribe("foo/#"));
    expect(state.subscriptions.get("foo/#")).toBe(true);

    state = reducer(state, addSubscription("bar"));
    expect(state.subscriptions.get("bar")).toBe(true);

    state = reducer(state, unsubscribe("foo/#"));
    expect(state.subscriptions.get("foo/#")).toBe(false);

    state = reducer(state, unsubscribeAll());
    expect(state.subscriptions.get("bar")).toBe(false);
  });

  it("clears message logs", () => {
    let state = reducer(undefined, addReceivedMessage("t", "in"));
    state = reducer(state, addSentMessage("t", "out"));
    state = reducer(state, clearMessages());
    expect(state.receivedMessages).toEqual([]);
    expect(state.sentMessages).toEqual([]);
  });
});
