import { combineReducers, type AnyAction } from "redux";

import system, { type SystemState } from "./system";
import mqtt, { type MqttState } from "./mqtt";

export interface AppState {
  system: SystemState;
  mqtt: MqttState;
}

const appReducer = combineReducers({
  system,
  mqtt,
});

export default (
  state: AppState | undefined,
  action: AnyAction
): AppState => {
  if (action.type === "RESET") {
    return appReducer(undefined, action);
  } else if (action.type === "SETSTATE") {
    return appReducer(action.payload as AppState, {
      type: "IGNORE",
    });
  } else {
    return appReducer(state, action);
  }
};
