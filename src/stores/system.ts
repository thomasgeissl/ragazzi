import { create } from "zustand";
import { devtools } from "zustand/middleware";
import packageConfig from "../../package.json";
import type { BrokerSettings, ProjectConfig } from "../types/ragazzi";

export interface SystemState {
  version: string;
  config: ProjectConfig;
  broker: BrokerSettings;
  setConfig: (config: ProjectConfig) => void;
  setBrokerSettings: (settings: Partial<BrokerSettings>) => void;
  reset: () => void;
}

export const initialSystemState = {
  version: packageConfig.version,
  config: {},
  broker: {
    running: true,
    wsPort: 9001,
    tcpPort: 1883,
  },
} satisfies Pick<SystemState, "version" | "config" | "broker">;

export const useSystemStore = create<SystemState>()(
  devtools(
    (set) => ({
      ...initialSystemState,
      setConfig: (config) => set({ config }, false, "SystemStore/setConfig"),
      setBrokerSettings: (settings) =>
        set(
          (state) => ({ broker: { ...state.broker, ...settings } }),
          false,
          "SystemStore/setBrokerSettings",
        ),
      reset: () => set(initialSystemState, false, "SystemStore/reset"),
    }),
    { name: "SystemStore" },
  ),
);
