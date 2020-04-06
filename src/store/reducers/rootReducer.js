import { combineReducers } from "redux";

import system from "./system";
import mqtt from "./mqtt";

const appReducer = combineReducers({
  system,
  mqtt
});

export default (state, action) => {
  if (action.type === "RESET") {
    return appReducer(undefined, action);
  } else if (action.type === "SETSTATE") {
    return appReducer(action.payload, {
      type: "IGNORE"
    });
  } else {
    return appReducer(state, action);
  }
};
