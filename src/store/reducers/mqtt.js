const types = {
  SETCONNECTED: "SETCONNECTED",
  ADDRECEIVEDMESSAGE: "ADDRECEIVEDMESSAGE",
  ADDSENTMESSAGE: "ADDSENTMESSAGE",
  ADDSUBSCRIPTION: "ADDSUBSCRIPTION",
  SUBSCRIBE: "SUBSCRIBE",
  UNSUBSCRIBE: "UNSUBSCRIBE",
  UNSUBSCRIBEALL: "UNSUBSCRIBEALL",
  SETBROKER: "SETBROKER",
  CLEARMESSAGES: "CLEARMESSAGES",
};

const defaultState = {
  connected: false,
  receivedMessages: [],
  sentMessages: [],
  protocol: "ws",
  host: "localhost",
  port: 9001,
  subscriptions: new Map([]),
};
const setBroker = (protocol, host, port) => {
  return {
    type: types.SETBROKER,
    payload: {
      protocol,
      host,
      port,
    },
  };
};
const setConnected = (value) => {
  return {
    type: types.SETCONNECTED,
    payload: {
      value,
    },
  };
};
const addReceivedMessage = (topic, message) => {
  return {
    type: types.ADDRECEIVEDMESSAGE,
    payload: {
      topic,
      message,
    },
  };
};
const addSentMessage = (topic, message) => {
  return {
    type: types.ADDSENTMESSAGE,
    payload: {
      topic,
      message,
    },
  };
};
const addSubscription = (value) => {
  return {
    type: types.ADDSUBSCRIPTION,
    payload: {
      value,
    },
  };
};
const subscribe = (value) => {
  return {
    type: types.SUBSCRIBE,
    payload: {
      value,
    },
  };
};
const unsubscribe = (value) => {
  return {
    type: types.UNSUBSCRIBE,
    payload: {
      value,
    },
  };
};
const unsubscribeAll = () => {
  return {
    type: types.UNSUBSCRIBEALL,
  };
};
const clearMessages = () => {
  return {
    type: types.CLEARMESSAGES,
  };
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case types.SETBROKER: {
      return {
        ...state,
        protocol: action.payload.protocol.trim(),
        host: action.payload.host.trim(),
        port: action.payload.port,
      };
    }
    case types.SETCONNECTED: {
      return {
        ...state,
        connected: action.payload.value,
      };
    }
    case types.ADDRECEIVEDMESSAGE: {
      let receivedMessages = [...state.receivedMessages];
      receivedMessages.unshift({
        ...action.payload,
        timestamp: new Date(),
        type: "INCOMING",
      });
      receivedMessages = receivedMessages.slice(0, 99);
      return {
        ...state,
        receivedMessages,
      };
    }
    case types.ADDSENTMESSAGE: {
      let sentMessages = [...state.sentMessages];
      sentMessages.unshift({
        ...action.payload,
        timestamp: new Date(),
        type: "OUTGOING",
      });
      sentMessages = sentMessages.slice(0, 99);
      return {
        ...state,
        sentMessages,
      };
    }
    case types.ADDSUBSCRIPTION: {
      let subscriptions = new Map(state.subscriptions);
      subscriptions.set(action.payload.value, true);
      return {
        ...state,
        subscriptions,
      };
    }
    case types.SUBSCRIBE: {
      let subscriptions = new Map(state.subscriptions);
      subscriptions.set(action.payload.value, true);
      return {
        ...state,
        subscriptions,
      };
    }
    case types.UNSUBSCRIBE: {
      let subscriptions = new Map(state.subscriptions);
      subscriptions.set(action.payload.value, false);
      return {
        ...state,
        subscriptions,
      };
    }
    case types.UNSUBSCRIBEALL: {
      let subscriptions = new Map(state.subscriptions);
      [...subscriptions.keys()].forEach((key) => {
        subscriptions.set(key, false);
      });
      return {
        ...state,
        subscriptions,
      };
    }
    case types.CLEARMESSAGES: {
      return {
        ...state,
        sentMessages: [],
        receivedMessages: [],
      };
    }
    default:
      return state;
  }
};

const isSubscriptionListShown = (state) => {
  return state.mqtt.subscriptions.size > 0;
};

export { types };
export {
  setBroker,
  setConnected,
  addReceivedMessage,
  addSentMessage,
  addSubscription,
  subscribe,
  unsubscribe,
  unsubscribeAll,
  isSubscriptionListShown,
  clearMessages,
};
