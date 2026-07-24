import { type AnyAction, combineReducers } from "redux";
import mqtt, { type MqttState } from "./mqtt";
import system, { type SystemState } from "./system";

export interface AppState {
  system: SystemState;
  mqtt: MqttState;
}

const appReducer = combineReducers({
  system,
  mqtt,
});

export default (state: AppState | undefined, action: AnyAction): AppState => {
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
