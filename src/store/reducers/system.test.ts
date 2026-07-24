import { describe, expect, it } from "vitest";
import packageConfig from "../../../package.json";
import reducer, { types } from "./system";

describe("system reducer", () => {
  it("exposes the package version by default", () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state.version).toBe(packageConfig.version);
    expect(state.config).toEqual({});
    expect(state.broker).toEqual({
      running: true,
      wsPort: 9001,
      tcpPort: 1883,
    });
  });

  it("sets project config", () => {
    const config = {
      title: "demo",
      views: [{ title: "Main", path: "index.html" }],
      externalViews: [],
    };
    const state = reducer(undefined, {
      type: types.SETCONFIG,
      payload: { value: config },
    });
    expect(state.config).toEqual(config);
  });

  it("merges broker settings", () => {
    const state = reducer(undefined, {
      type: types.SETBROKERSETTINGS,
      payload: { value: { running: false, wsPort: 9002 } },
    });
    expect(state.broker).toEqual({
      running: false,
      wsPort: 9002,
      tcpPort: 1883,
    });
  });

  it("clears hosted project config on empty views payload", () => {
    const hosted = reducer(undefined, {
      type: types.SETCONFIG,
      payload: {
        value: {
          title: "demo",
          views: [{ title: "Main", path: "index.html" }],
          externalViews: [],
        },
      },
    });
    const closed = reducer(hosted, {
      type: types.SETCONFIG,
      payload: {
        value: {
          title: "",
          description: "",
          views: [],
          externalViews: [],
        },
      },
    });
    expect(closed.config.views).toEqual([]);
    expect(closed.config.title).toBe("");
  });
});
