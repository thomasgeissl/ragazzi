import packageConfig from "../../../package.json";

const types = {
  SETCONFIG: "SETCONFIG",
  SETBROKERSETTINGS: "SETBROKERSETTINGS",
};

const defaultState = {
  version: packageConfig.version,
  config: {},
  broker: {
    running: true,
    wsPort: 9001,
    tcpPort: 1883,
  },
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case types.SETCONFIG: {
      return {
        ...state,
        config: action.payload.value,
      };
    }
    case types.SETBROKERSETTINGS: {
      return {
        ...state,
        broker: {
          ...state.broker,
          ...action.payload.value,
        },
      };
    }
    default:
      return state;
  }
};

export { types };
