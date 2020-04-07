const types = {
  SETCONFIG: "SETCONFIG"
};

const defaultState = {
  config: {}
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case types.SETCONFIG: {
      return {
        ...state,
        config: action.payload.value
      };
    }
    default:
      return state;
  }
};

export { types };
