const types = {
  ADDRECEIVEDMESSAGE: "ADDRECEIVEDMESSAGE"
};

const defaultState = {
  receivedMessages: [],
  sentMessages: []
};
const addReceivedMessage = (topic, message) => {
  return {
    type: types.ADDRECEIVEDMESSAGE,
    payload: {
      topic,
      message
    }
  };
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case types.ADDRECEIVEDMESSAGE: {
      let receivedMessages = [...state.receivedMessages];
      receivedMessages.unshift({ ...action.payload });
      receivedMessages.slice(0, 99);
      return {
        ...state,
        receivedMessages
      };
    }
    default:
      return state;
  }
};

export { types };
export { addReceivedMessage };
