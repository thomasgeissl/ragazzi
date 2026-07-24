import type { AnyAction } from "redux";
import type { BrokerSettings, ProjectConfig } from "../../types/ragazzi";
import packageConfig from "../../../package.json";

export const types = {
  SETCONFIG: "SETCONFIG",
  SETBROKERSETTINGS: "SETBROKERSETTINGS",
} as const;

export interface SystemState {
  version: string;
  config: ProjectConfig;
  broker: BrokerSettings;
}

export interface SetConfigAction {
  type: typeof types.SETCONFIG;
  payload: { value: ProjectConfig };
}

export interface SetBrokerSettingsAction {
  type: typeof types.SETBROKERSETTINGS;
  payload: { value: Partial<BrokerSettings> };
}

export type SystemAction = SetConfigAction | SetBrokerSettingsAction;

const defaultState: SystemState = {
  version: packageConfig.version,
  config: {},
  broker: {
    running: true,
    wsPort: 9001,
    tcpPort: 1883,
  },
};

export default (
  state: SystemState = defaultState,
  action: SystemAction | AnyAction
): SystemState => {
  switch (action.type) {
    case types.SETCONFIG: {
      return {
        ...state,
        config: (action as SetConfigAction).payload.value,
      };
    }
    case types.SETBROKERSETTINGS: {
      return {
        ...state,
        broker: {
          ...state.broker,
          ...(action as SetBrokerSettingsAction).payload.value,
        },
      };
    }
    default:
      return state;
  }
};
