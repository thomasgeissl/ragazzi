import { describe, expect, it } from "vitest";
import { setConnected } from "./mqtt";
import rootReducer from "./rootReducer";
import { types as systemTypes } from "./system";

describe("rootReducer", () => {
  it("resets nested state on RESET", () => {
    let state = rootReducer(undefined, setConnected(true));
    state = rootReducer(state, {
      type: systemTypes.SETCONFIG,
      payload: { value: { title: "demo", views: [] } },
    });
    expect(state.mqtt.connected).toBe(true);
    expect(state.system.config.title).toBe("demo");

    state = rootReducer(state, { type: "RESET" });
    expect(state.mqtt.connected).toBe(false);
    expect(state.system.config).toEqual({});
  });

  it("replaces state on SETSTATE", () => {
    const next = {
      mqtt: {
        connected: true,
        receivedMessages: [],
        sentMessages: [],
        protocol: "ws",
        host: "localhost",
        port: 9001,
        subscriptions: new Map(),
      },
      system: {
        version: "0.0.0",
        config: { title: "injected" },
        broker: { running: false, wsPort: 1, tcpPort: 2 },
      },
    };
    const state = rootReducer(undefined, {
      type: "SETSTATE",
      payload: next,
    });
    expect(state.system.config.title).toBe("injected");
    expect(state.mqtt.connected).toBe(true);
  });
});
