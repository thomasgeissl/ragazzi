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
    store.saveHistoryTab();
    store.clearMessages();

    expect(useMqttStore.getState()).toMatchObject({
      receivedMessages: [],
      sentMessages: [],
    });
    expect(useMqttStore.getState().historyTabs).toHaveLength(1);
  });

  it("saves a durable history snapshot and can remove it", () => {
    const store = useMqttStore.getState();
    store.addReceivedMessage("in/topic", "received");
    store.addSentMessage("out/topic", "sent");

    const historyTabId = store.saveHistoryTab();
    const historyTab = useMqttStore
      .getState()
      .historyTabs.find((candidate) => candidate.id === historyTabId);

    expect(historyTab).toMatchObject({
      id: historyTabId,
      messages: [
        expect.objectContaining({ topic: "in/topic", type: "INCOMING" }),
        expect.objectContaining({ topic: "out/topic", type: "OUTGOING" }),
      ],
    });
    expect(historyTab?.createdAt).toBeInstanceOf(Date);

    useMqttStore.getState().deleteHistoryTab(historyTabId ?? "");
    expect(useMqttStore.getState().historyTabs).toEqual([]);
  });

  it("does not save an empty live history", () => {
    expect(useMqttStore.getState().saveHistoryTab()).toBeUndefined();
    expect(useMqttStore.getState().historyTabs).toEqual([]);
  });

  it("renames a saved history tab", () => {
    const store = useMqttStore.getState();
    store.addReceivedMessage("topic", "message");
    const historyTabId = store.saveHistoryTab();

    store.renameHistoryTab(historyTabId ?? "", "  Renamed history  ");

    expect(useMqttStore.getState().historyTabs[0]?.title).toBe("Renamed history");
  });

  it("imports history into a new saved tab without changing live messages", () => {
    const store = useMqttStore.getState();
    store.addReceivedMessage("live/topic", "live");
    const importedTabId = store.importHistoryTab({
      title: "Imported history",
      messages: [
        {
          id: "imported-message",
          topic: "imported/topic",
          message: "imported",
          encoding: "utf8",
          timestamp: new Date("2026-01-01T12:00:00.000Z"),
          type: "OUTGOING",
        },
      ],
    });

    expect(useMqttStore.getState().receivedMessages).toHaveLength(1);
    expect(useMqttStore.getState().historyTabs).toContainEqual({
      id: importedTabId,
      title: "Imported history",
      createdAt: expect.any(Date),
      messages: [
        {
          id: "imported-message",
          topic: "imported/topic",
          message: "imported",
          encoding: "utf8",
          timestamp: new Date("2026-01-01T12:00:00.000Z"),
          type: "OUTGOING",
        },
      ],
    });
  });

  it("orders imported messages by timestamp", () => {
    const importedTabId = useMqttStore.getState().importHistoryTab({
      title: "Out of order",
      messages: [
        {
          id: "second",
          topic: "topic",
          message: "second",
          encoding: "utf8",
          timestamp: new Date("2026-01-01T12:00:01.000Z"),
          type: "INCOMING",
        },
        {
          id: "first",
          topic: "topic",
          message: "first",
          encoding: "utf8",
          timestamp: new Date("2026-01-01T12:00:00.000Z"),
          type: "OUTGOING",
        },
      ],
    });

    expect(
      useMqttStore
        .getState()
        .historyTabs.find((historyTab) => historyTab.id === importedTabId)
        ?.messages.map((message) => message.id),
    ).toEqual(["first", "second"]);
  });
});
