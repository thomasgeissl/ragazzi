import { beforeEach, describe, expect, it } from "vitest";
import { useMqttStore } from "./mqtt";

describe("mqtt store", () => {
  beforeEach(() => {
    useMqttStore.getState().reset();
  });

  it("exposes the default connection state", () => {
    const state = useMqttStore.getState();
    expect(state.connected).toBe(false);
    expect(state.host).toBe("localhost");
    expect(state.port).toBe(9001);
    expect(state.protocol).toBe("ws");
    expect(state.connectionEnabled).toBe(true);
    expect(state.subscriptions).toEqual(new Map());
  });

  it("trims broker host and protocol", () => {
    useMqttStore.getState().setBroker("  ws  ", "  broker.local  ", 1883);

    expect(useMqttStore.getState()).toMatchObject({
      protocol: "ws",
      host: "broker.local",
      port: 1883,
    });
  });

  it("tracks connection state", () => {
    useMqttStore.getState().setConnected(true);
    useMqttStore.getState().setConnectionEnabled(false);

    expect(useMqttStore.getState()).toMatchObject({
      connected: true,
      connectionEnabled: false,
    });
  });

  it("prepends received messages and caps at 99", () => {
    useMqttStore.getState().addReceivedMessage("a/topic", "one");
    expect(useMqttStore.getState().receivedMessages[0]).toMatchObject({
      topic: "a/topic",
      message: "one",
      type: "INCOMING",
    });
    expect(useMqttStore.getState().receivedMessages[0].timestamp).toBeInstanceOf(Date);

    for (let i = 0; i < 120; i += 1) {
      useMqttStore.getState().addReceivedMessage("t", String(i));
    }

    expect(useMqttStore.getState().receivedMessages).toHaveLength(99);
    expect(useMqttStore.getState().receivedMessages[0].message).toBe("119");
  });

  it("prepends sent messages and caps at 99", () => {
    useMqttStore.getState().addSentMessage("out", "7f", "hex");
    expect(useMqttStore.getState().sentMessages[0]).toMatchObject({
      topic: "out",
      message: "7f",
      encoding: "hex",
      type: "OUTGOING",
    });

    for (let i = 0; i < 120; i += 1) {
      useMqttStore.getState().addSentMessage("t", String(i));
    }

    expect(useMqttStore.getState().sentMessages).toHaveLength(99);
  });

  it("tracks subscription flags", () => {
    const store = useMqttStore.getState();
    store.subscribe("foo/#");
    store.addSubscription("bar");
    store.unsubscribe("foo/#");
    store.unsubscribeAll();

    expect(useMqttStore.getState().subscriptions).toEqual(
      new Map([
        ["foo/#", false],
        ["bar", false],
      ]),
    );
  });

  it("clears message logs", () => {
    const store = useMqttStore.getState();
    store.addReceivedMessage("t", "in");
    store.addSentMessage("t", "out");
    store.clearMessages();

    expect(useMqttStore.getState()).toMatchObject({
      receivedMessages: [],
      sentMessages: [],
    });
  });
});
