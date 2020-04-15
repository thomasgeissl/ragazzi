import packageConfig from "../../../package.json";
const types = {
  SETCONFIG: "SETCONFIG",
};

const defaultState = {
  version: packageConfig.version,
  config: {},
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case types.SETCONFIG: {
      return {
        ...state,
        config: action.payload.value,
      };
    }
    default:
      return state;
  }
};

export { types };
