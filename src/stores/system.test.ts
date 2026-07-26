import { beforeEach, describe, expect, it } from "vitest";
import packageConfig from "../../package.json";
import { initialSystemState, useSystemStore } from "./system";

describe("system store", () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  it("exposes the package version and default broker settings", () => {
    const state = useSystemStore.getState();
    expect(state.version).toBe(packageConfig.version);
    expect(state.config).toEqual(initialSystemState.config);
    expect(state.broker).toEqual(initialSystemState.broker);
  });

  it("sets project config", () => {
    const config = {
      title: "demo",
      views: [{ title: "Main", path: "index.html" }],
      externalViews: [],
    };

    useSystemStore.getState().setConfig(config);

    expect(useSystemStore.getState().config).toEqual(config);
  });

  it("merges broker settings", () => {
    useSystemStore.getState().setBrokerSettings({ running: false, wsPort: 9002 });

    expect(useSystemStore.getState().broker).toEqual({
      running: false,
      wsPort: 9002,
      tcpPort: 1883,
    });
  });
});
